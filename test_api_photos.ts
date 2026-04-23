import * as mysql from "mysql2/promise";

async function testAPI() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Testando API de fotos...\n");

    // Pegar um atleta que sabemos que tem foto (Abner, ID 2704896)
    const [athlete] = await connection.execute(
      "SELECT id, nome FROM atletas WHERE id = 2704896"
    );

    console.log(`📊 Atleta encontrado: ${(athlete as any)[0]?.nome}\n`);

    // Pegar fotos deste atleta
    const [photos] = await connection.execute(
      "SELECT id, url, tipo FROM midias WHERE atletaId = 2704896"
    );

    console.log(`📊 Fotos do atleta: ${(photos as any).length}\n`);

    (photos as any).forEach((p: any) => {
      console.log(`   ID: ${p.id}, Tipo: ${p.tipo}`);
      console.log(`   URL: ${p.url}\n`);
    });

    // Testar com outro atleta que deveria ter foto
    const [athletes] = await connection.execute(
      `SELECT DISTINCT m.atletaId FROM midias m
       INNER JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto'
       LIMIT 5`
    );

    console.log(`\n📊 Amostra de atletas com fotos:\n`);
    for (const a of (athletes as any)) {
      const [athlete] = await connection.execute(
        "SELECT nome FROM atletas WHERE id = ?",
        [a.atletaId]
      );
      const [photos] = await connection.execute(
        "SELECT COUNT(*) as count FROM midias WHERE atletaId = ? AND tipo = 'foto'",
        [a.atletaId]
      );
      console.log(`   ${(athlete as any)[0]?.nome}: ${(photos as any)[0].count} fotos`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

testAPI();
