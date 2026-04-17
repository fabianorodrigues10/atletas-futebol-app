import { getDb } from "../server/db";
import { atletas } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const VALENCIAS = [
  "Jogador de força, com boa ruptura",
  "Atleta com ótimo jogo aéreo",
  "Jogador rápido, com capacidade de pressionar defensores",
];

async function fillValencias() {
  try {
    console.log("Iniciando preenchimento de valências...");

    const db = await getDb();
    if (!db) {
      throw new Error("Banco de dados não disponível");
    }

    // Buscar todos os atletas
    const atletasLista = await db.select().from(atletas).limit(1515);

    console.log(`Encontrados ${atletasLista.length} atletas`);

    let atualizados = 0;
    let erros = 0;

    for (const atleta of atletasLista) {
      try {
        // Selecionar valência aleatória
        const valencia = VALENCIAS[Math.floor(Math.random() * VALENCIAS.length)];

        // Atualizar atleta
        await db
          .update(atletas)
          .set({ valencia })
          .where(eq(atletas.id, atleta.id));

        atualizados++;

        if (atualizados % 100 === 0) {
          console.log(`Processados: ${atualizados}/${atletasLista.length}`);
        }
      } catch (err) {
        erros++;
        console.error(`Erro ao atualizar atleta ${atleta.id}:`, err);
      }
    }

    console.log(`\n✅ Processo concluído!`);
    console.log(`- Atualizados: ${atualizados}`);
    console.log(`- Erros: ${erros}`);
    console.log(`- Total: ${atualizados + erros}`);
    process.exit(0);
  } catch (error) {
    console.error("Erro fatal:", error);
    process.exit(1);
  }
}

fillValencias();
