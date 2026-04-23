import * as mysql from "mysql2/promise";

async function check() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Verificando fotos de 18/04...\n");

    // Pegar fotos de 18/04
    const [photos] = await connection.execute(
      `SELECT id, atletaId, url FROM midias 
       WHERE tipo = 'foto' AND DATE(createdAt) = '2026-04-18'`
    );

    console.log(`📊 Total de fotos em 18/04: ${(photos as any).length}\n`);

    (photos as any).forEach((p: any) => {
      console.log(`   atletaId: ${p.atletaId}`);
      console.log(`   URL: ${p.url}\n`);
    });

    // Verificar se esses atletaId existem
    const athleteIds = (photos as any).map((p: any) => p.atletaId);
    if (athleteIds.length > 0) {
      const placeholders = athleteIds.map(() => '?').join(',');
      const [found] = await connection.execute(
        `SELECT COUNT(*) as count FROM atletas WHERE id IN (${placeholders})`,
        athleteIds
      );
      
      console.log(`✅ Atletas encontrados: ${(found as any)[0].count}/${athleteIds.length}`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

check();
