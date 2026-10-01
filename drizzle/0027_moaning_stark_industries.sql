CREATE TABLE `geapAutorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int,
	`pacienteId` int NOT NULL,
	`convenioId` int NOT NULL,
	`numeroCarteira` varchar(50),
	`nomePaciente` varchar(255) NOT NULL,
	`codigoTUSS` varchar(15) NOT NULL,
	`descricaoProcedimento` varchar(255),
	`cid10` varchar(10),
	`quantidadeSessoes` int NOT NULL DEFAULT 1,
	`dataInicio` date,
	`dataFim` date,
	`encaminhamentoUrl` text,
	`relatorioUrl` text,
	`status` enum('pendente','processando','autorizado','negado','erro','cancelado') NOT NULL DEFAULT 'pendente',
	`numeroAutorizacaoGeap` varchar(30),
	`dataAutorizacaoGeap` date,
	`validadeAutorizacaoGeap` date,
	`motivoNegacao` text,
	`logExecucao` text,
	`tentativas` int NOT NULL DEFAULT 0,
	`ultimaTentativa` timestamp,
	`solicitadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geapAutorizacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `geapCredenciais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoPrestador` varchar(20) NOT NULL,
	`nomePrestador` varchar(255),
	`cpfLogin` varchar(14) NOT NULL,
	`senhaLogin` varchar(255) NOT NULL,
	`accessToken` text,
	`tokenExpiresAt` timestamp,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`convenioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `geapCredenciais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text,
	`descricao` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemConfig_chave_unique` UNIQUE(`chave`)
);
