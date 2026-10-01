CREATE TABLE `anamneses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int,
	`queixaPrincipal` text,
	`historiaDoenca` text,
	`historiaFamiliar` text,
	`historiaSocial` text,
	`antecedentesPatologicos` text,
	`medicamentosEmUso` text,
	`alergias` text,
	`cirurgiasAnteriores` text,
	`habitos` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamneses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contratosTerapeuticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int,
	`numeroContrato` varchar(50),
	`dataContrato` date,
	`conteudo` text,
	`pdfKey` varchar(255),
	`pdfUrl` text,
	`status` enum('rascunho','enviado','assinado','cancelado') NOT NULL DEFAULT 'rascunho',
	`dataEnvioWhatsapp` timestamp,
	`dataAssinatura` timestamp,
	`assinaturaHash` varchar(64),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratosTerapeuticos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `convenios` DROP INDEX `convenios_cnpj_unique`;--> statement-breakpoint
ALTER TABLE `convenios` MODIFY COLUMN `cnpj` varchar(18);--> statement-breakpoint
ALTER TABLE `convenios` MODIFY COLUMN `registroANS` varchar(20);--> statement-breakpoint
ALTER TABLE `convenios` MODIFY COLUMN `codigoNaOperadora` varchar(50);--> statement-breakpoint
ALTER TABLE `profissionais` MODIFY COLUMN `cpf` varchar(14);--> statement-breakpoint
ALTER TABLE `profissionais` MODIFY COLUMN `crm` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `convenios` ADD `tipoIdentificacao` varchar(50);--> statement-breakpoint
ALTER TABLE `convenios` ADD `contratado` varchar(255);--> statement-breakpoint
ALTER TABLE `convenios` ADD `planos` text;--> statement-breakpoint
ALTER TABLE `procedimentosPorConvenio` ADD `tabelaOrigem` varchar(255);--> statement-breakpoint
ALTER TABLE `profissionais` ADD `dataNascimento` date;--> statement-breakpoint
ALTER TABLE `profissionais` ADD `ativo` tinyint DEFAULT 1 NOT NULL;