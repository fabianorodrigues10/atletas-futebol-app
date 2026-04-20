import { drizzle } from "drizzle-orm/mysql2";
import * as fs from "fs";

async function restoreAthletes() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  console.log("🔄 Iniciando restauração de atletas...\n");
  
  // Primeiro, deletar todos os atletas existentes (exceto o de teste)
  try {
    await db.execute(`DELETE FROM atletas WHERE userId = 1`);
    console.log("✅ Atletas antigos deletados");
  } catch (error) {
    console.log("⚠️ Erro ao deletar atletas antigos:", error);
  }
  
  // Importar os arquivos SQL
  const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];
  let totalInserted = 0;
  
  for (const file of files) {
    const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
      continue;
    }
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    try {
      await db.execute(sql);
      const count = (sql.match(/\(\d+,/g) || []).length;
      totalInserted += count;
      console.log(`✅ ${file}: ${count} atletas importados`);
    } catch (error: any) {
      console.error(`❌ Erro ao importar ${file}:`, error.message.substring(0, 100));
    }
  }
  
  // Verificar o total
  const result = await db.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  console.log(`\n📊 Total de atletas no banco: ${result[0][0].total}`);
}

restoreAthletes().catch(console.error).finally(() => process.exit(0));
