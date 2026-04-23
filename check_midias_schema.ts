import * as mysql from "mysql2/promise";

async function checkSchema() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'midias' ORDER BY ORDINAL_POSITION"
    );

    console.log("📋 Colunas da tabela 'midias':\n");
    (columns as any).forEach((col: any) => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // Mostrar alguns registros
    console.log(`\n📊 Primeiros 3 registros:\n`);
    const [records] = await connection.execute("SELECT * FROM midias LIMIT 3");
    (records as any).forEach((r: any) => {
      console.log(`   ${JSON.stringify(r, null, 2)}`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

checkSchema();
