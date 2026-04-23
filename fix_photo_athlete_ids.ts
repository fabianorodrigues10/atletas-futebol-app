import * as mysql from "mysql2/promise";

async function fixPhotoIds() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Corrigindo atletaId nas fotos...\n");

    // Pegar todas as fotos
    const [allPhotos] = await connection.execute(
      "SELECT id, url FROM midias WHERE tipo = 'foto'"
    );

    console.log(`📊 Total de fotos: ${(allPhotos as any).length}`);

    let updated = 0;
    let errors = 0;

    // Para cada foto, extrair o ID do OGol e encontrar o atleta correspondente
    for (const photo of (allPhotos as any)) {
      try {
        // Extrair ID do OGol da URL
        // Exemplo: https://www.ogol.com.br/img/jogadores/new/72/86/557286_ze_leandro_20250408041527.png
        // ID: 557286
        const match = photo.url.match(/\/(\d+)_[a-z_]+/);
        
        if (match) {
          const ogolId = match[1];
          
          // Procurar atleta com este link
          const [athletes] = await connection.execute(
            "SELECT id FROM atletas WHERE link LIKE ?",
            [`%/${ogolId}%`]
          );

          if ((athletes as any).length > 0) {
            const athleteId = (athletes as any)[0].id;
            
            // Atualizar foto
            await connection.execute(
              "UPDATE midias SET atletaId = ? WHERE id = ?",
              [athleteId, photo.id]
            );
            
            updated++;
          }
        }
      } catch (error: any) {
        errors++;
      }

      if ((updated + errors) % 200 === 0) {
        console.log(`✅ Processadas: ${updated + errors}/${(allPhotos as any).length}`);
      }
    }

    console.log(`\n📊 Resultado:`);
    console.log(`   ✅ Fotos corrigidas: ${updated}`);
    console.log(`   ❌ Erros: ${errors}`);

    // Verificar resultado
    const [result] = await connection.execute(
      `SELECT COUNT(DISTINCT atletaId) as count FROM midias WHERE tipo = 'foto'`
    );
    const uniqueAthletes = (result as any)[0].count;
    console.log(`   📊 Atletas únicos com foto: ${uniqueAthletes}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixPhotoIds();
