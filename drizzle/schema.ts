import {
  boolean,
  date,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Tabela de atletas
export const atletas = mysqlTable("atletas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Campos padrão
  nome: varchar("nome", { length: 255 }).notNull(),
  posicao: varchar("posicao", { length: 100 }),
  segundaPosicao: varchar("segundaPosicao", { length: 100 }),
  clube: varchar("clube", { length: 255 }),
  dataNascimento: date("dataNascimento"),
  idade: int("idade"),
  altura: decimal("altura", { precision: 5, scale: 2 }), // Ex: 180.50 cm
  pe: mysqlEnum("pe", ["direito", "esquerdo", "ambidestro"]),
  link: text("link"),
  escala: varchar("escala", { length: 100 }),
  naturalidade: varchar("naturalidade", { length: 255 }), // Cidade/Estado de nascimento
  // valencia: text("valencia"), // Descrição de valências do atleta - REMOVIDO (não existe no banco remoto)
  
  // Campos customizados (JSON para flexibilidade)
  camposCustomizados: text("camposCustomizados"), // JSON string
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de configuração de campos customizados
export const configuracaoCampos = mysqlTable("configuracaoCampos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Nome do campo customizado
  nomeCampo: varchar("nomeCampo", { length: 255 }).notNull(),
  
  // Tipo do campo (text, number, select, date)
  tipoCampo: mysqlEnum("tipoCampo", ["text", "number", "select", "date"]).notNull(),
  
  // Opções para campos do tipo select (JSON array)
  opcoes: text("opcoes"),
  
  // Se o campo está ativo
  ativo: boolean("ativo").default(true).notNull(),
  
  // Ordem de exibição
  ordem: int("ordem").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de configuração de campos padrão (visibilidade)
export const configuracaoCamposPadrao = mysqlTable("configuracaoCamposPadrao", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Nome do campo padrão
  nomeCampo: varchar("nomeCampo", { length: 100 }).notNull(),
  
  // Se o campo está visível
  visivel: boolean("visivel").default(true).notNull(),
  
  // Ordem de exibição
  ordem: int("ordem").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de avaliações de atletas
export const avaliacoes = mysqlTable("avaliacoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  atletaId: int("atletaId").notNull(),
  
  // Nota de 1-10
  nota: int("nota").notNull(), // 1-10
  
  // Comentários técnicos
  comentarios: text("comentarios"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de grupos/seleções de atletas
export const grupos = mysqlTable("grupos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // Nome do grupo (ex: Titulares, Reservas, Monitorados)
  nome: varchar("nome", { length: 255 }).notNull(),
  
  // Descrição do grupo
  descricao: text("descricao"),
  
  // Cor para identificação visual
  cor: varchar("cor", { length: 7 }).default("#FF6B35"), // Hex color
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de relação muitos-para-muitos: atletas em grupos
export const atletasEmGrupos = mysqlTable("atletasEmGrupos", {
  id: int("id").autoincrement().primaryKey(),
  atletaId: int("atletaId").notNull(),
  grupoId: int("grupoId").notNull(),
  posicaoOrdem: int("posicaoOrdem").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Tabela de mídia (fotos, vídeos, documentos)
export const midias = mysqlTable("midias", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  atletaId: int("atletaId").notNull(),
  
  // Tipo de mídia
  tipo: mysqlEnum("tipo", ["foto", "video", "documento"]).notNull(),
  
  // Nome do arquivo
  nome: varchar("nome", { length: 255 }).notNull(),
  
  // URL da mídia no S3
  url: text("url").notNull(),
  
  // Caminho no S3
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  
  // Tipo MIME
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Tamanho em bytes
  tamanho: int("tamanho"),
  
  // Descrição/anotações
  descricao: text("descricao"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de estatísticas de temporada por atleta
export const estatisticasTemporada = mysqlTable("estatisticasTemporada", {
  id: int("id").autoincrement().primaryKey(),
  atletaId: int("atletaId").notNull(),
  userId: int("userId").notNull(),
  temporada: varchar("temporada", { length: 20 }).notNull().default("2025"),
  minutosJogados: int("minutosJogados").default(0),
  jogos: int("jogos").default(0),
  jogosTitular: int("jogosTitular").default(0),
  gols: int("gols").default(0),
  assistencias: int("assistencias").default(0),
  finalizacoes: int("finalizacoes").default(0),
  desarmes: int("desarmes").default(0),
  interceptacoes: int("interceptacoes").default(0),
  duelos: int("duelos").default(0),
  duelosGanhos: int("duelosGanhos").default(0),
  passes: int("passes").default(0),
  passesCompletos: int("passesCompletos").default(0),
  cruzamentos: int("cruzamentos").default(0),
  faltasSofridas: int("faltasSofridas").default(0),
  dribles: int("dribles").default(0),
  jogosAereos: int("jogosAereos").default(0),
  duelosAereosPerdidos: int("duelosAereosPerdidos").default(0),
  faltasCometidas: int("faltasCometidas").default(0),
  bolasRecuperadas: int("bolasRecuperadas").default(0),
  cartoesAmarelos: int("cartoesAmarelos").default(0),
  cartoesVermelhos: int("cartoesVermelhos").default(0),
  notaTecnica: decimal("notaTecnica", { precision: 3, scale: 1 }),
  notaFisica: decimal("notaFisica", { precision: 3, scale: 1 }),
  notaTatica: decimal("notaTatica", { precision: 3, scale: 1 }),
  notaAtitudinal: decimal("notaAtitudinal", { precision: 3, scale: 1 }),
  notaPotencial: decimal("notaPotencial", { precision: 3, scale: 1 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EstatisticaTemporada = typeof estatisticasTemporada.$inferSelect;
export type InsertEstatisticaTemporada = typeof estatisticasTemporada.$inferInsert;

// Tabela de jogos (scout por jogo)
export const jogos = mysqlTable("jogos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mandante: varchar("mandante", { length: 255 }).notNull().default("Marcílio Dias"),
  visitante: varchar("visitante", { length: 255 }).notNull(),
  competicao: varchar("competicao", { length: 255 }),
  data: date("data"),
  horario: varchar("horario", { length: 10 }), // ex: "16:00"
  local: varchar("local", { length: 255 }),
  arbitro: varchar("arbitro", { length: 255 }),
  assistente1: varchar("assistente1", { length: 255 }),
  assistente2: varchar("assistente2", { length: 255 }),
  renda: varchar("renda", { length: 100 }),
  publico: varchar("publico", { length: 100 }),
  gols: text("gols"), // texto livre: "Davi Torres 23', Alan Costa 67'"
  placarMandante: int("placarMandante"),
  placarVisitante: int("placarVisitante"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Jogo = typeof jogos.$inferSelect;
export type InsertJogo = typeof jogos.$inferInsert;

// Tabela de scout por atleta por jogo
export const scoutJogo = mysqlTable("scoutJogo", {
  id: int("id").autoincrement().primaryKey(),
  jogoId: int("jogoId").notNull(),
  atletaId: int("atletaId").notNull(),
  userId: int("userId").notNull(),
  // Participação
  titular: boolean("titular").default(false),
  minutosJogados: int("minutosJogados").default(0),
  // Ofensivo
  gols: int("gols").default(0),
  assistencias: int("assistencias").default(0),
  finalizacoes: int("finalizacoes").default(0),
  passes: int("passes").default(0),
  passesCompletos: int("passesCompletos").default(0),
  cruzamentos: int("cruzamentos").default(0),
  faltasSofridas: int("faltasSofridas").default(0),
  dribles: int("dribles").default(0),
  // Defensivo
  desarmes: int("desarmes").default(0),
  interceptacoes: int("interceptacoes").default(0),
  duelos: int("duelos").default(0),
  duelosGanhos: int("duelosGanhos").default(0),
  jogosAereos: int("jogosAereos").default(0),
  duelosAereosPerdidos: int("duelosAereosPerdidos").default(0),
  faltasCometidas: int("faltasCometidas").default(0),
  bolasRecuperadas: int("bolasRecuperadas").default(0),
  // Disciplina
  cartoesAmarelos: int("cartoesAmarelos").default(0),
  cartoesVermelhos: int("cartoesVermelhos").default(0),
  // Notas
  notaTecnica: decimal("notaTecnica", { precision: 3, scale: 1 }),
  notaFisica: decimal("notaFisica", { precision: 3, scale: 1 }),
  notaTatica: decimal("notaTatica", { precision: 3, scale: 1 }),
  notaAtitudinal: decimal("notaAtitudinal", { precision: 3, scale: 1 }),
  notaPotencial: decimal("notaPotencial", { precision: 3, scale: 1 }),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScoutJogo = typeof scoutJogo.$inferSelect;
export type InsertScoutJogo = typeof scoutJogo.$inferInsert;

// Tipos TypeScript adicionais
export type Atleta = typeof atletas.$inferSelect;
export type InsertAtleta = typeof atletas.$inferInsert;

export type ConfiguracaoCampo = typeof configuracaoCampos.$inferSelect;
export type InsertConfiguracaoCampo = typeof configuracaoCampos.$inferInsert;

export type ConfiguracaoCampoPadrao = typeof configuracaoCamposPadrao.$inferSelect;
export type InsertConfiguracaoCampoPadrao = typeof configuracaoCamposPadrao.$inferInsert;

export type Avaliacao = typeof avaliacoes.$inferSelect;
export type InsertAvaliacao = typeof avaliacoes.$inferInsert;

export type Grupo = typeof grupos.$inferSelect;
export type InsertGrupo = typeof grupos.$inferInsert;

export type AtletaEmGrupo = typeof atletasEmGrupos.$inferSelect;
export type InsertAtletaEmGrupo = typeof atletasEmGrupos.$inferInsert;

export type Midia = typeof midias.$inferSelect;
export type InsertMidia = typeof midias.$inferInsert;
