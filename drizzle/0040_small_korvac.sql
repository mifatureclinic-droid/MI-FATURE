CREATE TABLE `auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`usuarioPerfil` varchar(50),
	`entidade` varchar(100) NOT NULL,
	`entidadeId` int,
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`dadosAnteriores` text,
	`dadosNovos` text,
	`ip` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `pagamentoParticularId` int;--> statement-breakpoint
ALTER TABLE `guias` ADD `guiaPrincipalId` int;--> statement-breakpoint
ALTER TABLE `guias` ADD `saldoSessoes` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `guias` ADD `serieId` varchar(36);--> statement-breakpoint
ALTER TABLE `guias` ADD `serieNumero` int;--> statement-breakpoint
ALTER TABLE `guias` ADD `serieSessaoInicio` int;--> statement-breakpoint
ALTER TABLE `guias` ADD `serieSessaoFim` int;--> statement-breakpoint
ALTER TABLE `pagamentos_atendimento` ADD `comprovanteUrl` text;--> statement-breakpoint
ALTER TABLE `pagamentos_atendimento` ADD `comprovanteKey` text;--> statement-breakpoint
ALTER TABLE `pagamentos_atendimento` ADD `atendimentosVinculados` text;--> statement-breakpoint
ALTER TABLE `profissionais` ADD `codigoConselho` varchar(2);--> statement-breakpoint
ALTER TABLE `profissionais` ADD `cbos` varchar(10);