ALTER TABLE `anamneses` ADD `tokenPreenchimento` varchar(128);--> statement-breakpoint
ALTER TABLE `anamneses` ADD `tokenPreenchimentoExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `preenchidaPeloPaciente` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `dataPreenchimentoPaciente` timestamp;--> statement-breakpoint
ALTER TABLE `anamneses` ADD `dataEnvioWhatsapp` timestamp;