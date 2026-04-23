import * as fs from "fs";
import * as mysql from "mysql2/promise";

async function processPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Processando fotos...\n");

    // Ler dados consolidados
    const athletes = JSON.parse(fs.readFileSync("consolidated_results.json", "utf-8"));
    
    // Filtrar atletas com foto URL
    const athletesWithPhotos = athletes.filter((a: any) => a.fotoUrl && a.fotoUrl.trim());
    
    console.log(`📊 Atletas com foto URL: ${athletesWithPhotos.length}`);
    console.log(`📊 Atletas sem foto URL: ${athletes.length - athletesWithPhotos.length}`);

    // Atualizar links de fotos no banco
    let updated = 0;
    for (const athlete of athletesWithPhotos) {
      try {
        await connection.execute(
          "UPDATE atletas SET fotoUrl = ? WHERE id = ?",
          [athlete.fotoUrl, athlete.id]
        );
        updated++;
      } catch (error: any) {
        // Silenciar erros
      }
    }

    console.log(`\n✅ Links de fotos atualizados: ${updated}`);

    // Verificar fotos no banco
    const [result] = await connection.execute(
      "SELECT COUNT(*) as count FROM atletas WHERE fotoUrl IS NOT NULL AND fotoUrl != ''"
    );
    const totalPhotos = (result as any)[0].count;
    console.log(`📊 Total de atletas com foto no banco: ${totalPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

processPhotos();
