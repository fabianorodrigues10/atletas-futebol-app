import mysql from "mysql2/promise";

async function checkBackup() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Verificar se há tabelas de backup ou histórico
  const [tables] = await connection.execute(`SHOW TABLES`);
  console.log("Tabelas no banco:");
  (tables as any[]).forEach(t => console.log("  -", Object.values(t)[0]));
  
  // Verificar se há dados de atletas deletados ou em outra tabela
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas`);
  console.log(`\nTotal de atletas: ${(result as any)[0].total}`);
  
  // Verificar se há um histórico de alterações
  const [changes] = await connection.execute(`SELECT * FROM atletas LIMIT 1`);
  console.log(`\nEstrutura da tabela atletas:`);
  console.log((changes as any)[0]);
  
  await connection.end();
  process.exit(0);
}

checkBackup().catch(console.error);
