import { mysqlTable, mysqlEnum, varchar, int, text, date, json, datetime, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int().primaryKey().autoincrement(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const atletas = mysqlTable("atletas", {
  id: int().primaryKey().autoincrement(),
  userId: int().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  posicao: varchar({ length: 100 }),
  segundaPosicao: varchar({ length: 100 }),
  clube: varchar({ length: 255 }),
  dataNascimento: date(),
  idade: int(),
  altura: varchar({ length: 50 }),
  pe: mysqlEnum("pe", ["direito", "esquerdo", "ambidestro"]),
  link: text(),
  escala: varchar({ length: 100 }),
  
  // Contrato: tipo (emprestimo ou definitivo)
  contratoTipo: mysqlEnum("contratoTipo", ["emprestimo", "definitivo"]),
  // Contrato: data de fim (armazenado como ISO date)
  contratoDataFim: date("contratoDataFim"),
  // Contrato: clube que tem o contrato
  contratoClube: varchar("contratoClube", { length: 255 }),
  // Contrato (apenas para emprestimo): clube que ele pertence
  contratoClubePertence: varchar("contratoClubePertence", { length: 255 }),
  
  naturalidade: varchar("naturalidade", { length: 255 }), // Cidade/Estado de nascimento
  
  // Campos customizados (JSON para flexibilidade)
  camposCustomizados: json("camposCustomizados"),

  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const midias = mysqlTable("midias", {
  id: int().primaryKey().autoincrement(),
  atletaId: int().notNull(),
  tipo: mysqlEnum("tipo", ["foto", "video"]),
  url: text().notNull(),
  base64: text(), // Para armazenar imagens em base64
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const configuracaoCampos = mysqlTable("configuracaoCampos", {
  id: int().primaryKey().autoincrement(),
  userId: int().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  tipo: varchar({ length: 50 }).notNull(),
  ativo: boolean().default(true),
  ordem: int(),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const configuracaoCamposPadrao = mysqlTable("configuracaoCamposPadrao", {
  id: int().primaryKey().autoincrement(),
  userId: int().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  ativo: boolean().default(true),
  ordem: int(),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const grupos = mysqlTable("grupos", {
  id: int().primaryKey().autoincrement(),
  userId: int().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  descricao: text(),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const atletasEmGrupos = mysqlTable("atletasEmGrupos", {
  id: int().primaryKey().autoincrement(),
  atletaId: int().notNull(),
  grupoId: int().notNull(),
  posicaoOrdem: int().default(0),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const jogos = mysqlTable("jogos", {
  id: int().primaryKey().autoincrement(),
  userId: int().notNull(),
  nome: varchar({ length: 255 }).notNull(),
  data: date(),
  adversario: varchar({ length: 255 }),
  resultado: varchar({ length: 50 }),
  placar: varchar({ length: 50 }),
  local: varchar({ length: 255 }),
  observacoes: text(),
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const scoutJogo = mysqlTable("scoutJogo", {
  id: int().primaryKey().autoincrement(),
  jogoId: int().notNull(),
  atletaId: int().notNull(),
  
  // Avaliações
  tecnica: int(),
  fisica: int(),
  tatica: int(),
  
  // Estatísticas de jogo
  passes: int(),
  passesCompletos: int(),
  chutes: int(),
  chutesCertos: int(),
  dribles: int(),
  driblesTocados: int(),
  roubada: int(),
  interceptacoes: int(),
  faltas: int(),
  cartaoAmarelo: boolean().default(false),
  cartaoVermelho: boolean().default(false),
  gols: int(),
  assistencias: int(),
  
  // Observações
  observacoes: text(),
  
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const avaliacoes = mysqlTable("avaliacoes", {
  id: int().primaryKey().autoincrement(),
  atletaId: int().notNull(),
  userId: int().notNull(),
  
  tecnica: int(),
  fisica: int(),
  tatica: int(),
  
  observacoes: text(),
  
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

export const estatisticasTemporada = mysqlTable("estatisticasTemporada", {
  id: int().primaryKey().autoincrement(),
  atletaId: int().notNull(),
  
  // Estatísticas gerais
  jogosJogados: int(),
  minutosTotais: int(),
  
  // Ofensivas
  gols: int(),
  assistencias: int(),
  chutes: int(),
  chutesCertos: int(),
  
  // Defensivas
  roubadas: int(),
  interceptacoes: int(),
  faltas: int(),
  
  // Cartões
  cartaoAmarelo: int(),
  cartaoVermelho: int(),
  
  // Passes
  passes: int(),
  passesCompletos: int(),
  
  // Dribles
  dribles: int(),
  driblesTocados: int(),
  
  createdAt: datetime().defaultNow(),
  updatedAt: datetime().defaultNow().onUpdateNow(),
});

// Relations
export const atletasRelations = relations(atletas, ({ many }) => ({
  midias: many(midias),
  grupos: many(atletasEmGrupos),
  avaliacoes: many(avaliacoes),
  estatisticas: many(estatisticasTemporada),
}));

export const midiasRelations = relations(midias, ({ one }) => ({
  atleta: one(atletas, {
    fields: [midias.atletaId],
    references: [atletas.id],
  }),
}));

export const atletasEmGruposRelations = relations(atletasEmGrupos, ({ one }) => ({
  atleta: one(atletas, {
    fields: [atletasEmGrupos.atletaId],
    references: [atletas.id],
  }),
  grupo: one(grupos, {
    fields: [atletasEmGrupos.grupoId],
    references: [grupos.id],
  }),
}));

export const gruposRelations = relations(grupos, ({ many }) => ({
  atletas: many(atletasEmGrupos),
}));

export const jogosRelations = relations(jogos, ({ many }) => ({
  scout: many(scoutJogo),
}));

export const scoutJogoRelations = relations(scoutJogo, ({ one }) => ({
  jogo: one(jogos, {
    fields: [scoutJogo.jogoId],
    references: [jogos.id],
  }),
  atleta: one(atletas, {
    fields: [scoutJogo.atletaId],
    references: [atletas.id],
  }),
}));

export const avaliacoesRelations = relations(avaliacoes, ({ one }) => ({
  atleta: one(atletas, {
    fields: [avaliacoes.atletaId],
    references: [atletas.id],
  }),
}));

export const estatisticasTemporadaRelations = relations(estatisticasTemporada, ({ one }) => ({
  atleta: one(atletas, {
    fields: [estatisticasTemporada.atletaId],
    references: [atletas.id],
  }),
}));
