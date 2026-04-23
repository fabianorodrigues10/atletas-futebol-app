import mysql from "mysql2/promise";

async function checkIncomplete() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔍 Verificando atletas com dados incompletos...\n");
  
  // Atletas com campos faltando
  const [incomplete] = await connection.execute(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN dataNascimento IS NULL THEN 1 ELSE 0 END) as sem_data_nascimento,
      SUM(CASE WHEN idade IS NULL THEN 1 ELSE 0 END) as sem_idade,
      SUM(CASE WHEN altura IS NULL THEN 1 ELSE 0 END) as sem_altura,
      SUM(CASE WHEN pe IS NULL THEN 1 ELSE 0 END) as sem_pe,
      SUM(CASE WHEN link IS NULL THEN 1 ELSE 0 END) as sem_link,
      SUM(CASE WHEN escala IS NULL THEN 1 ELSE 0 END) as sem_escala,
      SUM(CASE WHEN valencia IS NULL THEN 1 ELSE 0 END) as sem_valencia
    FROM atletas WHERE userId = 1
  `);
  
  console.log("📊 Resumo de dados incompletos:");
  console.log(incomplete);
  
  // Amostra de atletas com dados incompletos
  const [sample] = await connection.execute(`
    SELECT nome, posicao, clube, 
           CASE WHEN dataNascimento IS NULL THEN 'SIM' ELSE 'NÃO' END as sem_data,
           CASE WHEN idade IS NULL THEN 'SIM' ELSE 'NÃO' END as sem_idade,
           CASE WHEN altura IS NULL THEN 'SIM' ELSE 'NÃO' END as sem_altura,
           CASE WHEN pe IS NULL THEN 'SIM' ELSE 'NÃO' END as sem_pe,
           CASE WHEN link IS NULL THEN 'SIM' ELSE 'NÃO' END as sem_link
    FROM atletas WHERE userId = 1
    WHERE dataNascimento IS NULL OR idade IS NULL OR altura IS NULL OR pe IS NULL OR link IS NULL
    LIMIT 20
  `);
  
  console.log("\n📋 Amostra de atletas com dados incompletos:");
  (sample as any).forEach((row: any) => {
    const missing = [];
    if (row.sem_data === 'SIM') missing.push('data');
    if (row.sem_idade === 'SIM') missing.push('idade');
    if (row.sem_altura === 'SIM') missing.push('altura');
    if (row.sem_pe === 'SIM') missing.push('pé');
    if (row.sem_link === 'SIM') missing.push('link');
    console.log(`  - ${row.nome} (${row.posicao}, ${row.clube}): faltam ${missing.join(', ')}`);
  });
  
  await connection.end();
  process.exit(0);
}

checkIncomplete().catch(console.error);
