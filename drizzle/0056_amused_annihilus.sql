CREATE TABLE `notas_fiscais_repasse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profissionalId` int NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`arquivoKey` varchar(512) NOT NULL,
	`arquivoUrl` text NOT NULL,
	`nomeArquivo` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`enviadoPor` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notas_fiscais_repasse_id` PRIMARY KEY(`id`),
	CONSTRAINT `notas_fiscais_repasse_profissional_competencia_unique` UNIQUE(`profissionalId`,`competencia`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos_repasse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`status` enum('pendente','pago') NOT NULL DEFAULT 'pendente',
	`dataPagamento` timestamp,
	`marcadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pagamentos_repasse_id` PRIMARY KEY(`id`),
	CONSTRAINT `pagamentos_repasse_atendimentoId_unique` UNIQUE(`atendimentoId`)
);
