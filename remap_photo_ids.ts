import * as mysql from "mysql2/promise";

async function remapPhotoIds() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Remapeando IDs de fotos...\n");

    // Estratégia: usar o nome do atleta para fazer o mapeamento
    // Pegar nome da URL da foto e encontrar o atleta correspondente

    // Primeiro, vamos ver quantas fotos temos
    const [totalPhotos] = await connection.execute(
      "SELECT COUNT(*) as count FROM midias WHERE tipo = 'foto'"
    );
    console.log(`📊 Total de fotos: ${(totalPhotos as any)[0].count}`);

    // Pegar amostra de fotos com seus nomes
    const [photos] = await connection.execute(
      `SELECT id, atletaId, url, nome FROM midias WHERE tipo = 'foto' LIMIT 10`
    );

    console.log(`\n📋 Amostra de fotos:\n`);
    (photos as any).forEach((p: any) => {
      console.log(`   ID: ${p.id}, atletaId: ${p.atletaId}`);
      console.log(`   Nome: ${p.nome}`);
      console.log(`   URL: ${p.url?.substring(0, 80)}\n`);
    });

    // Tentar extrair nome do atleta da URL
    // Exemplo: https://www.ogol.com.br/img/jogadores/new/72/86/557286_ze_leandro_20250408041527.png
    // Nome: ze_leandro

    console.log(`\n🔍 Tentando extrair nomes das URLs...\n`);

    const [samplePhotos] = await connection.execute(
      `SELECT id, url, nome FROM midias WHERE tipo = 'foto' LIMIT 5`
    );

    (samplePhotos as any).forEach((p: any) => {
      const match = p.url.match(/\/(\d+)_([a-z_]+)_/);
      if (match) {
        const [, ogolId, extractedName] = match;
        console.log(`   URL: ${p.url?.substring(0, 80)}`);
        console.log(`   OGol ID: ${ogolId}, Nome extraído: ${extractedName}`);
        console.log(`   Nome salvo: ${p.nome}\n`);
      }
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

remapPhotoIds();
