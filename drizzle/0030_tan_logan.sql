ALTER TABLE `profissionais` ADD `roloAtendimento` varchar(50) DEFAULT 'Profissional';--> statement-breakpoint
ALTER TABLE `atendimentos` DROP COLUMN `criadoPorUserId`;