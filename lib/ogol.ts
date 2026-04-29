/**
 * Ogol Scraper - Extrai dados de atletas do site ogol.com.br
 *
 * Estrutura HTML real do Ogol (seção DADOS PESSOAIS):
 *   <span class="card-data__label">Nome</span>
 *   <span class="card-data__value">Ronaldy Wyllian da Silva Santana</span>
 *
 * Funciona no lado do cliente (React Native) para contornar proteção Cloudflare.
 * Fallback: usa o endpoint do servidor.
 */

import { Platform } from "react-native";

export interface OgolPlayerData {
  nome: string | null;
  posicao: string | null;
  dataNascimento: string | null; // formato dd/mm/aa
  idade: number | null;
  altura: number | null; // em metros (ex: 1.76)
  pe: string | null; // "direito" | "esquerdo" | "ambidestro"
  clube: string | null;
  naturalidade: string | null; // Cidade/Estado de nascimento
}

/**
 * Mapeia posição do Ogol para as categorias do app
 */
export function mapPosicao(ogolPos: string): string {
  const pos = ogolPos.toLowerCase().trim();
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
export function mapPe(ogolPe: string): string | null {
  const pe = ogolPe.toLowerCase().trim();
  if (pe === "destro" || pe === "direito") return "direito";
  if (pe === "canhoto" || pe === "esquerdo") return "esquerdo";
  if (pe === "ambidestro" || pe.includes("ambos")) return "ambidestro";
  return null;
}

/**
 * Converte data ISO (YYYY-MM-DD) para formato dd/mm/aa
 */
export function isoToShortDate(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) return "";
  const year = parts[0].slice(2);
  return `${parts[2]}/${parts[1]}/${year}`;
}

/**
 * Extrai o valor de um campo do HTML do Ogol.
 *
 * Abordagem: encontra a posição do label no HTML, depois busca o valor
 * mais próximo usando padrões card-data__value ou texto direto.
 */
function extractField(html: string, label: string): string | null {
  // Find the label position first
  const labelRegex = new RegExp(label, "i");
  const labelMatch = html.match(labelRegex);
  if (!labelMatch || labelMatch.index === undefined) return null;

  // Get everything after the label
  const afterLabel = html.substring(
    labelMatch.index + labelMatch[0].length
  );

  // Pattern 1: card-data__value content (most common in real Ogol HTML)
  const valueMatch = afterLabel.match(
    /card-data__value[s]?"[^>]*>(?:\s*(?:<[^>]+>\s*)*)?([^<]+)/i
  );
  if (valueMatch?.[1]?.trim()) return valueMatch[1].trim();

  // Pattern 2: direct text after closing tag (e.g. "Sem Clube" in a div)
  const directMatch = afterLabel.match(/<\/span>\s*<[^>]+>\s*([^<]+)/i);
  if (directMatch?.[1]?.trim()) return directMatch[1].trim();

  // Pattern 3: plain text on same line (markdown fallback)
  const plainMatch = afterLabel.match(/^\s+([^\n<]+)/);
  if (plainMatch?.[1]?.trim()) return plainMatch[1].trim();

  return null;
}

/**
 * Parseia HTML do Ogol e extrai dados do jogador
 */
export function parseOgolHtml(html: string): OgolPlayerData {
  const result: OgolPlayerData = {
    nome: null,
    posicao: null,
    dataNascimento: null,
    idade: null,
    altura: null,
    pe: null,
    clube: null,
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
      /(\d{4}-\d{2}-\d{2})\s*\((\d+)\s*anos?\)/
    );
    if (dataMatch) {
      result.dataNascimento = isoToShortDate(dataMatch[1]);
      result.idade = parseInt(dataMatch[2], 10);
    }
  }

  // Posição - use regex alternation for accented chars
  const posRaw = extractField(html, "Posi(?:ção|çao|cao|ção)");
  if (posRaw && posRaw.length < 30) {
    result.posicao = mapPosicao(posRaw);
  }

  // Pé preferencial
  const peRaw = extractField(html, "P(?:é|e) preferencial");
  if (peRaw) {
    result.pe = mapPe(peRaw);
  }

  // Altura
  const alturaRaw = extractField(html, "Altura");
  if (alturaRaw) {
    const altMatch = alturaRaw.match(/(\d{3})\s*cm/);
    if (altMatch) {
      const cm = parseInt(altMatch[1], 10);
      result.altura = parseFloat((cm / 100).toFixed(2));
    }
  }

  // Clube atual
  const clubeRaw = extractField(html, "Clube atual");
  if (clubeRaw && clubeRaw !== "Sem Clube" && clubeRaw.length > 1) {
    result.clube = clubeRaw;
  }

  // Naturalidade
  const naturalidadeRaw = extractField(html, "Naturalidade");
  if (naturalidadeRaw && naturalidadeRaw.length > 0) {
    result.naturalidade = naturalidadeRaw;
  }

  return result;
}

/**
 * Busca dados de um atleta do Ogol a partir da URL.
 * Tenta primeiro via fetch direto do cliente.
 * Se falhar, tenta via endpoint do servidor.
 */
export async function fetchOgolData(
  url: string,
  apiBaseUrl?: string
): Promise<{ success: boolean; data?: OgolPlayerData; error?: string }> {
  // Validar URL
  if (!url || !url.includes("ogol.com")) {
    return { success: false, error: "URL deve ser do site ogol.com.br" };
  }

  // Tentar fetch direto do cliente
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });

    if (response.ok) {
      const html = await response.text();
      if (
        html.length > 1000 &&
        (html.includes("DADOS PESSOAIS") ||
          html.includes("card-data__label"))
      ) {
        const data = parseOgolHtml(html);
        if (data.nome || data.posicao || data.dataNascimento) {
          return { success: true, data };
        }
      }
    }
  } catch (e) {
    console.log("[Ogol] Client fetch failed, trying server...", e);
  }

  // Fallback: tentar via servidor (proxy Ogol)
  if (apiBaseUrl) {
    try {
      const serverUrl = `${apiBaseUrl}/api/ogol/scrape`;
      const response = await fetch(serverUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (response.ok) {
        const jsonResult = await response.json();
        // Endpoint retorna diretamente os dados
        if (jsonResult.nome || jsonResult.posicao || jsonResult.dataNascimento) {
          // Converter altura de string para number se necessário
          const data: OgolPlayerData = {
            nome: jsonResult.nome || null,
            posicao: jsonResult.posicao ? mapPosicao(jsonResult.posicao) : null,
            dataNascimento: jsonResult.dataNascimento || null,
            idade: jsonResult.idade || null,
            altura: jsonResult.altura ? parseFloat(String(jsonResult.altura)) / 100 : null,
            pe: jsonResult.pe ? mapPe(jsonResult.pe) : null,
            clube: jsonResult.clube || null,
            naturalidade: jsonResult.naturalidade || null,
          };
          return { success: true, data };
        }
      }
    } catch (e) {
      console.log("[Ogol] Server fetch also failed", e);
    }
  }

  return {
    success: false,
    error:
      "Não foi possível acessar o Ogol. O site pode estar bloqueando a conexão. Tente novamente mais tarde.",
  };
}
