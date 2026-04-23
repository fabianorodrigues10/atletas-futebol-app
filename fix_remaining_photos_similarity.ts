import * as mysql from "mysql2/promise";

// Função para calcular similaridade entre strings (Levenshtein distance)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 100.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return ((longer.length - editDistance) / longer.length) * 100;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return costs[s2.length];
}

async function fixRemainingPhotos() {
  const connection = await mysql.createConnection(
    process.env.DATABASE_URL || "mysql://2xkKgzjDtwmdn7p.root:aD95QT17zsxmv7EpIPA4@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/7XTarzVUuQNAxDd5Eu29wi"
  );

  try {
    console.log("🔄 Corrigindo fotos restantes com busca por similaridade...\n");

    // Pegar fotos não mapeadas
    const [unmappedPhotos] = await connection.execute(
      `SELECT m.id, m.atletaId, m.nome, m.url 
       FROM midias m
       LEFT JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto' AND a.id IS NULL`
    );

    console.log(`📊 Fotos não mapeadas: ${(unmappedPhotos as any).length}\n`);

    // Pegar lista de todos os atletas
    const [allAthletes] = await connection.execute(
      "SELECT id, nome FROM atletas"
    );

    let updated = 0;

    // Para cada foto, encontrar o atleta mais similar
    for (let i = 0; i < (unmappedPhotos as any).length; i++) {
      const photo = (unmappedPhotos as any)[i];

      try {
        // Extrair nome da foto
        const nameMatch = photo.nome.match(/Foto de (.+)/);
        if (!nameMatch) continue;

        const photoName = nameMatch[1].toLowerCase();

        // Encontrar atleta mais similar
        let bestMatch = null;
        let bestScore = 0;

        for (const athlete of (allAthletes as any)) {
          const athleteName = athlete.nome.toLowerCase();
          const score = similarity(photoName, athleteName);

          if (score > bestScore) {
            bestScore = score;
            bestMatch = athlete;
          }
        }

        // Se encontrou com similaridade > 70%, atualizar
        if (bestMatch && bestScore > 70) {
          await connection.execute(
            "UPDATE midias SET atletaId = ? WHERE id = ?",
            [bestMatch.id, photo.id]
          );
          updated++;

          if (updated % 50 === 0) {
            console.log(`✅ Atualizadas: ${updated}/${(unmappedPhotos as any).length}`);
          }
        }
      } catch (error: any) {
        // Silenciar erros
      }
    }

    console.log(`\n✅ Fotos corrigidas por similaridade: ${updated}`);

    // Verificar cobertura final
    const [coverage] = await connection.execute(
      `SELECT COUNT(DISTINCT m.atletaId) as count 
       FROM midias m
       INNER JOIN atletas a ON m.atletaId = a.id
       WHERE m.tipo = 'foto'`
    );
    const validPhotos = (coverage as any)[0].count;
    console.log(`📊 Atletas com fotos válidas: ${validPhotos}`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixRemainingPhotos();
