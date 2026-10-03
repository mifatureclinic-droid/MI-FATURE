CREATE TABLE `notificacoes_in_app` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('confirmacao','cancelamento','assinatura','sistema') NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`conteudo` text,
	`lida` tinyint NOT NULL DEFAULT 0,
	`atendimentoId` int,
	`guiaId` int,
	`pacienteNome` varchar(255),
	`profissionalNome` varchar(255),
	`convenioNome` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notificacoes_in_app_id` PRIMARY KEY(`id`)
);
