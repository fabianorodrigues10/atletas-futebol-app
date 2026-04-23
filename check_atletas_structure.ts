import { createConnection } from "mysql2/promise";

async function checkAtletas() {
  let connection;
  try {
    console.log("🔄 Conectando ao TiDB Cloud...\n");

    connection = await createConnection({
      host: "gateway04.us-east-1.prod.aws.tidbcloud.com",
      port: 4000,
      user: "2xkKgzjDtwmdn7p.root",
      password: "aD95QT17zsxmv7EpIPA4",
      database: "7XTarzVUuQNAxDd5Eu29wi",
      ssl: { rejectUnauthorized: false },
    });

    console.log("✅ Conectado ao TiDB Cloud!\n");

    // Verificar estrutura da tabela atletas
    console.log("📋 Estrutura da tabela 'atletas':");
    const [columns]: any = await connection.execute(
      `DESCRIBE atletas`
    );
    columns.forEach((col: any) => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Contar atletas por clube
    console.log("\n📊 Atletas por clube (top 10):");
    const [clubeStats]: any = await connection.execute(
      `SELECT clube, COUNT(*) as total FROM atletas GROUP BY clube ORDER BY total DESC LIMIT 10`
    );
    clubeStats.forEach((row: any) => {
      console.log(`   ${row.clube}: ${row.total}`);
    });

    // Procurar especificamente por Marcílio Dias
    console.log("\n🔍 Procurando por atletas do Marcílio Dias:");
    const [marcilioDias]: any = await connection.execute(
      `SELECT id, nome, posicao, clube FROM atletas WHERE clube LIKE '%Marcílio%' OR clube LIKE '%Dias%' LIMIT 20`
    );
    console.log(`   Encontrados: ${marcilioDias.length}`);
    marcilioDias.forEach((row: any) => {
      console.log(`   - ${row.nome} (${row.posicao}) - ${row.clube}`);
    });

    // Verificar últimas mudanças
    console.log("\n⏰ Últimas mudanças (últimas 24 horas):");
    const [recentChanges]: any = await connection.execute(
      `SELECT id, nome, clube, updatedAt FROM atletas WHERE updatedAt > DATE_SUB(NOW(), INTERVAL 24 HOUR) ORDER BY updatedAt DESC LIMIT 10`
    );
    console.log(`   Encontradas: ${recentChanges.length}`);
    recentChanges.forEach((row: any) => {
      console.log(`   - ${row.nome} (${row.clube}) - ${row.updatedAt}`);
    });

    await connection.end();
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkAtletas();
