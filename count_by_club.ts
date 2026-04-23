import * as fs from "fs";

const athletes = JSON.parse(fs.readFileSync("extracted_athletes.json", "utf-8"));

const clubeCount = new Map();
athletes.forEach((a: any) => {
  const clube = a.clube || "Sem clube";
  clubeCount.set(clube, (clubeCount.get(clube) || 0) + 1);
});

// Ordenar por contagem
const sorted = Array.from(clubeCount.entries()).sort((a, b) => b[1] - a[1]);

console.log(`📊 Atletas por clube:\n`);
sorted.slice(0, 20).forEach(([clube, count]) => {
  console.log(`   ${clube}: ${count}`);
});

const marcilioCount = sorted.find(([c]) => c.includes("Marcilio"))?.[1] || 0;
console.log(`\n🎯 Marcilio Dias/SC: ${marcilioCount} atletas`);

process.exit(0);
