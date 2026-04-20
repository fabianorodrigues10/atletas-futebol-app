import { createConnection } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

async function exportAllData() {
  let connection;
  try {
    console.log("🔄 Conectando ao banco de dados...\n");

    // Criar conexão com o banco de dados
    connection = await createConnection({
      host: process.env.DATABASE_HOST || "localhost",
      user: process.env.DATABASE_USER || "root",
      password: process.env.DATABASE_PASSWORD || "",
      database: process.env.DATABASE_NAME || "atletas_futebol",
    });

    console.log("✅ Conectado ao banco de dados!\n");

    // Definir as tabelas a exportar
    const tables = [
      "atletas",
      "grupos",
      "atletasEmGrupos",
      "jogos",
      "scoutJogo",
      "estatisticasAtleta",
      "filtros",
      "customFields",
      "users",
    ];

    const allData: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        console.log(`📊 Exportando tabela: ${table}...`);
        
        const [rows] = await connection.execute(`SELECT * FROM ${table}`);
        allData[table] = rows as any[];
        console.log(`   ✅ ${allData[table].length} registros encontrados\n`);
      } catch (error: any) {
        console.log(`   ⚠️  Tabela não encontrada ou erro: ${error.message}\n`);
      }
    }

    // Salvar em arquivo JSON
    const exportPath = path.join(__dirname, "exported-data.json");
    fs.writeFileSync(exportPath, JSON.stringify(allData, null, 2));

    console.log(`\n✅ Exportação concluída!`);
    console.log(`📁 Arquivo salvo em: ${exportPath}`);
    console.log(`\n📊 Resumo:`);
    Object.entries(allData).forEach(([table, data]) => {
      console.log(`   ${table}: ${data.length} registros`);
    });

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao exportar dados:", error);
    if (connection) await connection.end();
    process.exit(1);
  }
}

exportAllData();
