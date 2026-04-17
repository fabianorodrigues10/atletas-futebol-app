/**
 * Script para atualizar dados de data de nascimento e idade do Ogol
 * Busca atletas sem essas informações e faz scraping do Ogol
 */

import { getDb } from "../server/db";
import { atletas } from "../drizzle/schema";
import { eq, isNull, or } from "drizzle-orm";

interface OgolData {
  dataNascimento: string | null;
  idade: number | null;
}

/**
 * Extrai data de nascimento e idade do HTML do Ogol
 */
function extractOgolData(html: string): OgolData {
  const result: OgolData = {
    dataNascimento: null,
    idade: null,
  };

  // Procurar por padrão: "Data de Nascimento" seguido pela data
  const dataMatch = html.match(
    /Data de Nascimento[^>]*>([^<]*\d{4}-\d{2}-\d{2}[^<]*)\((\d+)\s*anos?\)/i
  );
  if (dataMatch) {
    const datePart = dataMatch[1];
    const agePart = dataMatch[2];

    // Extrair data no formato YYYY-MM-DD
    const dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
    const dateMatch = datePart.match(dateRegex);
    if (dateMatch) {
      const [, yyyy, mm, dd] = dateMatch;
      result.dataNascimento = `${dd}/${mm}/${yyyy.slice(2)}`; // dd/mm/aa
      result.idade = parseInt(agePart, 10);
    }
  }

  return result;
}

/**
 * Faz fetch da página do Ogol com retry
 */
async function fetchOgolPage(url: string, retries = 3): Promise<string | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          Referer: "https://www.ogol.com.br/",
          Origin: "https://www.ogol.com.br",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        console.warn(
          `[Ogol] Erro ao acessar ${url}: ${response.status} (tentativa ${attempt + 1}/${retries})`
        );
        if (attempt < retries - 1) {
          // Aguardar antes de tentar novamente
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        continue;
      }

      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      return decoder.decode(buffer);
    } catch (error) {
      console.warn(
        `[Ogol] Erro ao fazer fetch de ${url}: ${error instanceof Error ? error.message : String(error)} (tentativa ${attempt + 1}/${retries})`
      );
      if (attempt < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  return null;
}

/**
 * Executa o script
 */
async function main() {
  console.log("[Update Ogol Data] Iniciando...");

  const db = await getDb();
  if (!db) {
    console.error("[Update Ogol Data] Banco de dados não disponível");
    process.exit(1);
  }

  // Buscar atletas sem data de nascimento ou idade
  const atletasSemData = await db
    .select()
    .from(atletas)
    .where(or(isNull(atletas.dataNascimento), isNull(atletas.idade)))
    .limit(100); // Limitar a 100 por vez para não sobrecarregar

  console.log(
    `[Update Ogol Data] Encontrados ${atletasSemData.length} atletas sem data de nascimento/idade`
  );

  if (atletasSemData.length === 0) {
    console.log("[Update Ogol Data] Nenhum atleta para atualizar!");
    process.exit(0);
  }

  let updated = 0;
  let failed = 0;

  for (const atleta of atletasSemData) {
    // Verificar se tem link do Ogol
    if (!atleta.link || !atleta.link.includes("ogol.com")) {
      console.log(`[${atleta.id}] ${atleta.nome}: Sem link do Ogol`);
      failed++;
      continue;
    }

    console.log(`[${atleta.id}] ${atleta.nome}: Buscando dados do Ogol...`);

    // Fazer fetch da página
    const html = await fetchOgolPage(atleta.link);
    if (!html) {
      console.log(`[${atleta.id}] ${atleta.nome}: Falha ao acessar Ogol`);
      failed++;
      continue;
    }

    // Extrair dados
    const data = extractOgolData(html);
    if (!data.dataNascimento && !data.idade) {
      console.log(
        `[${atleta.id}] ${atleta.nome}: Não conseguiu extrair dados`
      );
      failed++;
      continue;
    }

    // Atualizar banco de dados
    try {
      await db
        .update(atletas)
        .set({
          dataNascimento: data.dataNascimento
            ? new Date(data.dataNascimento.split("/").reverse().join("-"))
            : undefined,
          idade: data.idade || undefined,
        })
        .where(eq(atletas.id, atleta.id));

      console.log(
        `[${atleta.id}] ${atleta.nome}: Atualizado! Data: ${data.dataNascimento}, Idade: ${data.idade}`
      );
      updated++;
    } catch (error) {
      console.error(
        `[${atleta.id}] ${atleta.nome}: Erro ao atualizar:`,
        error instanceof Error ? error.message : String(error)
      );
      failed++;
    }

    // Aguardar um pouco entre requisições para não sobrecarregar o Ogol
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(
    `[Update Ogol Data] Concluído! Atualizados: ${updated}, Falhados: ${failed}`
  );
  process.exit(0);
}

main().catch((error) => {
  console.error("[Update Ogol Data] Erro fatal:", error);
  process.exit(1);
});
