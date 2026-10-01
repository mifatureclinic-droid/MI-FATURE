CREATE TABLE `alertasProntuarioPendente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`status` enum('pendente','reconhecido','resolvido') NOT NULL DEFAULT 'pendente',
	`dataAlerta` timestamp NOT NULL DEFAULT (now()),
	`dataReconhecimento` timestamp,
	`horaReconhecimento` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertasProntuarioPendente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `profissionais` ADD `conselhoProfissional` varchar(10) DEFAULT 'CRM';--> statement-breakpoint
ALTER TABLE `profissionais` ADD `numeroConselho` varchar(30);--> statement-breakpoint
ALTER TABLE `profissionais` ADD `codigoCBO` varchar(10);--> statement-breakpoint
ALTER TABLE `profissionais` ADD `uf` varchar(2);