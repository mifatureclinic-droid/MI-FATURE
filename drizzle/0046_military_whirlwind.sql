CREATE TABLE `pontoOcorrencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`tipo` enum('folga','ferias','atestado') NOT NULL,
	`dataInicio` date NOT NULL,
	`dataFim` date NOT NULL,
	`observacao` text,
	`registradoPorUsuarioId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoOcorrencias_id` PRIMARY KEY(`id`)
);
