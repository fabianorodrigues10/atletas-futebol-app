/**
 * Script para atualizar dados de data de nascimento e idade do Ogol em lote
 * Usa Puppeteer para contornar Cloudflare
 * 
 * TODO: Install puppeteer when needed
 * npm install puppeteer
 */

// import puppeteer from "puppeteer";
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
 * Executa o script
 * 
 * TODO: Uncomment when puppeteer is installed
 */
async function main() {
  console.log("[Batch Update Ogol] Script desabilitado - instale puppeteer para usar");
  process.exit(0);
  
  /*
  console.log("[Batch Update Ogol] Iniciando...");

  const db = await getDb();
  if (!db) {
    console.error("[Batch Update Ogol] Banco de dados não disponível");
    process.exit(1);
  }

  // Buscar atletas sem data de nascimento ou idade
  const atletasSemData = await db
    .select()
    .from(atletas)
    .where(or(isNull(atletas.dataNascimento), isNull(atletas.idade)))
    .limit(100); // Limitar a 100 por vez

  console.log(
    `[Batch Update Ogol] Encontrados ${atletasSemData.length} atletas sem data de nascimento/idade`
  );

  if (atletasSemData.length === 0) {
    console.log("[Batch Update Ogol] Nenhum atleta para atualizar!");
    process.exit(0);
  }

  let browser;
  try {
    // Iniciar Puppeteer
    // browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });

    // let updated = 0;
    // let failed = 0;

    // for (const atleta of atletasSemData) {
    //   // Verificar se tem link do Ogol
    //   if (!atleta.link || !atleta.link.includes("ogol.com")) {
    //     console.log(`[${atleta.id}] ${atleta.nome}: Sem link do Ogol`);
    //     failed++;
    //     continue;
    //   }

    //   console.log(`[${atleta.id}] ${atleta.nome}: Buscando dados do Ogol...`);

    //   try {
    //     // Criar página
    //     const page = await browser.newPage();
    //     await page.setUserAgent(
    //       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    //     );

    //     // Navegar para a página
    //     await page.goto(atleta.link, { waitUntil: "networkidle2", timeout: 30000 });

    //     // Aguardar um pouco para carregar conteúdo dinâmico
    //     await new Promise((resolve) => setTimeout(resolve, 2000));

    //     // Extrair HTML
    //     const html = await page.content();

    //     // Extrair dados
    //     const data = extractOgolData(html);

    //     if (!data.dataNascimento && !data.idade) {
    //       console.log(
    //         `[${atleta.id}] ${atleta.nome}: Não conseguiu extrair dados`
    //       );
    //       failed++;
    //       await page.close();
    //       continue;
    //     }

    //     // Atualizar banco de dados
    //     await db
    //       .update(atletas)
    //       .set({
    //         dataNascimento: data.dataNascimento
    //           ? new Date(data.dataNascimento.split("/").reverse().join("-"))
    //           : undefined,
    //         idade: data.idade || undefined,
    //       })
    //       .where(eq(atletas.id, atleta.id));

    //     console.log(
    //       `[${atleta.id}] ${atleta.nome}: Atualizado! Data: ${data.dataNascimento}, Idade: ${data.idade}`
    //     );
    //     updated++;

    //     await page.close();
    //   } catch (error) {
    //     console.error(
    //       `[${atleta.id}] ${atleta.nome}: Erro:`,
    //       error instanceof Error ? error.message : String(error)
    //     );
    //     failed++;
    //   }

    //   // Aguardar um pouco entre requisições
    //   await new Promise((resolve) => setTimeout(resolve, 1000));
    // }

    // console.log(
    //   `[Batch Update Ogol] Concluído! Atualizados: ${updated}, Falhados: ${failed}`
    // );
  } finally {
    // if (browser) {
    //   await browser.close();
    // }
  }
  */
}

main().catch((error) => {
  console.error("[Batch Update Ogol] Erro fatal:", error);
  process.exit(1);
});
