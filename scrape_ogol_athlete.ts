import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

interface AthleteData {
  id: number;
  nome: string;
  link: string;
  clube?: string;
  posicao?: string;
  altura?: string;
  dataNascimento?: string;
  naturalidade?: string;
  fotoUrl?: string;
  fotoLocal?: string;
}

async function scrapeAthlete(athlete: AthleteData): Promise<Partial<AthleteData>> {
  try {
    const response = await fetch(athlete.link, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.log(`⚠️  ${athlete.nome}: HTTP ${response.status}`);
      return {};
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const updates: Partial<AthleteData> = {};

    // Extrair dados da página
    // Procurar por padrões comuns no OGol

    // Clube (geralmente em um campo destacado)
    const clubeText = $("span:contains('Clube')").next().text().trim() ||
                      $("td:contains('Clube')").next().text().trim();
    if (clubeText) updates.clube = clubeText;

    // Posição
    const posicaoText = $("span:contains('Posição')").next().text().trim() ||
                        $("td:contains('Posição')").next().text().trim() ||
                        $("span:contains('Pos.')").next().text().trim();
    if (posicaoText) updates.posicao = posicaoText;

    // Altura
    const alturaText = $("span:contains('Altura')").next().text().trim() ||
                       $("td:contains('Altura')").next().text().trim();
    if (alturaText) {
      const match = alturaText.match(/(\d+,\d+|\d+\.\d+)/);
      if (match) updates.altura = match[1].replace(",", ".");
    }

    // Data de nascimento
    const dataNascText = $("span:contains('Data de Nascimento')").next().text().trim() ||
                         $("td:contains('Data de Nascimento')").next().text().trim() ||
                         $("span:contains('Nascimento')").next().text().trim();
    if (dataNascText && dataNascText !== "-") {
      updates.dataNascimento = dataNascText;
    }

    // Naturalidade
    const naturalidadeText = $("span:contains('Naturalidade')").next().text().trim() ||
                             $("td:contains('Naturalidade')").next().text().trim();
    if (naturalidadeText && naturalidadeText !== "-") {
      updates.naturalidade = naturalidadeText;
    }

    // Foto (procurar por img com classe de foto de perfil)
    const fotoUrl = $("img.profile-photo").attr("src") ||
                    $("img.jogador-foto").attr("src") ||
                    $("img[alt*='foto']").attr("src") ||
                    $("img").first().attr("src");

    if (fotoUrl && fotoUrl.includes("ogol")) {
      updates.fotoUrl = fotoUrl.startsWith("http") ? fotoUrl : `https://www.ogol.com.br${fotoUrl}`;
    }

    return updates;
  } catch (error: any) {
    console.log(`❌ ${athlete.nome}: ${error.message}`);
    return {};
  }
}

// Exportar função
export { scrapeAthlete, AthleteData };
