/**
 * Script para importar atletas do JSON para o banco de dados.
 */
import "../scripts/load-env.js";
import { drizzle } from "drizzle-orm/mysql2";
import { atletas } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";

const JSON_FILE = "/home/ubuntu/atletas_futebol_app/scripts/atletas-data.json";
const USER_ID = 1;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set!");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  const db = drizzle(databaseUrl);
  
  // Read JSON
  const content = fs.readFileSync(JSON_FILE, 'utf8');
  const data = JSON.parse(content);
  
  console.log(`Total athletes in JSON: ${data.length}`);
  
  // Delete existing athletes
  console.log("Deleting existing athletes...");
  await db.delete(atletas).where(eq(atletas.userId, USER_ID));
  console.log("Existing athletes deleted.");
  
  // Prepare records
  const athleteRecords = data.map((athlete: any) => ({
    userId: USER_ID,
    nome: athlete.nome,
    posicao: athlete.posicao || null,
    segundaPosicao: athlete.segunda_posicao || null,
    clube: athlete.clube || null,
    dataNascimento: athlete.data_nascimento ? new Date(athlete.data_nascimento) : null,
    idade: athlete.idade || null,
    altura: athlete.altura ? String(athlete.altura) : null,
    pe: athlete.pe?.toLowerCase() || null,
  }));
  
  // Insert all
  try {
    await db.insert(atletas).values(athleteRecords);
    console.log(`✅ Successfully imported ${athleteRecords.length} athletes!`);
  } catch (error: any) {
    console.error("Error importing:", error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
