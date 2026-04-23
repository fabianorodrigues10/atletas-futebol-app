import mysql from "mysql2/promise";

async function finalStatus() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  const [result] = await connection.execute(`
    SELECT COUNT(*) as total FROM atletas WHERE userId = 1
  `);
  
  const total = (result as any)[0].total;
  console.log(`✅ Total de atletas no banco: ${total}`);
  
  // Verificar campos preenchidos
  const [stats] = await connection.execute(`
    SELECT 
      SUM(CASE WHEN nome IS NOT NULL AND nome != '' THEN 1 ELSE 0 END) as com_nome,
      SUM(CASE WHEN posicao IS NOT NULL AND posicao != '' THEN 1 ELSE 0 END) as com_posicao,
      SUM(CASE WHEN clube IS NOT NULL AND clube != '' THEN 1 ELSE 0 END) as com_clube,
      SUM(CASE WHEN altura IS NOT NULL AND altura != '' THEN 1 ELSE 0 END) as com_altura,
      SUM(CASE WHEN dataNascimento IS NOT NULL THEN 1 ELSE 0 END) as com_data,
      SUM(CASE WHEN link IS NOT NULL AND link != '' THEN 1 ELSE 0 END) as com_link,
      SUM(CASE WHEN naturalidade IS NOT NULL AND naturalidade != '' THEN 1 ELSE 0 END) as com_naturalidade
    FROM atletas WHERE userId = 1
  `);
  
  const s = (stats as any)[0];
  console.log(`\n📊 Campos preenchidos:`);
  console.log(`  Nome: ${s.com_nome}/${total} (${Math.round(s.com_nome/total*100)}%)`);
  console.log(`  Posição: ${s.com_posicao}/${total} (${Math.round(s.com_posicao/total*100)}%)`);
  console.log(`  Clube: ${s.com_clube}/${total} (${Math.round(s.com_clube/total*100)}%)`);
  console.log(`  Altura: ${s.com_altura}/${total} (${Math.round(s.com_altura/total*100)}%)`);
  console.log(`  Data Nascimento: ${s.com_data}/${total} (${Math.round(s.com_data/total*100)}%)`);
  console.log(`  Link: ${s.com_link}/${total} (${Math.round(s.com_link/total*100)}%)`);
  console.log(`  Naturalidade: ${s.com_naturalidade}/${total} (${Math.round(s.com_naturalidade/total*100)}%)`);
  
  await connection.end();
  process.exit(0);
}

finalStatus().catch(console.error);
