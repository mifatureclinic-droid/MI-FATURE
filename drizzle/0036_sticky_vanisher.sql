CREATE TABLE `anexos_paciente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paciente_id` int NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` varchar(500),
	`categoria` varchar(100) DEFAULT 'outros',
	`file_key` varchar(500) NOT NULL,
	`file_url` varchar(1000) NOT NULL,
	`mime_type` varchar(100),
	`tamanho` int,
	`uploaded_by` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `anexos_paciente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cores_atendimento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` varchar(100) NOT NULL,
	`cor` varchar(20) NOT NULL DEFAULT '#3b82f6',
	`cor_texto` varchar(20) NOT NULL DEFAULT '#ffffff',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cores_atendimento_id` PRIMARY KEY(`id`),
	CONSTRAINT `cores_atendimento_tipo_unique` UNIQUE(`tipo`)
);
--> statement-breakpoint
CREATE TABLE `pagamentos_atendimento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`valor` decimal(15,2) NOT NULL,
	`dataPagamento` timestamp NOT NULL,
	`referenciaDatas` varchar(255) NOT NULL,
	`metodoPagamento` enum('dinheiro','cartao_credito','cartao_debito','pix','transferencia','outro') NOT NULL,
	`observacoes` text,
	`contaReceberCriadaId` int,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pagamentos_atendimento_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `serieId` varchar(36);