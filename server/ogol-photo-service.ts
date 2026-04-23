/**
 * Serviço para extrair fotos do Ogol em tempo real
 * Sem depender do banco de dados
 */

const photoCache = new Map<number, string>();

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

export async function getPhotoFromOgol(
  atletaId: number,
  ogolUrl: string
): Promise<string | null> {
  // Verificar cache
  if (photoCache.has(atletaId)) {
    return photoCache.get(atletaId) || null;
  }

  try {
    const response = await fetch(ogolUrl, {
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
      photoCache.set(atletaId, "");
      return null;
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    const fotoUrl = extractPhotoFromOgol(html);
    photoCache.set(atletaId, fotoUrl || "");
    return fotoUrl || null;
  } catch (error) {
    console.error(`[Photo Service] Erro ao extrair foto do atleta ${atletaId}:`, error);
    photoCache.set(atletaId, "");
    return null;
  }
}

export function clearPhotoCache() {
  photoCache.clear();
}

export function getCacheSize() {
  return photoCache.size;
}
