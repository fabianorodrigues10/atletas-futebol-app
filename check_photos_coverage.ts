import * as mysql from "mysql2/promise";

async function check() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    // Contar atletas com fotos
    const [withPhotos] = await connection.execute(
      `SELECT COUNT(DISTINCT atletaId) as count FROM midias WHERE tipo = 'foto'`
    );
    const photosCount = (withPhotos as any)[0].count;

    // Total de atletas
    const [total] = await connection.execute(
      "SELECT COUNT(*) as count FROM atletas"
    );
    const totalAthletes = (total as any)[0].count;

    console.log(`📊 Cobertura de fotos:`);
    console.log(`   ✅ Atletas com foto: ${photosCount}`);
    console.log(`   📊 Total de atletas: ${totalAthletes}`);
    console.log(`   📈 Cobertura: ${((photosCount / totalAthletes) * 100).toFixed(1)}%`);

    // Mostrar alguns atletas com foto
    console.log(`\n📋 Exemplos de atletas com foto:\n`);
    const [examples] = await connection.execute(
      `SELECT a.nome, m.url 
       FROM atletas a
       JOIN midias m ON a.id = m.atletaId
       WHERE m.tipo = 'foto'
       LIMIT 5`
    );

    (examples as any).forEach((e: any) => {
      console.log(`   ${e.nome}`);
      console.log(`   ${e.url}\n`);
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
