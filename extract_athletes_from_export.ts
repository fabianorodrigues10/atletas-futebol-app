import * as fs from "fs";

// Ler o arquivo exportado
const data = JSON.parse(fs.readFileSync("tidb-exported-all-data.json", "utf-8"));

// Extrair apenas os atletas (procurar por objetos com campos de atleta)
const athletes = new Map();

// Procurar em todas as tabelas
for (const [key, values] of Object.entries(data)) {
  if (Array.isArray(values)) {
    values.forEach((item: any) => {
      // Se tem campos de atleta
      if (item.nome && item.posicao && item.clube) {
        if (!athletes.has(item.id)) {
          athletes.set(item.id, item);
        }
      }
    });
  }
}

console.log(`📊 Total de atletas únicos encontrados: ${athletes.size}`);
console.log(`\n✅ Primeiros 10 atletas:`);
Array.from(athletes.values())
  .slice(0, 10)
  .forEach((a: any) => {
    console.log(`   - ${a.nome} (${a.posicao}) - ${a.clube}`);
  });

// Salvar em arquivo
const athletesArray = Array.from(athletes.values());
fs.writeFileSync(
  "extracted_athletes.json",
  JSON.stringify(athletesArray, null, 2)
);
console.log(`\n💾 Salvos em extracted_athletes.json`);

process.exit(0);
