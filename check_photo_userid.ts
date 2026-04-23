import * as mysql from "mysql2/promise";

async function check() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Verificando userId das fotos...\n");

    // Pegar amostra de fotos com seus userId
    const [photos] = await connection.execute(
      `SELECT id, atletaId, userId, tipo FROM midias WHERE tipo = 'foto' LIMIT 10`
    );

    console.log(`📊 Amostra de fotos:\n`);
    (photos as any).forEach((p: any) => {
      console.log(`   ID: ${p.id}, atletaId: ${p.atletaId}, userId: ${p.userId}, tipo: ${p.tipo}`);
    });

    // Contar userId distintos
    const [userIds] = await connection.execute(
      `SELECT DISTINCT userId FROM midias WHERE tipo = 'foto'`
    );

    console.log(`\n📊 UserIds distintos nas fotos: ${(userIds as any).length}`);
    (userIds as any).forEach((u: any) => {
      console.log(`   userId: ${u.userId}`);
    });

    // Verificar qual userId está logado
    const [users] = await connection.execute(
      `SELECT id, email FROM users LIMIT 5`
    );

    console.log(`\n📊 Usuários no banco:\n`);
    (users as any).forEach((u: any) => {
      console.log(`   ID: ${u.id}, Email: ${u.email}`);
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
