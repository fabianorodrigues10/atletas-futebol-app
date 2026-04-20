import mysql from "mysql2/promise";

async function analyze() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Contar por usuário
  const [byUser] = await connection.execute(`
    SELECT userId, COUNT(*) as total FROM atletas GROUP BY userId
  `);
  console.log("Atletas por usuário:");
  (byUser as any[]).forEach(row => console.log(`  userId ${row.userId}: ${row.total} atletas`));
  
  // Verificar dados incompletos
  const [incomplete] = await connection.execute(`
    SELECT COUNT(*) as total FROM atletas 
    WHERE userId = 1 AND (
      nome IS NULL OR nome = '' OR
      posicao IS NULL OR posicao = '' OR
      clube IS NULL OR clube = ''
    )
  `);
  console.log(`\nAtletas com dados incompletos (userId=1): ${(incomplete as any)[0].total}`);
  
  // Verificar campos vazios
  const [fieldStats] = await connection.execute(`
    SELECT 
      SUM(CASE WHEN nome IS NULL OR nome = '' THEN 1 ELSE 0 END) as nome_vazio,
      SUM(CASE WHEN posicao IS NULL OR posicao = '' THEN 1 ELSE 0 END) as posicao_vazio,
      SUM(CASE WHEN clube IS NULL OR clube = '' THEN 1 ELSE 0 END) as clube_vazio,
      SUM(CASE WHEN dataNascimento IS NULL THEN 1 ELSE 0 END) as data_vazia,
      SUM(CASE WHEN altura IS NULL OR altura = '' THEN 1 ELSE 0 END) as altura_vazia,
      SUM(CASE WHEN link IS NULL OR link = '' THEN 1 ELSE 0 END) as link_vazio,
      SUM(CASE WHEN naturalidade IS NULL OR naturalidade = '' THEN 1 ELSE 0 END) as naturalidade_vazia
    FROM atletas WHERE userId = 1
  `);
  console.log(`\nCampos vazios (userId=1):`);
  const stats = (fieldStats as any)[0];
  console.log(`  Nome: ${stats.nome_vazio}`);
  console.log(`  Posição: ${stats.posicao_vazio}`);
  console.log(`  Clube: ${stats.clube_vazio}`);
  console.log(`  Data Nascimento: ${stats.data_vazia}`);
  console.log(`  Altura: ${stats.altura_vazia}`);
  console.log(`  Link: ${stats.link_vazio}`);
  console.log(`  Naturalidade: ${stats.naturalidade_vazia}`);
  
  // Verificar duplicatas
  const [duplicates] = await connection.execute(`
    SELECT nome, COUNT(*) as count FROM atletas WHERE userId = 1 GROUP BY nome HAVING count > 1 LIMIT 10
  `);
  console.log(`\nAtletas duplicados (userId=1):`);
  if ((duplicates as any[]).length > 0) {
    (duplicates as any[]).forEach(row => console.log(`  ${row.nome}: ${row.count} vezes`));
  } else {
    console.log("  Nenhum duplicado encontrado");
  }
  
  await connection.end();
  process.exit(0);
}

analyze().catch(console.error);
