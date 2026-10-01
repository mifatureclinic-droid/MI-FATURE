CREATE TABLE `contas_pagar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`categoria` varchar(100),
	`valor` decimal(15,2) NOT NULL,
	`dataVencimento` date NOT NULL,
	`dataPagamento` date,
	`status` enum('pendente','pago','atrasado','cancelado') NOT NULL DEFAULT 'pendente',
	`observacoes` text,
	`extratoBancarioId` int,
	`origemExtrato` tinyint DEFAULT 0,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contas_pagar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contas_receber` (
	`id` int AUTO_INCREMENT NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`categoria` varchar(100),
	`valor` decimal(15,2) NOT NULL,
	`dataVencimento` date NOT NULL,
	`dataRecebimento` date,
	`status` enum('pendente','recebido','atrasado','cancelado') NOT NULL DEFAULT 'pendente',
	`observacoes` text,
	`extratoBancarioId` int,
	`origemExtrato` tinyint DEFAULT 0,
	`criadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contas_receber_id` PRIMARY KEY(`id`)
);
