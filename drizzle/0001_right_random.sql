CREATE TABLE `liberacoesProntuario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`masterId` int NOT NULL,
	`motivo` text NOT NULL,
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liberacoesProntuario_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `dataLimiteProntuario` timestamp;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `liberadoPorMaster` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `motLiberacao` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `pedidoMedicoUrl` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `dataVencimentoPedido` date;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `alertaVencimentoEnviado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prontuarios` ADD `statusAtraso` enum('noTempo','atrasado','liberado') DEFAULT 'noTempo' NOT NULL;