import * as fs from "fs";

console.log("🔄 Analisando arquivo exportado do TiDB...\n");

const data = JSON.parse(fs.readFileSync("tidb-exported-all-data.json", "utf-8"));

// Listar todas as tabelas
console.log("📋 Tabelas encontradas:");
for (const [key, values] of Object.entries(data)) {
  if (Array.isArray(values)) {
    console.log(`   - ${key}: ${values.length} registros`);
  }
}

// Procurar pela tabela de atletas
if (data.atletas) {
  console.log(`\n🎯 Tabela 'atletas': ${data.atletas.length} registros`);
  
  // Procurar por Marcílio Dias
  const marcilioAthletes = (data.atletas as any[]).filter(a => 
    a.clube && a.clube.includes("Marcilio")
  );
  
  console.log(`\n🎯 Atletas do Marcílio Dias: ${marcilioAthletes.length}`);
  marcilioAthletes.slice(0, 5).forEach((a: any) => {
    console.log(`   - ${a.nome} (${a.posicao}) - ${a.clube}`);
  });
}

process.exit(0);
