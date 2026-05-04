import mysql from "mysql2/promise";
import * as fs from "fs";

async function test() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const sql = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_part_aa', 'utf-8');
  
  console.log("SQL (primeiros 500 chars):", sql.substring(0, 500));
  console.log("\nSQL (chars 300-350):", sql.substring(300, 350));
  
  try {
    const result = await connection.execute(sql);
    console.log("✅ Importação bem-sucedida");
  } catch (error: any) {
    console.log("❌ Erro:", error.message);
    console.log("SQL State:", error.sqlState);
    console.log("Errno:", error.errno);
  }
  
  await connection.end();
  process.exit(0);
}

test();
