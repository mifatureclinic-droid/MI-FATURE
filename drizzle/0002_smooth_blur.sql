CREATE TABLE `procedimentosPorConvenio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`convenioId` int NOT NULL,
	`tabelaProcedimentoId` int NOT NULL,
	`codigoConvenio` varchar(20) NOT NULL,
	`descricaoConvenio` text,
	`valor` decimal(10,2) NOT NULL,
	`valorMinimo` decimal(10,2),
	`valorMaximo` decimal(10,2),
	`ativo` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procedimentosPorConvenio_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tabelaProcedimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoANS` varchar(10) NOT NULL,
	`descricao` text NOT NULL,
	`especialidade` varchar(100),
	`grupoANS` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tabelaProcedimentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `tabelaProcedimentos_codigoANS_unique` UNIQUE(`codigoANS`)
);
