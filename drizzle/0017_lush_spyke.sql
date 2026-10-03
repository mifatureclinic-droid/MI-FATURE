ALTER TABLE `dadosPrestador` MODIFY COLUMN `cnpj` varchar(18) NOT NULL;--> statement-breakpoint
ALTER TABLE `atendimentos` ADD `confirmacaoTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `cep` varchar(10);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `logradouro` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `numero` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `complemento` varchar(100);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `bairro` varchar(100);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `cidade` varchar(100);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `estado` varchar(2);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `celular` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `email` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `site` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `banco` varchar(100);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `agencia` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `conta` varchar(30);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `tipoConta` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `pix` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `nomeResponsavel` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `cpfResponsavel` varchar(14);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `crmResponsavel` varchar(50);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `emailResponsavel` varchar(255);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `telefoneResponsavel` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `registroANS` varchar(20);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `inscricaoEstadual` varchar(30);--> statement-breakpoint
ALTER TABLE `dadosPrestador` ADD `inscricaoMunicipal` varchar(30);--> statement-breakpoint
ALTER TABLE `guias` ADD `atendimentoId` int;--> statement-breakpoint
ALTER TABLE `profissionais` ADD `percentualRepasse` decimal(5,2) DEFAULT '70.00';--> statement-breakpoint
ALTER TABLE `profissionais` ADD `percentualConvenio` decimal(5,2) DEFAULT '70.00';--> statement-breakpoint
ALTER TABLE `profissionais` ADD `percentualParticular` decimal(5,2) DEFAULT '70.00';--> statement-breakpoint
ALTER TABLE `profissionais` ADD `percentualTesteAvulso` decimal(5,2) DEFAULT '70.00';--> statement-breakpoint
ALTER TABLE `profissionais` ADD `percentualAvaliacaoNeuropsicologica` decimal(5,2) DEFAULT '70.00';