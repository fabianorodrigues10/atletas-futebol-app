import * as cheerio from "cheerio";

async function testScrape() {
  try {
    // Testar com um atleta específico
    const url = "https://www.ogol.com.br/jogador/ze-leandro/557286";
    
    console.log(`🔄 Testando scrape de: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Procurar por imagens
    const images = $("img");
    console.log(`📊 Total de imagens na página: ${images.length}\n`);

    // Procurar por foto de perfil
    const profileImg = $("img.profile-photo, img.jogador-foto, img[alt*='Ze Leandro']");
    console.log(`🖼️  Imagens de perfil encontradas: ${profileImg.length}`);
    profileImg.each((i, el) => {
      const src = $(el).attr("src");
      console.log(`   ${i + 1}. ${src}`);
    });

    // Procurar por qualquer imagem grande
    console.log(`\n📸 Primeiras 5 imagens da página:`);
    images.slice(0, 5).each((i, el) => {
      const src = $(el).attr("src");
      const alt = $(el).attr("alt");
      console.log(`   ${i + 1}. src: ${src?.substring(0, 80)}`);
      console.log(`      alt: ${alt}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

testScrape();
