ALTER TABLE `atendimentos` ADD `prontuarioFeito` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `compartilhadoCom` text;--> statement-breakpoint
ALTER TABLE `guias` ADD `repasseFinalizado` tinyint DEFAULT 0;