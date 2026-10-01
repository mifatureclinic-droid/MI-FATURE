CREATE TABLE `pontoBiometrias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`descritorFacial` text NOT NULL,
	`consentimentoVersao` varchar(20) NOT NULL,
	`consentidoEm` timestamp NOT NULL DEFAULT (now()),
	`revogadoEm` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontoBiometrias_id` PRIMARY KEY(`id`),
	CONSTRAINT `ponto_biometrias_usuario_unico` UNIQUE(`usuarioId`)
);
--> statement-breakpoint
CREATE TABLE `pontoConsentimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`versao` varchar(20) NOT NULL,
	`aceito` tinyint NOT NULL,
	`texto` text NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoConsentimentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pontoLocalidades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(120) NOT NULL DEFAULT 'CLÍNICA CLIPSI',
	`latitude` decimal(10,7) NOT NULL,
	`longitude` decimal(10,7) NOT NULL,
	`raioMetros` int NOT NULL DEFAULT 150,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`atualizadoPorUsuarioId` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontoLocalidades_id` PRIMARY KEY(`id`)
);
