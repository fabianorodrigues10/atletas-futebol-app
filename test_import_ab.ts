import mysql from "mysql2/promise";
import * as fs from "fs";

async function test() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  // Deletar todos os atletas
  await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
  
  const sql = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_part_ab', 'utf-8');
  
  try {
    const result = await connection.execute(sql);
    console.log("✅ Importação bem-sucedida");
    
    const [rows] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
    console.log("Total de atletas:", (rows as any)[0].total);
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
  }
  
  await connection.end();
  process.exit(0);
}

test();
