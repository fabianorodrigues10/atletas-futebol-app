import mysql from "mysql2/promise";
import * as fs from "fs";

async function restore() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  console.log("🔄 Restaurando dados do cache...\n");
  
  // Ler o arquivo de cache com os dados
  const cacheFile = "/home/ubuntu/page_texts/127.0.0.1_3000_api_atletas.md";
  const content = fs.readFileSync(cacheFile, 'utf-8');
  
  // Extrair o JSON do arquivo
  const jsonMatch = content.match(/\{"data":\[.*\],"total":\d+\}/);
  if (!jsonMatch) {
    console.error("❌ Não foi possível encontrar os dados no arquivo de cache");
    process.exit(1);
  }
  
  const data = JSON.parse(jsonMatch[0]);
  console.log(`📊 Encontrados ${data.data.length} atletas no cache`);
  console.log(`📊 Total no banco: ${data.total}`);
  
  // Deletar atletas antigos
  await connection.execute(`DELETE FROM atletas WHERE userId = 1`);
  console.log("✅ Atletas antigos deletados\n");
  
  // Importar novos atletas
  let imported = 0;
  for (const atleta of data.data) {
    try {
      const sql = `INSERT INTO atletas (userId, nome, posicao, segundaPosicao, clube, dataNascimento, idade, altura, pe, link, escala, valencia, naturalidade, createdAt, updatedAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      
      const values = [
        atleta.userId,
        atleta.nome,
        atleta.posicao,
        atleta.segundaPosicao,
        atleta.clube,
        atleta.dataNascimento,
        atleta.idade,
        atleta.altura,
        atleta.pe,
        atleta.link,
        atleta.escala,
        atleta.valencia,
        atleta.naturalidade
      ];
      
      await connection.execute(sql, values);
      imported++;
    } catch (error: any) {
      console.error(`❌ Erro ao importar ${atleta.nome}:`, error.message);
    }
  }
  
  console.log(`✅ ${imported} atletas importados`);
  
  // Verificar o total
  const [result] = await connection.execute(`SELECT COUNT(*) as total FROM atletas WHERE userId = 1`);
  const total = (result as any)[0].total;
  console.log(`📊 Total de atletas no banco: ${total}`);
  
  await connection.end();
  process.exit(0);
}

restore().catch(console.error);
