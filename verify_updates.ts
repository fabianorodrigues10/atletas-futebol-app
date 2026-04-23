import * as mysql from "mysql2/promise";

async function verify() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔍 Verificando atualizações no banco de dados...\n");

    // Verificar atletas com naturalidade preenchida
    const [naturalidade] = await connection.execute(
      "SELECT COUNT(*) as count FROM atletas WHERE naturalidade IS NOT NULL AND naturalidade != ''"
    );
    console.log(`✅ Atletas com naturalidade: ${(naturalidade as any)[0].count}`);

    // Verificar atletas com altura preenchida
    const [altura] = await connection.execute(
      "SELECT COUNT(*) as count FROM atletas WHERE altura > 0"
    );
    console.log(`✅ Atletas com altura: ${(altura as any)[0].count}`);

    // Verificar atletas com data de nascimento
    const [dataNasc] = await connection.execute(
      "SELECT COUNT(*) as count FROM atletas WHERE dataNascimento IS NOT NULL"
    );
    console.log(`✅ Atletas com data de nascimento: ${(dataNasc as any)[0].count}`);

    // Mostrar alguns exemplos de atletas atualizados
    console.log(`\n📋 Exemplos de atletas atualizados:\n`);
    const [examples] = await connection.execute(
      `SELECT nome, clube, posicao, altura, dataNascimento, naturalidade 
       FROM atletas 
       WHERE naturalidade IS NOT NULL AND naturalidade != '' 
       LIMIT 5`
    );

    (examples as any).forEach((a: any) => {
      console.log(`   ${a.nome}`);
      console.log(`   - Clube: ${a.clube}`);
      console.log(`   - Posição: ${a.posicao}`);
      console.log(`   - Altura: ${a.altura}`);
      console.log(`   - Data Nasc: ${a.dataNascimento}`);
      console.log(`   - Naturalidade: ${a.naturalidade}\n`);
    });

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

verify();
