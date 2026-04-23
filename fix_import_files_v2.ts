import * as fs from "fs";

const files = ['import_part_aa', 'import_part_ab', 'import_part_ac', 'import_part_ad', 'import_part_ae', 'import_part_af', 'import_part_ag', 'import_part_ah'];

for (const file of files) {
  const filePath = `/home/ubuntu/atletas_futebol_app/${file}`;
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Remover vírgula antes de ponto-e-vírgula
  content = content.replace(/,\s*;\s*$/m, ';');
  content = content.replace(/,\n;/g, ';');
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ ${file} corrigido`);
}
