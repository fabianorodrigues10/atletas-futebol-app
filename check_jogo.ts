import { createConnection } from "mysql2/promise";

async function checkJogo() {
  const connection = await createConnection(process.env.DATABASE_URL!);
  
  // Verificar dados do jogo
  const [jogos]: any = await connection.execute(`
    SELECT * FROM jogos WHERE nome LIKE '%Marcílio%São José%' OR nome LIKE '%São José%Marcílio%'
  `);
  
  console.log("🎮 Jogos encontrados:");
  jogos.forEach((jogo: any) => {
    console.log(`\n  ID: ${jogo.id}`);
    console.log(`  Nome: ${jogo.nome}`);
    console.log(`  Data: ${jogo.data}`);
    console.log(`  Criado em: ${jogo.createdAt}`);
    console.log(`  Atualizado em: ${jogo.updatedAt}`);
  });

  // Verificar scout para este jogo
  for (const jogo of jogos) {
    const [scouts]: any = await connection.execute(`
      SELECT COUNT(*) as total FROM scoutJogo WHERE jogoId = ?
    `, [jogo.id]);
    
    console.log(`\n  Scout para jogo ${jogo.id}: ${scouts[0].total} registros`);
    
    // Mostrar detalhes do scout
    const [scoutDetails]: any = await connection.execute(`
      SELECT atletaId, notaTecnica, notaFisica, notaTatica, updatedAt 
      FROM scoutJogo WHERE jogoId = ? 
      ORDER BY updatedAt DESC LIMIT 5
    `, [jogo.id]);
    
    scoutDetails.forEach((scout: any) => {
      console.log(`    - Atleta ${scout.atletaId}: T=${scout.notaTecnica} F=${scout.notaFisica} Ta=${scout.notaTatica} (${scout.updatedAt})`);
    });
  }

  await connection.end();
  process.exit(0);
}

checkJogo().catch(console.error);
