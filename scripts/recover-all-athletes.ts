import * as fs from "fs";
import * as path from "path";

async function recoverAllAthletes() {
  try {
    console.log("🔄 Iniciando recuperação de todos os atletas do cache...\n");

    const cacheDir = path.join(__dirname, "../.manus/db");
    const files = fs.readdirSync(cacheDir).filter((f) => f.endsWith(".json"));

    const allAthletes: any[] = [];
    const athleteIds = new Set<number>();

    for (const file of files) {
      const filePath = path.join(cacheDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      try {
        const data = JSON.parse(content);
        
        // Verificar se tem rows com atletas
        if (data.rows && Array.isArray(data.rows)) {
          for (const row of data.rows) {
            if (row.id && row.nome && row.posicao) {
              const athleteId = parseInt(row.id);
              
              // Evitar duplicatas
              if (!athleteIds.has(athleteId)) {
                athleteIds.add(athleteId);
                allAthletes.push({
                  id: athleteId,
                  nome: row.nome,
                  posicao: row.posicao,
                  segundaPosicao: row.segundaPosicao || null,
                  clube: row.clube,
                  dataNascimento: row.dataNascimento,
                  idade: row.idade ? parseInt(row.idade) : null,
                  altura: row.altura ? parseFloat(row.altura) : null,
                  pe: row.pe,
                  link: row.link,
                  escala: row.escala,
                  valencia: row.valencia,
                });
              }
            }
          }
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    }

    console.log(`✅ Encontrados ${allAthletes.length} atletas únicos no cache\n`);

    // Salvar em arquivo JSON
    const outputPath = path.join(__dirname, "recovered-athletes.json");
    fs.writeFileSync(outputPath, JSON.stringify(allAthletes, null, 2));

    console.log(`📁 Arquivo salvo em: ${outputPath}`);
    console.log(`\n📊 Resumo:`);
    console.log(`   Total de atletas: ${allAthletes.length}`);
    
    // Agrupar por posição
    const byPosition: Record<string, number> = {};
    allAthletes.forEach((a) => {
      byPosition[a.posicao] = (byPosition[a.posicao] || 0) + 1;
    });
    
    console.log(`\n📍 Por posição:`);
    Object.entries(byPosition)
      .sort((a, b) => b[1] - a[1])
      .forEach(([pos, count]) => {
        console.log(`   ${pos}: ${count}`);
      });

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao recuperar atletas:", error);
    process.exit(1);
  }
}

recoverAllAthletes();
