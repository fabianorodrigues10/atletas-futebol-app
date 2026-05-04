import { readFileSync } from 'fs';
import * as db from '../server/db';

async function main() {
  console.log('Iniciando importação de atletas...\n');

  const userId = 1; // ID do usuário criado anteriormente

  // Ler o arquivo CSV
  const csvContent = readFileSync('/home/ubuntu/upload/atletas_utf8.csv', 'utf-8');
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map((h: string) => h.trim());

  let imported = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = line.split(',');
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() || '';
      });

      const nome = row['ATLETA'];
      if (!nome) {
        continue;
      }

      // Parse data de nascimento
      let dataNascimento = null;
      if (row['DATA']) {
        const parts = row['DATA'].split('/');
        if (parts.length === 3) {
          const [day, month, year] = parts;
          const fullYear = year.length === 2 ? (parseInt(year) > 50 ? `19${year}` : `20${year}`) : year;
          dataNascimento = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }
      }

      // Parse altura
      let altura = null;
      if (row['ALTURA'] && row['ALTURA'].toUpperCase() !== 'ND') {
        try {
          const alturaFloat = parseFloat(row['ALTURA'].replace(',', '.'));
          if (!isNaN(alturaFloat)) {
            altura = (alturaFloat * 100).toFixed(2);
          }
        } catch {}
      }

      // Parse pé
      let pe = null;
      if (row['PÉ']) {
        const peUpper = row['PÉ'].toUpperCase();
        if (peUpper === 'D') pe = 'direito';
        else if (peUpper === 'E') pe = 'esquerdo';
        else if (peUpper === 'A') pe = 'ambidestro';
      }

      // Calcular idade
      let idade = null;
      if (dataNascimento && !isNaN(dataNascimento.getTime())) {
        const today = new Date();
        idade = today.getFullYear() - dataNascimento.getFullYear();
        if (today.getMonth() < dataNascimento.getMonth() || 
            (today.getMonth() === dataNascimento.getMonth() && today.getDate() < dataNascimento.getDate())) {
          idade--;
        }
      } else if (row['IDADE'] && !isNaN(parseInt(row['IDADE'])) && parseInt(row['IDADE']) < 100) {
        idade = parseInt(row['IDADE']);
      }

      // Importar atleta
      await db.createAtleta({
        userId,
        nome,
        posicao: row['POSIÇÃO'] || null,
        segundaPosicao: row['2ª POSIÇÃO'] || null,
        clube: row['CLUBE'] || null,
        dataNascimento: dataNascimento && !isNaN(dataNascimento.getTime()) ? dataNascimento : null,
        idade,
        altura,
        pe: pe as any,
        link: row['LINK'] || null,
        escala: row['ESCALA'] || null,
        valencia: row['VALÊNCIAS'] || null,
      });

      imported++;
      
      if (imported % 100 === 0) {
        console.log(`✓ ${imported} atletas importados...`);
      }
    } catch (e: any) {
      errors++;
      if (errors <= 5) {
        console.error(`✗ Erro na linha ${i}: ${e.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Importação concluída!');
  console.log(`Total importado: ${imported} atletas`);
  console.log(`Erros: ${errors}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
