import mysql from "mysql2/promise";
import * as fs from "fs";

async function importCacheAthletes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Importando atletas adicionais do cache...\n");
  
  // Ler o arquivo de cache
  const athletes = JSON.parse(fs.readFileSync('/tmp/all_athletes_from_cache.json', 'utf-8'));
  
  console.log(`📊 Encontrados ${athletes.length} atletas no cache`);
  
  let imported = 0;
  let duplicated = 0;
  let errors = 0;
  
  for (const atleta of athletes) {
    try {
      // Verificar se já existe
      const [existing] = await connection.execute(
        `SELECT id FROM atletas WHERE userId = 1 AND nome = ?`,
        [atleta.nome]
      );
      
      if ((existing as any[]).length > 0) {
        duplicated++;
        continue;
      }
      
      const sql = `INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, naturalidade, createdAt, updatedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      
      await connection.execute(sql, [
        1,
        atleta.nome || null,
        atleta.posicao || null,
        atleta.segundaPosicao || null,
        atleta.clube || null,
        atleta.dataNascimento || null,
        atleta.idade ? parseInt(atleta.idade) : null,
        atleta.altura ? parseFloat(atleta.altura) : null,
        atleta.pe || null,
        atleta.link || null,
        atleta.escala || null,
        atleta.valencia || null,
        atleta.naturalidade || null
      ]);
      
      imported++;
    } catch (error: any) {
      errors++;
    }
  }
  
  console.log(`\n✅ ${imported} atletas importados`);
  console.log(`⚠️  ${duplicated} atletas duplicados (já existiam)`);
  console.log(`❌ ${errors} erros`);
  
  // Verificar o total
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  const total = (result as any)[0].total;
  console.log(`\n📊 Total de atletas no banco: ${total}`);
  
  await connection.end();
  process.exit(0);
}

importCacheAthletes().catch(console.error);
