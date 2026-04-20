import mysql from "mysql2/promise";
import * as fs from "fs";

async function extractAndImport() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Iniciando extração e importação de atletas...\n");
  
  // Deletar todos os atletas
  await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
  console.log("✅ Atletas antigos deletados\n");
  
  const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];
  let totalImported = 0;
  
  for (const file of files) {
    const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extrair apenas as linhas com valores (começam com "(1,")
    const lines = content.split('\n').filter(line => line.trim().startsWith('(1,'));
    
    for (const line of lines) {
      try {
        // Remover vírgula no final se existir
        let cleanLine = line.trim();
        if (cleanLine.endsWith(',')) {
          cleanLine = cleanLine.slice(0, -1);
        }
        
        // Criar um INSERT para cada linha
        const sql = `INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, createdAt, updatedAt) VALUES ${cleanLine}`;
        
        await connection.execute(sql);
        totalImported++;
      } catch (error: any) {
        // Ignorar erros de linhas individuais
      }
    }
    
    console.log(`✅ ${file}: ${lines.length} atletas processados`);
  }
  
  // Verificar o total
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  const total = (result as any)[0].total;
  console.log(`\n📊 Total de atletas no banco: ${total}`);
  
  await connection.end();
  process.exit(0);
}

extractAndImport().catch(console.error);
