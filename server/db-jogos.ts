import { eq, and, gte, lte, desc } from "drizzle-orm";
import { jogos, scoutJogo, atletas, InsertJogo } from "../drizzle/schema";
import { getDb } from "./db";

// ==================== JOGOS ====================

/**
 * Listar todos os jogos do usuário
 */
export async function getJogos(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(jogos)
      .where(eq(jogos.userId, userId))
      .orderBy(desc(jogos.data));
  } catch (error) {
    console.error("[Database] Failed to get jogos:", error);
    return [];
  }
}

/**
 * Buscar jogo por ID
 */
export async function getJogoById(jogoId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(jogos)
      .where(and(eq(jogos.id, jogoId), eq(jogos.userId, userId)))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get jogo:", error);
    return null;
  }
}

/**
 * Listar jogos por período (entre duas datas)
 */
export async function getJogosPorPeriodo(
  userId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(jogos)
      .where(
        and(
          eq(jogos.userId, userId),
          gte(jogos.data, dataInicio),
          lte(jogos.data, dataFim)
        )
      )
      .orderBy(desc(jogos.data));
  } catch (error) {
    console.error("[Database] Failed to get jogos por período:", error);
    return [];
  }
}

/**
 * Criar novo jogo
 */
export async function createJogo(data: InsertJogo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(jogos).values(data);
    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[Database] Failed to create jogo:", error);
    throw error;
  }
}

/**
 * Atualizar jogo
 */
export async function updateJogo(
  jogoId: number,
  userId: number,
  data: Partial<InsertJogo>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db
      .update(jogos)
      .set(data)
      .where(and(eq(jogos.id, jogoId), eq(jogos.userId, userId)));
  } catch (error) {
    console.error("[Database] Failed to update jogo:", error);
    throw error;
  }
}

/**
 * Deletar jogo
 */
export async function deleteJogo(jogoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Deletar scout do jogo primeiro
    await db.delete(scoutJogo).where(eq(scoutJogo.jogoId, jogoId));

    // Deletar jogo
    await db
      .delete(jogos)
      .where(and(eq(jogos.id, jogoId), eq(jogos.userId, userId)));
  } catch (error) {
    console.error("[Database] Failed to delete jogo:", error);
    throw error;
  }
}

// ==================== SCOUT JOGO ====================

/**
 * Listar scout de um jogo (atletas que jogaram)
 */
export async function getScoutJogo(jogoId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db
      .select()
      .from(scoutJogo)
      .where(eq(scoutJogo.jogoId, jogoId));
  } catch (error) {
    console.error("[Database] Failed to get scout jogo:", error);
    return [];
  }
}

/**
 * Buscar scout específico de um atleta em um jogo
 */
export async function getScoutAtletaJogo(jogoId: number, atletaId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(scoutJogo)
      .where(
        and(eq(scoutJogo.jogoId, jogoId), eq(scoutJogo.atletaId, atletaId))
      )
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get scout atleta jogo:", error);
    return null;
  }
}

/**
 * Listar atletas que jogaram em um período (para relatório)
 */
export async function getAtletasJogadosPorPeriodo(
  userId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar todos os jogos do período
    const jogosPeriodo = await db
      .select({ id: jogos.id })
      .from(jogos)
      .where(
        and(
          eq(jogos.userId, userId),
          gte(jogos.data, dataInicio),
          lte(jogos.data, dataFim)
        )
      );

    if (jogosPeriodo.length === 0) return [];

    const jogoIds = jogosPeriodo.map((j: any) => j.id);

    // Buscar todos os scouts desses jogos com dados do atleta
    return await db
      .select({
        scoutId: scoutJogo.id,
        jogoId: scoutJogo.jogoId,
        atletaId: scoutJogo.atletaId,
        atletaNome: atletas.nome,
        atletaPosicao: atletas.posicao,
        titular: scoutJogo.titular,
        minutosJogados: scoutJogo.minutosJogados,
        notaTecnica: scoutJogo.notaTecnica,
        notaFisica: scoutJogo.notaFisica,
        notaTatica: scoutJogo.notaTatica,
        observacoes: scoutJogo.observacoes,
      })
      .from(scoutJogo)
      .innerJoin(atletas, eq(scoutJogo.atletaId, atletas.id))
      .where(
        and(
          eq(scoutJogo.userId, userId),
          // @ts-ignore - inArray não está tipado corretamente
          // inArray(scoutJogo.jogoId, jogoIds)
        )
      );
  } catch (error) {
    console.error("[Database] Failed to get atletas jogados por período:", error);
    return [];
  }
}

/**
 * Contar atletas novos descobertos em um período
 */
export async function countAtletasNovos(
  userId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) return 0;

  try {
    // Buscar atletas criados no período
    const result = await db
      .select()
      .from(atletas)
      .where(
        and(
          eq(atletas.userId, userId),
          gte(atletas.createdAt, dataInicio),
          lte(atletas.createdAt, dataFim)
        )
      );

    return result.length;
  } catch (error) {
    console.error("[Database] Failed to count atletas novos:", error);
    return 0;
  }
}

/**
 * Obter estatísticas de um período
 */
export async function getEstatisticasPeriodo(
  userId: number,
  dataInicio: Date,
  dataFim: Date
) {
  const db = await getDb();
  if (!db) {
    return {
      totalJogos: 0,
      jogosEstadio: 0,
      jogosOutroLocal: 0,
      totalAtletas: 0,
      atletasNovos: 0,
    };
  }

  try {
    // Total de jogos
    const jogosPeriodo = await db
      .select()
      .from(jogos)
      .where(
        and(
          eq(jogos.userId, userId),
          gte(jogos.data, dataInicio),
          lte(jogos.data, dataFim)
        )
      );

    const totalJogos = jogosPeriodo.length;
    const jogosEstadio = jogosPeriodo.filter((j: any) => j.visualizadoNoEstadio).length;
    const jogosOutroLocal = totalJogos - jogosEstadio;

    // Total de atletas únicos que jogaram
    const jogoIds = jogosPeriodo.map((j: any) => j.id);
    let totalAtletas = 0;
    let atletasNovos = 0;

    if (jogoIds.length > 0) {
      const scouts = await db
        .select({ atletaId: scoutJogo.atletaId })
        .from(scoutJogo)
        .where(eq(scoutJogo.userId, userId));

      const atletasUnicos = new Set(scouts.map((s: any) => s.atletaId));
      totalAtletas = atletasUnicos.size;

      // Atletas novos criados no período
      const atletasNovosPeriodo = await db
        .select()
        .from(atletas)
        .where(
          and(
            eq(atletas.userId, userId),
            gte(atletas.createdAt, dataInicio),
            lte(atletas.createdAt, dataFim)
          )
        );

      atletasNovos = atletasNovosPeriodo.length;
    }

    return {
      totalJogos,
      jogosEstadio,
      jogosOutroLocal,
      totalAtletas,
      atletasNovos,
    };
  } catch (error) {
    console.error("[Database] Failed to get estatísticas período:", error);
    return {
      totalJogos: 0,
      jogosEstadio: 0,
      jogosOutroLocal: 0,
      totalAtletas: 0,
      atletasNovos: 0,
    };
  }
}
