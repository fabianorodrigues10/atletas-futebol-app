import { z } from "zod";
import { InsertAtleta } from "../drizzle/schema";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as dbJogos from "./db-jogos";
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
    // Listar atletas de um grupo
    getAtletas: publicProcedure
      .input(z.object({ grupoId: z.number() }))
      .query(({ ctx, input }) => {
        return db.getAtletasDoGrupo(input.grupoId);
      }),

    // Buscar atletas sem data de nascimento/idade
    getSemData: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getAtletas(userId).then(atletas => 
        atletas.filter(a => !a.dataNascimento || !a.idade)
      );
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
          limit: z.number().optional(),
        })
      )
      .query(({ ctx, input }) => {
        return db.searchAtletas(ctx.user?.id || 1, input as any);
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
          altura: z.union([z.number(), z.string()]).optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
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
          altura: z.union([z.number(), z.string()]).optional(),
          pe: z.enum(["direito", "esquerdo", "ambidestro"]).optional(),
          link: z.string().optional(),
          escala: z.string().max(100).optional(),
          camposCustomizados: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        
        // Converte altura para string se fornecida
        const updateData: any = { ...data };
        if (data.altura !== undefined) {
          updateData.altura = typeof data.altura === 'number' ? data.altura.toString() : data.altura;
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
    // Listar atletas de um grupo
    getAtletas: publicProcedure
      .input(z.object({ grupoId: z.number() }))
      .query(({ ctx, input }) => {
        return db.getAtletasDoGrupo(input.grupoId);
      }),

    // Criar novo grupo
    create: publicProcedure
      .input(
        z.object({
          nome: z.string().min(1).max(255),
          descricao: z.string().optional(),
          atletasIds: z.array(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const id = await db.createGrupo({
          userId,
          nome: input.nome,
          descricao: input.descricao || null,
        });
        
        // Adicionar atletas ao grupo
        if (input.atletasIds && input.atletasIds.length > 0) {
          for (const atletaId of input.atletasIds) {
            await db.addAtletaAoGrupo({
              grupoId: id,
              atletaId: atletaId,
            });
          }
        }
        
        return { id };
      }),

    // Atualizar grupo
    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).max(255).optional(),
          descricao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        await db.updateGrupo(id, userId, data);
        return { success: true };
      }),

    // Excluir grupo
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.deleteGrupo(input.id, userId);
        return { success: true };
      }),

    // Adicionar atleta ao grupo
    addAtleta: publicProcedure
      .input(z.object({ grupoId: z.number(), atletaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.addAtletaAoGrupo({
          grupoId: input.grupoId,
          atletaId: input.atletaId,
        });
        return { success: true };
      }),

    // Remover atleta do grupo
    removeAtleta: publicProcedure
      .input(z.object({ grupoId: z.number(), atletaId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.removeAtletaDoGrupo(input.atletaId, input.grupoId);
        return { success: true };
      }),
  }),

  // ==================== CAMPOS CUSTOMIZADOS ====================
  campos: router({
    // Listar campos customizados
    list: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getCamposCustomizados(userId);
    }),

    // Criar campo customizado
    create: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string().min(1).max(255),
          tipoCampo: z.enum(["text", "number", "select", "date"]),
          opcoes: z.string().optional(), // JSON array
          ordem: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const id = await db.createCampoCustomizado({
          userId,
          nomeCampo: input.nomeCampo,
          tipoCampo: input.tipoCampo,
          opcoes: input.opcoes || null,
          ativo: true,
          ordem: input.ordem,
        });
        return { id };
      }),

    // Atualizar campo customizado
    update: publicProcedure
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
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        await db.updateCampoCustomizado(id, userId, data);
        return { success: true };
      }),

    // Deletar campo customizado
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.deleteCampoCustomizado(input.id, userId);
        return { success: true };
      }),
  }),

  // ==================== CAMPOS PADRÃO ====================
  camposPadrao: router({
    // Listar configuração de campos padrão
    list: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return db.getCamposPadrao(userId);
    }),

    // Atualizar visibilidade de campo padrão
    updateVisibilidade: publicProcedure
      .input(
        z.object({
          nomeCampo: z.string(),
          visivel: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await db.upsertCampoPadrao({
          userId,
          nomeCampo: input.nomeCampo,
          visivel: input.visivel,
          ordem: 0,
        });
        return { success: true };
      }),
  }),

  // ==================== IMPORTAÇÃO ====================
  importacao: router({
    // Importar atletas de CSV
    importarCSV: publicProcedure
      .input(
        z.object({
          dados: z.string(), // CSV content
          modoAtualizacao: z.enum(["substituir", "mesclar"]).default("mesclar"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        
        // Parse CSV
        const linhas = input.dados.split("\n").filter(l => l.trim());
        if (linhas.length < 2) {
          throw new Error("CSV deve ter pelo menos 2 linhas (cabeçalho + dados)");
        }

        const cabecalho = linhas[0].split(",").map(h => h.trim());
        const atletas = [];

        for (let i = 1; i < linhas.length; i++) {
          const valores = linhas[i].split(",").map(v => v.trim());
          const atleta: any = {};
          
          cabecalho.forEach((col, idx) => {
            atleta[col] = valores[idx] || null;
          });

          atletas.push(atleta);
        }

        // Importar atletas
        let importados = 0;
        for (const atleta of atletas) {
          try {
            await db.createAtleta({
              userId,
              nome: atleta.nome || "Sem nome",
              posicao: atleta.posicao || null,
              segundaPosicao: atleta.segundaPosicao || null,
              clube: atleta.clube || null,
              naturalidade: atleta.naturalidade || null,
              dataNascimento: atleta.dataNascimento ? new Date(atleta.dataNascimento) : null,
              idade: atleta.idade ? parseInt(atleta.idade) : null,
              altura: atleta.altura?.toString() || null,
              pe: atleta.pe || null,
              link: atleta.link || null,
              escala: atleta.escala || null,
              camposCustomizados: atleta.camposCustomizados || null,
            } as any);
            importados++;
          } catch (error) {
            console.error(`Erro ao importar atleta ${atleta.nome}:`, error);
          }
        }

        return {
          success: true,
          message: `${importados} atletas importados com sucesso`,
          importados,
        };
      }),
  }),

  // ==================== UTILITÁRIOS ====================
  // ==================== MIDIAS ====================
  midias: router({
    // Upload de foto
    uploadFoto: publicProcedure
      .input(z.object({
        atletaId: z.number(),
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.uploadFoto(input.atletaId, userId, input.fileName, input.mimeType, input.base64Data);
      }),
    // Listar midias de um atleta
    getByAtleta: publicProcedure
      .input(z.object({ atletaId: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getMidiasDoAtleta(input.atletaId, userId);
      }),
    // Deletar midia
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.deleteMidia(input.id, userId);
      }),
    // Buscar midia por ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return db.getMidiaById(input.id, userId);
      }),
  }),

  utils: router({
    // Corrigir alturas (converter de cm para m se necessário)
    corrigirAlturas: publicProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user?.id || 1;
      
      try {
        const atletas = await db.getAtletas(userId);
        
        let corrigidos = 0;
        for (const atleta of atletas) {
          // Se altura > 10, significa que está em centímetros (ex: 168.00)
          if (atleta.altura && Number(atleta.altura) > 10) {
            const novaAltura = Math.round((Number(atleta.altura) / 100) * 100) / 100; // Dividir por 100 e arredondar para 2 casas
            await db.updateAtleta(atleta.id, userId, { altura: novaAltura.toString() } as any);
            corrigidos++;
          }
        }
        
        return {
          success: true,
          message: `${corrigidos} atletas corrigidos com sucesso`,
          corrigidos,
        };
      } catch (error) {
        console.error("Erro ao corrigir altura:", error);
        return {
          success: false,
          message: "Erro ao corrigir alturas",
          corrigidos: 0,
        };
      }
    }),
  }),

  // ==================== MONITORAMENTO (JOGOS) ====================
  monitoramento: router({
    // Listar todos os jogos do usuário
    listJogos: publicProcedure.query(({ ctx }) => {
      const userId = ctx.user?.id || 1;
      return dbJogos.getJogos(userId);
    }),

    // Buscar jogo por ID
    getJogo: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        return dbJogos.getJogoById(input.id, userId);
      }),

    // Listar jogos por período
    getJogosPorPeriodo: publicProcedure
      .input(
        z.object({
          dataInicio: z.string(), // ISO date string
          dataFim: z.string(), // ISO date string
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const dataInicio = new Date(input.dataInicio);
        const dataFim = new Date(input.dataFim);
        return dbJogos.getJogosPorPeriodo(userId, dataInicio, dataFim);
      }),

    // Criar novo jogo
    createJogo: publicProcedure
      .input(
        z.object({
          mandante: z.string().max(255),
          visitante: z.string().max(255),
          competicao: z.string().max(255).optional(),
          data: z.string(), // ISO date string
          horario: z.string().max(10).optional(),
          local: z.string().max(255).optional(),
          arbitro: z.string().max(255).optional(),
          assistente1: z.string().max(255).optional(),
          assistente2: z.string().max(255).optional(),
          renda: z.string().max(100).optional(),
          publico: z.string().max(100).optional(),
          gols: z.string().optional(),
          placarMandante: z.number().optional(),
          placarVisitante: z.number().optional(),
          visualizadoNoEstadio: z.boolean().default(false),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const jogoId = await dbJogos.createJogo({
          userId,
          mandante: input.mandante,
          visitante: input.visitante,
          competicao: input.competicao || null,
          data: new Date(input.data),
          horario: input.horario || null,
          local: input.local || null,
          arbitro: input.arbitro || null,
          assistente1: input.assistente1 || null,
          assistente2: input.assistente2 || null,
          renda: input.renda || null,
          publico: input.publico || null,
          gols: input.gols || null,
          placarMandante: input.placarMandante || null,
          placarVisitante: input.placarVisitante || null,
          visualizadoNoEstadio: input.visualizadoNoEstadio,
          observacoes: input.observacoes || null,
        });
        return { id: jogoId };
      }),

    // Atualizar jogo
    updateJogo: publicProcedure
      .input(
        z.object({
          id: z.number(),
          mandante: z.string().max(255).optional(),
          visitante: z.string().max(255).optional(),
          competicao: z.string().max(255).optional(),
          data: z.string().optional(),
          horario: z.string().max(10).optional(),
          local: z.string().max(255).optional(),
          arbitro: z.string().max(255).optional(),
          assistente1: z.string().max(255).optional(),
          assistente2: z.string().max(255).optional(),
          renda: z.string().max(100).optional(),
          publico: z.string().max(100).optional(),
          gols: z.string().optional(),
          placarMandante: z.number().optional(),
          placarVisitante: z.number().optional(),
          visualizadoNoEstadio: z.boolean().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const { id, ...data } = input;
        const updateData: any = {};
        if (data.mandante !== undefined) updateData.mandante = data.mandante;
        if (data.visitante !== undefined) updateData.visitante = data.visitante;
        if (data.competicao !== undefined) updateData.competicao = data.competicao;
        if (data.data !== undefined) updateData.data = new Date(data.data);
        if (data.horario !== undefined) updateData.horario = data.horario;
        if (data.local !== undefined) updateData.local = data.local;
        if (data.arbitro !== undefined) updateData.arbitro = data.arbitro;
        if (data.assistente1 !== undefined) updateData.assistente1 = data.assistente1;
        if (data.assistente2 !== undefined) updateData.assistente2 = data.assistente2;
        if (data.renda !== undefined) updateData.renda = data.renda;
        if (data.publico !== undefined) updateData.publico = data.publico;
        if (data.gols !== undefined) updateData.gols = data.gols;
        if (data.placarMandante !== undefined) updateData.placarMandante = data.placarMandante;
        if (data.placarVisitante !== undefined) updateData.placarVisitante = data.placarVisitante;
        if (data.visualizadoNoEstadio !== undefined) updateData.visualizadoNoEstadio = data.visualizadoNoEstadio;
        if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
        await dbJogos.updateJogo(id, userId, updateData);
        return { success: true };
      }),

    // Deletar jogo
    deleteJogo: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        await dbJogos.deleteJogo(input.id, userId);
        return { success: true };
      }),

    // Obter estatísticas de um período
    getEstatisticasPeriodo: publicProcedure
      .input(
        z.object({
          dataInicio: z.string(),
          dataFim: z.string(),
        })
      )
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id || 1;
        const dataInicio = new Date(input.dataInicio);
        const dataFim = new Date(input.dataFim);
        return dbJogos.getEstatisticasPeriodo(userId, dataInicio, dataFim);
      }),
  }),

  // ==================== ESTATISTICAS ====================
  estatisticas: router({
    // Buscar estatisticas por IDs de atletas
    getByAtletaIds: publicProcedure
      .input(z.object({ atletaIds: z.array(z.number()) }))
      .query(async ({ ctx, input }) => {
        // Retorna array vazio se nenhum ID fornecido
        if (!input.atletaIds || input.atletaIds.length === 0) return [];
        // Aqui você pode implementar a lógica para buscar estatísticas
        // Por enquanto, retorna array vazio
        return [];
      }),
  }),

  // ==================== RELATORIOS ====================
  relatorios: router({
    // Gerar PDF com dados de atletas
    gerarPDF: publicProcedure
      .input(z.object({ atletaIds: z.array(z.number()) }))
      .mutation(async ({ ctx, input }) => {
        // Aqui você pode implementar a lógica para gerar PDF
        // Por enquanto, retorna um objeto vazio
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
