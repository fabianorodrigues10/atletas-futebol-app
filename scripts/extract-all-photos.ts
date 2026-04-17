import { getDb } from "../server/db";
import { atletas, midias } from "../drizzle/schema";
import { eq, isNull, and } from "drizzle-orm";

interface PhotoData {
  fotoUrl: string | null;
  source: string; // "ogol", "google", "instagram", etc
}

function extractPhotoFromOgol(html: string): string | null {
  const patterns = [
    /<img[^>]*class="[^"]*player[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*photo[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*class="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*\/jogador\/[^"]+)"/i,
    /<img[^>]*src="([^"]*\/player[^"]+)"/i,
    /<img[^>]*src="([^"]*\/fotos\/[^"]+)"/i,
    /<img[^>]*src="([^"]*\/images\/[^"]+)"/i,
    /<div[^>]*class="[^"]*perfil[^"]*"[^>]*>.*?<img[^>]*src="([^"]+)"/is,
    /<img[^>]*alt="[^"]*jogador[^"]*"[^>]*src="([^"]+)"/i,
    /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))[^"]*"[^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let fotoUrl = match[1].trim();
      if (
        fotoUrl.includes("placeholder") ||
        fotoUrl.includes("icon") ||
        fotoUrl.includes("default") ||
        fotoUrl.includes("logo")
      ) {
        continue;
      }
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

async function extractFromOgol(url: string): Promise<PhotoData> {
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
      return { fotoUrl: null, source: "ogol" };
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    const fotoUrl = extractPhotoFromOgol(html);
    return { fotoUrl, source: "ogol" };
  } catch (error) {
    return { fotoUrl: null, source: "ogol" };
  }
}

async function extractFromGoogle(atleta: any): Promise<PhotoData> {
  try {
    // Construir query de busca
    const query = `${atleta.nome} ${atleta.posicao || ""} futebol`;
    const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;

    // Nota: Não conseguimos fazer scraping direto do Google Images
    // Mas podemos tentar uma API alternativa como Bing Images
    const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;

    const response = await fetch(bingUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { fotoUrl: null, source: "google" };
    }

    const html = await response.text();

    // Procurar por URLs de imagem no Bing
    const imgPattern = /"murl":"([^"]+\.(?:jpg|jpeg|png|webp))"/i;
    const match = html.match(imgPattern);

    if (match?.[1]) {
      return { fotoUrl: match[1], source: "bing" };
    }

    return { fotoUrl: null, source: "google" };
  } catch (error) {
    return { fotoUrl: null, source: "google" };
  }
}

async function extractFromInstagram(atleta: any): Promise<PhotoData> {
  try {
    // Procurar por perfil do Instagram
    const query = atleta.nome.replace(/\s+/g, "");
    const instagramUrl = `https://www.instagram.com/${query}/`;

    const response = await fetch(instagramUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      return { fotoUrl: null, source: "instagram" };
    }

    const html = await response.text();

    // Procurar por URL de foto de perfil
    const profilePicPattern =
      /"profile_pic_url":"([^"]+\.(?:jpg|jpeg|png|webp))"/i;
    const match = html.match(profilePicPattern);

    if (match?.[1]) {
      return { fotoUrl: match[1], source: "instagram" };
    }

    return { fotoUrl: null, source: "instagram" };
  } catch (error) {
    return { fotoUrl: null, source: "instagram" };
  }
}

async function extractPhotoForAtleta(atleta: any): Promise<PhotoData> {
  // Tentar Ogol primeiro
  if (atleta.link) {
    const ogolPhoto = await extractFromOgol(atleta.link);
    if (ogolPhoto.fotoUrl) {
      return ogolPhoto;
    }
  }

  // Tentar Google Images
  const googlePhoto = await extractFromGoogle(atleta);
  if (googlePhoto.fotoUrl) {
    return googlePhoto;
  }

  // Tentar Instagram
  const instagramPhoto = await extractFromInstagram(atleta);
  if (instagramPhoto.fotoUrl) {
    return instagramPhoto;
  }

  return { fotoUrl: null, source: "none" };
}

async function main() {
  console.log("🔄 Iniciando extração de fotos de todos os atletas...\n");

  const db = await getDb();
  if (!db) {
    console.log("❌ Banco de dados não disponível");
    return;
  }

  // Buscar todos os atletas
  const todoAtletas = await db.select().from(atletas);
  console.log(`📊 Total de atletas: ${todoAtletas.length}\n`);

  // Buscar atletas que já têm foto
  const atletasComFoto = await db
    .select({ atletaId: midias.atletaId })
    .from(midias)
    .where(eq(midias.tipo, "foto"));

  const atletasComFotoIds = new Set(atletasComFoto.map((m) => m.atletaId));
  const atletasSemFoto = todoAtletas.filter(
    (a) => !atletasComFotoIds.has(a.id)
  );

  console.log(`📸 Atletas sem foto: ${atletasSemFoto.length}\n`);

  let atualizados = 0;
  let erros = 0;
  const sourceCount: Record<string, number> = {};

  for (let i = 0; i < atletasSemFoto.length; i++) {
    const atleta = atletasSemFoto[i];

    process.stdout.write(
      `⏳ ${i + 1}/${atletasSemFoto.length} ${atleta.nome}... `
    );

    const photoData = await extractPhotoForAtleta(atleta);

    if (photoData.fotoUrl) {
      try {
        await db.insert(midias).values({
          userId: atleta.userId,
          atletaId: atleta.id,
          tipo: "foto",
          nome: `Foto de ${atleta.nome}`,
          url: photoData.fotoUrl,
          s3Key: `${photoData.source}/${atleta.id}/foto.jpg`,
          mimeType: "image/jpeg",
          descricao: `Foto extraída de ${photoData.source}`,
        });

        console.log(`✅ ${photoData.source.toUpperCase()}`);
        atualizados++;
        sourceCount[photoData.source] =
          (sourceCount[photoData.source] || 0) + 1;
      } catch (error) {
        console.log(`❌ Erro ao salvar`);
        erros++;
      }
    } else {
      console.log(`⚠️  Não encontrou foto`);
      erros++;
    }

    // Delay para não sobrecarregar
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n✅ Processo concluído!`);
  console.log(`📈 Fotos salvas: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Total processado: ${atualizados + erros}`);
  console.log(`\n📊 Fotos por fonte:`);
  Object.entries(sourceCount).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
}

main().catch(console.error);
