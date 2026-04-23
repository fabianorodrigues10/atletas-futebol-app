import * as mysql from "mysql2/promise";

async function deleteUnmappedPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🗑️  Deletando fotos não mapeadas...\n");

    // Contar fotos não mapeadas
    const [unmapped] = await connection.execute(
      `SELECT COUNT(*) as count FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL`
    );

    const unmappedCount = (unmapped as any)[0].count;
    console.log(`📊 Fotos não mapeadas: ${unmappedCount}`);

    // Deletar fotos não mapeadas
    await connection.execute(
      `DELETE FROM midias 
       WHERE id IN (
         SELECT m.id FROM midias m
         LEFT JOIN atletas a ON m.atletaId = a.id
         WHERE m.tipo = 'foto' AND a.id IS NULL
       )`
    );

    console.log(`✅ Fotos deletadas: ${unmappedCount}`);

    // Verificar resultado final
    const [result] = await connection.execute(
      `SELECT COUNT(*) as count FROM midias WHERE tipo = 'foto'`
    );

    const totalPhotos = (result as any)[0].count;
    console.log(`📊 Total de fotos restantes: ${totalPhotos}`);

    // Contar atletas com fotos
    const [athletes] = await connection.execute(
      `SELECT COUNT(DISTINCT atletaId) as count FROM midias WHERE tipo = 'foto'`
    );

    const athletesWithPhotos = (athletes as any)[0].count;
    console.log(`📊 Atletas com fotos: ${athletesWithPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

deleteUnmappedPhotos();
