ALTER TABLE `convenios` ADD `registroANS` varchar(10);--> statement-breakpoint
ALTER TABLE `convenios` ADD `codigoNaOperadora` varchar(20);--> statement-breakpoint
ALTER TABLE `convenios` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `convenios` ADD `ativo` tinyint DEFAULT 1 NOT NULL;