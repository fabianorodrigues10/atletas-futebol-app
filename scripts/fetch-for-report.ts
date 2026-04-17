import "../scripts/load-env.js";
import { drizzle } from "drizzle-orm/mysql2";
import { atletas } from "../drizzle/schema";
import { sql, isNotNull, and, ne } from "drizzle-orm";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  
  const rows = await db.select().from(atletas)
    .where(
      and(
        isNotNull(atletas.idade),
        isNotNull(atletas.posicao),
        isNotNull(atletas.clube),
        ne(atletas.posicao, ''),
        ne(atletas.clube, '')
      )
    )
    .limit(12);
  
  console.log(JSON.stringify(rows));
  process.exit(0);
}
main();
