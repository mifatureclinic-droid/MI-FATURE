ALTER TABLE `atendimentos` ADD `criadoPorUserId` int;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoUrl` text;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoNomeArquivo` varchar(255);--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoTamanho` int;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoTipo` varchar(50);--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `relatorioNomeArquivo` varchar(255);--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `relatorioTamanho` int;--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `relatorioTipo` varchar(50);--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` ADD `anexosUploadadoEm` timestamp;--> statement-breakpoint
ALTER TABLE `pacientes` ADD `nomeMedicoSolicitante` varchar(255);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `crmMedicoSolicitante` varchar(20);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `ufMedicoSolicitante` varchar(2);--> statement-breakpoint
ALTER TABLE `pacientes` ADD `cbosMedicoSolicitante` varchar(10);--> statement-breakpoint
ALTER TABLE `geapAutorizacoes` DROP COLUMN `encaminhamentoUrl`;