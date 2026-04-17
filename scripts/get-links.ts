import { drizzle } from "drizzle-orm/mysql2";
import { atletas } from "../drizzle/schema";
import { sql } from "drizzle-orm";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  const rows = await db
    .select({ nome: atletas.nome, link: atletas.link })
    .from(atletas)
    .where(sql`link IS NOT NULL AND link != ''`)
    .limit(5);
  rows.forEach((r) => console.log(r.nome, "|", r.link));
  process.exit(0);
}
main();
