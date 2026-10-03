ALTER TABLE `pacientes` ADD `whatsapp` varchar(20);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `recebeLembretesWhatsapp` tinyint DEFAULT 1;