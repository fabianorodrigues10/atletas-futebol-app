/*
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
 * Parseia o HTML do Ogol e extrai os dados do jogador usando cheerio
 */
function parseOgolHtml(html: string): OgolPlayerData {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  
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

  // Função auxiliar para extrair valor de um label usando cheerio
  const getFieldValue = (labelText: string): string | null => {
    let value: string | null = null;
    
    // Procura por span com class card-data__label que contenha o texto
    $('span.card-data__label').each((i: number, el: any) => {
      const label = $(el).text().trim();
      // Verifica se o label contém o texto procurado (case-insensitive)
      if (label.toLowerCase().includes(labelText.toLowerCase())) {
        // Procura pelo próximo span com class card-data__value ou card-data__values
        const parent = $(el).closest('.card-data__row');
        if (parent.length) {
          // Tenta encontrar card-data__value
          let valueSpan = parent.find('span.card-data__value').first();
          if (!valueSpan.length) {
            // Se não encontrou, tenta card-data__values > card-data__value
            valueSpan = parent.find('span.card-data__values span.card-data__value').first();
          }
          if (valueSpan.length) {
            value = valueSpan.text().trim();
          }
        }
      }
    });
    
    return value && (value as string).length > 0 ? value : null;
  };
  
  // Nome completo
  const nomeRaw = getFieldValue('Nome');
  if (nomeRaw && nomeRaw.length > 2) {
    result.nome = nomeRaw;
  }

  // Data de nascimento e idade
  const dataRaw = getFieldValue('Data de Nascimento');
  if (dataRaw) {
    const dataMatch = dataRaw.match(/(\d{4})-(\d{2})-(\d{2})\s*\((\d+)\s*anos?\)/);
    if (dataMatch) {
      const yy = dataMatch[1].slice(2);
      result.dataNascimento = `${dataMatch[3]}/${dataMatch[2]}/${yy}`; // dd/mm/aa
      result.idade = parseInt(dataMatch[4], 10);
    }
  }

  // Posição
  const posRaw = getFieldValue('Posição');
  if (posRaw && posRaw.length < 30) {
    result.posicao = mapPosicao(posRaw);
  }

  // Pé preferencial
  const peRaw = getFieldValue('Pé preferencial');
  if (peRaw) {
    result.pe = mapPe(peRaw);
  }

  // Naturalidade
  const naturalidadeRaw = getFieldValue('Naturalidade');
  if (naturalidadeRaw && naturalidadeRaw.length > 0) {
    result.naturalidade = naturalidadeRaw;
  }

  // Altura / Peso
  const alturaRaw = getFieldValue('Altura / Peso') || getFieldValue('Altura');
  if (alturaRaw) {
    const altMatch = alturaRaw.match(/(\d{3})\s*cm/);
    if (altMatch) {
      const cm = parseInt(altMatch[1], 10);
      result.altura = parseFloat((cm / 100).toFixed(2));
    }
  }

  // Foto do atleta - procura por img tags
  const fotoPatterns = [
    // Padrão 1: img com class contendo "player" ou "jogador"
    'img[class*="player"], img[class*="jogador"]',
    // Padrão 2: img com src contendo /jogador/ ou /player
    'img[src*="/jogador/"], img[src*="/player"]',
    // Padrão 3: img com src contendo /fotos/ ou /images/
    'img[src*="/fotos/"], img[src*="/images/"]',
    // Padrão 4: Qualquer img dentro de divs com id/class de perfil
    'div[class*="perfil"] img, div[id*="perfil"] img',
  ];
  
  for (const selector of fotoPatterns) {
    const img = $(selector).first();
    if (img.length) {
      let fotoUrl = img.attr('src');
      if (fotoUrl && !fotoUrl.includes('placeholder') && !fotoUrl.includes('icon') && !fotoUrl.includes('default')) {
        // Converter URLs relativas em absolutas
        if (fotoUrl.startsWith('/')) {
          fotoUrl = 'https://www.ogol.com.br' + fotoUrl;
        } else if (!fotoUrl.startsWith('http')) {
          fotoUrl = 'https://www.ogol.com.br/' + fotoUrl;
        }
        result.fotoUrl = fotoUrl;
        break;
      }
    }
  }

  return result;
}

/**
 * Scraping com Playwright como fallback para Cloudflare
 */
async function scrapeWithPlaywright(url: string): Promise<string | null> {
  const startTime = Date.now();
  const MAX_DURATION = 12000; // 12s timeout maximo
  
  try {
    const playwright = await import("playwright");
    const browser = await playwright.chromium.launch({ headless: true });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    
    // Definir user agent para evitar bloqueios
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    
    // Navegar para a URL com timeout de 10s (reduzido de 30s)
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
    } catch (navError) {
      console.log("[Ogol Scraper] Navegacao falhou, continuando com HTML parcial...");
    }
    
    // Aguardar o carregamento do conteudo principal (max 2s)
    await page.waitForSelector(".card-data__label", { timeout: 2000 }).catch(() => null);
    
    // Extrair HTML
    const html = await page.content();
    
    // Fechar browser
    await browser.close();
    
    const duration = Date.now() - startTime;
    console.log(`[Ogol Scraper] Playwright completado em ${duration}ms`);
    
    // Se demorou muito, avisar
    if (duration > 10000) {
      console.warn(`[Ogol Scraper] Playwright demorou ${duration}ms (limite: ${MAX_DURATION}ms)`);
    }
    
    return html;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Ogol Scraper] Playwright error (${duration}ms): ${error.message}`);
    return null;
  }
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

      let html: string | null = null;
      
      // Tentar fetch normal primeiro
      try {
        // Usar AbortController para timeout real (fetch nativo nao suporta timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
        
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
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const decoder = new TextDecoder("iso-8859-1");
          html = decoder.decode(buffer);
          console.log(`[Ogol Scraper] Fetch bem-sucedido, HTML length: ${html.length}`);
        }
      } catch (fetchError: any) {
        console.log(`[Ogol Scraper] Fetch falhou: ${fetchError.message}, tentando Playwright...`);
      }
      
      // Se fetch falhou ou retornou vazio, usar Playwright
      if (!html || html.length < 1000) {
        console.log(`[Ogol Scraper] Usando Playwright como fallback...`);
        html = await scrapeWithPlaywright(url);
      }
      
      if (!html) {
        res.status(502).json({ error: "Erro ao acessar o Ogol (Cloudflare bloqueado)" });
        return;
      }

      console.log(`[Ogol Scraper] HTML length: ${html.length}`);
      
      // Detectar Cloudflare challenge ou conteúdo inválido
      const isCloudflareChallenge = html.includes('cf-challenge') || html.includes('cloudflare') || html.includes('turnstile') || html.includes('captcha');
      const hasValidContent = html.includes('card-data__label') || html.includes('DADOS PESSOAIS') || html.includes('Dados Pessoais');
      
      if (isCloudflareChallenge || !hasValidContent) {
        console.error('[Ogol Scraper] Cloudflare challenge detectado ou conteúdo inválido');
        console.error(`  - isCloudflareChallenge: ${isCloudflareChallenge}`);
        console.error(`  - hasValidContent: ${hasValidContent}`);
        console.error(`  - HTML preview: ${html.substring(0, 500)}`);
        res.status(502).json({ error: "Erro ao acessar o Ogol (Cloudflare bloqueado ou conteúdo indisponível)" });
        return;
      }

      // Parsear os dados
      const data = parseOgolHtml(html);
      console.log(`[Ogol Scraper] Parsed data:`, JSON.stringify(data));

      res.json({ success: true, data });
    } catch (error: any) {
      console.error("[Ogol Scraper] Error:", error);
      res.status(500).json({ error: error.message || "Erro ao extrair dados do Ogol" });
    }
  });
}
