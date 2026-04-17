import * as fs from "fs";
import mysql from "mysql2/promise";

async function importAtletas() {
  console.log("🚀 Iniciando importação de atletas...\n");

  // Ler CSV
  const csvContent = fs.readFileSync("/tmp/atletas_limpo_final.csv", "utf-8");
  
  // Parser CSV simples
  const lines = csvContent.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const records = lines.slice(1).map(line => {
    const values = line.split(',');
    const record: any = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx]?.trim() || '';
    });
    return record;
  });

  console.log(`📊 Total de registros a importar: ${records.length}`);

  // Conectar ao banco
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "atletas",
  });

  let importados = 0;
  let erros = 0;
  const batchSize = 100;

  // Processar em lotes
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(records.length / batchSize);

    console.log(`\n📦 Processando lote ${batchNum}/${totalBatches}...`);

    try {
      for (const record of batch) {
        try {
          // Converter altura de "1,76" para 1.76
          let altura = null;
          if (record.ALTURA && record.ALTURA.trim().toUpperCase() !== "ND") {
            const alturaStr = record.ALTURA.replace(",", ".");
            const alturaNum = parseFloat(alturaStr);
            if (!isNaN(alturaNum) && alturaNum > 0) {
              altura = alturaNum;
            }
          }

          // Converter data de DD/MM/YY para YYYY-MM-DD
          let dataNascimento = null;
          if (record.DATA && record.DATA.trim()) {
            const [dia, mes, ano] = record.DATA.split("/");
            if (dia && mes && ano) {
              const anoNum = parseInt(ano);
              const anoCompleto = anoNum < 50 ? 2000 + anoNum : 1900 + anoNum;
              dataNascimento = `${anoCompleto}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
            }
          }

          // Calcular idade se não estiver preenchida
          let idade = null;
          if (record.IDADE && record.IDADE.trim()) {
            const idadeNum = parseInt(record.IDADE);
            if (!isNaN(idadeNum) && idadeNum > 0 && idadeNum < 150) {
              idade = idadeNum;
            }
          } else if (dataNascimento) {
            const birthDate = new Date(dataNascimento);
            const today = new Date();
            idade = today.getFullYear() - birthDate.getFullYear();
            if (
              today.getMonth() < birthDate.getMonth() ||
              (today.getMonth() === birthDate.getMonth() &&
                today.getDate() < birthDate.getDate())
            ) {
              idade--;
            }
          }

          // Mapear pé
          let pe = null;
          const peStr = record.PÉ?.trim().toUpperCase();
          if (peStr === "D") pe = "direito";
          else if (peStr === "E") pe = "esquerdo";
          else if (peStr === "A") pe = "ambidestro";

          // Preparar SQL
          const sql = `
            INSERT INTO atletas (
              userId, nome, posicao, segundaPosicao, clube, 
              dataNascimento, idade, altura, pe, link, escala, valencia,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `;

          const values = [
            1,
            record.ATLETA?.trim() || "",
            record.POSIÇÃO?.trim() || null,
            record["2ª POSIÇÃO"]?.trim() || null,
            record.CLUBE?.trim() || null,
            dataNascimento || null,
            idade || null,
            altura || null,
            pe || null,
            record.LINK?.trim() || null,
            record.ESCALA?.trim() || null,
            record.VALÊNCIAS?.trim() || null,
          ];

          await connection.execute(sql, values);
          importados++;
        } catch (error) {
          erros++;
          console.error(`  ❌ Erro ao importar: ${record.ATLETA}`, error);
        }
      }

      console.log(`  ✓ Lote ${batchNum} concluído (${batch.length} registros)`);
    } catch (error) {
      console.error(`  ❌ Erro no lote ${batchNum}:`, error);
    }
  }

  await connection.end();

  console.log("\n" + "=".repeat(60));
  console.log("✅ IMPORTAÇÃO CONCLUÍDA!");
  console.log("=".repeat(60));
  console.log(`  ✓ Atletas importados: ${importados}`);
  console.log(`  ❌ Erros: ${erros}`);
  console.log(`  📊 Taxa de sucesso: ${((importados / records.length) * 100).toFixed(2)}%`);
}

importAtletas().catch(console.error);
