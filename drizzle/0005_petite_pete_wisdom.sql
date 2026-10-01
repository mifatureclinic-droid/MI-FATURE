ALTER TABLE `convenios` ADD `aniversarioConvenio` date;--> statement-breakpoint
ALTER TABLE `convenios` ADD `alertaAniversarioEnviado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `convenios` ADD `anexoUrl` text;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `anexoUrl` text;--> statement-breakpoint
ALTER TABLE `profissionais` ADD `anexoUrl` text;