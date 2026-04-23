CREATE TABLE `atletasEmGrupos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atletaId` int NOT NULL,
	`grupoId` int NOT NULL,
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
