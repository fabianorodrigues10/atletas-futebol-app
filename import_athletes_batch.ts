import mysql from "mysql2/promise";
import * as fs from "fs";

async function importAthletes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Iniciando importação de atletas...\n");
  
  // Primeiro, deletar todos os atletas existentes
  try {
    await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
    console.log("✅ Atletas antigos deletados\n");
  } catch (error) {
    console.log("⚠️ Erro ao deletar atletas antigos:", error);
  }
  
  // Importar os arquivos SQL um por um
  const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];
  let totalImported = 0;
  
  for (const file of files) {
    const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      continue;
    }
    
    let sql = fs.readFileSync(filePath, 'utf-8');
    
    // Remover linhas vazias e comentários
    sql = sql.split('\n').filter(line => line.trim() && !line.trim().startsWith('--')).join('\n');
    
    // Contar quantos atletas estão no arquivo
    const count = (sql.match(/\(\d+,/g) || []).length;
    
    try {
      // Executar em chunks para evitar timeout
      const lines = sql.split('\n').filter(l => l.trim());
      
      for (const line of lines) {
        if (line.trim().startsWith('INSERT')) {
          await connection.execute(line);
        }
      }
      
      totalImported += count;
      console.log(`✅ ${file}: ${count} atletas importados`);
    } catch (error: any) {
      console.error(`❌ Erro ao importar ${file}:`, error.message.substring(0, 150));
    }
  }
  
  // Verificar o total
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  const total = (result as any)[0].total;
  console.log(`\n📊 Total de atletas no banco: ${total}`);
  
  await connection.end();
}

importAthletes().catch(console.error).finally(() => process.exit(0));
