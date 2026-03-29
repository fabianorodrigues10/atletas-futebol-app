import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerPdfRoutes } from "../pdf-report";
import { registerExcelRoutes } from "../excel-report";
import { registerOgolRoutes } from "../ogol-scraper";
import { appRouter } from "../routers";
import { createContext } from "./context";
import * as db from "../db";
import { storagePut } from "../storage";

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

  registerOAuthRoutes(app);
  registerPdfRoutes(app);
  registerExcelRoutes(app);
  registerOgolRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
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
      const payload = { atletaId, userId, temporada, ...dados };
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
      const atletasMarcilio = await dbConn.select().from(atletasTable)
        .where(and(eq(atletasTable.userId, userId), like(atletasTable.clube, "%arc%lio%")));
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
