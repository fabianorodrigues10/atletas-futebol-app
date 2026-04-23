import "../scripts/load-env.js";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  const posicoes = await db.execute(sql`SELECT DISTINCT posicao, COUNT(*) as total FROM atletas WHERE posicao IS NOT NULL AND posicao != '' GROUP BY posicao ORDER BY total DESC`);
  console.log("POSIÇÕES:", JSON.stringify(posicoes[0], null, 2));
  
  const idades = await db.execute(sql`SELECT MIN(idade) as min_idade, MAX(idade) as max_idade FROM atletas WHERE idade IS NOT NULL AND idade > 0`);
  console.log("IDADES:", JSON.stringify(idades[0], null, 2));
  
  process.exit(0);
}
main();
