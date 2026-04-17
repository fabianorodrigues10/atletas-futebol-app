import express, { Request, Response } from "express";
import { loginUser, createUser, listUsers, deleteUser, updateUserRole, verifyToken, AuthPayload } from "./auth";

export function registerAuthRoutes(app: express.Application) {
  /**
   * POST /auth/login
   * Fazer login com username e password
   */
  app.post("/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username e password são obrigatórios" });
      }

      const result = await loginUser(username, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || "Erro ao fazer login" });
    }
  });

  /**
   * POST /auth/signup
   * Criar novo usuário
   */
  app.post("/auth/signup", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username e password são obrigatórios" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Senha deve ter no mínimo 6 caracteres" });
      }

      const user = await createUser(username, password, "user");
      res.status(201).json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Erro ao criar usuário" });
    }
  });

  /**
   * GET /auth/users
   * Listar todos os usuários (apenas para admin)
   */
  app.get("/auth/users", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthPayload;

      if (user.role !== "admin") {
        return res.status(403).json({ error: "Apenas admin pode listar usuários" });
      }

      const allUsers = await listUsers();
      res.json(allUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao listar usuários" });
    }
  });

  /**
   * DELETE /auth/users/:id
   * Deletar usuário (apenas para admin)
   */
  app.delete("/auth/users/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthPayload;

      if (user.role !== "admin") {
        return res.status(403).json({ error: "Apenas admin pode deletar usuários" });
      }

      const userId = parseInt(req.params.id);
      await deleteUser(userId);
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao deletar usuário" });
    }
  });

  /**
   * PUT /auth/users/:id/role
   * Atualizar role de usuário (apenas para admin)
   */
  app.put("/auth/users/:id/role", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user as AuthPayload;

      if (user.role !== "admin") {
        return res.status(403).json({ error: "Apenas admin pode atualizar roles" });
      }

      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!role || !["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Role inválido" });
      }

      await updateUserRole(userId, role);
      res.json({ message: "Role atualizado com sucesso" });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Erro ao atualizar role" });
    }
  });

  /**
   * GET /auth/verify
   * Verificar se token é válido
   */
  app.get("/auth/verify", authenticateToken, (req: Request, res: Response) => {
    const user = (req as any).user as AuthPayload;
    res.json(user);
  });
}

/**
 * Middleware para autenticar token JWT
 */
export function authenticateToken(req: Request, res: Response, next: Function) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: "Token inválido ou expirado" });
  }

  (req as any).user = payload;
  next();
}
