import { eq, and, like, gte, lte, or, desc, asc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  atletas,
  midias,
  configuracaoCampos,
  configuracaoCamposPadrao,
  avaliacoes,
  grupos,
  atletasEmGrupos,
  InsertAtleta,
  InsertConfiguracaoCampo,
  InsertConfiguracaoCampoPadrao,
  InsertAvaliacao,
  InsertGrupo,
  InsertAtletaEmGrupo,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isNull } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      console.log('[Database] Conectando ao banco...');
      _db = drizzle(process.env.DATABASE_URL);
      console.log('[Database] ✓ Conexão estabelecida');
    } catch (error: any) {
      console.error("[Database] Erro ao conectar:", error.message);
      _db = null;
    }
  } else if (!process.env.DATABASE_URL) {
    console.warn('[Database] DATABASE_URL não está definida');
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== ATLETAS ====================

/**
 * Busca todos os atletas de um usuário com foto
 */
export async function getAtletas(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(atletas)
    .where(eq(atletas.userId, userId))
    .orderBy(desc(atletas.createdAt));
  
  // Buscar fotos e vídeos para cada atleta
  if (result.length > 0) {
    const { midias } = await import("../drizzle/schema");
    const atletasIds = result.map(a => a.id);
    
    const fotos = await db
      .select()
      .from(midias)
      .where(and(
        inArray(midias.atletaId, atletasIds),
        eq(midias.tipo, "foto")
      ))
      .orderBy(desc(midias.createdAt));
    
    const videos = await db
      .select()
      .from(midias)
      .where(and(
        inArray(midias.atletaId, atletasIds),
        eq(midias.tipo, "video")
      ))
      .orderBy(desc(midias.createdAt));
    
    // Criar mapa de fotos por atletaId
    const fotoMap = new Map();
    fotos.forEach(foto => {
      if (foto.atletaId && !fotoMap.has(foto.atletaId)) {
        fotoMap.set(foto.atletaId, foto.url);
      }
    });
    
    // Criar mapa de vídeos por atletaId
    const videoMap = new Map();
    videos.forEach(video => {
      if (video.atletaId) {
        if (!videoMap.has(video.atletaId)) {
          videoMap.set(video.atletaId, []);
        }
        videoMap.get(video.atletaId).push(video.url);
      }
    });
    
    // Adicionar foto e vídeos a cada atleta
    return result.map(atleta => {
      const temVideo = (videoMap.get(atleta.id) || []).length > 0;
      return {
        ...atleta,
        fotoUrl: fotoMap.get(atleta.id) || null,
        videos: videoMap.get(atleta.id) || [],
        completude: calcularCompletude(atleta, fotoMap.has(atleta.id), temVideo)
      };
    });
  }
  
  return result.map(atleta => ({
    ...atleta,
    completude: calcularCompletude(atleta, false, false)
  }));
}

function calcularCompletude(atleta: any, temFoto: boolean, temVideo: boolean = false): number {
  const campos = [
    atleta.nome ? 1 : 0,
    atleta.posicao ? 1 : 0,
    atleta.dataNascimento ? 1 : 0,
    atleta.altura ? 1 : 0,
    atleta.pe ? 1 : 0,
    atleta.link ? 1 : 0,
    atleta.escala ? 1 : 0,
    atleta.valencia ? 1 : 0,
    temFoto ? 1 : 0,
    temVideo ? 1 : 0,
  ];
  
  const total = campos.reduce((a, b) => a + b, 0);
  return Math.round((total / campos.length) * 100);
}

/**
 * Busca atleta por ID com foto
 */
export async function getAtletaById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(atletas)
    .where(and(eq(atletas.id, id), eq(atletas.userId, userId)))
    .limit(1);
  
  if (!result[0]) return null;
  
  const atleta = result[0];
  
  // Buscar todas as mídias do atleta
  const todasMidias = await db
    .select()
    .from(midias)
    .where(eq(midias.atletaId, id))
    .orderBy(desc(midias.createdAt));
  
  // Separar fotos e vídeos
  const fotos = todasMidias.filter((m: any) => m.tipo === 'foto');
  const videosData = todasMidias.filter((m: any) => m.tipo === 'video');
  
  return {
    ...atleta,
    fotoUrl: fotos[0]?.url || null,
    midias: todasMidias,
    videos: videosData.map((v: any) => v.url)
  };
}

/**
 * Busca atletas com filtros
 */
export async function searchAtletas(
  userId: number,
  filtros: {
    nome?: string;
    posicao?: string;
    clube?: string;
    idadeMin?: number;
    idadeMax?: number;
    alturaMin?: number;
    alturaMax?: number;
    pe?: string;
    escala?: string;
    valencia?: string;
    limit?: number;
  }
) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(atletas.userId, userId)];
  
  if (filtros.nome) {
    conditions.push(like(atletas.nome, `%${filtros.nome}%`));
  }
  
  if (filtros.posicao) {
    conditions.push(
      or(
        eq(atletas.posicao, filtros.posicao),
        eq(atletas.segundaPosicao, filtros.posicao)
      )!
    );
  }
  
  if (filtros.clube) {
    conditions.push(like(atletas.clube, `%${filtros.clube}%`));
  }
  
  if (filtros.idadeMin !== undefined) {
    conditions.push(gte(atletas.idade, filtros.idadeMin));
  }
  
  if (filtros.idadeMax !== undefined) {
    conditions.push(lte(atletas.idade, filtros.idadeMax));
  }
  
  if (filtros.alturaMin !== undefined) {
    conditions.push(gte(atletas.altura, filtros.alturaMin.toString()));
  }
  
  if (filtros.alturaMax !== undefined) {
    conditions.push(lte(atletas.altura, filtros.alturaMax.toString()));
  }
  
  if (filtros.pe) {
    conditions.push(eq(atletas.pe, filtros.pe as any));
  }
  
  if (filtros.escala) {
    conditions.push(eq(atletas.escala, filtros.escala));
  }
  
  if (filtros.valencia) {
    conditions.push(eq(atletas.valencia, filtros.valencia));
  }
  
  const query = db
    .select()
    .from(atletas)
    .where(and(...conditions))
    .orderBy(asc(atletas.nome));

  if (filtros.limit) {
    return query.limit(filtros.limit);
  }
  return query;
}

/**
 * Cria um novo atleta
 */
export async function createAtleta(data: InsertAtleta) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log("[DB] Criando atleta com dados:", data);
  const result = await db.insert(atletas).values(data);
  console.log("[DB] Resultado do insert:", result);
  console.log("[DB] insertId:", result[0]?.insertId);
  const id = Number(result[0]?.insertId);
  console.log("[DB] ID convertido:", id);
  return id;
}

/**
 * Atualiza um atleta
 */
export async function updateAtleta(
  id: number,
  userId: number,
  data: Partial<InsertAtleta>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(atletas)
    .set(data)
    .where(and(eq(atletas.id, id), eq(atletas.userId, userId)));
}

/**
 * Exclui um atleta
 */
export async function deleteAtleta(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(atletas)
    .where(and(eq(atletas.id, id), eq(atletas.userId, userId)));
}

// ==================== CONFIGURAÇÃO DE CAMPOS ====================

/**
 * Busca campos customizados de um usuário
 */
export async function getCamposCustomizados(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(configuracaoCampos)
    .where(eq(configuracaoCampos.userId, userId))
    .orderBy(configuracaoCampos.ordem);
}

/**
 * Cria um novo campo customizado
 */
export async function createCampoCustomizado(data: InsertConfiguracaoCampo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(configuracaoCampos).values(data);
  return Number(result[0].insertId);
}

/**
 * Atualiza um campo customizado
 */
export async function updateCampoCustomizado(
  id: number,
  userId: number,
  data: Partial<InsertConfiguracaoCampo>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(configuracaoCampos)
    .set(data)
    .where(and(eq(configuracaoCampos.id, id), eq(configuracaoCampos.userId, userId)));
}

/**
 * Exclui um campo customizado
 */
export async function deleteCampoCustomizado(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(configuracaoCampos)
    .where(and(eq(configuracaoCampos.id, id), eq(configuracaoCampos.userId, userId)));
}

/**
 * Busca configuração de campos padrão de um usuário
 */
export async function getCamposPadrao(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(configuracaoCamposPadrao)
    .where(eq(configuracaoCamposPadrao.userId, userId))
    .orderBy(configuracaoCamposPadrao.ordem);
}

/**
 * Atualiza ou cria configuração de campo padrão
 */
export async function upsertCampoPadrao(data: InsertConfiguracaoCampoPadrao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verifica se já existe
  const existing = await db
    .select()
    .from(configuracaoCamposPadrao)
    .where(
      and(
        eq(configuracaoCamposPadrao.userId, data.userId),
        eq(configuracaoCamposPadrao.nomeCampo, data.nomeCampo)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Atualiza
    await db
      .update(configuracaoCamposPadrao)
      .set(data)
      .where(eq(configuracaoCamposPadrao.id, existing[0].id));
    return existing[0].id;
  } else {
    // Cria
    const result = await db.insert(configuracaoCamposPadrao).values(data);
    return Number(result[0].insertId);
  }
}

// ==================== AVALIAÇÕES ====================

/**
 * Busca avaliação de um atleta
 */
export async function getAvaliacao(atletaId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(avaliacoes)
    .where(and(eq(avaliacoes.atletaId, atletaId), eq(avaliacoes.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Cria ou atualiza avaliação de um atleta
 */
export async function upsertAvaliacao(data: InsertAvaliacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verifica se já existe
  const existing = await db
    .select()
    .from(avaliacoes)
    .where(
      and(
        eq(avaliacoes.atletaId, data.atletaId),
        eq(avaliacoes.userId, data.userId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Atualiza
    await db
      .update(avaliacoes)
      .set(data)
      .where(eq(avaliacoes.id, existing[0].id));
    return existing[0].id;
  } else {
    // Cria
    const result = await db.insert(avaliacoes).values(data);
    return Number(result[0].insertId);
  }
}

/**
 * Exclui avaliação de um atleta
 */
export async function deleteAvaliacao(atletaId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(avaliacoes)
    .where(and(eq(avaliacoes.atletaId, atletaId), eq(avaliacoes.userId, userId)));
}

// ==================== GRUPOS ====================

/**
 * Busca todos os grupos de um usuário
 */
export async function getGrupos(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(grupos)
    .where(eq(grupos.userId, userId))
    .orderBy(desc(grupos.createdAt));
}

/**
 * Busca grupo por ID
 */
export async function getGrupoById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(grupos)
    .where(and(eq(grupos.id, id), eq(grupos.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Cria um novo grupo
 */
export async function createGrupo(data: InsertGrupo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(grupos).values(data);
  return Number(result[0].insertId);
}

/**
 * Atualiza um grupo
 */
export async function updateGrupo(
  id: number,
  userId: number,
  data: Partial<InsertGrupo>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(grupos)
    .set(data)
    .where(and(eq(grupos.id, id), eq(grupos.userId, userId)));
}

/**
 * Exclui um grupo
 */
export async function deleteGrupo(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(grupos)
    .where(and(eq(grupos.id, id), eq(grupos.userId, userId)));
}

// ==================== ATLETAS EM GRUPOS ====================

/**
 * Busca atletas de um grupo
 */
export async function getAtletasDoGrupo(grupoId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      atletaId: atletasEmGrupos.atletaId,
      atletaNome: atletas.nome,
      posicao: atletas.posicao,
      posicaoOrdem: atletasEmGrupos.posicaoOrdem,
    })
    .from(atletasEmGrupos)
    .leftJoin(atletas, eq(atletasEmGrupos.atletaId, atletas.id))
    .where(eq(atletasEmGrupos.grupoId, grupoId))
    .orderBy(asc(atletasEmGrupos.posicaoOrdem), asc(atletas.nome));
}

/**
 * Adiciona atleta a um grupo
 */
export async function addAtletaAoGrupo(data: InsertAtletaEmGrupo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verifica se já existe
  const existing = await db
    .select()
    .from(atletasEmGrupos)
    .where(
      and(
        eq(atletasEmGrupos.atletaId, data.atletaId),
        eq(atletasEmGrupos.grupoId, data.grupoId)
      )
    )
    .limit(1);
  
  if (existing.length === 0) {
    // Define posicaoOrdem como o próximo disponível no grupo
    const countResult = await db
      .select({ count: atletasEmGrupos.id })
      .from(atletasEmGrupos)
      .where(eq(atletasEmGrupos.grupoId, data.grupoId));
    const nextOrdem = countResult.length;
    const result = await db.insert(atletasEmGrupos).values({ ...data, posicaoOrdem: nextOrdem });
    return Number(result[0].insertId);
  }
  
  return existing[0].id;
}

/**
 * Remove atleta de um grupo
 */
export async function removeAtletaDoGrupo(atletaId: number, grupoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(atletasEmGrupos)
    .where(
      and(
        eq(atletasEmGrupos.atletaId, atletaId),
        eq(atletasEmGrupos.grupoId, grupoId)
      )
    );
}

/**
 * Remove todos os atletas de um grupo (quando grupo é deletado)
 */
export async function removeAllAtletasDoGrupo(grupoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(atletasEmGrupos)
    .where(eq(atletasEmGrupos.grupoId, grupoId));
}

/**
 * Reordena atletas de um grupo salvando a nova ordem
 */
export async function reordenarAtletasDoGrupo(
  grupoId: number,
  atletaIds: number[] // array na nova ordem
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Atualiza posicaoOrdem de cada atleta em paralelo
  await Promise.all(
    atletaIds.map((atletaId, index) =>
      db
        .update(atletasEmGrupos)
        .set({ posicaoOrdem: index })
        .where(
          and(
            eq(atletasEmGrupos.atletaId, atletaId),
            eq(atletasEmGrupos.grupoId, grupoId)
          )
        )
    )
  );
}

// ==================== MÍDIA ====================

import { InsertMidia, Midia } from "../drizzle/schema";

/**
 * Busca todas as mídias de um atleta
 */
export async function getMidiasDoAtleta(atletaId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select()
    .from(midias)
    .where(and(eq(midias.atletaId, atletaId), eq(midias.userId, userId)))
    .orderBy(desc(midias.createdAt));
}

/**
 * Busca mídia por ID
 */
export async function getMidiaById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(midias)
    .where(and(eq(midias.id, id), eq(midias.userId, userId)))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Cria nova mídia
 */
export async function createMidia(data: InsertMidia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(midias).values(data);
  return Number(result[0].insertId);
}

/**
 * Atualiza mídia
 */
export async function updateMidia(
  id: number,
  userId: number,
  data: Partial<InsertMidia>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(midias)
    .set(data)
    .where(and(eq(midias.id, id), eq(midias.userId, userId)));
}

/**
 * Exclui mídia
 */
export async function deleteMidia(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(midias)
    .where(and(eq(midias.id, id), eq(midias.userId, userId)));
}

/**
 * Exclui todas as mídias de um atleta
 */
export async function deleteMidiasDoAtleta(atletaId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(midias)
    .where(and(eq(midias.atletaId, atletaId), eq(midias.userId, userId)));
}


/**
 * Busca atletas sem data de nascimento ou idade
 */
export async function getAtletasSemData(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db
    .select({
      id: atletas.id,
      nome: atletas.nome,
      link: atletas.link,
    })
    .from(atletas)
    .where(
      and(
        eq(atletas.userId, userId),
        or(
          isNull(atletas.dataNascimento),
          isNull(atletas.idade)
        )!
      )
    )
    .limit(100);
}
