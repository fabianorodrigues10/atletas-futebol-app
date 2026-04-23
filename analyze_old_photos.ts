import * as mysql from "mysql2/promise";

async function analyze() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Analisando fotos de 18/02...\n");

    // Pegar fotos criadas em 18/02
    const [oldPhotos] = await connection.execute(
      `SELECT COUNT(*) as count FROM midias 
       WHERE tipo = 'foto' AND DATE(createdAt) = '2026-02-19'`
    );

    console.log(`📊 Fotos criadas em 19/02: ${(oldPhotos as any)[0].count}`);

    // Amostra de fotos antigas
    const [sample] = await connection.execute(
      `SELECT id, atletaId, url, createdAt FROM midias 
       WHERE tipo = 'foto' AND DATE(createdAt) = '2026-02-19'
       LIMIT 10`
    );

    console.log(`\n📋 Amostra de URLs:\n`);
    (sample as any).forEach((p: any) => {
      console.log(`   ${p.url}`);
    });

    // Extrair IDs do OGol das URLs
    console.log(`\n🔍 IDs do OGol extraídos:\n`);
    (sample as any).forEach((p: any) => {
      const match = p.url.match(/\/(\d{5,})_/);
      if (match) {
        console.log(`   ${match[1]}`);
      }
    });

    // Verificar se esses IDs existem nos links dos atletas
    const sampleIds = (sample as any).map((p: any) => {
      const match = p.url.match(/\/(\d{5,})_/);
      return match ? match[1] : null;
    }).filter((id: any) => id);

    if (sampleIds.length > 0) {
      const placeholders = sampleIds.map(() => '?').join(',');
      const [found] = await connection.execute(
        `SELECT COUNT(*) as count FROM atletas WHERE link LIKE ? OR link LIKE ? OR link LIKE ? OR link LIKE ? OR link LIKE ?`,
        sampleIds.map((id: any) => `%/${id}%`)
      );
      
      console.log(`\n✅ Atletas encontrados com esses IDs: ${(found as any)[0].count}`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

analyze();
