import * as mysql from "mysql2/promise";

async function analyze() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Analisando fotos não mapeadas...\n");

    // Pegar fotos não mapeadas
    const [unmapped] = await connection.execute(
      `SELECT m.id, m.atletaId, m.nome, m.url 
       FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL
       LIMIT 50`
    );

    console.log(`📊 Amostra de fotos não mapeadas:\n`);
    (unmapped as any).forEach((photo: any) => {
      console.log(`   ID: ${photo.id}, atletaId: ${photo.atletaId}`);
      console.log(`   Nome: ${photo.nome}`);
      console.log(`   URL: ${photo.url?.substring(0, 100)}\n`);
    });

    // Contar total de fotos não mapeadas
    const [total] = await connection.execute(
      `SELECT COUNT(*) as count FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL`
    );

    console.log(`\n📊 Total de fotos não mapeadas: ${(total as any)[0].count}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

analyze();
