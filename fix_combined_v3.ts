import * as fs from "fs";

let content = fs.readFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', 'utf-8');

// Remover todos os INSERT duplicados
content = content.replace(/INSERT INTO atletas[^(]*VALUES /g, '');

// Adicionar INSERT no início
content = 'INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, createdAt, updatedAt) VALUES ' + content;

// Remover todos os ponto-e-vírgula
content = content.replace(/;/g, '');

// Adicionar um único ponto-e-vírgula no final
content = content.trim() + ';';

fs.writeFileSync('/home/ubuntu/atletas_futebol_app/import_combined.sql', content);
console.log("✅ Arquivo combinado corrigido - removidos todos os INSERT duplicados");
