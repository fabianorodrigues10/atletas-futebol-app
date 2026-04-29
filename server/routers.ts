import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storagePut } from "./storage";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ==================== ATLETAS ====================
  atletas: router({
    // Listar todos os atletas do usuário (TEMPORÁRIO: public para testes)
    list: publicProcedure.query(({ ctx }) => {
      // Usar userId fixo 1 para testes sem autenticação
      const userId = ctx.user?.id || 1;
      return db.getAtletas(userId);
    }),

    // Buscar atleta por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const atleta = await db.getAtletaById(input.id, userId);
        return atleta;
      }),

    // Buscar atletas sem data de nascimento/idade
    getSemData: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getAtletasSemData(userId);
    }),

    // Buscar atletas com filtros
    search: publicProcedure
      .input(
        z.object({
          nome: z.string().optional(),
          posicao: z.string().optional(),
          clube: z.string().optional(),
          idadeMin: z.number().optional(),
          idadeMax: z.number().optional(),
          alturaMin: z.number().optional(),
          alturaMax: z.number().optional(),
          pe: z.string().optional(),
          escala: z.string().optional(),
          valencia: z.string().optional(),
          limit: z.number().optional(),
        })
      )
      .query(({ ctx, input }) => {
        return db.searchAtletas(ctx.user?.id || 1, input);
      }),

    // Criar novo atleta
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(255),
          posicao: z.string().max(100).optional(),
          segundaPosicao: z.string().max(100).optional(),
          clube: z.string().max(255).optional(),
          naturalidade: z.string().max(255).optional(),
          dataNascimento: z.string().optional(), // ISO date string
          idade: z.number().optional(),
          altura: z.number().optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
          valencia: z.string().max(1000).optional(),
          camposCustomizados: z.string().optional(), // JSON string
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAtleta({
          userId: ctx.user?.id || 1,
          nome: input.nome,
          posicao: input.posicao || null,
          segundaPosicao: input.segundaPosicao || null,
          clube: input.clube || null,
          naturalidade: input.naturalidade || null,
          dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
          idade: input.idade || null,
          altura: input.altura?.toString() || null,
          pe: input.pe || null,
          link: input.link || null,
          escala: input.escala || null,
          valencia: input.valencia || null,
          camposCustomizados: input.camposCustomizados || null,
        });
        return { id };
      }),

    // Atualizar atleta
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).max(255).optional(),
          posicao: z.string().max(100).optional(),
          segundaPosicao: z.string().max(100).optional(),
          clube: z.string().max(255).optional(),
          naturalidade: z.string().max(255).optional(),
          dataNascimento: z.string().optional(),
          idade: z.number().optional(),
          altura: z.number().optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
          valencia: z.string().max(1000).optional(),
          camposCustomizados: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Converte altura para string se fornecida
        const updateData: any = { ...data };
        if (data.altura !== undefined) {
          updateData.altura = data.altura.toString();
        }
        
        // Manter dataNascimento como string (formato dd/mm/aa)
        // Não converter para Date - deixar o banco armazenar como está
        
        await db.updateAtleta(id, ctx.user?.id || 1, updateData);
        return { success: true };
      }),

    // Excluir atleta
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAtleta(input.id, ctx.user?.id || 1);
        return { success: true };
      }),
  }),

  // ==================== AVALIAÇÕES ====================
  avaliacoes: router({
    // Buscar avaliação de um atleta
    get: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getAvaliacao(input.atletaId, userId);
      }),

    // Criar ou atualizar avaliação
    upsert: publicProcedure
      .input(
        z.object({
          atletaId: z.number(),
          nota: z.number().min(1).max(10),
          comentarios: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const id = await db.upsertAvaliacao({
          userId,
          atletaId: input.atletaId,
          nota: input.nota,
          comentarios: input.comentarios || null,
        });
        return { id };
      }),

    // Deletar avaliação
    delete: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.deleteAvaliacao(input.atletaId, userId);
        return { success: true };
      }),
  }),

  // ==================== GRUPOS ====================
  grupos: router({
    // Listar todos os grupos
    list: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getGrupos(userId);
    }),

    // Buscar grupo por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getGrupoById(input.id, userId);
      }),

    // Buscar atletas de um grupo
    getAtletas: publicProcedure
      .input(z.object({ grupoId: z.number() }))
      .query(({ input }) => {
        return db.getAtletasDoGrupo(input.grupoId);
      }),

    // Criar novo grupo
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(255),
          descricao: z.string().optional(),
          cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        // Verificar se já existe grupo com esse nome para esse usuário
        const gruposExistentes = await db.getGrupos(userId);
        const existente = gruposExistentes.find((g: any) => g.nome === input.nome);
        if (existente) {
          return { id: existente.id };
        }
        const id = await db.createGrupo({
          userId,
          nome: input.nome,
          descricao: input.descricao || null,
          cor: input.cor || "#FF6B35",
        });
        return { id };
      }),

    // Atualizar grupo
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).max(255).optional(),
          descricao: z.string().optional(),
          cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        await db.updateGrupo(id, userId, data);
        return { success: true };
      }),

    // Deletar grupo
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.removeAllAtletasDoGrupo(input.id);
        await db.deleteGrupo(input.id, userId);
        return { success: true };
      }),

    // Adicionar atleta ao grupo
    addAtleta: publicProcedure
      .input(z.object({ atletaId: z.number(), grupoId: z.number() }))
      .mutation(async ({ input }) => {
        const id = await db.addAtletaAoGrupo({
          atletaId: input.atletaId,
          grupoId: input.grupoId,
        });
        return { id };
      }),

    // Remover atleta do grupo
    removeAtleta: publicProcedure
      .input(z.object({ atletaId: z.number(), grupoId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeAtletaDoGrupo(input.atletaId, input.grupoId);
        return { success: true };
      }),

    reordenar: publicProcedure
      .input(z.object({ grupoId: z.number(), atletaIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        await db.reordenarAtletasDoGrupo(input.grupoId, input.atletaIds);
        return { success: true };
      }),
  }),

  // ==================== CONFIGURAÇÃO DE CAMPOS ====================
  campos: router({
    // Listar campos customizados
    listCustomizados: publicProcedure.query(({ ctx }) => {
      return db.getCamposCustomizados(ctx.user?.id || 1);
    }),

    // Listar configuração de campos padrão
    listPadrao: publicProcedure.query(({ ctx }) => {
      return db.getCamposPadrao(ctx.user?.id || 1);
    }),

    // Criar campo customizado
    createCustomizado: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(255),
          tipoCampo: z.enum(["text", "number", "select", "date"]),
          opcoes: z.string().optional(), // JSON array para selects
          ativo: z.boolean().default(true),
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.createCampoCustomizado({
          userId: ctx.user?.id || 1,
          nomeCampo: input.nomeCampo,
          tipoCampo: input.tipoCampo,
          opcoes: input.opcoes || null,
          ativo: input.ativo,
          ordem: input.ordem,
        });
        return { id };
      }),

    // Atualizar campo customizado
    updateCustomizado: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nomeCampo: z.string().min(1).max(255).optional(),
          tipoCampo: z.enum(["text", "number", "select", "date"]).optional(),
          opcoes: z.string().optional(),
          ativo: z.boolean().optional(),
          ordem: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCampoCustomizado(id, ctx.user?.id || 1, data);
        return { success: true };
      }),

    // Excluir campo customizado
    deleteCustomizado: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampoCustomizado(input.id, ctx.user?.id || 1);
        return { success: true };
      }),

    // Atualizar configuração de campo padrão
    updatePadrao: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(100),
          visivel: z.boolean(),
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await db.upsertCampoPadrao({
          userId: ctx.user?.id || 1,
          nomeCampo: input.nomeCampo,
          visivel: input.visivel,
          ordem: input.ordem,
        });
        return { id };
      }),
  }),

  // ==================== MÍDIA ====================
  midias: router({
    // Gerar URL de upload para S3
    getUploadUrl: publicProcedure
      .input(
        z.object({
          atletaId: z.number(),
          fileName: z.string().min(1).max(255),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const s3Key = `atletas/${userId}/${input.atletaId}/${timestamp}-${random}-${input.fileName}`;
        return { s3Key };
      }),

    // Upload de foto com base64 (funciona na web e celular)
    uploadFoto: publicProcedure
      .input(
        z.object({
          atletaId: z.number(),
          fileName: z.string().min(1).max(255),
          mimeType: z.string(),
          base64Data: z.string(), // base64 encoded image data
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const s3Key = `atletas/${userId}/${input.atletaId}/${timestamp}-${random}-${input.fileName}`;
        
        // Decodifica base64 e faz upload ao S3
        const buffer = Buffer.from(input.base64Data, 'base64');
        const { url } = await storagePut(s3Key, buffer, input.mimeType);
        
        // Salva referência no banco
        const id = await db.createMidia({
          userId,
          atletaId: input.atletaId,
          tipo: 'foto',
          nome: input.fileName,
          url,
          s3Key,
          mimeType: input.mimeType,
          tamanho: buffer.length,
          descricao: input.descricao,
        });
        
        return { id, url };
      }),

    // Listar mídias de um atleta
    getByAtleta: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getMidiasDoAtleta(input.atletaId, userId);
      }),

    // Buscar mídia por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getMidiaById(input.id, userId);
      }),

    // Criar nova mídia (após upload para S3)
    create: publicProcedure
      .input(
        z.object({
          atletaId: z.number(),
          tipo: z.enum(["foto", "video", "documento"]),
          nome: z.string().min(1).max(255),
          url: z.string().url(),
          s3Key: z.string().min(1).max(500).optional(), // Opcional para vídeos do YouTube
          mimeType: z.string().optional(),
          tamanho: z.number().optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        // Para vídeos sem s3Key, gerar um s3Key sintético
        const s3Key = input.s3Key || `videos/${userId}/${input.atletaId}/${Date.now()}-${Math.random().toString(36).substring(7)}.url`;
        const id = await db.createMidia({
          userId,
          atletaId: input.atletaId,
          tipo: input.tipo,
          nome: input.nome,
          url: input.url,
          s3Key: s3Key,
          mimeType: input.mimeType,
          tamanho: input.tamanho,
          descricao: input.descricao,
        });
        return { id };
      }),

    // Atualizar mídia
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          descricao: z.string().optional(),
          nome: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        await db.updateMidia(id, userId, data);
        return { success: true };
      }),

    // Deletar mídia
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Permitir exclusão sem verificação de userId para evitar problemas de autenticação
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        
        const { eq } = await import("drizzle-orm");
        const { midias } = await import("../drizzle/schema");
        
        await db_instance
          .delete(midias)
          .where(eq(midias.id, input.id));
        
        return { success: true };
      }),
  }),

  // ==================== ESTATISTICAS DA TEMPORADA ====================
  estatisticas: router({
    // Buscar estatísticas da temporada de múltiplos atletas de uma vez
    getByAtletaIds: publicProcedure
      .input(z.object({
        atletaIds: z.array(z.number()),
        temporada: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        try {
          const userId = ctx.user?.id || 1;
          if (!input.atletaIds.length) return [];
          const dbConn = await db.getDb();
          if (!dbConn) return [];
          const { estatisticasTemporada } = await import("../drizzle/schema");
          const { and, inArray, eq } = await import("drizzle-orm");
          const temporada = input.temporada || "2025";
          const result = await dbConn.select().from(estatisticasTemporada)
            .where(and(
              inArray(estatisticasTemporada.atletaId, input.atletaIds),
              eq(estatisticasTemporada.userId, userId),
              eq(estatisticasTemporada.temporada, temporada),
            ));
          return result;
        } catch (e) {
          return [];
        }
      }),
  }),

  // ==================== RELATORIOS ====================
  relatorios: router({
    // Gerar relatório em PDF
    gerarPDF: publicProcedure
      .input(
        z.object({
          titulo: z.string(),
          posicoes: z.array(z.string()).optional(),
          idades: z.array(z.number()).optional(),
          clubes: z.array(z.string()).optional(),
          atletaIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const userId = ctx.user?.id || 1;
          let atletasQuery = await db.getAtletas(userId);
          
          if (input.atletaIds && input.atletaIds.length > 0) {
            atletasQuery = atletasQuery.filter((a: any) => input.atletaIds!.includes(a.id));
          }
          
          const { gerarRelatorioPDF } = await import("./pdf-generator.js");
          const pdfBuffer = await gerarRelatorioPDF(input.titulo, atletasQuery, { totalAtletas: atletasQuery.length, idadeMedia: 0, alturaMedia: "0", posicoes: {} });
          
          return {
            success: true,
            message: "Relatório gerado com sucesso",
            pdfBase64: pdfBuffer.toString("base64"),
          };
        } catch (error) {
          console.error("Erro ao gerar PDF:", error);
          return {
            success: false,
            message: "Erro ao gerar relatório",
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
