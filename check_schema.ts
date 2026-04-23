import * as mysql from "mysql2/promise";

async function checkSchema() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'atletas' ORDER BY ORDINAL_POSITION"
    );

    console.log("📋 Colunas da tabela 'atletas':\n");
    (columns as any).forEach((col: any) => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // Procurar por coluna de foto
    const hasPhoto = (columns as any).some((c: any) => 
      c.COLUMN_NAME.toLowerCase().includes("foto") || 
      c.COLUMN_NAME.toLowerCase().includes("photo") ||
      c.COLUMN_NAME.toLowerCase().includes("image")
    );

    if (!hasPhoto) {
      console.log("\n⚠️  Nenhuma coluna de foto encontrada!");
      console.log("   Colunas disponíveis para armazenar foto:");
      console.log("   - Criar nova coluna 'fotoUrl'");
      console.log("   - Usar tabela 'midias' para armazenar fotos");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

checkSchema();
