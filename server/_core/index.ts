import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerAuthRoutes } from "../auth-routes";
import { registerPdfRoutes } from "../pdf-report";
import { registerPdfExecutivoRoutes } from "../pdf-report-executivo";
import { registerExcelRoutes } from "../excel-report";
import { registerPdfJogoRoutes } from "../pdf-report-jogo";
import { registerOgolRoutes } from "../ogol-scraper";
import { appRouter } from "../routers";
import { createContext } from "./context";
import * as db from "../db";
import { storagePut } from "../storage";

// Normaliza string removendo acentos, espaços extras e convertendo para minúsculas
function normalizeStr(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Verifica se dois nomes de clube são equivalentes (ignora acentos, capitalização e espaços)
function clubeMatch(clube: string | null | undefined, alvo: string): boolean {
  if (!clube || clube.trim() === "") return false; // clube vazio nunca bate
  const nc = normalizeStr(clube);
  const na = normalizeStr(alvo);
  if (!nc || !na) return false;
  return nc.includes(na) || na.includes(nc);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Servir arquivos estáticos (imagens, ícones, etc)
  app.use("/assets", express.static(path.join(__dirname, "../../assets")));
  app.use("/public", express.static(path.join(__dirname, "../../public")));
  app.use("/images", express.static(path.join(__dirname, "../../assets/images")));
  app.use("/icons", express.static(path.join(__dirname, "../../assets/images")));
  app.use("/logo", express.static(path.join(__dirname, "../../assets/images")));

  // Registrar rotas de autenticação e relatórios
  registerOAuthRoutes(app);
  registerAuthRoutes(app);
  registerPdfRoutes(app);
  registerPdfExecutivoRoutes(app);
  registerExcelRoutes(app);
  registerOgolRoutes(app);
  registerPdfJogoRoutes(app);

  // Endpoint para servir imagens do assets
  app.get("/img/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "../../assets/images", filename);
    res.sendFile(filepath);
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Endpoint para servir imagens (fallback)
  app.get("/api/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, "../../assets/images", filename);
    res.sendFile(filepath, (err) => {
      if (err) {
        res.status(404).json({ error: "Imagem não encontrada" });
      }
    });
  });

  // Endpoint para listar atletas
  app.get("/api/atletas", async (req, res) => {
    try {
      const userId = 1;
      
      const atletas = await db.getAtletas(userId);
      const total = atletas.length;
      
      // Converter URLs S3 em URLs completas
      const atletasComUrls = atletas.map((atleta: any) => {
        if (atleta.midias && Array.isArray(atleta.midias)) {
          atleta.midias = atleta.midias.map((midia: any) => ({
            ...midia,
            url: midia.s3Key ? `https://manus-storage.s3.amazonaws.com/${midia.s3Key}` : midia.url,
          }));
        }
        return atleta;
      });
      
      res.json({
        data: atletasComUrls,
        total
      });
    } catch (error: any) {
      console.error("[API] Erro ao listar atletas:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para obter atleta por ID
  app.get("/api/atletas/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1; // Usar userId fixo para testes
      
      console.log("[API] Obtendo atleta:", id);
      
      const atleta = await db.getAtletaById(id, userId);
      
      if (!atleta) {
        return res.status(404).json({ error: "Atleta nao encontrado" });
      }
      
      // Converter URLs S3 em URLs completas
      if (atleta.midias && Array.isArray(atleta.midias)) {
        atleta.midias = atleta.midias.map((midia: any) => ({
          ...midia,
          url: midia.s3Key ? `https://manus-storage.s3.amazonaws.com/${midia.s3Key}` : midia.url,
        }));
      }
      
      res.json(atleta);
    } catch (error: any) {
      console.error("[API] Erro ao obter atleta:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint direto para atualizar atleta (bypass do tRPC batch)
  app.post("/api/atletas/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1; // Usar userId fixo para testes
      const data = req.body;
      
      console.log("[API] Atualizando atleta:", id);
      console.log("[API] Dados:", data);
      
      // Converter altura para string se fornecida
      const updateData: any = { ...data };
      if (data.altura !== undefined) {
        updateData.altura = data.altura.toString();
      }
      
      await db.updateAtleta(id, userId, updateData);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Erro ao atualizar atleta:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para deletar atleta
  app.delete("/api/atletas/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      console.log("[API] Deletando atleta:", id);
      await db.deleteAtleta(id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Erro ao deletar atleta:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para upload de foto
  app.post("/api/atletas/:id/foto", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      const { fileName, mimeType, base64Data } = req.body;
      
      console.log("[API] Fazendo upload de foto para atleta:", id);
      
      if (!fileName || !mimeType || !base64Data) {
        return res.status(400).json({ error: "Dados de foto inválidos" });
      }
      
      // Converter base64 para buffer
      console.log("[API] Convertendo base64 para buffer");
      const buffer = Buffer.from(base64Data, 'base64');
      console.log("[API] Buffer criado com tamanho:", buffer.length);
      
      // Gerar s3Key
      const s3Key = `fotos/${id}/${Date.now()}-${fileName}`;
      console.log("[API] S3Key gerado:", s3Key);
      
      // Fazer upload para S3
      console.log("[API] Iniciando upload para S3...");
      await storagePut(s3Key, buffer, mimeType);
      console.log("[API] Upload para S3 concluído com sucesso");
      
      // Salvar referência no banco de dados
      console.log("[API] Preparando payload para salvar no banco de dados");
      const fotoPayload = {
        userId: userId,
        atletaId: id,
        tipo: 'foto' as const,
        nome: fileName,
        url: s3Key,
        s3Key: s3Key,
        mimeType: mimeType,
        tamanho: buffer.length,
        descricao: 'Foto do atleta',
      };
      console.log("[API] Payload:", fotoPayload);
      
      console.log("[API] Salvando no banco de dados...");
      await db.createMidia(fotoPayload as any);
      console.log("[API] Foto salva no banco de dados com sucesso");
      
      res.json({ success: true, s3Key });
    } catch (error: any) {
      console.error("[API] Erro ao fazer upload de foto:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para deletar foto
  app.delete("/api/atletas/:id/foto/:fotoId", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const fotoId = Number(req.params.fotoId);
      const userId = 1;
      
      console.log("[API] Deletando foto:", fotoId, "do atleta:", id);
      
      // Deletar do banco de dados
      await db.deleteMidia(fotoId, userId);
      console.log("[API] Foto deletada do banco de dados:", fotoId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Erro ao deletar foto:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para buscar atletas por nome (mantido para compatibilidade futura)
  app.get("/api/atletas/search/:query", async (req, res) => {
    try {
      const userId = 1;
      const query = req.params.query as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;
      
      console.log("[API] Buscando atletas com query:", query);
      
      const atletas = await db.getAtletas(userId);
      
      // Filtrar por nome (case-insensitive)
      const filtered = atletas.filter((atleta: any) => 
        atleta.nome && atleta.nome.toLowerCase().includes(query.toLowerCase())
      );
      
      const total = filtered.length;
      const paginatedAtletas = filtered.slice(skip, skip + limit);
      
      // Converter URLs S3 em URLs completas
      const atletasComUrls = paginatedAtletas.map((atleta: any) => {
        if (atleta.midias && Array.isArray(atleta.midias)) {
          atleta.midias = atleta.midias.map((midia: any) => ({
            ...midia,
            url: midia.s3Key ? `https://manus-storage.s3.amazonaws.com/${midia.s3Key}` : midia.url,
          }));
        }
        return atleta;
      });
      
      res.json({
        data: atletasComUrls,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      });
    } catch (error: any) {
      console.error("[API] Erro ao buscar atletas:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para upload de vídeo
  app.post("/api/atletas/:id/video", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      const { url, nome, descricao } = req.body;
      
      console.log("[API] Salvando vídeo para atleta:", id);
      
      if (!url) {
        return res.status(400).json({ error: "URL do vídeo é obrigatória" });
      }
      
      // Salvar vídeo no banco de dados
      const s3Key = `videos/${id}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
      const videoPayload = {
        userId: userId,
        atletaId: id,
        tipo: 'video' as const,
        nome: nome || `Vídeo - ${new Date().toLocaleString()}`,
        url: url.trim(),
        s3Key: s3Key,
        mimeType: 'video/youtube',
        tamanho: 0,
        descricao: descricao || 'Vídeo do YouTube',
      };
      
      const result = await db.createMidia(videoPayload as any);
      
      res.json({ success: true, result });
    } catch (error: any) {
      console.error("[API] Erro ao salvar vídeo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para deletar vídeo
  app.delete("/api/atletas/:id/video/:videoId", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const videoId = Number(req.params.videoId);
      const userId = 1;
      
      console.log("[API] Deletando vídeo:", videoId, "do atleta:", id);
      
      await db.deleteMidia(videoId, userId);
      console.log("[API] Vídeo deletado do banco de dados:", videoId);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[API] Erro ao deletar vídeo:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ESTATÍSTICAS DE TEMPORADA ====================

  // Buscar estatísticas de um atleta
  app.get("/api/atletas/:id/estatisticas", async (req, res) => {
    try {
      const atletaId = Number(req.params.id);
      const userId = 1;
      const temporada = (req.query.temporada as string) || "2025";
      const { getDb } = await import("../../server/db");
      const { estatisticasTemporada } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.json(null);
      const result = await dbConn.select().from(estatisticasTemporada)
        .where(and(eq(estatisticasTemporada.atletaId, atletaId), eq(estatisticasTemporada.userId, userId), eq(estatisticasTemporada.temporada, temporada)))
        .limit(1);
      res.json(result[0] || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar/atualizar estatísticas de um atleta
  app.post("/api/atletas/:id/estatisticas", async (req, res) => {
    try {
      const atletaId = Number(req.params.id);
      const userId = 1;
      const dados = req.body;
      const temporada = dados.temporada || "2025";
      const { getDb } = await import("../../server/db");
      const { estatisticasTemporada } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });
      const existing = await dbConn.select().from(estatisticasTemporada)
        .where(and(eq(estatisticasTemporada.atletaId, atletaId), eq(estatisticasTemporada.userId, userId), eq(estatisticasTemporada.temporada, temporada)))
        .limit(1);
      // Remover campos internos que não devem ser enviados ao banco
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, atletaId: _aId, userId: _uId, ...dadosLimpos } = dados;
      const payload = { atletaId, userId, temporada, ...dadosLimpos };
      if (existing[0]) {
        await dbConn.update(estatisticasTemporada).set(payload)
          .where(and(eq(estatisticasTemporada.atletaId, atletaId), eq(estatisticasTemporada.userId, userId), eq(estatisticasTemporada.temporada, temporada)));
        res.json({ success: true, action: "updated" });
      } else {
        await dbConn.insert(estatisticasTemporada).values(payload);
        res.json({ success: true, action: "created" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar elenco completo do Marcílio Dias com estatísticas
  app.get("/api/marcilio/elenco", async (req, res) => {
    try {
      const userId = 1;
      const temporada = (req.query.temporada as string) || "2025";
      const { getDb } = await import("../../server/db");
      const { atletas: atletasTable, estatisticasTemporada, midias: midiasTable } = await import("../../drizzle/schema");
      const { eq, and, like, inArray, desc } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.json([]);
      // Buscar todos os atletas e filtrar por normalização (ignora acentos e capitalização)
      const todosAtletas = await dbConn.select().from(atletasTable)
        .where(eq(atletasTable.userId, userId));
      const atletasMarcilio = todosAtletas.filter((a: any) =>
        clubeMatch(a.clube || "", "Marcilio Dias")
      );
      if (!atletasMarcilio.length) return res.json([]);
      const ids = atletasMarcilio.map((a: any) => a.id);
      const fotos = await dbConn.select().from(midiasTable)
        .where(and(inArray(midiasTable.atletaId, ids), eq(midiasTable.tipo, "foto")))
        .orderBy(desc(midiasTable.createdAt));
      const fotoMap = new Map();
      fotos.forEach((f: any) => { if (!fotoMap.has(f.atletaId)) fotoMap.set(f.atletaId, f.url); });
      const stats = await dbConn.select().from(estatisticasTemporada)
        .where(and(inArray(estatisticasTemporada.atletaId, ids), eq(estatisticasTemporada.temporada, temporada)));
      const statsMap = new Map();
      stats.forEach((s: any) => statsMap.set(s.atletaId, s));
      const resultado = atletasMarcilio.map((a: any) => ({
        ...a,
        fotoUrl: fotoMap.get(a.id) || null,
        estatisticas: statsMap.get(a.id) || null,
      }));
      res.json(resultado);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Benchmark de mercado por posição
  app.get("/api/benchmark/:posicao", async (req, res) => {
    try {
      const userId = 1;
      const posicao = decodeURIComponent(req.params.posicao);
      const { getDb } = await import("../../server/db");
      const { atletas: atletasTable, estatisticasTemporada } = await import("../../drizzle/schema");
      const { eq, and, or, inArray } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.json(null);
      const atletasPosicao = await dbConn.select().from(atletasTable)
        .where(and(eq(atletasTable.userId, userId), or(eq(atletasTable.posicao, posicao), eq(atletasTable.segundaPosicao, posicao))!));
      if (!atletasPosicao.length) return res.json(null);
      const ids = atletasPosicao.map((a: any) => a.id);
      const idades = atletasPosicao.map((a: any) => a.idade).filter(Boolean) as number[];
      const alturas = atletasPosicao.map((a: any) => parseFloat(a.altura || "0")).filter(Boolean);
      const stats = await dbConn.select().from(estatisticasTemporada).where(inArray(estatisticasTemporada.atletaId, ids));
      const mediaIdade = idades.length ? Math.round(idades.reduce((a, b) => a + b, 0) / idades.length) : null;
      const mediaAltura = alturas.length ? (alturas.reduce((a, b) => a + b, 0) / alturas.length).toFixed(2) : null;
      const mediaGols = stats.length ? (stats.reduce((a: number, s: any) => a + (s.gols || 0), 0) / stats.length).toFixed(1) : "0";
      const mediaAssistencias = stats.length ? (stats.reduce((a: number, s: any) => a + (s.assistencias || 0), 0) / stats.length).toFixed(1) : "0";
      const mediaMinutos = stats.length ? Math.round(stats.reduce((a: number, s: any) => a + (s.minutosJogados || 0), 0) / stats.length) : 0;
      res.json({ posicao, total: atletasPosicao.length, mediaIdade, mediaAltura, mediaGols, mediaAssistencias, mediaMinutos });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== JOGOS / SCOUT POR JOGO ====================

  // Listar jogos
  app.get("/api/jogos", async (req, res) => {
    try {
      const userId = 1;
      const { getDb } = await import("../../server/db");
      const { jogos } = await import("../../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.json([]);
      const result = await dbConn.select().from(jogos)
        .where(eq(jogos.userId, userId))
        .orderBy(desc(jogos.data));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Criar jogo
  app.post("/api/jogos", async (req, res) => {
    try {
      const userId = 1;
      const dados = req.body;
      // Remover campos que não existem na tabela
      const { id: _id, createdAt: _c, updatedAt: _u, userId: _uid, dataExibicao: _de, ...dadosLimpos } = dados;
      // Converter strings vazias para null em campos numéricos
      if (dadosLimpos.publico === "" || dadosLimpos.publico === undefined) dadosLimpos.publico = null;
      if (dadosLimpos.placarMandante === "" || dadosLimpos.placarMandante === undefined) dadosLimpos.placarMandante = null;
      if (dadosLimpos.placarVisitante === "" || dadosLimpos.placarVisitante === undefined) dadosLimpos.placarVisitante = null;
      const { getDb } = await import("../../server/db");
      const { jogos } = await import("../../drizzle/schema");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });
      const [result] = await dbConn.insert(jogos).values({ ...dadosLimpos, userId });
      res.json({ success: true, id: (result as any).insertId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar jogo por ID
  app.get("/api/jogos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      const { getDb } = await import("../../server/db");
      const { jogos } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });
      const result = await dbConn.select().from(jogos)
        .where(and(eq(jogos.id, id), eq(jogos.userId, userId)))
        .limit(1);
      if (!result[0]) return res.status(404).json({ error: "Jogo n\u00e3o encontrado" });
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Atualizar jogo
  app.put("/api/jogos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      const dados = req.body;
      const { id: _id, createdAt: _c, updatedAt: _u, userId: _uid, dataExibicao: _de, ...dadosLimpos } = dados;
      // Converter strings vazias para null em campos numéricos
      if (dadosLimpos.publico === "" || dadosLimpos.publico === undefined) dadosLimpos.publico = null;
      if (dadosLimpos.placarMandante === "" || dadosLimpos.placarMandante === undefined) dadosLimpos.placarMandante = null;
      if (dadosLimpos.placarVisitante === "" || dadosLimpos.placarVisitante === undefined) dadosLimpos.placarVisitante = null;
      const { getDb } = await import("../../server/db");
      const { jogos } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });
      await dbConn.update(jogos).set(dadosLimpos)
        .where(and(eq(jogos.id, id), eq(jogos.userId, userId)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Deletar jogo
  app.delete("/api/jogos/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = 1;
      const { getDb } = await import("../../server/db");
      const { jogos, scoutJogo } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });
      // Remover scouts do jogo primeiro
      await dbConn.delete(scoutJogo).where(eq(scoutJogo.jogoId, id));
      await dbConn.delete(jogos).where(and(eq(jogos.id, id), eq(jogos.userId, userId)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Buscar scouts de um jogo
  app.get("/api/jogos/:id/scouts", async (req, res) => {
    try {
      const jogoId = Number(req.params.id);
      const userId = 1;
      const { getDb } = await import("../../server/db");
      const { scoutJogo } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.json([]);
      const result = await dbConn.select().from(scoutJogo)
        .where(and(eq(scoutJogo.jogoId, jogoId), eq(scoutJogo.userId, userId)));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Salvar scouts de um jogo (upsert em lote) e recalcular estatísticas da temporada
  app.post("/api/jogos/:id/scouts", async (req, res) => {
    try {
      const jogoId = Number(req.params.id);
      const userId = 1;
      const scouts: any[] = req.body.scouts || [];
      const { getDb } = await import("../../server/db");
      const { scoutJogo, estatisticasTemporada } = await import("../../drizzle/schema");
      const { eq, and, inArray } = await import("drizzle-orm");
      const dbConn = await getDb();
      if (!dbConn) return res.status(500).json({ error: "DB unavailable" });

      // Deletar scouts de atletas que foram removidos da relação
      const atletaIdsEnviados = scouts.map((s: any) => s.atletaId);
      const scoutsExistentes = await dbConn.select({ atletaId: scoutJogo.atletaId })
        .from(scoutJogo)
        .where(eq(scoutJogo.jogoId, jogoId));
      const atletasParaDeletar = scoutsExistentes
        .map((s: any) => s.atletaId)
        .filter((id: number) => !atletaIdsEnviados.includes(id));
      if (atletasParaDeletar.length > 0) {
        await dbConn.delete(scoutJogo)
          .where(and(eq(scoutJogo.jogoId, jogoId), inArray(scoutJogo.atletaId, atletasParaDeletar)));
      }

      // Upsert scouts
      for (const scout of scouts) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...dadosLimpos } = scout;
        // Converter strings vazias em null para campos de decimal (notas)
        if (dadosLimpos.notaTecnica === "" || dadosLimpos.notaTecnica === null) dadosLimpos.notaTecnica = null;
        if (dadosLimpos.notaFisica === "" || dadosLimpos.notaFisica === null) dadosLimpos.notaFisica = null;
        if (dadosLimpos.notaTatica === "" || dadosLimpos.notaTatica === null) dadosLimpos.notaTatica = null;
        if (dadosLimpos.notaAtitudinal === "" || dadosLimpos.notaAtitudinal === null) dadosLimpos.notaAtitudinal = null;
        if (dadosLimpos.notaPotencial === "" || dadosLimpos.notaPotencial === null) dadosLimpos.notaPotencial = null;
        if (dadosLimpos.observacoes === "") dadosLimpos.observacoes = null;
        const existing = await dbConn.select().from(scoutJogo)
          .where(and(eq(scoutJogo.jogoId, jogoId), eq(scoutJogo.atletaId, scout.atletaId)))
          .limit(1);
        if (existing[0]) {
          await dbConn.update(scoutJogo).set(dadosLimpos)
            .where(and(eq(scoutJogo.jogoId, jogoId), eq(scoutJogo.atletaId, scout.atletaId)));
        } else {
          await dbConn.insert(scoutJogo).values({ ...dadosLimpos, jogoId, userId });
        }
      }

      // Recalcular estatísticas da temporada para cada atleta afetado (incluindo os removidos)
      const atletaIds = [...new Set([...scouts.map((s: any) => s.atletaId), ...atletasParaDeletar])];
      const temporada = "2025";
      for (const atletaId of atletaIds) {
        // Buscar todos os scouts do atleta em todos os jogos
        const todosScouts = await dbConn.select().from(scoutJogo)
          .where(and(eq(scoutJogo.atletaId, atletaId), eq(scoutJogo.userId, userId)));
        // Somar todos os campos numéricos
        const soma: any = {
          minutosJogados: 0, jogos: todosScouts.length, jogosTitular: 0,
          gols: 0, assistencias: 0, finalizacoes: 0,
          passes: 0, passesCompletos: 0, cruzamentos: 0, faltasSofridas: 0, dribles: 0,
          desarmes: 0, interceptacoes: 0, duelos: 0, duelosGanhos: 0,
          jogosAereos: 0, duelosAereosPerdidos: 0, faltasCometidas: 0, bolasRecuperadas: 0,
          cartoesAmarelos: 0, cartoesVermelhos: 0,
        };
        const notas: any = { notaTecnica: [], notaFisica: [], notaTatica: [], notaAtitudinal: [], notaPotencial: [] };
        for (const s of todosScouts) {
          soma.minutosJogados += s.minutosJogados || 0;
          if (s.titular) soma.jogosTitular++;
          soma.gols += s.gols || 0;
          soma.assistencias += s.assistencias || 0;
          soma.finalizacoes += s.finalizacoes || 0;
          soma.passes += s.passes || 0;
          soma.passesCompletos += s.passesCompletos || 0;
          soma.cruzamentos += (s as any).cruzamentos || 0;
          soma.faltasSofridas += (s as any).faltasSofridas || 0;
          soma.dribles += (s as any).dribles || 0;
          soma.desarmes += s.desarmes || 0;
          soma.interceptacoes += s.interceptacoes || 0;
          soma.duelos += s.duelos || 0;
          soma.duelosGanhos += s.duelosGanhos || 0;
          soma.jogosAereos += s.jogosAereos || 0;
          soma.duelosAereosPerdidos += s.duelosAereosPerdidos || 0;
          soma.faltasCometidas += (s as any).faltasCometidas || 0;
          soma.bolasRecuperadas += (s as any).bolasRecuperadas || 0;
          soma.cartoesAmarelos += s.cartoesAmarelos || 0;
          soma.cartoesVermelhos += s.cartoesVermelhos || 0;
          if (s.notaTecnica) notas.notaTecnica.push(parseFloat(s.notaTecnica));
          if (s.notaFisica) notas.notaFisica.push(parseFloat(s.notaFisica));
          if (s.notaTatica) notas.notaTatica.push(parseFloat(s.notaTatica));
          if (s.notaAtitudinal) notas.notaAtitudinal.push(parseFloat(s.notaAtitudinal));
          if (s.notaPotencial) notas.notaPotencial.push(parseFloat(s.notaPotencial));
        }
        // Média das notas
        const mediaNotas: any = {};
        for (const k of Object.keys(notas)) {
          mediaNotas[k] = notas[k].length ? (notas[k].reduce((a: number, b: number) => a + b, 0) / notas[k].length).toFixed(1) : null;
        }
        const payload = { atletaId, userId, temporada, ...soma, ...mediaNotas };
        const existing = await dbConn.select().from(estatisticasTemporada)
          .where(and(eq(estatisticasTemporada.atletaId, atletaId), eq(estatisticasTemporada.userId, userId), eq(estatisticasTemporada.temporada, temporada)))
          .limit(1);
        if (existing[0]) {
          const { id: _id, createdAt: _c, updatedAt: _u, atletaId: _a, userId: _uid, temporada: _t, ...update } = payload;
          await dbConn.update(estatisticasTemporada).set(update)
            .where(and(eq(estatisticasTemporada.atletaId, atletaId), eq(estatisticasTemporada.userId, userId), eq(estatisticasTemporada.temporada, temporada)));
        } else {
          await dbConn.insert(estatisticasTemporada).values(payload);
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rota tRPC
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
