import * as fs from "fs";
import * as mysql from "mysql2/promise";

async function importAthletes() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Lendo arquivo de atletas extraído...\n");
    const athletes = JSON.parse(fs.readFileSync("extracted_athletes.json", "utf-8"));
    console.log(`📊 Total de atletas para importar: ${athletes.length}`);

    // Verificar quantos já existem
    const [existing] = await connection.execute("SELECT COUNT(*) as count FROM atletas");
    const existingCount = (existing as any)[0].count;
    console.log(`📊 Atletas já no banco: ${existingCount}`);

    // Importar em lotes
    const batchSize = 100;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < athletes.length; i += batchSize) {
      const batch = athletes.slice(i, i + batchSize);
      
      for (const athlete of batch) {
        try {
          // Verificar se já existe
          const [existing] = await connection.execute(
            "SELECT id FROM atletas WHERE id = ?",
            [athlete.id]
          );

          if ((existing as any).length === 0) {
            // Inserir novo
            await connection.execute(
              `INSERT INTO atletas (id, userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, camposCustomizados, createdAt, updatedAt, naturalidade)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                athlete.id,
                athlete.userId || 1,
                athlete.nome,
                athlete.posicao,
                athlete.segundaPosicao,
                athlete.clube,
                athlete.dataNascimento,
                athlete.idade,
                athlete.altura,
                athlete.pe,
                athlete.link,
                athlete.escala,
                athlete.valencia,
                athlete.camposCustomizados,
                athlete.createdAt,
                athlete.updatedAt,
                athlete.naturalidade,
              ]
            );
            imported++;
          } else {
            skipped++;
          }
        } catch (error: any) {
          console.error(`❌ Erro ao importar ${athlete.nome}:`, error.message);
        }
      }

      console.log(`✅ Processados: ${Math.min(i + batchSize, athletes.length)}/${athletes.length}`);
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Importados: ${imported}`);
    console.log(`   ⏭️  Pulados (já existiam): ${skipped}`);

    // Verificar total final
    const [final] = await connection.execute("SELECT COUNT(*) as count FROM atletas");
    const finalCount = (final as any)[0].count;
    console.log(`   📊 Total final: ${finalCount}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importAthletes();
