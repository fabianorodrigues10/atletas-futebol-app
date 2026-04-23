/**
 * Ogol Scraper - Extrai dados de atletas do site ogol.com.br
 * Faz fetch da página HTML e parseia os dados pessoais do jogador.
 */
import { Request, Response } from "express";

export interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null; // formato dd/mm/aa (ex: 28/03/97)
  idade: number | null;
  altura: number | null; // em metros (ex: 1.76)
  pe: string | null; // "direito" | "esquerdo" | "ambidestro"
  clube: string | null;
  fotoUrl: string | null; // URL da foto do atleta
  naturalidade: string | null; // Cidade/Estado de nascimento
}

/**
 * Mapeia posição do Ogol para as categorias do app
 */
function mapPosicao(ogolPos: string | null): string | null {
  if (!ogolPos) return null;
  const pos = ogolPos.toLowerCase().trim();

  // Mapeamento direto
  const mapping: Record<string, string> = {
    goleiro: "Goleiro",
    "guarda-redes": "Goleiro",
    zagueiro: "Zagueiro",
    "defesa central": "Zagueiro",
    defensor: "Zagueiro",
    lateral: "Lateral",
    "lateral direito": "Lateral",
    "lateral esquerdo": "Lateral",
    volante: "Volante",
    "médio defensivo": "Volante",
    "meio-campista": "Meia",
    médio: "Meia",
    meia: "Meia",
    "meia-atacante": "Meia",
    "médio ofensivo": "Meia",
    extremo: "Extremo",
    ponta: "Extremo",
    "ponta direita": "Extremo",
    "ponta esquerda": "Extremo",
    atacante: "Centroavante",
    avançado: "Centroavante",
    centroavante: "Centroavante",
    "segundo avançado": "2º Atacante",
  };

  if (mapping[pos]) return mapping[pos];
  for (const [key, value] of Object.entries(mapping)) {
    if (pos.includes(key) || key.includes(pos)) return value;
  }
  return ogolPos.charAt(0).toUpperCase() + ogolPos.slice(1);
}

/**
 * Mapeia pé preferencial do Ogol para o formato do app
 */
function mapPe(ogolPe: string | null): string | null {
  if (!ogolPe) return null;
  const pe = ogolPe.toLowerCase().trim();
  if (pe === "destro" || pe === "direito") return "direito";
  if (pe === "canhoto" || pe === "esquerdo") return "esquerdo";
  if (pe === "ambidestro" || pe.includes("ambos")) return "ambidestro";
  return null;
}

/**
 * Extrai o valor de um campo específico do HTML do Ogol.
 * Usa padrões específicos baseados na estrutura real do HTML.
 */
function extractField(html: string, labelText: string): string | null {
  // Escapar caracteres especiais no label para usar em regex
  const escapedLabel = labelText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Pattern 1: Label seguido por card-data__value (caso comum)
  const pattern1 = new RegExp(
    `card-data__label"[^>]*>${escapedLabel}<\\/span>\\s*<span class="card-data__value"[^>]*>([^<]+)<`,
    "i"
  );
  const match1 = html.match(pattern1);
  if (match1?.[1]) {
    const text = match1[1].trim();
    if (text.length > 0) return text;
  }

  // Pattern 2: Label seguido por card-data__values (plural, usado para Posição)
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

/**
 * Parseia HTML do Ogol e extrai dados do jogador
 */
function parseOgolHtml(html: string): OgolPlayerData {
  const result: OgolPlayerData = {
    nome: null,
    posicao: null,
    dataNascimento: null,
    idade: null,
    altura: null,
    pe: null,
    clube: null,
    fotoUrl: null,
    naturalidade: null,
  };

  // Nome completo
  const nomeRaw = extractField(html, "Nome");
  if (nomeRaw && nomeRaw.length > 2) {
    result.nome = nomeRaw;
  }

  // Data de nascimento e idade
  const dataRaw = extractField(html, "Data de Nascimento");
  if (dataRaw) {
    const dataMatch = dataRaw.match(
      /(\d{4})-(\d{2})-(\d{2})\s*\((\d+)\s*anos?\)/
    );
    if (dataMatch) {
      const yy = dataMatch[1].slice(2);
      result.dataNascimento = `${dataMatch[3]}/${dataMatch[2]}/${yy}`; // dd/mm/aa
      result.idade = parseInt(dataMatch[4], 10);
    }
  }

  // Posição
  const posRaw = extractField(html, "Posição");
  if (posRaw && posRaw.length < 30) {
    result.posicao = mapPosicao(posRaw);
  }

  // Pé preferencial
  const peRaw = extractField(html, "Pé preferencial");
  if (peRaw) {
    result.pe = mapPe(peRaw);
  }

  // Naturalidade
  const naturalidadeRaw = extractField(html, "Naturalidade");
  if (naturalidadeRaw && naturalidadeRaw.length > 0) {
    result.naturalidade = naturalidadeRaw;
  }

  // Altura / Peso
  const alturaRaw = extractField(html, "Altura / Peso");
  if (alturaRaw) {
    const altMatch = alturaRaw.match(/(\d{3})\s*cm/);
    if (altMatch) {
      const cm = parseInt(altMatch[1], 10);
      result.altura = parseFloat((cm / 100).toFixed(2));
    }
  }

  // Foto do atleta - múltiplos padrões
  // Procura por img tags com src contendo foto/imagem do jogador
  console.log(`[Ogol Parser] Procurando por foto...`);
  const fotoPatterns = [
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
    /<img[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*jogador[^"]*)"/i,
    /<img[^>]*src="([^"]*(?:jpg|jpeg|png|webp)[^"]*player[^"]*)"/i,
  ];
  
  for (const pattern of fotoPatterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      let fotoUrl = match[1].trim();
      // Validar que não é um placeholder ou ícone
      if (fotoUrl.includes("placeholder") || fotoUrl.includes("icon") || fotoUrl.includes("default")) {
        continue;
      }
      // Converter URLs relativas em absolutas
      if (fotoUrl.startsWith("/")) {
        fotoUrl = "https://www.ogol.com.br" + fotoUrl;
      } else if (!fotoUrl.startsWith("http")) {
        fotoUrl = "https://www.ogol.com.br/" + fotoUrl;
      }
      result.fotoUrl = fotoUrl;
      break;
    }
  }
  
  // Se não encontrou com os padrões, tenta uma busca mais genérica
  if (!result.fotoUrl) {
    // Procura por qualquer img tag com src que pareça uma foto
    const genericPattern = /<img[^>]*src="([^"]*\.(?:jpg|jpeg|png|webp))[^"]*"[^>]*>/i;
    const match = html.match(genericPattern);
    if (match?.[1]) {
      let fotoUrl = match[1].trim();
      if (!fotoUrl.includes("placeholder") && !fotoUrl.includes("icon")) {
        if (fotoUrl.startsWith("/")) {
          fotoUrl = "https://www.ogol.com.br" + fotoUrl;
        } else if (!fotoUrl.startsWith("http")) {
          fotoUrl = "https://www.ogol.com.br/" + fotoUrl;
        }
        result.fotoUrl = fotoUrl;
      }
    }
  }

  return result;
}

/**
 * Registra a rota Express para scraping do Ogol
 */
export function registerOgolRoutes(app: any) {
  app.post("/api/ogol/scrape", async (req: Request, res: Response) => {
    try {
      const { url } = req.body as { url?: string };

      if (!url) {
        res.status(400).json({ error: "URL é obrigatória" });
        return;
      }

      // Validar que é uma URL do Ogol
      if (!url.includes("ogol.com")) {
        res.status(400).json({ error: "URL deve ser do site ogol.com.br" });
        return;
      }

      console.log(`[Ogol Scraper] Fetching: ${url}`);

      // Fetch da página com headers que contornam Cloudflare
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          "Referer": "https://www.ogol.com.br/",
          "Origin": "https://www.ogol.com.br",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });

      if (!response.ok) {
        res.status(502).json({ error: `Erro ao acessar o Ogol: ${response.status}` });
        return;
      }

      // Decodificar HTML com tratamento de encoding
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder("iso-8859-1");
      const html = decoder.decode(buffer);

      console.log(`[Ogol Scraper] HTML length: ${html.length}`);

      // Parsear os dados
      const data = parseOgolHtml(html);
      console.log(`[Ogol Scraper] Parsed data:`, JSON.stringify(data));
      
      // Debug: Log de imagens encontradas
      const imgMatches = html.match(/<img[^>]*src="([^"]+)"[^>]*>/g) || [];
      console.log(`[Ogol Scraper] Total de img tags encontradas: ${imgMatches.length}`);
      if (imgMatches.length > 0) {
        console.log(`[Ogol Scraper] Primeiras 5 img tags:`);
        imgMatches.slice(0, 5).forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.substring(0, 150)}...`);
        });
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[Ogol Scraper] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao extrair dados do Ogol" });
    }
  });
}
