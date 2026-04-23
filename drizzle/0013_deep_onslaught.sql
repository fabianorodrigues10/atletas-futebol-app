CREATE TABLE `atletas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`posicao` varchar(100),
	`segundaPosicao` varchar(100),
	`clube` varchar(255),
	`dataNascimento` date,
	`idade` int,
	`altura` decimal(5,2),
	`pe` enum('direito','esquerdo','ambidestro'),
	`link` text,
	`escala` varchar(100),
	`valencia` text,
	`naturalidade` varchar(255),
	`camposCustomizados` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atletas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `atletasEmGrupos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atletaId` int NOT NULL,
	`grupoId` int NOT NULL,
	`posicaoOrdem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `atletasEmGrupos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `avaliacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`atletaId` int NOT NULL,
	`nota` int NOT NULL,
	`comentarios` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `avaliacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configuracaoCampos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nomeCampo` varchar(255) NOT NULL,
	`tipoCampo` enum('text','number','select','date') NOT NULL,
	`opcoes` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`ordem` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracaoCampos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configuracaoCamposPadrao` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nomeCampo` varchar(100) NOT NULL,
	`visivel` boolean NOT NULL DEFAULT true,
	`ordem` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracaoCamposPadrao_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estatisticasTemporada` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atletaId` int NOT NULL,
	`userId` int NOT NULL,
	`temporada` varchar(20) NOT NULL DEFAULT '2025',
	`minutosJogados` int DEFAULT 0,
	`jogos` int DEFAULT 0,
	`jogosTitular` int DEFAULT 0,
	`gols` int DEFAULT 0,
	`assistencias` int DEFAULT 0,
	`finalizacoes` int DEFAULT 0,
	`desarmes` int DEFAULT 0,
	`interceptacoes` int DEFAULT 0,
	`duelos` int DEFAULT 0,
	`duelosGanhos` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passesCompletos` int DEFAULT 0,
	`cruzamentos` int DEFAULT 0,
	`faltasSofridas` int DEFAULT 0,
	`dribles` int DEFAULT 0,
	`jogosAereos` int DEFAULT 0,
	`duelosAereosPerdidos` int DEFAULT 0,
	`faltasCometidas` int DEFAULT 0,
	`bolasRecuperadas` int DEFAULT 0,
	`cartoesAmarelos` int DEFAULT 0,
	`cartoesVermelhos` int DEFAULT 0,
	`notaTecnica` decimal(3,1),
	`notaFisica` decimal(3,1),
	`notaTatica` decimal(3,1),
	`notaAtitudinal` decimal(3,1),
	`notaPotencial` decimal(3,1),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `estatisticasTemporada_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grupos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`cor` varchar(7) DEFAULT '#FF6B35',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grupos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jogos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mandante` varchar(255) NOT NULL DEFAULT 'Marcílio Dias',
	`visitante` varchar(255) NOT NULL,
	`competicao` varchar(255),
	`data` date,
	`horario` varchar(10),
	`local` varchar(255),
	`arbitro` varchar(255),
	`assistente1` varchar(255),
	`assistente2` varchar(255),
	`renda` varchar(100),
	`publico` int,
	`gols` text,
	`placarMandante` int,
	`placarVisitante` int,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jogos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `midias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`atletaId` int NOT NULL,
	`tipo` enum('foto','video','documento') NOT NULL,
	`nome` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`s3Key` varchar(500) NOT NULL,
	`mimeType` varchar(100),
	`tamanho` int,
	`descricao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `midias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoutJogo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jogoId` int NOT NULL,
	`atletaId` int NOT NULL,
	`userId` int NOT NULL,
	`titular` boolean DEFAULT false,
	`minutosJogados` int DEFAULT 0,
	`gols` int DEFAULT 0,
	`assistencias` int DEFAULT 0,
	`finalizacoes` int DEFAULT 0,
	`passes` int DEFAULT 0,
	`passesCompletos` int DEFAULT 0,
	`cruzamentos` int DEFAULT 0,
	`faltasSofridas` int DEFAULT 0,
	`dribles` int DEFAULT 0,
	`desarmes` int DEFAULT 0,
	`interceptacoes` int DEFAULT 0,
	`duelos` int DEFAULT 0,
	`duelosGanhos` int DEFAULT 0,
	`jogosAereos` int DEFAULT 0,
	`duelosAereosPerdidos` int DEFAULT 0,
	`faltasCometidas` int DEFAULT 0,
	`bolasRecuperadas` int DEFAULT 0,
	`cartoesAmarelos` int DEFAULT 0,
	`cartoesVermelhos` int DEFAULT 0,
	`notaTecnica` decimal(3,1),
	`notaFisica` decimal(3,1),
	`notaTatica` decimal(3,1),
	`notaAtitudinal` decimal(3,1),
	`notaPotencial` decimal(3,1),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scoutJogo_id` PRIMARY KEY(`id`)
);
