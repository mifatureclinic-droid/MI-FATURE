ALTER TABLE `atendimentos` ADD `lembreteSolicitado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `lembreteEnviado` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `dataEnvioLembrete` timestamp;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `confirmacaoAtendimento` tinyint;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `dataConfirmacao` timestamp;