import mysql from "mysql2/promise";

async function testApi() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🧪 Testando acesso aos dados da API...\n");
  
  // Teste 1: Atletas
  const [atletas] = await connection.execute(`
    SELECT COUNT(*) as total, 
           COUNT(DISTINCT posicao) as posicoes,
           COUNT(DISTINCT clube) as clubes
    FROM atletas WHERE userId = 1
  `);
  console.log("✅ Atletas:", (atletas as any)[0]);
  
  // Teste 2: Mídias
  const [midias] = await connection.execute(`
    SELECT tipo, COUNT(*) as total
    FROM midias WHERE userId = 1
    GROUP BY tipo
  `);
  console.log("✅ Mídias por tipo:", midias);
  
  // Teste 3: Scout por jogo
  const [scout] = await connection.execute(`
    SELECT COUNT(*) as total,
           COUNT(DISTINCT jogoId) as jogos,
           COUNT(DISTINCT atletaId) as atletas
    FROM scoutJogo WHERE userId = 1
  `);
  console.log("✅ Scout por jogo:", (scout as any)[0]);
  
  // Teste 4: Jogos
  const [jogos] = await connection.execute(`
    SELECT COUNT(*) as total,
           GROUP_CONCAT(CONCAT(mandante, ' x ', visitante)) as jogos
    FROM jogos WHERE userId = 1
  `);
  console.log("✅ Jogos:", (jogos as any)[0]);
  
  // Teste 5: Grupos
  const [grupos] = await connection.execute(`
    SELECT COUNT(*) as total,
           GROUP_CONCAT(nome) as nomes
    FROM grupos WHERE userId = 1
  `);
  console.log("✅ Grupos:", (grupos as any)[0]);
  
  // Teste 6: Estatísticas de temporada
  const [stats] = await connection.execute(`
    SELECT COUNT(*) as total,
           COUNT(DISTINCT atletaId) as atletas,
           COUNT(DISTINCT temporada) as temporadas
    FROM estatisticasTemporada WHERE userId = 1
  `);
  console.log("✅ Estatísticas de temporada:", (stats as any)[0]);
  
  // Teste 7: Amostra de atletas com mídias
  const [sample] = await connection.execute(`
    SELECT a.nome, a.posicao, a.clube,
           COUNT(m.id) as total_midias
    FROM atletas a
    LEFT JOIN midias m ON a.id = m.atletaId
    WHERE a.userId = 1
    GROUP BY a.id
    HAVING total_midias > 0
    LIMIT 5
  `);
  console.log("\n📸 Amostra de atletas com mídias:");
  (sample as any).forEach((row: any) => {
    console.log(`  - ${row.nome} (${row.posicao}, ${row.clube}): ${row.total_midias} mídias`);
  });
  
  await connection.end();
  process.exit(0);
}

testApi().catch(console.error);
