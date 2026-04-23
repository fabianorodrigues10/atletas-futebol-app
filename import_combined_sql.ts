import mysql from "mysql2/promise";
import * as fs from "fs";

async function importCombined() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Iniciando importação do arquivo combinado...\n");
  
  // Deletar todos os atletas
  try {
    await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
    console.log("✅ Atletas antigos deletados\n");
  } catch (error) {
    console.log("⚠️ Erro ao deletar atletas antigos:", error);
  }
  
  const sql = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', 'utf-8');
  
  try {
    await connection.execute(sql);
    console.log("✅ Importação bem-sucedida!");
    
    const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
    const total = (result as any)[0].total;
    console.log(`\n📊 Total de atletas no banco: ${total}`);
  } catch (error: any) {
    console.log("❌ Erro:", error.message.substring(0, 200));
  }
  
  await connection.end();
  process.exit(0);
}

importCombined();
