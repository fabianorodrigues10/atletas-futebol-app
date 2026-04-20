import * as fs from "fs";

const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];

for (const file of files) {
  const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remover caracteres especiais UTF-8
  content = content.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Substituir caracteres problemáticos
  content = content.replace(/º/g, 'o');
  content = content.replace(/ª/g, 'a');
  content = content.replace(/ç/g, 'c');
  content = content.replace(/ã/g, 'a');
  content = content.replace(/õ/g, 'o');
  content = content.replace(/é/g, 'e');
  content = content.replace(/á/g, 'a');
  content = content.replace(/í/g, 'i');
  content = content.replace(/ó/g, 'o');
  content = content.replace(/ú/g, 'u');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file} convertido para ASCII`);
}
