import * as fs from "fs";

const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];

for (const file of files) {
  const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remover quebra de linha após VALUES
  content = content.replace(/VALUES\s+\n/g, 'VALUES ');
  
  // Remover quebras de linha extras
  content = content.replace(/\n\s*\n/g, '\n');
  
  // Garantir que termina com ;
  if (!content.trim().endsWith(';')) {
    content = content.trim() + ';';
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file} corrigido`);
}
