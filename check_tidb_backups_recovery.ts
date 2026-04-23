import { createConnection } from "mysql2/promise";

async function checkBackups() {
  let connection;
  try {
    console.log("🔄 Conectando ao TiDB Cloud...\n");

    connection = await createConnection({
      host: "gateway04.us-east-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "2xkKgzjDtwmdn7p.root",
      password: "aD95QT17zsxmv7EpIPA4",
      database: "7XTarzVUuQNAxDd5Eu29wi",
      ssl: { rejectUnauthorized: false },
    });

    console.log("✅ Conectado ao TiDB Cloud!\n");

    // Listar todas as tabelas
    const [tables]: any = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    );

    console.log("📊 Tabelas disponíveis:");
    tables.forEach((t: any) => console.log(`   - ${t.TABLE_NAME}`));

    // Verificar se há informações de backup
    console.log("\n🔍 Procurando por informações de backup...");
    
    // Tentar acessar informações de sistema do TiDB
    try {
      const [backupInfo]: any = await connection.execute(
        `SELECT * FROM INFORMATION_SCHEMA.TIDB_BACKUP_INFO LIMIT 5`
      );
      console.log("📦 Informações de backup encontradas:");
      console.log(backupInfo);
    } catch (e: any) {
      console.log("   ⚠️  Tabela TIDB_BACKUP_INFO não disponível");
    }

    // Verificar se há tabela de auditoria
    try {
      const [auditInfo]: any = await connection.execute(
        `SELECT * FROM INFORMATION_SCHEMA.AUDIT_LOG LIMIT 5`
      );
      console.log("📋 Log de auditoria encontrado:");
      console.log(auditInfo);
    } catch (e: any) {
      console.log("   ⚠️  Tabela AUDIT_LOG não disponível");
    }

    // Verificar deletions recentes
    console.log("\n🗑️  Procurando por deletions recentes...");
    const [recentDeletes]: any = await connection.execute(
      `SELECT * FROM atletas WHERE deletedAt IS NOT NULL OR updatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY updatedAt DESC LIMIT 10`
    );
    console.log("Registros deletados ou modificados recentemente:");
    console.log(recentDeletes);

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkBackups();
