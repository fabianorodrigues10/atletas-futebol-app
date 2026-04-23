import * as mysql from "mysql2/promise";

async function fixAllPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Corrigindo TODAS as fotos com estratégia abrangente...\n");

    // Pegar TODAS as fotos
    const [allPhotos] = await connection.execute(
      "SELECT id, atletaId, nome, url FROM midias WHERE tipo = 'foto' ORDER BY id"
    );

    console.log(`📊 Total de fotos: ${(allPhotos as any).length}\n`);

    let updated = 0;
    let alreadyValid = 0;
    let failed = 0;

    // Para cada foto, tentar mapear
    for (let i = 0; i < (allPhotos as any).length; i++) {
      const photo = (allPhotos as any)[i];

      try {
        // Verificar se já está mapeada corretamente
        const [existing] = await connection.execute(
          "SELECT id FROM atletas WHERE id = ?",
          [photo.atletaId]
        );

        if ((existing as any).length > 0) {
          alreadyValid++;
          continue;
        }

        let newAthleteId = null;

        // Estratégia 1: Extrair ID do OGol da URL
        let match = photo.url.match(/\/(\d+)_[a-z_]+/);
        if (match) {
          const ogolId = match[1];
          const [athletes] = await connection.execute(
            "SELECT id FROM atletas WHERE link LIKE ? LIMIT 1",
            [`%/${ogolId}%`]
          );
          if ((athletes as any).length > 0) {
            newAthleteId = (athletes as any)[0].id;
          }
        }

        // Estratégia 2: Usar nome da foto
        if (!newAthleteId && photo.nome) {
          const nameMatch = photo.nome.match(/Foto de (.+)/);
          if (nameMatch) {
            const athleteName = nameMatch[1];
            const [athletes] = await connection.execute(
              "SELECT id FROM atletas WHERE nome = ? LIMIT 1",
              [athleteName]
            );
            if ((athletes as any).length > 0) {
              newAthleteId = (athletes as any)[0].id;
            }
          }
        }

        // Estratégia 3: Busca fuzzy por nome (remover acentos e espaços)
        if (!newAthleteId && photo.nome) {
          const nameMatch = photo.nome.match(/Foto de (.+)/);
          if (nameMatch) {
            const athleteName = nameMatch[1];
            // Remover acentos
            const normalizedName = athleteName
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase();

            const [athletes] = await connection.execute(
              `SELECT id FROM atletas 
               WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(nome, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ã', 'a'), 'õ', 'o'), 'ç', 'c')) LIKE ? 
               LIMIT 1`,
              [`%${normalizedName}%`]
            );
            if ((athletes as any).length > 0) {
              newAthleteId = (athletes as any)[0].id;
            }
          }
        }

        // Se encontrou, atualizar
        if (newAthleteId) {
          await connection.execute(
            "UPDATE midias SET atletaId = ? WHERE id = ?",
            [newAthleteId, photo.id]
          );
          updated++;
        } else {
          failed++;
        }

        if ((updated + alreadyValid + failed) % 200 === 0) {
          console.log(
            `✅ Processadas: ${updated + alreadyValid + failed}/${(allPhotos as any).length} (✅ ${updated} atualizadas, ✅ ${alreadyValid} válidas, ❌ ${failed} falhadas)`
          );
        }
      } catch (error: any) {
        failed++;
      }
    }

    console.log(`\n📊 Resultado Final:`);
    console.log(`   ✅ Fotos atualizadas: ${updated}`);
    console.log(`   ✅ Fotos já válidas: ${alreadyValid}`);
    console.log(`   ❌ Fotos não mapeadas: ${failed}`);

    // Verificar cobertura final
    const [coverage] = await connection.execute(
      `SELECT COUNT(DISTINCT m.atletaId) as count 
       FROM midias m
       INNER JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto'`
    );
    const validPhotos = (coverage as any)[0].count;
    console.log(`   📊 Atletas com fotos válidas: ${validPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixAllPhotos();
