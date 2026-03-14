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
