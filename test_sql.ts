import mysql from "mysql2/promise";
import * as fs from "fs";

async function test() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const sql = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_part_aa', 'utf-8');
  
  try {
    await connection.execute(sql);
  } catch (error: any) {
    console.log("Erro completo:", error.message);
    console.log("SQL (primeiros 500 chars):", sql.substring(0, 500));
  }
  
  await connection.end();
  process.exit(0);
}

test();
