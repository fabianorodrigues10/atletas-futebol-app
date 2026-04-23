import { createConnection } from "mysql2/promise";

async function testConnection() {
  let connection;
  try {
    console.log("🔄 Testando conexão ao TiDB Cloud...\n");

    connection = await createConnection({
      host: "gateway04.us-east-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "2xkKgzjDtwmdn7p.root",
      password: "aD95QT17zsxmv7EpIPA4",
      database: "7XTarzVUuQNAxDd5Eu29wi",
      ssl: { rejectUnauthorized: false },
    });

    console.log("✅ Conectado ao TiDB Cloud!\n");

    // Contar atletas
    const [athletes] = await connection.execute(
      "SELECT COUNT(*) as total FROM atletas"
    );
    console.log("📊 Atletas no banco:", (athletes as any)[0].total);

    // Contar usuários
    const [users] = await connection.execute(
      "SELECT COUNT(*) as total FROM users"
    );
    console.log("👥 Usuários no banco:", (users as any)[0].total);

    // Listar últimas mudanças
    const [recentChanges] = await connection.execute(
      "SELECT * FROM atletas ORDER BY updatedAt DESC LIMIT 3"
    );
    console.log("\n📝 Últimas mudanças:");
    console.log(recentChanges);

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

testConnection();
