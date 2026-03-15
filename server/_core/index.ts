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

  // Middleware para interceptar e converter requisições POST para /api/trpc/:path
  // para o formato batch esperado pelo tRPC
  app.use((req, res, next) => {
    // Se for POST para /api/trpc com um caminho específico
    if (req.method === "POST" && req.path.startsWith("/api/trpc/") && req.body && !Array.isArray(req.body)) {
      // Extrair o caminho (ex: /api/trpc/atletas.update -> atletas.update)
      const path = req.path.replace("/api/trpc/", "");
      
      console.log("[tRPC Middleware] Convertendo POST com caminho");
      console.log("[tRPC Middleware] Caminho:", path);
      
      // Converter para o formato batch do tRPC
      req.body = [
        {
          "0": req.body,
          "1": path,
        },
      ];
      
      // Mudar a URL para /api/trpc
      req.url = "/api/trpc";
      
      console.log("[tRPC Middleware] Convertido para batch");
    }
    next();
  });

  // Middleware para converter POST /api/trpc/procedimento para formato batch
  app.use("/api/trpc", (req, res, next) => {
    if (req.method === "POST" && req.path && req.path !== "/" && req.path !== "") {
      // Extrair o procedimento da URL (ex: /atletas.getById -> atletas.getById)
      const procedimento = req.path.substring(1); // Remove leading slash
      console.log("[tRPC Middleware] Convertendo URL para batch:", procedimento);
      
      // Converter para formato batch do tRPC
      const batchData = [{
        0: req.body,
        1: "query",
        2: procedimento
      }];
      
      req.body = batchData;
      // Reescrever a URL para raiz
      (req as any).url = "/api/trpc/";
    }
    next();
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
