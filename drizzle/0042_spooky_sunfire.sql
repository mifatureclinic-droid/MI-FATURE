CREATE TABLE `pontoAjustes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registroId` int NOT NULL,
	`ajustadoPorUsuarioId` int NOT NULL,
	`valoresAnteriores` text NOT NULL,
	`valoresNovos` text NOT NULL,
	`justificativa` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoAjustes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pontoFechamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`fechadoPorUsuarioId` int NOT NULL,
	`observacao` text,
	`fechadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoFechamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `ponto_fechamentos_competencia_unico` UNIQUE(`competencia`)
);
--> statement-breakpoint
CREATE TABLE `pontoJornadas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`horaEntrada` varchar(5) NOT NULL DEFAULT '08:00',
	`inicioIntervalo` varchar(5) NOT NULL DEFAULT '12:00',
	`fimIntervalo` varchar(5) NOT NULL DEFAULT '13:00',
	`horaSaida` varchar(5) NOT NULL DEFAULT '17:00',
	`toleranciaMarcacaoMinutos` int NOT NULL DEFAULT 5,
	`toleranciaDiariaMinutos` int NOT NULL DEFAULT 10,
	`adicionalHoraExtra` decimal(5,2) NOT NULL DEFAULT '50.00',
	`valorHora` decimal(10,2) NOT NULL DEFAULT '0.00',
	`ativo` tinyint NOT NULL DEFAULT 1,
	`criadoPorUsuarioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontoJornadas_id` PRIMARY KEY(`id`),
	CONSTRAINT `ponto_jornadas_usuario_unico` UNIQUE(`usuarioId`)
);
--> statement-breakpoint
CREATE TABLE `pontoRegistros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`data` date NOT NULL,
	`entrada` varchar(5),
	`inicioIntervalo` varchar(5),
	`fimIntervalo` varchar(5),
	`saida` varchar(5),
	`status` varchar(20) NOT NULL DEFAULT 'aberto',
	`justificativa` text,
	`ajustadoPorUsuarioId` int,
	`fechado` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontoRegistros_id` PRIMARY KEY(`id`),
	CONSTRAINT `ponto_registros_usuario_data_unico` UNIQUE(`usuarioId`,`data`)
);
