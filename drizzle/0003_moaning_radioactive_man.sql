CREATE TABLE `historicoAlteracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`usuarioId` int NOT NULL,
	`tipoAlteracao` varchar(50) NOT NULL,
	`valorAnterior` text,
	`valorNovo` text,
	`descricao` text,
	`dataHora` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historicoAlteracoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `historicoAlteracoes` ADD CONSTRAINT `historicoAlteracoes_atendimentoId_atendimentos_id_fk` FOREIGN KEY (`atendimentoId`) REFERENCES `atendimentos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `historicoAlteracoes` ADD CONSTRAINT `historicoAlteracoes_usuarioId_users_id_fk` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;