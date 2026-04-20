import * as fs from "fs";

let content = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', 'utf-8');

// Remover INSERT duplicados
content = content.replace(/;INSERT INTO atletas[^(]*VALUES /g, ',');

// Remover ponto-e-vírgula extras antes de vírgulas
content = content.replace(/;\s*,/g, ',');

// Garantir que termina com ponto-e-vírgula
if (!content.trim().endsWith(';')) {
  content = content.trim() + ';';
}

fs.writeFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', content);
console.log("✅ Arquivo combinado corrigido");
