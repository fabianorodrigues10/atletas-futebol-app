import mysql from "mysql2/promise";

async function checkBackups() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Verificar se há uma tabela de auditoria ou histórico
  const [tables] = await connection.execute(`SHOW TABLES LIKE '%audit%' OR LIKE '%history%' OR LIKE '%log%'`);
  console.log("Tabelas de auditoria/histórico:");
  (tables as any[]).forEach(t => console.log("  -", Object.values(t)[0]));
  
  // Verificar o createdAt mais antigo e mais recente
  const [dateRange] = await connection.execute(`
    SELECT 
      MIN(createdAt) as oldest,
      MAX(createdAt) as newest,
      COUNT(*) as total
    FROM atletas
  `);
  console.log(`\nDados de atletas:`);
  console.log(`  Mais antigo: ${(dateRange as any)[0].oldest}`);
  console.log(`  Mais recente: ${(dateRange as any)[0].newest}`);
  console.log(`  Total: ${(dateRange as any)[0].total}`);
  
  // Verificar se há dados deletados (soft delete)
  const [softDeleted] = await connection.execute(`
    SELECT COUNT(*) as total FROM atletas WHERE deletedAt IS NOT NULL
  `);
  console.log(`\nAtletas com soft delete: ${(softDeleted as any)[0].total}`);
  
  await connection.end();
  process.exit(0);
}

checkBackups().catch(console.error);
