/**
 * Script para importar todos os atletas do CSV para o banco de dados.
 * Executa via tsx diretamente, usando a conexão do banco.
 */
import "../scripts/load-env.js";
import { drizzle } from "drizzle-orm/mysql2";
import { atletas } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const CSV_FILE = "/home/ubuntu/upload/BANCODEDADOSFABIANORODRIGUES.csv";
const USER_ID = 1;
const BATCH_SIZE = 100;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) return null;
  
  let [day, month, year] = parts.map(Number);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  if (year < 100) {
    year = year > 50 ? 1900 + year : 2000 + year;
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  
  return new Date(year, month - 1, day);
}

function parseHeight(heightStr: string): string | null {
  if (!heightStr || heightStr.trim() === '') return null;
  const h = parseFloat(heightStr.trim().replace(',', '.'));
  if (isNaN(h) || h < 0.5 || h > 2.5) return null;
  return h.toFixed(2);
}

function parseAge(ageStr: string): number | null {
  if (!ageStr || ageStr.trim() === '') return null;
  const age = parseInt(ageStr.trim());
  if (isNaN(age) || age < 10 || age > 60) return null;
  return age;
}

function parseFoot(peStr: string): "direito" | "esquerdo" | "ambidestro" | null {
  if (!peStr || peStr.trim() === '') return null;
  const pe = peStr.trim().toUpperCase();
  if (pe === 'D' || pe === 'DIREITO') return 'direito';
  if (pe === 'E' || pe === 'ESQUERDO') return 'esquerdo';
  if (pe === 'A' || pe === 'AMBIDESTRO') return 'ambidestro';
  return null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set!");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  const db = drizzle(databaseUrl);
  
  // Read CSV
  const content = fs.readFileSync(CSV_FILE, 'latin1');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  
  console.log(`Total lines in CSV: ${lines.length}`);
  
  // Skip header
  const dataLines = lines.slice(1);
  
  // Parse all athletes
  const athleteRecords: any[] = [];
  let skipped = 0;
  
  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCSVLine(dataLines[i]);
    
    const nome = fields[0]?.trim();
    if (!nome) {
      skipped++;
      continue;
    }
    
    // Check if row has only valencia (index 10) and nothing else meaningful
    const hasOtherData = fields.slice(0, 10).some((f, idx) => idx > 0 && f && f.trim() !== '');
    if (!hasOtherData && fields[10]?.trim()) {
      // Only valencia filled - skip
      skipped++;
      continue;
    }
    
    const posicao = fields[1]?.trim() || null;
    const segundaPosicao = fields[2]?.trim() || null;
    const clube = fields[3]?.trim() || null;
    const dataNascimento = parseDate(fields[4] || '');
    const idade = parseAge(fields[5] || '');
    const altura = parseHeight(fields[6] || '');
    const pe = parseFoot(fields[7] || '');
    const link = fields[8]?.trim() || null;
    const escala = fields[9]?.trim() || null;
    const valencia = fields[10]?.trim() || null;
    
    athleteRecords.push({
      userId: USER_ID,
      nome,
      posicao,
      segundaPosicao,
      clube,
      dataNascimento,
      idade,
      altura,
      pe,
      link,
      escala,
      valencia,
    });
  }
  
  console.log(`Parsed ${athleteRecords.length} athletes (skipped ${skipped} rows)`);
  
  // Delete existing athletes
  console.log("Deleting existing athletes...");
  await db.delete(atletas).where(eq(atletas.userId, USER_ID));
  console.log("Existing athletes deleted.");
  
  // Insert in batches
  let inserted = 0;
  const totalBatches = Math.ceil(athleteRecords.length / BATCH_SIZE);
  
  for (let i = 0; i < athleteRecords.length; i += BATCH_SIZE) {
    const batch = athleteRecords.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      await db.insert(atletas).values(batch);
      inserted += batch.length;
      console.log(`Batch ${batchNum}/${totalBatches}: inserted ${batch.length} athletes (total: ${inserted})`);
    } catch (error: any) {
      console.error(`Error in batch ${batchNum}:`, error.message);
      
      // Try inserting one by one
      for (const record of batch) {
        try {
          await db.insert(atletas).values(record);
          inserted++;
        } catch (e: any) {
          console.error(`  Failed to insert "${record.nome}": ${e.message}`);
        }
      }
    }
  }
  
  console.log(`\nImport complete! Total inserted: ${inserted}/${athleteRecords.length}`);
  
  // Verify
  const result = await db.select({ count: sql`COUNT(*)` }).from(atletas).where(eq(atletas.userId, USER_ID));
  console.log(`Verification: ${JSON.stringify(result[0])} athletes in database`);
  
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
