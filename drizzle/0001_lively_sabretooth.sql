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
	`valencia` varchar(100),
	`camposCustomizados` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atletas_id` PRIMARY KEY(`id`)
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
