CREATE TABLE `dadosPrestador` (
	`id` int AUTO_INCREMENT NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255),
	`cnpj` varchar(14) NOT NULL,
	`cnes` varchar(7),
	`codigoPrestadorNaOperadora` varchar(14),
	`versaoTISSPadrao` varchar(10) DEFAULT '4.01.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dadosPrestador_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guiaProcedimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`sequencial` int NOT NULL DEFAULT 1,
	`dataExecucao` date,
	`codigoTabela` varchar(2) DEFAULT '22',
	`codigoProcedimento` varchar(15) NOT NULL,
	`descricaoProcedimento` varchar(255) NOT NULL,
	`quantidadeExecutada` decimal(10,2) NOT NULL DEFAULT '1',
	`valorUnitario` decimal(10,2) NOT NULL DEFAULT '0',
	`valorTotal` decimal(10,2) NOT NULL DEFAULT '0',
	`reducaoAcrescimo` decimal(5,2) DEFAULT '1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guiaProcedimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lotesFaturamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroLote` varchar(20) NOT NULL,
	`convenioId` int NOT NULL,
	`versaoTISS` varchar(10) NOT NULL DEFAULT '4.01.00',
	`tipoTransacao` varchar(30) NOT NULL DEFAULT 'ENVIO_LOTE_GUIAS',
	`sequencialTransacao` varchar(12),
	`registroANS` varchar(6),
	`cnpjPrestador` varchar(14),
	`codigoPrestadorNaOperadora` varchar(14),
	`nomePrestador` varchar(255),
	`cnesPrestador` varchar(7),
	`quantidadeGuias` int DEFAULT 0,
	`valorTotalLote` decimal(12,2) DEFAULT '0',
	`hashXML` varchar(32),
	`xmlKey` varchar(255),
	`xmlUrl` text,
	`status` enum('aberto','gerado','enviado','processado') NOT NULL DEFAULT 'aberto',
	`dataGeracao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lotesFaturamento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `guias` ADD `loteId` int;--> statement-breakpoint
ALTER TABLE `guias` ADD `numeroGuiaOperadora` varchar(20);--> statement-breakpoint
ALTER TABLE `guias` ADD `numeroGuiaPrincipal` varchar(20);--> statement-breakpoint
ALTER TABLE `guias` ADD `senhaAutorizacao` varchar(20);--> statement-breakpoint
ALTER TABLE `guias` ADD `dataAutorizacao` date;--> statement-breakpoint
ALTER TABLE `guias` ADD `dataValidadeSenha` date;--> statement-breakpoint
ALTER TABLE `guias` ADD `numeroCarteira` varchar(20);--> statement-breakpoint
ALTER TABLE `guias` ADD `validadeCarteira` date;--> statement-breakpoint
ALTER TABLE `guias` ADD `atendimentoRN` enum('S','N') DEFAULT 'N';--> statement-breakpoint
ALTER TABLE `guias` ADD `caraterAtendimento` enum('1','2') DEFAULT '1';--> statement-breakpoint
ALTER TABLE `guias` ADD `tipoAtendimento` varchar(2) DEFAULT '05';--> statement-breakpoint
ALTER TABLE `guias` ADD `indicacaoAcidente` varchar(1) DEFAULT '9';--> statement-breakpoint
ALTER TABLE `guias` ADD `tipoConsulta` varchar(1);--> statement-breakpoint
ALTER TABLE `guias` ADD `regimeAtendimento` varchar(2);--> statement-breakpoint
ALTER TABLE `guias` ADD `cid10Principal` varchar(10);--> statement-breakpoint
ALTER TABLE `guias` ADD `valorProcedimentos` decimal(10,2);--> statement-breakpoint
ALTER TABLE `guias` ADD `valorTaxasAlugueis` decimal(10,2);--> statement-breakpoint
ALTER TABLE `guias` ADD `valorMateriais` decimal(10,2);--> statement-breakpoint
ALTER TABLE `guias` ADD `valorMedicamentos` decimal(10,2);--> statement-breakpoint
ALTER TABLE `guias` ADD `valorTotalGeral` decimal(10,2);--> statement-breakpoint
ALTER TABLE `guias` ADD `observacoesTISS` text;