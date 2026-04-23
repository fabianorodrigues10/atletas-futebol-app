import mysql from "mysql2/promise";

async function fullDiagnosis() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("=== DIAGNÓSTICO COMPLETO DO APP ===\n");
  
  // 1. Atletas
  const [atletas] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  console.log(`📊 ATLETAS: ${(atletas as any)[0].total}`);
  
  // 2. Mídias
  const [midias] = await connection.execute(`SELECT COUNT(*) as total FROM midias WHERE userId = 1`);
  console.log(`📸 MÍDIAS: ${(midias as any)[0].total}`);
  
  // 3. Grupos
  const [grupos] = await connection.execute(`SELECT COUNT(*) as total FROM grupos WHERE userId = 1`);
  console.log(`👥 GRUPOS: ${(grupos as any)[0].total}`);
  
  // 4. Atletas em Grupos
  const [atletasGrupos] = await connection.execute(`SELECT COUNT(*) as total FROM atletasEmGrupos WHERE userId = 1`);
  console.log(`👤 ATLETAS EM GRUPOS: ${(atletasGrupos as any)[0].total}`);
  
  // 5. Jogos
  const [jogos] = await connection.execute(`SELECT COUNT(*) as total FROM jogos WHERE userId = 1`);
  console.log(`⚽ JOGOS: ${(jogos as any)[0].total}`);
  
  // 6. Scout por Jogo
  const [scout] = await connection.execute(`SELECT COUNT(*) as total FROM scoutJogo WHERE userId = 1`);
  console.log(`📋 SCOUT POR JOGO: ${(scout as any)[0].total}`);
  
  // 7. Estatísticas de Temporada
  const [stats] = await connection.execute(`SELECT COUNT(*) as total FROM estatisticasTemporada WHERE userId = 1`);
  console.log(`📈 ESTATÍSTICAS DE TEMPORADA: ${(stats as any)[0].total}`);
  
  // 8. Avaliações
  const [avaliacoes] = await connection.execute(`SELECT COUNT(*) as total FROM avaliacoes WHERE userId = 1`);
  console.log(`⭐ AVALIAÇÕES: ${(avaliacoes as any)[0].total}`);
  
  // 9. Configurações
  const [config] = await connection.execute(`SELECT COUNT(*) as total FROM configuracaoCampos WHERE userId = 1`);
  console.log(`⚙️  CONFIGURAÇÕES DE CAMPOS: ${(config as any)[0].total}`);
  
  // 10. Usuários
  const [users] = await connection.execute(`SELECT COUNT(*) as total FROM users`);
  console.log(`👨 USUÁRIOS: ${(users as any)[0].total}`);
  
  // Verificar se há dados deletados
  console.log(`\n=== VERIFICANDO INTEGRIDADE ===\n`);
  
  const [orphanMidias] = await connection.execute(`
    SELECT COUNT(*) as total FROM midias m 
    WHERE m.userId = 1 AND NOT EXISTS (SELECT 1 FROM atletas a WHERE a.id = m.atletaId AND a.userId = 1)
  `);
  console.log(`⚠️  Mídias órfãs (sem atleta): ${(orphanMidias as any)[0].total}`);
  
  const [orphanScout] = await connection.execute(`
    SELECT COUNT(*) as total FROM scoutJogo s 
    WHERE s.userId = 1 AND NOT EXISTS (SELECT 1 FROM atletas a WHERE a.id = s.atletaId AND a.userId = 1)
  `);
  console.log(`⚠️  Scout órfão (sem atleta): ${(orphanScout as any)[0].total}`);
  
  await connection.end();
  process.exit(0);
}

fullDiagnosis().catch(console.error);
