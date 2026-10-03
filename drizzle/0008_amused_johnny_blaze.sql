CREATE TABLE `assinaturasGuias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`pacienteId` int NOT NULL,
	`assinaturaPacienteUrl` text,
	`dataAssinatura` timestamp NOT NULL DEFAULT (now()),
	`hashAssinatura` varchar(255),
	`sessaoNumero` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assinaturasGuias_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contratosTerapêuticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`conteudo` text NOT NULL,
	`assinado` tinyint DEFAULT 0,
	`dataAssinatura` timestamp,
	`assinaturaPacienteUrl` text,
	`hashAssinatura` varchar(255),
	`ativo` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratosTerapêuticos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `guias` ADD `assinadoPaciente` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `guias` ADD `dataAssinaturaPaciente` timestamp;--> statement-breakpoint
ALTER TABLE `guias` ADD `assinaturaPacienteUrl` text;--> statement-breakpoint
ALTER TABLE `guias` ADD `totalSessoes` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prontuarios` ADD `contratoTerapeuticoAssinado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `prontuarios` ADD `dataAssinaturaContrato` timestamp;--> statement-breakpoint
ALTER TABLE `prontuarios` ADD `contratoTerapeuticoUrl` text;