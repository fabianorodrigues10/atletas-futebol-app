/**
 * Script para atualizar naturalidade de todos os atletas a partir do Ogol
 * Extrai naturalidade do campo "Naturalidade" na página do Ogol
 */

import { getDb } from "../server/db";
import { atletas } from "../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

interface OgolData {
  naturalidade: string | null;
}

/**
 * Extrai naturalidade do HTML do Ogol
 */
function extractNaturalidade(html: string): OgolData {
  const result: OgolData = {
    naturalidade: null,
  };

  // Procurar por padrão: "Naturalidade" seguido pelo valor
  // Padrão 1: card-data__label/card-data__value
  const pattern1 = /Naturalidade<\/span>\s*<span[^>]*class="card-data__value"[^>]*>([^<]+)</i;
  const match1 = html.match(pattern1);
  if (match1?.[1]) {
    result.naturalidade = match1[1].trim();
    return result;
  }

  // Padrão 2: Fallback com regex mais genérico
  const pattern2 = /Naturalidade<\/span>\s*(?:<[^>]*>\s*)*([^<]+)/i;
  const match2 = html.match(pattern2);
  if (match2?.[1]) {
    const text = match2[1].trim();
    if (text.length > 0 && text.length < 200) {
      result.naturalidade = text;
      return result;
    }
  }

  return result;
}

/**
 * Busca dados de um atleta do Ogol via API do servidor
 */
async function fetchOgolData(url: string, apiBaseUrl: string): Promise<OgolData> {
  try {
    const response = await fetch(`${apiBaseUrl}/api/ogol/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.data) {
        return {
          naturalidade: data.data.naturalidade || null,
        };
      }
    }
  } catch (e) {
    console.error(`[Fetch] Erro ao buscar ${url}:`, e);
  }

  return { naturalidade: null };
}

/**
 * Executa o script
 */
async function main() {
  console.log("[Update Naturalidade] Iniciando...");

  const db = await getDb();
  if (!db) {
    console.error("[Update Naturalidade] Banco de dados não disponível");
    process.exit(1);
  }

  // Buscar todos os atletas com link do Ogol
  const atletasComLink = await db
    .select()
    .from(atletas)
    .where(isNotNull(atletas.link));

  console.log(
    `[Update Naturalidade] Encontrados ${atletasComLink.length} atletas com link do Ogol`
  );

  if (atletasComLink.length === 0) {
    console.log("[Update Naturalidade] Nenhum atleta com link para atualizar!");
    process.exit(0);
  }

  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";
  let atualizados = 0;
  let erros = 0;
  let semNaturalidade = 0;

  // Processar atletas em lotes
  for (let i = 0; i < atletasComLink.length; i++) {
    const atleta = atletasComLink[i];
    
    // Mostrar progresso a cada 10 atletas
    if (i % 10 === 0) {
      console.log(`[Update Naturalidade] Processando ${i + 1}/${atletasComLink.length}...`);
    }

    try {
      // Validar link
      if (!atleta.link || !atleta.link.includes("ogol.com")) {
        continue;
      }

      // Buscar dados do Ogol
      const ogolData = await fetchOgolData(atleta.link, apiBaseUrl);

      if (ogolData.naturalidade) {
        // Atualizar no banco
        await db
          .update(atletas)
          .set({ naturalidade: ogolData.naturalidade })
          .where(eq(atletas.id, atleta.id));

        atualizados++;
      } else {
        semNaturalidade++;
      }

      // Delay para não sobrecarregar o servidor
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`[Update Naturalidade] Erro ao processar atleta ${atleta.id}:`, e);
      erros++;
    }
  }

  console.log("\n[Update Naturalidade] ✅ Concluído!");
  console.log(`  - Atualizados: ${atualizados}`);
  console.log(`  - Sem naturalidade encontrada: ${semNaturalidade}`);
  console.log(`  - Erros: ${erros}`);
  console.log(`  - Total processado: ${atualizados + semNaturalidade + erros}/${atletasComLink.length}`);

  process.exit(0);
}

main().catch((error) => {
  console.error("[Update Naturalidade] Erro fatal:", error);
  process.exit(1);
});
