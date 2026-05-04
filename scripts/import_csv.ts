import * as fs from 'fs';
import * as db from '../server/db';

interface CSVRow {
  ATLETA: string;
  'POSIÇÃO': string;
  '2ª POSIÇÃO': string;
  CLUBE: string;
  DATA: string;
  IDADE: string;
  ALTURA: string;
  'PÉ': string;
  LINK: string;
  ESCALA: string;
  'VALÊNCIAS': string;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  
  try {
    // Formato: DD/MM/YY
    const parts = dateStr.trim().split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      // Assumir século 19 se ano > 50, senão século 20
      const fullYear = year.length === 2
        ? (parseInt(year) > 50 ? `19${year}` : `20${year}`)
        : year;
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  } catch (e) {
    console.error(`Erro ao parsear data '${dateStr}':`, e);
  }
  
  return null;
}

function parseAltura(alturaStr: string): string | null {
  if (!alturaStr || alturaStr.trim() === '' || alturaStr.trim().toUpperCase() === 'ND') {
    return null;
  }
  
  try {
    // Remove espaços e substitui vírgula por ponto
    const altura = alturaStr.trim().replace(',', '.');
    // Converte para float e multiplica por 100 para obter centímetros
    const alturaCm = Math.round(parseFloat(altura) * 100);
    return alturaCm.toString();
  } catch (e) {
    console.error(`Erro ao parsear altura '${alturaStr}':`, e);
  }
  
  return null;
}

function calculateAge(birthDate: string): number | null {
  if (!birthDate) {
    return null;
  }
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

function normalizePe(peStr: string): string | null {
  if (!peStr || peStr.trim() === '') {
    return null;
  }
  
  const pe = peStr.trim().toUpperCase();
  if (pe === 'D') {
    return 'direito';
  } else if (pe === 'E') {
    return 'esquerdo';
  } else if (pe === 'A') {
    return 'ambidestro';
  }
  
  return peStr.trim().toLowerCase();
}

async function importCSV(csvPath: string, userId: number) {
  console.log(`Lendo arquivo CSV: ${csvPath}`);
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  let imported = 0;
  let errors = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header.trim()] = values[idx]?.trim() || '';
      });
      
      const nome = row['ATLETA'];
      
      if (!nome) {
        console.log(`Linha ${i}: Nome vazio, pulando...`);
        errors++;
        continue;
      }
      
      const posicao = row['POSIÇÃO'] || null;
      const segundaPosicao = row['2ª POSIÇÃO'] || null;
      const clube = row['CLUBE'] || null;
      const dataNascimentoStr = parseDate(row['DATA']);
      const dataNascimento = dataNascimentoStr ? new Date(dataNascimentoStr) : null;
      const idadeCsv = row['IDADE'];
      
      // Calcular idade a partir da data ou usar a do CSV
      let idade: number | null = null;
      if (dataNascimentoStr) {
        idade = calculateAge(dataNascimentoStr);
      } else if (idadeCsv && !isNaN(parseInt(idadeCsv)) && parseInt(idadeCsv) < 100) {
        // Ignorar idades inválidas como 126
        idade = parseInt(idadeCsv);
      }
      
      const altura = parseAltura(row['ALTURA']);
      const peStr = normalizePe(row['PÉ']);
      const pe = (peStr === 'direito' || peStr === 'esquerdo' || peStr === 'ambidestro') ? peStr : null;
      const link = row['LINK'] || null;
      const escala = row['ESCALA'] || null;
      const valencia = row['VALÊNCIAS'] || null;
      
      // Inserir no banco
      await db.createAtleta({
        userId,
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
      
      imported++;
      
      if (imported % 100 === 0) {
        console.log(`Importados ${imported} atletas...`);
      }
      
    } catch (e: any) {
      console.error(`Erro na linha ${i}:`, e.message);
      errors++;
      continue;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Importação concluída!');
  console.log(`Total importado: ${imported} atletas`);
  console.log(`Erros: ${errors}`);
  console.log('='.repeat(60));
  
  return { imported, errors };
}

// Executar importação
const csvPath = process.argv[2];
const userId = parseInt(process.argv[3]);

if (!csvPath || !userId) {
  console.error('Uso: tsx import_csv.ts <caminho_csv> <user_id>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Arquivo não encontrado: ${csvPath}`);
  process.exit(1);
}

importCSV(csvPath, userId).then(() => {
  console.log('Importação finalizada!');
  process.exit(0);
}).catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
