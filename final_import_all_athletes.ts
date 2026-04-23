import mysql from "mysql2/promise";
import * as fs from "fs";

async function finalImport() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Importando todos os atletas dos arquivos SQL...\n");
  
  // Deletar atletas antigos
  await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
  console.log("✅ Atletas antigos deletados\n");
  
  const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];
  let totalImported = 0;
  
  for (const file of files) {
    const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extrair apenas as linhas com valores (começam com "(1,")
    const lines = content.split('\n').filter(line => line.trim().startsWith('(1,'));
    
    console.log(`📄 Processando ${file}...`);
    
    for (const line of lines) {
      try {
        // Remover vírgula no final se existir
        let cleanLine = line.trim();
        if (cleanLine.endsWith(',')) {
          cleanLine = cleanLine.slice(0, -1);
        }
        if (cleanLine.endsWith(';')) {
          cleanLine = cleanLine.slice(0, -1);
        }
        
        // Parse dos valores
        const values = parseValues(cleanLine);
        if (values.length < 13) continue;
        
        const [userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia] = values;
        
        const sql = `INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, createdAt, updatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        
        await connection.execute(sql, [
          parseInt(userId),
          nome,
          posicao,
          segundaPosicao === 'NULL' ? null : segundaPosicao,
          clube,
          dataNascimento === 'NULL' ? null : dataNascimento,
          idade === 'NULL' ? null : parseInt(idade),
          altura === 'NULL' ? null : parseFloat(altura),
          pe === 'NULL' ? null : pe,
          link === 'NULL' ? null : link,
          escala === 'NULL' ? null : escala,
          valencia === 'NULL' ? null : valencia
        ]);
        
        totalImported++;
      } catch (error: any) {
        // Ignorar erros de linhas individuais
      }
    }
    
    console.log(`✅ ${file}: ${lines.length} atletas processados`);
  }
  
  // Verificar o total
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  const total = (result as any)[0].total;
  console.log(`\n📊 Total de atletas no banco: ${total}`);
  
  await connection.end();
  process.exit(0);
}

function parseValues(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 1; // Skip opening paren
  
  while (i < line.length - 1) { // Skip closing paren
    const char = line[i];
    
    if (char === "'" && (i === 0 || line[i - 1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  if (current) {
    values.push(current.trim());
  }
  
  return values.map(v => {
    if (v.startsWith("'") && v.endsWith("'")) {
      return v.slice(1, -1);
    }
    return v;
  });
}

finalImport().catch(console.error);
