import * as fs from "fs";
import * as mysql from "mysql2/promise";

async function addPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Adicionando fotos à tabela midias...\n");

    // Ler dados consolidados
    const athletes = JSON.parse(fs.readFileSync("consolidated_results.json", "utf-8"));
    
    // Filtrar atletas com foto URL
    const athletesWithPhotos = athletes.filter((a: any) => a.fotoUrl && a.fotoUrl.trim());
    
    console.log(`📊 Atletas com foto URL: ${athletesWithPhotos.length}`);

    let added = 0;
    let skipped = 0;

    // Adicionar fotos à tabela midias
    for (const athlete of athletesWithPhotos) {
      try {
        // Verificar se já existe
        const [existing] = await connection.execute(
          "SELECT id FROM midias WHERE atletaId = ? AND tipo = 'foto'",
          [athlete.id]
        );

        if ((existing as any).length === 0) {
          // Adicionar nova foto
          await connection.execute(
            `INSERT INTO midias (atletaId, tipo, url, createdAt, updatedAt) 
             VALUES (?, 'foto', ?, NOW(), NOW())`,
            [athlete.id, athlete.fotoUrl]
          );
          added++;
        } else {
          // Atualizar URL existente
          await connection.execute(
            "UPDATE midias SET url = ?, updatedAt = NOW() WHERE atletaId = ? AND tipo = 'foto'",
            [athlete.fotoUrl, athlete.id]
          );
          skipped++;
        }
      } catch (error: any) {
        console.error(`❌ Erro ao adicionar foto de ${athlete.nome}:`, error.message);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Fotos adicionadas: ${added}`);
    console.log(`   ✅ Fotos atualizadas: ${skipped}`);

    // Verificar total
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM midias WHERE tipo = 'foto'"
    );
    const totalPhotos = (result as any)[0].count;
    console.log(`   📊 Total de fotos no banco: ${totalPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addPhotos();
