import * as mysql from "mysql2/promise";

async function check() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Verificando datas das fotos...\n");

    // Pegar datas das fotos
    const [dates] = await connection.execute(
      `SELECT DATE(createdAt) as data, COUNT(*) as count 
       FROM midias 
       WHERE tipo = 'foto'
       GROUP BY DATE(createdAt)
       ORDER BY data DESC
       LIMIT 10`
    );

    console.log(`📊 Fotos por data:\n`);
    (dates as any).forEach((d: any) => {
      console.log(`   ${d.data}: ${d.count} fotos`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

check();
