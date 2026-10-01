ALTER TABLE `geapAutorizacoes` ADD `tipoAtendimento` enum('ambulatorial','eletivo') DEFAULT 'ambulatorial' NOT NULL;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `nomeMedicoSolicitante` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `crmMedicoSolicitante` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `ufMedicoSolicitante` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `cbosMedicoSolicitante` varchar(10) NOT NULL;