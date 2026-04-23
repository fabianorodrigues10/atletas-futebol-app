import * as fs from "fs";

const athletes = JSON.parse(fs.readFileSync("athletes_with_links.json", "utf-8"));

// Dividir em lotes de 50 para processamento paralelo
const batchSize = 50;
const batches = [];

for (let i = 0; i < athletes.length; i += batchSize) {
  const batch = athletes.slice(i, i + batchSize);
  batches.push(JSON.stringify(batch));
}

console.log(`📊 Total de atletas: ${athletes.length}`);
console.log(`📦 Divididos em ${batches.length} lotes de ${batchSize}`);

// Salvar cada lote em um arquivo
batches.forEach((batch, index) => {
  fs.writeFileSync(`batch_${index}.json`, batch);
});

console.log(`✅ Lotes salvos em batch_0.json até batch_${batches.length - 1}.json`);

// Criar lista de inputs para map
const inputs = batches.map((_, index) => `/home/ubuntu/atletas_futebol_app/batch_${index}.json`);
fs.writeFileSync("batch_inputs.json", JSON.stringify(inputs, null, 2));

console.log(`✅ Lista de inputs salva em batch_inputs.json`);
