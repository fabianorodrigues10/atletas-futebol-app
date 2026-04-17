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
