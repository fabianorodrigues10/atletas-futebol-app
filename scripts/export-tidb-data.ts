import { createConnection } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

async function exportTiDBData() {
  let connection;
  try {
    console.log("🔄 Conectando ao TiDB Cloud...\n");

    // Credenciais extraídas do cache
    connection = await createConnection({
      host: "gateway04.us-east-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "2xkKgzjDtwmdn7p.root",
      password: process.env.TIDB_PASSWORD || "", // Senha pode estar em variável de ambiente
      database: "7XTarzVUuQNAxDd5Eu29wi",
      ssl: { rejectUnauthorized: false }, // TiDB Cloud requer SSL
    });

    console.log("✅ Conectado ao TiDB Cloud!\n");

    // Obter lista de todas as tabelas
    const [tables]: any = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()`
    );

    console.log(`📊 Encontradas ${tables.length} tabelas\n`);

    const allData: Record<string, any[]> = {};

    for (const { TABLE_NAME } of tables) {
      try {
        console.log(`📥 Exportando tabela: ${TABLE_NAME}...`);
        
        const [rows] = await connection.execute(`SELECT * FROM ${TABLE_NAME}`);
        allData[TABLE_NAME] = rows as any[];
        console.log(`   ✅ ${allData[TABLE_NAME].length} registros\n`);
      } catch (error: any) {
        console.log(`   ⚠️  Erro: ${error.message}\n`);
      }
    }

    // Salvar em arquivo JSON
    const exportPath = path.join(__dirname, "tidb-exported-data.json");
    fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2));

    console.log(`\n✅ Exportação concluída!`);
    console.log(`📁 Arquivo salvo em: ${exportPath}`);
    console.log(`\n📊 Resumo:`);
    let totalRecords = 0;
    Object.entries(allData).forEach(([table, data]) => {
      console.log(`   ${table}: ${data.length} registros`);
      totalRecords += data.length;
    });
    console.log(`\n📈 Total de registros: ${totalRecords}`);

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro ao exportar dados:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

exportTiDBData();
