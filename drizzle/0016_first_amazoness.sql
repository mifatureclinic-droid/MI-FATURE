DROP TABLE `contratosTerapeuticos`;--> statement-breakpoint
ALTER TABLE `assinaturasGuias` ADD `token` varchar(128);--> statement-breakpoint
ALTER TABLE `assinaturasGuias` ADD `tokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `confirmacaoToken` varchar(128);--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `confirmacaoStatus` enum('pendente','confirmado','cancelado') DEFAULT 'pendente';--> statement-breakpoint
ALTER TABLE `contratosTerapêuticos` ADD `tokenAssinatura` varchar(128);--> statement-breakpoint
ALTER TABLE `contratosTerapêuticos` ADD `tokenExpiresAt` timestamp;