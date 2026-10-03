CREATE TABLE `atendimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`convenioId` int NOT NULL,
	`data` date NOT NULL,
	`hora` varchar(5) NOT NULL,
	`duracao` int,
	`tipo` varchar(50) NOT NULL,
	`descricao` text,
	`status` enum('agendado','realizado','cancelado','falta') NOT NULL DEFAULT 'agendado',
	`recorrencia` varchar(50),
	`diasSemana` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `atendimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `autorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroAutorizacao` varchar(20) NOT NULL,
	`pacienteId` int NOT NULL,
	`convenioId` int NOT NULL,
	`procedimento` varchar(255) NOT NULL,
	`dataAutorizacao` date NOT NULL,
	`dataValidade` date NOT NULL,
	`quantidadeSessoes` int,
	`status` enum('ativa','utilizada','expirada','cancelada') NOT NULL DEFAULT 'ativa',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `autorizacoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `autorizacoes_numeroAutorizacao_unique` UNIQUE(`numeroAutorizacao`)
);
--> statement-breakpoint
CREATE TABLE `convenios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cnpj` varchar(18) NOT NULL,
	`codigoOperadora` varchar(10),
	`email` varchar(255),
	`telefone` varchar(20),
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `convenios_id` PRIMARY KEY(`id`),
	CONSTRAINT `convenios_cnpj_unique` UNIQUE(`cnpj`)
);
--> statement-breakpoint
CREATE TABLE `faturamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroNota` varchar(20) NOT NULL,
	`convenioId` int NOT NULL,
	`dataEmissao` date NOT NULL,
	`dataVencimento` date NOT NULL,
	`totalGuias` int NOT NULL,
	`valorTotal` decimal(12,2) NOT NULL,
	`status` enum('rascunho','emitida','enviada','recebida','paga','parcial') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faturamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `faturamentos_numeroNota_unique` UNIQUE(`numeroNota`)
);
--> statement-breakpoint
CREATE TABLE `guias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroGuia` varchar(20) NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`convenioId` int NOT NULL,
	`autorizacaoId` int,
	`dataEmissao` date NOT NULL,
	`procedimento` varchar(255) NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`status` enum('rascunho','emitida','enviada','processada','paga','glosa') NOT NULL DEFAULT 'rascunho',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guias_id` PRIMARY KEY(`id`),
	CONSTRAINT `guias_numeroGuia_unique` UNIQUE(`numeroGuia`)
);
--> statement-breakpoint
CREATE TABLE `pacientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`dataNascimento` date NOT NULL,
	`email` varchar(255),
	`telefone` varchar(20),
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(10),
	`cartaoSUS` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pacientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `pacientes_cpf_unique` UNIQUE(`cpf`)
);
--> statement-breakpoint
CREATE TABLE `profissionais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`crm` varchar(20) NOT NULL,
	`especialidade` varchar(100) NOT NULL,
	`email` varchar(255),
	`telefone` varchar(20),
	`endereco` text,
	`cidade` varchar(100),
	`estado` varchar(2),
	`cep` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profissionais_id` PRIMARY KEY(`id`),
	CONSTRAINT `profissionais_cpf_unique` UNIQUE(`cpf`),
	CONSTRAINT `profissionais_crm_unique` UNIQUE(`crm`)
);
--> statement-breakpoint
CREATE TABLE `prontuarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`atendimentoId` int NOT NULL,
	`queixa` text,
	`diagnostico` text,
	`tratamento` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prontuarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
