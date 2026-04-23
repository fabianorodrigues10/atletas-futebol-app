import * as mysql from "mysql2/promise";

async function fixRemainingPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Corrigindo fotos restantes usando nome do atleta...\n");

    // Pegar fotos que ainda não foram mapeadas
    const [unmappedPhotos] = await connection.execute(
      `SELECT m.id, m.atletaId, m.nome, m.url 
       FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL
       LIMIT 100`
    );

    console.log(`📊 Fotos não mapeadas: ${(unmappedPhotos as any).length}`);

    let updated = 0;

    // Para cada foto não mapeada, tentar encontrar o atleta pelo nome
    for (const photo of (unmappedPhotos as any)) {
      try {
        // Extrair nome da foto (ex: "Foto de Zé Leandro")
        const nameMatch = photo.nome.match(/Foto de (.+)/);
        
        if (nameMatch) {
          const athleteName = nameMatch[1];
          
          // Procurar atleta com este nome
          const [athletes] = await connection.execute(
            "SELECT id FROM atletas WHERE nome = ? LIMIT 1",
            [athleteName]
          );

          if ((athletes as any).length > 0) {
            const athleteId = (athletes as any)[0].id;
            
            // Atualizar foto
            await connection.execute(
              "UPDATE midias SET atletaId = ? WHERE id = ?",
              [athleteId, photo.id]
            );
            
            updated++;
            console.log(`   ✅ ${athleteName} (ID: ${athleteId})`);
          }
        }
      } catch (error: any) {
        // Silenciar erros
      }
    }

    console.log(`\n✅ Fotos corrigidas: ${updated}`);

    // Verificar resultado final
    const [result] = await connection.execute(
      `SELECT COUNT(DISTINCT atletaId) as count FROM midias 
       WHERE tipo = 'foto' AND atletaId IN (SELECT id FROM atletas)`
    );
    const validPhotos = (result as any)[0].count;
    console.log(`📊 Atletas com fotos válidas: ${validPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixRemainingPhotos();
