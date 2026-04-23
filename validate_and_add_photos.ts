import * as fs from "fs";
import * as mysql from "mysql2/promise";

async function validateAndAddPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Validando e adicionando fotos...\n");

    // Ler URLs geradas
    const photos = JSON.parse(fs.readFileSync("photos_generated_urls.json", "utf-8"));

    console.log(`📊 Total de URLs: ${photos.length}`);

    let added = 0;
    let updated = 0;
    let errors = 0;

    // Processar em lotes
    const batchSize = 50;
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);

      for (const photo of batch) {
        try {
          // Verificar se já existe
          const [existing] = await connection.execute(
            "SELECT id FROM midias WHERE atletaId = ? AND tipo = 'foto'",
            [photo.id]
          );

          if ((existing as any).length === 0) {
            // Adicionar nova foto
            await connection.execute(
              `INSERT INTO midias (atletaId, tipo, url, createdAt, updatedAt) 
               VALUES (?, 'foto', ?, NOW(), NOW())`,
              [photo.id, photo.fotoUrl]
            );
            added++;
          } else {
            // Atualizar URL existente
            await connection.execute(
              "UPDATE midias SET url = ?, updatedAt = NOW() WHERE atletaId = ? AND tipo = 'foto'",
              [photo.fotoUrl, photo.id]
            );
            updated++;
          }
        } catch (error: any) {
          errors++;
        }
      }

      if ((i + batchSize) % 200 === 0) {
        console.log(`✅ Processadas: ${Math.min(i + batchSize, photos.length)}/${photos.length}`);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Fotos adicionadas: ${added}`);
    console.log(`   ✅ Fotos atualizadas: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);

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

validateAndAddPhotos();
