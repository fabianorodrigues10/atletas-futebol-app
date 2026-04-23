import * as fs from "fs";
import * as mysql from "mysql2/promise";

async function updateDatabase() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Lendo dados consolidados...\n");
    const athletes = JSON.parse(fs.readFileSync("consolidated_results.json", "utf-8"));

    console.log(`📊 Total de atletas para atualizar: ${athletes.length}`);

    let updated = 0;
    let errors = 0;

    // Atualizar em lotes
    const batchSize = 50;
    for (let i = 0; i < athletes.length; i += batchSize) {
      const batch = athletes.slice(i, i + batchSize);

      for (const athlete of batch) {
        try {
          // Preparar dados para atualização
          const updates: any = {};
          if (athlete.clube && athlete.clube.trim()) updates.clube = athlete.clube.trim();
          if (athlete.posicao && athlete.posicao.trim()) updates.posicao = athlete.posicao.trim();
          if (athlete.altura && athlete.altura.trim()) {
            const alturaNum = parseFloat(athlete.altura.toString().replace(",", "."));
            if (!isNaN(alturaNum)) updates.altura = alturaNum;
          }
          if (athlete.dataNascimento && athlete.dataNascimento.trim()) updates.dataNascimento = athlete.dataNascimento.trim();
          if (athlete.naturalidade && athlete.naturalidade.trim()) updates.naturalidade = athlete.naturalidade.trim();
          if (athlete.fotoUrl && athlete.fotoUrl.trim()) updates.fotoUrl = athlete.fotoUrl.trim();

          if (Object.keys(updates).length > 0) {
            // Construir query de atualização
            const fields = Object.keys(updates).map(k => `${k} = ?`).join(", ");
            const values = Object.values(updates);

            await connection.execute(
              `UPDATE atletas SET ${fields}, updatedAt = NOW() WHERE id = ?`,
              [...values, athlete.id]
            );

            updated++;
          }
        } catch (error: any) {
          errors++;
        }
      }

      if ((i + batchSize) % 200 === 0) {
        console.log(`✅ Processados: ${Math.min(i + batchSize, athletes.length)}/${athletes.length}`);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);

    // Verificar total
    const [result] = await connection.execute("SELECT COUNT(*) as count FROM atletas");
    const totalCount = (result as any)[0].count;
    console.log(`   📊 Total de atletas no banco: ${totalCount}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

updateDatabase();
