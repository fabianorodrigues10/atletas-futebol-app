import * as mysql from "mysql2/promise";

async function fixPhotosByOGolId() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Corrigindo fotos usando ID do OGol da URL...\n");

    // Pegar fotos não mapeadas
    const [unmappedPhotos] = await connection.execute(
      `SELECT m.id, m.atletaId, m.nome, m.url 
       FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL`
    );

    console.log(`📊 Fotos não mapeadas: ${(unmappedPhotos as any).length}\n`);

    let updated = 0;
    let failed = 0;

    // Para cada foto, extrair ID do OGol e procurar atleta
    for (const photo of (unmappedPhotos as any)) {
      try {
        // Tentar extrair ID do OGol de várias formas
        let ogolId = null;

        // Formato 1: /123456_nome_data.jpg
        let match = photo.url.match(/\/(\d{5,})_[a-z_]+/);
        if (match) ogolId = match[1];

        // Formato 2: /123456_20240101_nome.jpg
        if (!ogolId) {
          match = photo.url.match(/\/(\d{5,})_\d{8}/);
          if (match) ogolId = match[1];
        }

        // Formato 3: /123456.jpg
        if (!ogolId) {
          match = photo.url.match(/\/(\d{5,})\./);
          if (match) ogolId = match[1];
        }

        if (ogolId) {
          // Procurar atleta com este ID do OGol no link
          const [athletes] = await connection.execute(
            "SELECT id FROM atletas WHERE link LIKE ? LIMIT 1",
            [`%/${ogolId}%`]
          );

          if ((athletes as any).length > 0) {
            const athleteId = (athletes as any)[0].id;
            
            await connection.execute(
              "UPDATE midias SET atletaId = ? WHERE id = ?",
              [athleteId, photo.id]
            );
            
            updated++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }

        if ((updated + failed) % 100 === 0) {
          console.log(`✅ Processadas: ${updated + failed}/${(unmappedPhotos as any).length}`);
        }
      } catch (error: any) {
        failed++;
      }
    }

    console.log(`\n✅ Fotos corrigidas: ${updated}`);
    console.log(`❌ Fotos não encontradas: ${failed}`);

    // Verificar cobertura final
    const [coverage] = await connection.execute(
      `SELECT COUNT(DISTINCT m.atletaId) as count 
       FROM midias m
       INNER JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto'`
    );
    const validPhotos = (coverage as any)[0].count;
    console.log(`📊 Atletas com fotos válidas: ${validPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixPhotosByOGolId();
