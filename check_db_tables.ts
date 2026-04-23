import mysql from "mysql2/promise";

async function checkTables() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔍 Verificando tabelas do banco de dados...\n");
  
  // Listar todas as tabelas
  const [tables] = await connection.execute(`
    SELECT TABLE_NAME, TABLE_ROWS 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_ROWS DESC
  `);
  
  console.log("📊 Tabelas e quantidade de registros:\n");
  (tables as any).forEach((table: any) => {
    console.log(`  ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
  });
  
  // Verificar estrutura de cada tabela
  console.log("\n📋 Estrutura das tabelas:\n");
  
  for (const table of tables as any) {
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
    `, [table.TABLE_NAME]);
    
    console.log(`${table.TABLE_NAME}:`);
    (columns as any).forEach((col: any) => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });
    console.log("");
  }
  
  await connection.end();
  process.exit(0);
}

checkTables().catch(console.error);
