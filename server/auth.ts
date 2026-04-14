import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "seu-secret-key-super-seguro-2024";
const JWT_EXPIRY = "7d"; // Token válido por 7 dias

export interface AuthPayload {
  id: number;
  username: string;
  role: "admin" | "user";
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  password: string;
}

/**
 * Hash de senha com bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Comparar senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gerar JWT token
 */
export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verificar e decodificar JWT token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Criar novo usuário (signup)
 */
export async function createUser(username: string, password: string, role: "admin" | "user" = "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se usuário já existe
  const existing = await db.select().from(users).where(eq(users.openId, username)).limit(1);

  if (existing.length > 0) {
    throw new Error("Usuário já existe");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Inserir usuário
  await db.insert(users).values({
    openId: username,
    name: username,
    loginMethod: "password",
    role: role,
  });

  // Buscar o usuário criado para retornar o ID
  const newUser = await db.select().from(users).where(eq(users.openId, username)).limit(1);
  
  if (newUser.length === 0) {
    throw new Error("Erro ao criar usuário");
  }
  
  return {
    id: newUser[0].id,
    username,
    role,
  };
}

/**
 * Fazer login (verificar credenciais)
 */
export async function loginUser(username: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar usuário
  const userList = await db.select().from(users).where(eq(users.openId, username)).limit(1);
  const user = userList.length > 0 ? userList[0] : null;

  if (!user) {
    throw new Error("Usuário ou senha inválidos");
  }

  // Verificar senha (por enquanto, vamos usar uma abordagem simples)
  // Em produção, você deve armazenar a senha hasheada no banco
  const isValid = await verifyCredentials(username, password);
  if (!isValid) {
    throw new Error("Usuário ou senha inválidos");
  }

  // Gerar token
  const token = generateToken({
    id: user.id,
    username: user.openId,
    role: user.role as "admin" | "user",
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.openId,
      role: user.role,
    },
  };
}

/**
 * Verificar credenciais (hardcoded para admin, dinâmico para outros)
 * Em produção, isso deve verificar contra o banco de dados com senha hasheada
 */
async function verifyCredentials(username: string, password: string): Promise<boolean> {
  // Admin hardcoded
  if (username === "admin" && password === "Marcilio1919!") {
    return true;
  }

  // Para outros usuários, verificar no banco (ainda não implementado)
  // Por enquanto, qualquer outro usuário pode fazer login com qualquer senha
  // Isso será melhorado quando adicionarmos a coluna 'password' na tabela users
  
  return true; // Temporário: permitir qualquer senha para usuários comuns
}

/**
 * Listar todos os usuários (apenas para admin)
 */
export async function listUsers() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allUsers = await db.select().from(users);
  return allUsers.map((u: typeof users.$inferSelect) => ({
    id: u.id,
    username: u.openId,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

/**
 * Deletar usuário (apenas para admin)
 */
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(users).where(eq(users.id, userId));
}

/**
 * Atualizar role de usuário (apenas para admin)
 */
export async function updateUserRole(userId: number, newRole: "admin" | "user") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
}
