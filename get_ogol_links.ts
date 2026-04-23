import * as mysql from "mysql2/promise";

async function getLinks() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    const [athletes] = await connection.execute(
      "SELECT id, nome, link FROM atletas WHERE link IS NOT NULL AND link != '' LIMIT 1452"
    );

    console.log(`📊 Total de atletas com link: ${(athletes as any).length}`);
    
    // Salvar em arquivo para usar no scraping
    const fs = require("fs");
    fs.writeFileSync(
      "athletes_with_links.json",
      JSON.stringify(athletes, null, 2)
    );

    console.log(`💾 Salvos em athletes_with_links.json`);
    
    // Mostrar alguns exemplos
    console.log(`\n✅ Primeiros 5 atletas:`);
    (athletes as any).slice(0, 5).forEach((a: any) => {
      console.log(`   - ${a.nome}: ${a.link}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

getLinks();
