import * as fs from "fs";

async function generatePhotoUrls() {
  console.log("🔄 Gerando URLs de foto baseadas em padrões do OGol...\n");

  // Ler lista de atletas
  const athletes = JSON.parse(fs.readFileSync("athletes_with_links.json", "utf-8"));

  console.log(`📊 Total de atletas: ${athletes.length}`);

  const results = [];

  for (const athlete of athletes) {
    try {
      // Extrair ID do atleta do link
      // Link: https://www.ogol.com.br/jogador/ze-leandro/557286
      // ID: 557286
      const match = athlete.link.match(/\/(\d+)(?:\?|$)/);
      
      if (match) {
        const athleteId = match[1];
        
        // Padrão de URL de foto do OGol (baseado em análise de URLs conhecidas)
        // Formato: https://cdn-img.staticzz.com/img/jogadores/{id}.jpg
        const fotoUrl = `https://cdn-img.staticzz.com/img/jogadores/${athleteId}.jpg`;
        
        results.push({
          id: athlete.id,
          nome: athlete.nome,
          link: athlete.link,
          athleteId,
          fotoUrl,
        });
      }
    } catch (error) {
      // Silenciar erros
    }
  }

  console.log(`✅ URLs geradas: ${results.length}`);

  // Salvar resultado
  fs.writeFileSync(
    "photos_generated_urls.json",
    JSON.stringify(results, null, 2)
  );

  console.log(`💾 URLs salvas em photos_generated_urls.json`);

  // Mostrar alguns exemplos
  console.log(`\n📋 Exemplos de URLs geradas:\n`);
  results.slice(0, 5).forEach((r: any) => {
    console.log(`   ${r.nome}:`);
    console.log(`   ${r.fotoUrl}\n`);
  });

  process.exit(0);
}

generatePhotoUrls();
