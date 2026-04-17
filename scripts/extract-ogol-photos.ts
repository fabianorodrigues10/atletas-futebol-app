import { getDb } from "../server/db";
import { atletas, midias } from "../drizzle/schema";
import { eq, isNull } from "drizzle-orm";

interface OgolPhotoData {
  fotoUrl: string | null;
}

function extractPhotoUrl(html: string): string | null {
  // Múltiplos padrões para encontrar a foto
  const patterns = [
    // Padrão 1: img com class contendo "player"
    /<img[^>]*class="[^"]*player[^"]*"[^>]*src="([^"]+)"/i,
    // Padrão 2: img com class contendo "photo"
    /<img[^>]*class="[^"]*photo[^"]*"[^>]*src="([^"]+)"/i,
    // Padrão 3: img com class contendo "jogador"
    /<img[^>]*class="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    // Padrão 4: img com src contendo /jogador/
    /<img[^>]*src="([^"]*\/jogador\/[^"]+)"/i,
    // Padrão 5: img com src contendo /player
    /<img[^>]*src="([^"]*\/player[^"]+)"/i,
    // Padrão 6: img com src contendo /fotos/ ou /images/
    /<img[^>]*src="([^"]*\/fotos\/[^"]+)"/i,
    /<img[^>]*src="([^"]*\/images\/[^"]+)"/i,
    // Padrão 7: Qualquer img dentro de divs com id/class de perfil
    /<div[^>]*class="[^"]*perfil[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is,
    // Padrão 8: img com alt contendo nome do jogador
    /<img[^>]*alt="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    // Padrão 9: Procura por qualquer img com src que não seja placeholder
    /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))[^"]*"[^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let fotoUrl = match[1].trim();
      // Validar que não é um placeholder ou ícone
      if (
        fotoUrl.includes("placeholder") ||
        fotoUrl.includes("icon") ||
        fotoUrl.includes("default") ||
        fotoUrl.includes("logo")
      ) {
        continue;
      }
      // Converter URLs relativas em absolutas
      if (fotoUrl.startsWith("/")) {
        fotoUrl = "https://www.ogol.com.br" + fotoUrl;
      } else if (!fotoUrl.startsWith("http")) {
        fotoUrl = "https://www.ogol.com.br/" + fotoUrl;
      }
      return fotoUrl;
    }
  }

  return null;
}

async function extractOgolPhoto(url: string): Promise<OgolPhotoData> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        Referer: "https://www.ogol.com.br/",
      },
    });

    if (!response.ok) {
      return { fotoUrl: null };
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    const fotoUrl = extractPhotoUrl(html);
    return { fotoUrl };
  } catch (error) {
    return { fotoUrl: null };
  }
}

async function main() {
  console.log("🔄 Iniciando extração de fotos do Ogol...\n");

  const db = await getDb();
  if (!db) {
    console.log("❌ Banco de dados não disponível");
    return;
  }

  // Buscar atletas que não têm foto (não têm mídia do tipo "foto")
  const atletasComFoto = await db
    .select({ atletaId: midias.atletaId })
    .from(midias)
    .where(eq(midias.tipo, "foto"));

  const atletasComFotoIds = new Set(atletasComFoto.map((m) => m.atletaId));

  const todoAtletas = await db.select().from(atletas).limit(200);
  const atletasSemFoto = todoAtletas.filter((a) => !atletasComFotoIds.has(a.id));

  console.log(`📊 Encontrados ${atletasSemFoto.length} atletas sem foto\n`);

  let atualizados = 0;
  let erros = 0;

  for (let i = 0; i < atletasSemFoto.length; i++) {
    const atleta = atletasSemFoto[i];

    if (!atleta.link) {
      console.log(
        `⏭️  ${i + 1}/${atletasSemFoto.length} ${atleta.nome} - Sem link`
      );
      continue;
    }

    process.stdout.write(
      `⏳ ${i + 1}/${atletasSemFoto.length} ${atleta.nome}... `
    );

    const data = await extractOgolPhoto(atleta.link);

    if (data.fotoUrl) {
      try {
        // Salvar foto no banco
        await db.insert(midias).values({
          userId: atleta.userId,
          atletaId: atleta.id,
          tipo: "foto",
          nome: `Foto de ${atleta.nome}`,
          url: data.fotoUrl,
          s3Key: `ogol/${atleta.id}/foto.jpg`,
          mimeType: "image/jpeg",
          descricao: "Foto extraída do Ogol",
        });

        console.log(`✅ Foto salva`);
        atualizados++;
      } catch (error) {
        console.log(`❌ Erro ao salvar`);
        erros++;
      }
    } else {
      console.log(`⚠️  Não encontrou foto`);
      erros++;
    }

    // Delay para não sobrecarregar o Ogol
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📈 Fotos salvas: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total processado: ${atualizados + erros}`);
}

main().catch(console.error);
