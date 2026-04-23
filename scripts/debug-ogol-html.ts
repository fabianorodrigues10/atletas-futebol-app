/**
 * Script para analisar a estrutura HTML do Ogol e identificar padrões dos campos
 */

const url = "https://www.ogol.com.br/jogador/giva/607807?epoca_id=154";

async function analyzeOgolHtml() {
  try {
    console.log(`[Debug] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://www.ogol.com.br/",
        "Cache-Control": "max-age=0",
      },
    });

    if (!response.ok) {
      console.error(`[Debug] Erro: ${response.status}`);
      return;
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder("iso-8859-1");
    const html = decoder.decode(buffer);

    console.log(`[Debug] HTML length: ${html.length}`);

    // Procurar por "Posição"
    const posicaoIndex = html.indexOf("Posição");
    if (posicaoIndex !== -1) {
      console.log(
        `\n[Debug] Encontrado "Posição" no índice ${posicaoIndex}`
      );
      console.log(
        `[Debug] Contexto (300 chars depois):\n${html.substring(posicaoIndex, posicaoIndex + 300)}`
      );
    } else {
      console.log(`[Debug] "Posição" NÃO encontrado`);
    }

    // Procurar por "Clube"
    const clubeIndex = html.indexOf("Clube");
    if (clubeIndex !== -1) {
      console.log(`\n[Debug] Encontrado "Clube" no índice ${clubeIndex}`);
      console.log(
        `[Debug] Contexto (300 chars depois):\n${html.substring(clubeIndex, clubeIndex + 300)}`
      );
    } else {
      console.log(`[Debug] "Clube" NÃO encontrado`);
    }

    // Procurar por "Naturalidade"
    const naturalidadeIndex = html.indexOf("Naturalidade");
    if (naturalidadeIndex !== -1) {
      console.log(
        `\n[Debug] Encontrado "Naturalidade" no índice ${naturalidadeIndex}`
      );
      console.log(
        `[Debug] Contexto (300 chars depois):\n${html.substring(naturalidadeIndex, naturalidadeIndex + 300)}`
      );
    } else {
      console.log(`[Debug] "Naturalidade" NÃO encontrado`);
    }

    // Procurar por "card-data__label" para entender a estrutura
    const cardDataMatches = html.match(
      /<span class="card-data__label"[^>]*>([^<]+)<\/span>/g
    );
    if (cardDataMatches) {
      console.log(
        `\n[Debug] Encontrados ${cardDataMatches.length} card-data__label:`
      );
      cardDataMatches.forEach((match, idx) => {
        console.log(`  ${idx + 1}. ${match}`);
      });
    }

    // Salvar um trecho do HTML para análise manual
    const fs = await import("fs");
    const debugFile = "/home/ubuntu/ogol-debug.html";
    fs.writeFileSync(debugFile, html);
    console.log(`\n[Debug] HTML completo salvo em: ${debugFile}`);
  } catch (error: any) {
    console.error("[Debug] Erro:", error.message);
  }
}

analyzeOgolHtml();
