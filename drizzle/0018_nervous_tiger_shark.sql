ALTER TABLE `atletas` ADD `contratoTipo` enum('emprestimo','definitivo');--> statement-breakpoint
ALTER TABLE `atletas` ADD `contratoDataFim` date;--> statement-breakpoint
ALTER TABLE `atletas` ADD `contratoClube` varchar(255);--> statement-breakpoint
ALTER TABLE `atletas` ADD `contratoDataFimEmprestimo` date;--> statement-breakpoint
ALTER TABLE `atletas` ADD `contratoClubePertence` varchar(255);