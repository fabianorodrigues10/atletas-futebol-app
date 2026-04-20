import * as fs from "fs";

const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];

let combined = 'INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, createdAt, updatedAt) VALUES ';
let values: string[] = [];

for (const file of files) {
  const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Extrair apenas as linhas com valores (começam com "(1,")
  const lines = content.split('\n').filter(line => line.trim().startsWith('(1,'));
  
  for (const line of lines) {
    // Remover vírgula no final se existir
    let cleanLine = line.trim();
    if (cleanLine.endsWith(',')) {
      cleanLine = cleanLine.slice(0, -1);
    }
    values.push(cleanLine);
  }
  
  console.log(`✅ ${file}: ${lines.length} valores extraídos`);
}

combined += values.join(',\n') + ';';

// Salvar em um arquivo único
fs.writeFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', combined);
console.log(`\n✅ Arquivo combinado criado com ${values.length} atletas`);
