import * as mysql from "mysql2/promise";

async function debug() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Debugando relacionamento entre atletas e fotos...\n");

    // Verificar se atletaId em midias corresponde a id em atletas
    const [sample] = await connection.execute(
      `SELECT m.id, m.atletaId, m.url, a.id as athlete_id, a.nome 
       FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto'
       LIMIT 5`
    );

    console.log(`📋 Amostra de fotos:\n`);
    (sample as any).forEach((row: any) => {
      console.log(`   Foto ID: ${row.id}`);
      console.log(`   atletaId: ${row.atletaId}`);
      console.log(`   athlete_id: ${row.athlete_id}`);
      console.log(`   nome: ${row.nome}`);
      console.log(`   url: ${row.url?.substring(0, 80)}\n`);
    });

    // Verificar se há fotos com atletaId que não existem em atletas
    const [orphaned] = await connection.execute(
      `SELECT COUNT(*) as count FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL`
    );

    console.log(`⚠️  Fotos órfãs (sem atleta correspondente): ${(orphaned as any)[0].count}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

debug();
