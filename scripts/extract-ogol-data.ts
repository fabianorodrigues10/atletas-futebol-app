import { getDb } from "../server/db";
import { atletas } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";

interface OgolPlayerData {
  idade: number | null;
  dataNascimento: string | null;
}

function extractField(html: string, labelText: string): string | null {
  const escapedLabel = labelText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  
  const pattern1 = new RegExp(
    `card-data__label"[^>]*>${escapedLabel}<\\/span>\\s*<span class="card-data__value"[^>]*>([^<]+)<`,
    "i"
  );
  const match1 = html.match(pattern1);
  if (match1?.[1]) {
    const text = match1[1].trim();
    if (text.length > 0) return text;
  }

  const pattern2 = new RegExp(
    `card-data__label"[^>]*>${escapedLabel}<\\/span>\\s*<span class="card-data__values"[^>]*>\\s*<span class="card-data__value"[^>]*>([^<]+)<`,
    "i"
  );
  const match2 = html.match(pattern2);
  if (match2?.[1]) {
    const text = match2[1].trim();
    if (text.length > 0) return text;
  }

  return null;
}

async function extractOgolData(url: string): Promise<OgolPlayerData> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "Referer": "https://www.ogol.com.br/",
      },
    });

    if (!response.ok) {
      console.log(`❌ Erro ao acessar ${url}: ${response.status}`);
      return { idade: null, dataNascimento: null };
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    const dataRaw = extractField(html, "Data de Nascimento");
    let idade = null;

    if (dataRaw) {
      const dataMatch = dataRaw.match(/(\d{4})-(\d{2})-(\d{2})\s*\((\d+)\s*anos?\)/);
      if (dataMatch) {
        idade = parseInt(dataMatch[4], 10);
      }
    }

    return { idade, dataNascimento: dataRaw };
  } catch (error) {
    console.log(`❌ Erro ao extrair ${url}:`, error);
    return { idade: null, dataNascimento: null };
  }
}

async function main() {
  console.log("🔄 Iniciando extração de dados do Ogol...\n");

  const db = await getDb();
  if (!db) {
    console.log("❌ Banco de dados não disponível");
    return;
  }

  // Buscar atletas sem idade
  const atletasSemIdade = await db
    .select()
    .from(atletas)
    .where(isNull(atletas.idade))
    .limit(200); // Processar 200 por vez para não sobrecarregar

  console.log(`📊 Encontrados ${atletasSemIdade.length} atletas sem idade\n`);

  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < atletasSemIdade.length; i++) {
    const atleta = atletasSemIdade[i];
    
    if (!atleta.link) {
      console.log(`⏭️  ${i + 1}/${atletasSemIdade.length} ${atleta.nome} - Sem link`);
      continue;
    }

    process.stdout.write(`⏳ ${i + 1}/${atletasSemIdade.length} ${atleta.nome}... `);

    const data = await extractOgolData(atleta.link);

    if (data.idade) {
      try {
        await db
          .update(atletas)
          .set({ idade: data.idade })
          .where(eq(atletas.id, atleta.id));
        
        console.log(`✅ Idade: ${data.idade}`);
        atualizados++;
      } catch (error) {
        console.log(`❌ Erro ao atualizar`);
        erros++;
      }
    } else {
      console.log(`⚠️  Não encontrou idade`);
      erros++;
    }

    // Delay para não sobrecarregar o Ogol
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📈 Atualizados: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total processado: ${atualizados + erros}`);
}

main().catch(console.error);
