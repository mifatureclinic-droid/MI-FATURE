-- MIFATURE: estrutura completa do banco (gerada a partir das migrations do Drizzle)
-- Execute no MySQL Workbench: File > Open SQL Script > este ficheiro > raio (Execute)
CREATE DATABASE IF NOT EXISTS mifature CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mifature;
SET FOREIGN_KEY_CHECKS=0;

-- ===== 0000_square_mandrill =====
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


-- ===== 0001_right_random =====
CREATE TABLE `liberacoesProntuario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`masterId` int NOT NULL,
	`motivo` text NOT NULL,
	`status` enum('pendente','aprovada','rejeitada') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liberacoesProntuario_id` PRIMARY KEY(`id`)
);

ALTER TABLE `atendimentos` ADD `dataLimiteProntuario` timestamp;
ALTER TABLE `atendimentos` ADD `liberadoPorMaster` tinyint DEFAULT 0;
ALTER TABLE `atendimentos` ADD `motLiberacao` text;
ALTER TABLE `pacientes` ADD `pedidoMedicoUrl` text;
ALTER TABLE `pacientes` ADD `dataVencimentoPedido` date;
ALTER TABLE `pacientes` ADD `alertaVencimentoEnviado` tinyint DEFAULT 0;
ALTER TABLE `prontuarios` ADD `statusAtraso` enum('noTempo','atrasado','liberado') DEFAULT 'noTempo' NOT NULL;

-- ===== 0002_smooth_blur =====
CREATE TABLE `procedimentosPorConvenio` (
	`id` int AUTO_INCREMENT NOT NULL,
	`convenioId` int NOT NULL,
	`tabelaProcedimentoId` int NOT NULL,
	`codigoConvenio` varchar(20) NOT NULL,
	`descricaoConvenio` text,
	`valor` decimal(10,2) NOT NULL,
	`valorMinimo` decimal(10,2),
	`valorMaximo` decimal(10,2),
	`ativo` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `procedimentosPorConvenio_id` PRIMARY KEY(`id`)
);

CREATE TABLE `tabelaProcedimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigoANS` varchar(10) NOT NULL,
	`descricao` text NOT NULL,
	`especialidade` varchar(100),
	`grupoANS` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tabelaProcedimentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `tabelaProcedimentos_codigoANS_unique` UNIQUE(`codigoANS`)
);


-- ===== 0003_moaning_radioactive_man =====
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

ALTER TABLE `historicoAlteracoes` ADD CONSTRAINT `historicoAlteracoes_atendimentoId_atendimentos_id_fk` FOREIGN KEY (`atendimentoId`) REFERENCES `atendimentos`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `historicoAlteracoes` ADD CONSTRAINT `historicoAlteracoes_usuarioId_users_id_fk` FOREIGN KEY (`usuarioId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;

-- ===== 0004_married_zzzax =====
ALTER TABLE `atendimentos` ADD `reagendadoPara` int;
ALTER TABLE `atendimentos` ADD `atendimentoAnteriorId` int;

-- ===== 0005_petite_pete_wisdom =====
ALTER TABLE `convenios` ADD `aniversarioConvenio` date;
ALTER TABLE `convenios` ADD `alertaAniversarioEnviado` tinyint DEFAULT 0;
ALTER TABLE `convenios` ADD `anexoUrl` text;
ALTER TABLE `pacientes` ADD `anexoUrl` text;
ALTER TABLE `profissionais` ADD `anexoUrl` text;

-- ===== 0006_icy_adam_destine =====
ALTER TABLE `users` ADD `perfil` varchar(50) DEFAULT 'user';
ALTER TABLE `users` ADD `profissionalVinculadoId` int;

-- ===== 0007_tiresome_puff_adder =====
ALTER TABLE `atendimentos` ADD `prontuarioFeito` tinyint DEFAULT 0;
ALTER TABLE `atendimentos` ADD `compartilhadoCom` text;
ALTER TABLE `guias` ADD `repasseFinalizado` tinyint DEFAULT 0;

-- ===== 0008_amused_johnny_blaze =====
CREATE TABLE `assinaturasGuias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`pacienteId` int NOT NULL,
	`assinaturaPacienteUrl` text,
	`dataAssinatura` timestamp NOT NULL DEFAULT (now()),
	`hashAssinatura` varchar(255),
	`sessaoNumero` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assinaturasGuias_id` PRIMARY KEY(`id`)
);

CREATE TABLE `contratosTerapêuticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`conteudo` text NOT NULL,
	`assinado` tinyint DEFAULT 0,
	`dataAssinatura` timestamp,
	`assinaturaPacienteUrl` text,
	`hashAssinatura` varchar(255),
	`ativo` tinyint DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratosTerapêuticos_id` PRIMARY KEY(`id`)
);

ALTER TABLE `guias` ADD `assinadoPaciente` tinyint DEFAULT 0;
ALTER TABLE `guias` ADD `dataAssinaturaPaciente` timestamp;
ALTER TABLE `guias` ADD `assinaturaPacienteUrl` text;
ALTER TABLE `guias` ADD `totalSessoes` int DEFAULT 0;
ALTER TABLE `prontuarios` ADD `contratoTerapeuticoAssinado` tinyint DEFAULT 0;
ALTER TABLE `prontuarios` ADD `dataAssinaturaContrato` timestamp;
ALTER TABLE `prontuarios` ADD `contratoTerapeuticoUrl` text;

-- ===== 0009_abandoned_mandrill =====
ALTER TABLE `pacientes` ADD `whatsapp` varchar(20);
ALTER TABLE `pacientes` ADD `recebeLembretesWhatsapp` tinyint DEFAULT 1;

-- ===== 0010_clumsy_silver_centurion =====
ALTER TABLE `atendimentos` ADD `lembreteSolicitado` tinyint DEFAULT 0;
ALTER TABLE `atendimentos` ADD `lembreteEnviado` tinyint DEFAULT 0;
ALTER TABLE `atendimentos` ADD `dataEnvioLembrete` timestamp;
ALTER TABLE `atendimentos` ADD `confirmacaoAtendimento` tinyint;
ALTER TABLE `atendimentos` ADD `dataConfirmacao` timestamp;

-- ===== 0011_icy_invisible_woman =====
CREATE TABLE `dadosPrestador` (
	`id` int AUTO_INCREMENT NOT NULL,
	`razaoSocial` varchar(255) NOT NULL,
	`nomeFantasia` varchar(255),
	`cnpj` varchar(14) NOT NULL,
	`cnes` varchar(7),
	`codigoPrestadorNaOperadora` varchar(14),
	`versaoTISSPadrao` varchar(10) DEFAULT '4.01.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dadosPrestador_id` PRIMARY KEY(`id`)
);

CREATE TABLE `guiaProcedimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`sequencial` int NOT NULL DEFAULT 1,
	`dataExecucao` date,
	`codigoTabela` varchar(2) DEFAULT '22',
	`codigoProcedimento` varchar(15) NOT NULL,
	`descricaoProcedimento` varchar(255) NOT NULL,
	`quantidadeExecutada` decimal(10,2) NOT NULL DEFAULT '1',
	`valorUnitario` decimal(10,2) NOT NULL DEFAULT '0',
	`valorTotal` decimal(10,2) NOT NULL DEFAULT '0',
	`reducaoAcrescimo` decimal(5,2) DEFAULT '1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guiaProcedimentos_id` PRIMARY KEY(`id`)
);

CREATE TABLE `lotesFaturamento` (
	`id` int AUTO_INCREMENT NOT NULL,
	`numeroLote` varchar(20) NOT NULL,
	`convenioId` int NOT NULL,
	`versaoTISS` varchar(10) NOT NULL DEFAULT '4.01.00',
	`tipoTransacao` varchar(30) NOT NULL DEFAULT 'ENVIO_LOTE_GUIAS',
	`sequencialTransacao` varchar(12),
	`registroANS` varchar(6),
	`cnpjPrestador` varchar(14),
	`codigoPrestadorNaOperadora` varchar(14),
	`nomePrestador` varchar(255),
	`cnesPrestador` varchar(7),
	`quantidadeGuias` int DEFAULT 0,
	`valorTotalLote` decimal(12,2) DEFAULT '0',
	`hashXML` varchar(32),
	`xmlKey` varchar(255),
	`xmlUrl` text,
	`status` enum('aberto','gerado','enviado','processado') NOT NULL DEFAULT 'aberto',
	`dataGeracao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lotesFaturamento_id` PRIMARY KEY(`id`)
);

ALTER TABLE `guias` ADD `loteId` int;
ALTER TABLE `guias` ADD `numeroGuiaOperadora` varchar(20);
ALTER TABLE `guias` ADD `numeroGuiaPrincipal` varchar(20);
ALTER TABLE `guias` ADD `senhaAutorizacao` varchar(20);
ALTER TABLE `guias` ADD `dataAutorizacao` date;
ALTER TABLE `guias` ADD `dataValidadeSenha` date;
ALTER TABLE `guias` ADD `numeroCarteira` varchar(20);
ALTER TABLE `guias` ADD `validadeCarteira` date;
ALTER TABLE `guias` ADD `atendimentoRN` enum('S','N') DEFAULT 'N';
ALTER TABLE `guias` ADD `caraterAtendimento` enum('1','2') DEFAULT '1';
ALTER TABLE `guias` ADD `tipoAtendimento` varchar(2) DEFAULT '05';
ALTER TABLE `guias` ADD `indicacaoAcidente` varchar(1) DEFAULT '9';
ALTER TABLE `guias` ADD `tipoConsulta` varchar(1);
ALTER TABLE `guias` ADD `regimeAtendimento` varchar(2);
ALTER TABLE `guias` ADD `cid10Principal` varchar(10);
ALTER TABLE `guias` ADD `valorProcedimentos` decimal(10,2);
ALTER TABLE `guias` ADD `valorTaxasAlugueis` decimal(10,2);
ALTER TABLE `guias` ADD `valorMateriais` decimal(10,2);
ALTER TABLE `guias` ADD `valorMedicamentos` decimal(10,2);
ALTER TABLE `guias` ADD `valorTotalGeral` decimal(10,2);
ALTER TABLE `guias` ADD `observacoesTISS` text;

-- ===== 0012_absurd_malice =====
CREATE TABLE `alertasProntuarioPendente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`status` enum('pendente','reconhecido','resolvido') NOT NULL DEFAULT 'pendente',
	`dataAlerta` timestamp NOT NULL DEFAULT (now()),
	`dataReconhecimento` timestamp,
	`horaReconhecimento` varchar(5),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertasProntuarioPendente_id` PRIMARY KEY(`id`)
);

ALTER TABLE `profissionais` ADD `conselhoProfissional` varchar(10) DEFAULT 'CRM';
ALTER TABLE `profissionais` ADD `numeroConselho` varchar(30);
ALTER TABLE `profissionais` ADD `codigoCBO` varchar(10);
ALTER TABLE `profissionais` ADD `uf` varchar(2);

-- ===== 0013_conscious_oracle =====
ALTER TABLE `atendimentos` ADD `procedimentoConvenioId` int;
ALTER TABLE `users` ADD `senha` varchar(255);

-- ===== 0014_complete_speed_demon =====
ALTER TABLE `convenios` ADD `registroANS` varchar(10);
ALTER TABLE `convenios` ADD `codigoNaOperadora` varchar(20);
ALTER TABLE `convenios` ADD `logoUrl` text;
ALTER TABLE `convenios` ADD `ativo` tinyint DEFAULT 1 NOT NULL;

-- ===== 0015_mature_wildside =====
CREATE TABLE `anamneses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int,
	`queixaPrincipal` text,
	`historiaDoenca` text,
	`historiaFamiliar` text,
	`historiaSocial` text,
	`antecedentesPatologicos` text,
	`medicamentosEmUso` text,
	`alergias` text,
	`cirurgiasAnteriores` text,
	`habitos` text,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamneses_id` PRIMARY KEY(`id`)
);

CREATE TABLE `contratosTerapeuticos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int,
	`numeroContrato` varchar(50),
	`dataContrato` date,
	`conteudo` text,
	`pdfKey` varchar(255),
	`pdfUrl` text,
	`status` enum('rascunho','enviado','assinado','cancelado') NOT NULL DEFAULT 'rascunho',
	`dataEnvioWhatsapp` timestamp,
	`dataAssinatura` timestamp,
	`assinaturaHash` varchar(64),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contratosTerapeuticos_id` PRIMARY KEY(`id`)
);

ALTER TABLE `convenios` DROP INDEX `convenios_cnpj_unique`;
ALTER TABLE `convenios` MODIFY COLUMN `cnpj` varchar(18);
ALTER TABLE `convenios` MODIFY COLUMN `registroANS` varchar(20);
ALTER TABLE `convenios` MODIFY COLUMN `codigoNaOperadora` varchar(50);
ALTER TABLE `profissionais` MODIFY COLUMN `cpf` varchar(14);
ALTER TABLE `profissionais` MODIFY COLUMN `crm` varchar(50) NOT NULL;
ALTER TABLE `convenios` ADD `tipoIdentificacao` varchar(50);
ALTER TABLE `convenios` ADD `contratado` varchar(255);
ALTER TABLE `convenios` ADD `planos` text;
ALTER TABLE `procedimentosPorConvenio` ADD `tabelaOrigem` varchar(255);
ALTER TABLE `profissionais` ADD `dataNascimento` date;
ALTER TABLE `profissionais` ADD `ativo` tinyint DEFAULT 1 NOT NULL;

-- ===== 0016_first_amazoness =====
DROP TABLE `contratosTerapeuticos`;
ALTER TABLE `assinaturasGuias` ADD `token` varchar(128);
ALTER TABLE `assinaturasGuias` ADD `tokenExpiresAt` timestamp;
ALTER TABLE `atendimentos` ADD `confirmacaoToken` varchar(128);
ALTER TABLE `atendimentos` ADD `confirmacaoStatus` enum('pendente','confirmado','cancelado') DEFAULT 'pendente';
ALTER TABLE `contratosTerapêuticos` ADD `tokenAssinatura` varchar(128);
ALTER TABLE `contratosTerapêuticos` ADD `tokenExpiresAt` timestamp;

-- ===== 0017_lush_spyke =====
ALTER TABLE `dadosPrestador` MODIFY COLUMN `cnpj` varchar(18) NOT NULL;
ALTER TABLE `atendimentos` ADD `confirmacaoTokenExpiresAt` timestamp;
ALTER TABLE `dadosPrestador` ADD `cep` varchar(10);
ALTER TABLE `dadosPrestador` ADD `logradouro` varchar(255);
ALTER TABLE `dadosPrestador` ADD `numero` varchar(20);
ALTER TABLE `dadosPrestador` ADD `complemento` varchar(100);
ALTER TABLE `dadosPrestador` ADD `bairro` varchar(100);
ALTER TABLE `dadosPrestador` ADD `cidade` varchar(100);
ALTER TABLE `dadosPrestador` ADD `estado` varchar(2);
ALTER TABLE `dadosPrestador` ADD `telefone` varchar(20);
ALTER TABLE `dadosPrestador` ADD `celular` varchar(20);
ALTER TABLE `dadosPrestador` ADD `email` varchar(255);
ALTER TABLE `dadosPrestador` ADD `site` varchar(255);
ALTER TABLE `dadosPrestador` ADD `banco` varchar(100);
ALTER TABLE `dadosPrestador` ADD `agencia` varchar(20);
ALTER TABLE `dadosPrestador` ADD `conta` varchar(30);
ALTER TABLE `dadosPrestador` ADD `tipoConta` varchar(20);
ALTER TABLE `dadosPrestador` ADD `pix` varchar(255);
ALTER TABLE `dadosPrestador` ADD `nomeResponsavel` varchar(255);
ALTER TABLE `dadosPrestador` ADD `cpfResponsavel` varchar(14);
ALTER TABLE `dadosPrestador` ADD `crmResponsavel` varchar(50);
ALTER TABLE `dadosPrestador` ADD `emailResponsavel` varchar(255);
ALTER TABLE `dadosPrestador` ADD `telefoneResponsavel` varchar(20);
ALTER TABLE `dadosPrestador` ADD `registroANS` varchar(20);
ALTER TABLE `dadosPrestador` ADD `inscricaoEstadual` varchar(30);
ALTER TABLE `dadosPrestador` ADD `inscricaoMunicipal` varchar(30);
ALTER TABLE `guias` ADD `atendimentoId` int;
ALTER TABLE `profissionais` ADD `percentualRepasse` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualConvenio` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualParticular` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualTesteAvulso` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualAvaliacaoNeuropsicologica` decimal(5,2) DEFAULT '70.00';

-- ===== 0017_lush_spyke =====
ALTER TABLE `dadosPrestador` MODIFY COLUMN `cnpj` varchar(18) NOT NULL;
ALTER TABLE `atendimentos` ADD `confirmacaoTokenExpiresAt` timestamp;
ALTER TABLE `dadosPrestador` ADD `cep` varchar(10);
ALTER TABLE `dadosPrestador` ADD `logradouro` varchar(255);
ALTER TABLE `dadosPrestador` ADD `numero` varchar(20);
ALTER TABLE `dadosPrestador` ADD `complemento` varchar(100);
ALTER TABLE `dadosPrestador` ADD `bairro` varchar(100);
ALTER TABLE `dadosPrestador` ADD `cidade` varchar(100);
ALTER TABLE `dadosPrestador` ADD `estado` varchar(2);
ALTER TABLE `dadosPrestador` ADD `telefone` varchar(20);
ALTER TABLE `dadosPrestador` ADD `celular` varchar(20);
ALTER TABLE `dadosPrestador` ADD `email` varchar(255);
ALTER TABLE `dadosPrestador` ADD `site` varchar(255);
ALTER TABLE `dadosPrestador` ADD `banco` varchar(100);
ALTER TABLE `dadosPrestador` ADD `agencia` varchar(20);
ALTER TABLE `dadosPrestador` ADD `conta` varchar(30);
ALTER TABLE `dadosPrestador` ADD `tipoConta` varchar(20);
ALTER TABLE `dadosPrestador` ADD `pix` varchar(255);
ALTER TABLE `dadosPrestador` ADD `nomeResponsavel` varchar(255);
ALTER TABLE `dadosPrestador` ADD `cpfResponsavel` varchar(14);
ALTER TABLE `dadosPrestador` ADD `crmResponsavel` varchar(50);
ALTER TABLE `dadosPrestador` ADD `emailResponsavel` varchar(255);
ALTER TABLE `dadosPrestador` ADD `telefoneResponsavel` varchar(20);
ALTER TABLE `dadosPrestador` ADD `registroANS` varchar(20);
ALTER TABLE `dadosPrestador` ADD `inscricaoEstadual` varchar(30);
ALTER TABLE `dadosPrestador` ADD `inscricaoMunicipal` varchar(30);
ALTER TABLE `guias` ADD `atendimentoId` int;
ALTER TABLE `profissionais` ADD `percentualRepasse` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualConvenio` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualParticular` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualTesteAvulso` decimal(5,2) DEFAULT '70.00';
ALTER TABLE `profissionais` ADD `percentualAvaliacaoNeuropsicologica` decimal(5,2) DEFAULT '70.00';

-- ===== 0019_mature_stature =====
ALTER TABLE `pacientes` ADD `numeroCarteira` varchar(50);
ALTER TABLE `pacientes` ADD `validadeCarteira` date;

-- ===== 0020_kind_madrox =====
ALTER TABLE `guiaProcedimentos` ADD `profissionalId` int;
ALTER TABLE `pacientes` ADD `convenioId` int;

-- ===== 0021_flaky_starbolt =====
ALTER TABLE `atendimentos` ADD `guiaId` int;
ALTER TABLE `guias` ADD `numeroGuiaInterno` varchar(30);

-- ===== 0022_magenta_nemesis =====
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


-- ===== 0023_ancient_true_believers =====
ALTER TABLE `assinaturasGuias` ADD `datasAtendimento` text;

-- ===== 0024_premium_quasimodo =====
CREATE TABLE `subscricoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`stripePriceId` varchar(255),
	`plano` enum('starter','clinica','premium') NOT NULL,
	`status` enum('active','trialing','past_due','canceled','incomplete') NOT NULL DEFAULT 'incomplete',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscricoes_id` PRIMARY KEY(`id`)
);


-- ===== 0025_whole_lifeguard =====
CREATE TABLE `assinaturasSadt` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`pacienteId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`atendimentoId` int,
	`numeroSessao` int NOT NULL DEFAULT 1,
	`dataSessao` date NOT NULL,
	`procedimento` varchar(255) NOT NULL,
	`pacienteNome` varchar(255) NOT NULL,
	`pacienteCpf` varchar(14),
	`pacienteWhatsapp` varchar(20),
	`token` varchar(128) NOT NULL,
	`tokenExpiresAt` timestamp NOT NULL,
	`status` enum('pendente','assinado','expirado','cancelado') NOT NULL DEFAULT 'pendente',
	`assinaturaDataUrl` text,
	`assinaturaHash` varchar(64),
	`ipAssinatura` varchar(45),
	`userAgentAssinatura` text,
	`dataAssinatura` timestamp,
	`whatsappEnviado` tinyint NOT NULL DEFAULT 0,
	`dataEnvioWhatsapp` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assinaturasSadt_id` PRIMARY KEY(`id`),
	CONSTRAINT `assinaturasSadt_token_unique` UNIQUE(`token`)
);


-- ===== 0026_demonic_union_jack =====
ALTER TABLE `assinaturasSadt` ADD `motivoRecusa` text;
ALTER TABLE `assinaturasSadt` ADD `pdfUrl` text;

-- ===== 0027_moaning_stark_industries =====
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

CREATE TABLE `systemConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chave` varchar(100) NOT NULL,
	`valor` text,
	`descricao` varchar(255),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemConfig_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemConfig_chave_unique` UNIQUE(`chave`)
);


-- ===== 0028_fearless_maginty =====
ALTER TABLE `geapAutorizacoes` ADD `tipoAtendimento` enum('ambulatorial','eletivo') DEFAULT 'ambulatorial' NOT NULL;
ALTER TABLE `geapAutorizacoes` ADD `nomeMedicoSolicitante` varchar(255) NOT NULL;
ALTER TABLE `geapAutorizacoes` ADD `crmMedicoSolicitante` varchar(20) NOT NULL;
ALTER TABLE `geapAutorizacoes` ADD `ufMedicoSolicitante` varchar(2) NOT NULL;
ALTER TABLE `geapAutorizacoes` ADD `cbosMedicoSolicitante` varchar(10) NOT NULL;

-- ===== 0029_bumpy_butterfly =====
ALTER TABLE `atendimentos` ADD `criadoPorUserId` int;
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoUrl` text;
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoNomeArquivo` varchar(255);
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoTamanho` int;
ALTER TABLE `geapAutorizacoes` ADD `pedidoMedicoTipo` varchar(50);
ALTER TABLE `geapAutorizacoes` ADD `relatorioNomeArquivo` varchar(255);
ALTER TABLE `geapAutorizacoes` ADD `relatorioTamanho` int;
ALTER TABLE `geapAutorizacoes` ADD `relatorioTipo` varchar(50);
ALTER TABLE `geapAutorizacoes` ADD `anexosUploadadoEm` timestamp;
ALTER TABLE `pacientes` ADD `nomeMedicoSolicitante` varchar(255);
ALTER TABLE `pacientes` ADD `crmMedicoSolicitante` varchar(20);
ALTER TABLE `pacientes` ADD `ufMedicoSolicitante` varchar(2);
ALTER TABLE `pacientes` ADD `cbosMedicoSolicitante` varchar(10);
ALTER TABLE `geapAutorizacoes` DROP COLUMN `encaminhamentoUrl`;

-- ===== 0030_tan_logan =====
ALTER TABLE `profissionais` ADD `roloAtendimento` varchar(50) DEFAULT 'Profissional';
ALTER TABLE `atendimentos` DROP COLUMN `criadoPorUserId`;

-- ===== 0031_bored_vector =====
ALTER TABLE `profissionais` DROP COLUMN `roloAtendimento`;

-- ===== 0032_loud_hemingway =====
ALTER TABLE `assinaturasSadt` MODIFY COLUMN `guiaId` int;
ALTER TABLE `assinaturasSadt` MODIFY COLUMN `profissionalId` int;

-- ===== 0033_modern_stone_men =====
CREATE TABLE `extrato_bancario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`banco` varchar(50) NOT NULL DEFAULT 'Bradesco',
	`agencia` varchar(20),
	`conta` varchar(30),
	`data` date NOT NULL,
	`descricao` text NOT NULL,
	`documento` varchar(50),
	`credito` decimal(15,2),
	`debito` decimal(15,2),
	`tipo` enum('credito','debito','saldo') NOT NULL,
	`categoria` varchar(100),
	`conciliado` tinyint DEFAULT 0,
	`contaFinanceiraId` int,
	`arquivoOrigem` varchar(255),
	`importadoPor` int,
	`importadoEm` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `extrato_bancario_id` PRIMARY KEY(`id`)
);


-- ===== 0034_parched_naoko =====
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


-- ===== 0035_vengeful_terrax =====
CREATE TABLE `horarios_profissional` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profissionalId` int NOT NULL,
	`diaSemana` int NOT NULL,
	`horaInicio` varchar(5) NOT NULL,
	`horaFim` varchar(5) NOT NULL,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `horarios_profissional_id` PRIMARY KEY(`id`)
);


-- ===== 0036_sticky_vanisher =====
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

ALTER TABLE `atendimentos` ADD `serieId` varchar(36);

-- ===== 0037_chief_invisible_woman =====
ALTER TABLE `dadosPrestador` ADD `logoUrl` text;

-- ===== 0038_great_eternals =====
ALTER TABLE `users` ADD `avatarUrl` text;

-- ===== 0039_flowery_rage =====
ALTER TABLE `profissionais` ADD `duracaoPadrao` int DEFAULT 30 NOT NULL;

-- ===== 0040_small_korvac =====
CREATE TABLE `auditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int,
	`usuarioNome` varchar(255),
	`usuarioPerfil` varchar(50),
	`entidade` varchar(100) NOT NULL,
	`entidadeId` int,
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`dadosAnteriores` text,
	`dadosNovos` text,
	`ip` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditoria_id` PRIMARY KEY(`id`)
);

ALTER TABLE `atendimentos` ADD `pagamentoParticularId` int;
ALTER TABLE `guias` ADD `guiaPrincipalId` int;
ALTER TABLE `guias` ADD `saldoSessoes` int DEFAULT 0;
ALTER TABLE `guias` ADD `serieId` varchar(36);
ALTER TABLE `guias` ADD `serieNumero` int;
ALTER TABLE `guias` ADD `serieSessaoInicio` int;
ALTER TABLE `guias` ADD `serieSessaoFim` int;
ALTER TABLE `pagamentos_atendimento` ADD `comprovanteUrl` text;
ALTER TABLE `pagamentos_atendimento` ADD `comprovanteKey` text;
ALTER TABLE `pagamentos_atendimento` ADD `atendimentosVinculados` text;
ALTER TABLE `profissionais` ADD `codigoConselho` varchar(2);
ALTER TABLE `profissionais` ADD `cbos` varchar(10);

-- ===== 0041_past_alice =====
-- A coluna pagamentoAtendimentoId foi aplicada com segurança na base ativa antes do registro desta migração.
SELECT 1;


-- ===== 0042_spooky_sunfire =====
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

CREATE TABLE `pontoFechamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`fechadoPorUsuarioId` int NOT NULL,
	`observacao` text,
	`fechadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoFechamentos_id` PRIMARY KEY(`id`),
	CONSTRAINT `ponto_fechamentos_competencia_unico` UNIQUE(`competencia`)
);

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


-- ===== 0043_abnormal_marrow =====
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

CREATE TABLE `pontoConsentimentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`versao` varchar(20) NOT NULL,
	`aceito` tinyint NOT NULL,
	`texto` text NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoConsentimentos_id` PRIMARY KEY(`id`)
);

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


-- ===== 0044_salty_maximus =====
ALTER TABLE `pontoRegistros` ADD `metodoValidacao` varchar(30) DEFAULT 'manual' NOT NULL;
ALTER TABLE `pontoRegistros` ADD `latitude` decimal(10,7);
ALTER TABLE `pontoRegistros` ADD `longitude` decimal(10,7);
ALTER TABLE `pontoRegistros` ADD `precisaoMetros` int;
ALTER TABLE `pontoRegistros` ADD `distanciaMetros` int;
ALTER TABLE `pontoRegistros` ADD `confiancaFacial` decimal(6,4);

-- ===== 0045_groovy_zemo =====
CREATE TABLE `bradescoAutorizacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`guiaId` int NOT NULL,
	`pacienteId` int NOT NULL,
	`convenioId` int NOT NULL,
	`numeroCarteira` varchar(50),
	`validadeCarteira` date,
	`nomePaciente` varchar(255) NOT NULL,
	`codigoTUSS` varchar(20) NOT NULL,
	`descricaoProcedimento` varchar(255),
	`cid10` varchar(10) NOT NULL DEFAULT 'F41',
	`quantidadeSessoes` int NOT NULL DEFAULT 1,
	`dataInicio` date,
	`dataFim` date,
	`nomeMedicoSolicitante` varchar(255),
	`crmMedicoSolicitante` varchar(30),
	`ufMedicoSolicitante` varchar(2),
	`cbosMedicoSolicitante` varchar(10),
	`pedidoMedicoUrl` text,
	`pedidoMedicoNomeArquivo` varchar(255),
	`status` enum('pendente_documentacao','pendente','aguardando_acao_humana','enviado_portal','autorizado','negado','erro','cancelado') NOT NULL DEFAULT 'pendente',
	`protocoloBradesco` varchar(50),
	`numeroAutorizacaoBradesco` varchar(40),
	`senhaAutorizacaoBradesco` varchar(30),
	`dataAutorizacaoBradesco` date,
	`validadeAutorizacaoBradesco` date,
	`sessoesAutorizadas` int,
	`motivoNegacao` text,
	`logExecucao` text,
	`tentativas` int NOT NULL DEFAULT 0,
	`ultimaTentativa` timestamp,
	`solicitadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bradescoAutorizacoes_id` PRIMARY KEY(`id`)
);

CREATE TABLE `bradescoCredenciais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cpfResponsavel` varchar(14) NOT NULL,
	`cnpjPrestador` varchar(18) NOT NULL,
	`nomePrestador` varchar(255),
	`senhaLogin` varchar(255) NOT NULL,
	`ativo` tinyint NOT NULL DEFAULT 1,
	`convenioId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bradescoCredenciais_id` PRIMARY KEY(`id`)
);


-- ===== 0046_military_whirlwind =====
CREATE TABLE `pontoOcorrencias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuarioId` int NOT NULL,
	`tipo` enum('folga','ferias','atestado') NOT NULL,
	`dataInicio` date NOT NULL,
	`dataFim` date NOT NULL,
	`observacao` text,
	`registradoPorUsuarioId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pontoOcorrencias_id` PRIMARY KEY(`id`)
);


-- ===== 0047_square_luckman =====
ALTER TABLE `contas_pagar` ADD `pagamentoAtendimentoId` int;
ALTER TABLE `contas_pagar` ADD CONSTRAINT `contas_pagar_pagamentoAtendimentoId_unique` UNIQUE(`pagamentoAtendimentoId`);

-- ===== 0048_real_skreet =====
ALTER TABLE `guias` ADD `valorOPME` decimal(10,2);
ALTER TABLE `guias` ADD `valorGasesMedicinais` decimal(10,2);
ALTER TABLE `guias` ADD `indicacaoClinica` text;
ALTER TABLE `guias` ADD `motivoEncerramento` varchar(2);
ALTER TABLE `guias` ADD `saudeOcupacional` varchar(1);
ALTER TABLE `guias` ADD `dadosPrefaturamento` text;

-- ===== 0049_fearless_supernaut =====
ALTER TABLE `guiaProcedimentos` ADD `horaInicial` varchar(5);
ALTER TABLE `guiaProcedimentos` ADD `horaFinal` varchar(5);

-- ===== 0050_short_shinobi_shaw =====
ALTER TABLE `bradescoCredenciais` ADD `modoExecucao` enum('assistido_sob_demanda') DEFAULT 'assistido_sob_demanda' NOT NULL;

-- ===== 0051_slippery_mandarin =====
ALTER TABLE `bradescoAutorizacoes` MODIFY COLUMN `status` enum('pendente_documentacao','pendente','aguardando_acao_humana','enviado_portal','liberada','autorizado','negado','erro','cancelado') NOT NULL DEFAULT 'pendente';

-- ===== 0052_fantastic_stardust =====
ALTER TABLE `atendimentos` ADD `unidadesRepasse` int DEFAULT 1 NOT NULL;

-- ===== 0053_military_warhawk =====
ALTER TABLE `pagamentos_atendimento` ADD `formasPagamento` text;

-- ===== 0054_slimy_firebrand =====
ALTER TABLE `anamneses` ADD `tokenPreenchimento` varchar(128);
ALTER TABLE `anamneses` ADD `tokenPreenchimentoExpiresAt` timestamp;
ALTER TABLE `anamneses` ADD `preenchidaPeloPaciente` tinyint DEFAULT 0 NOT NULL;
ALTER TABLE `anamneses` ADD `dataPreenchimentoPaciente` timestamp;
ALTER TABLE `anamneses` ADD `dataEnvioWhatsapp` timestamp;

-- ===== 0055_quick_cable =====
ALTER TABLE `prontuarios` ADD `tipoRegistro` enum('anamnese','continuidade') DEFAULT 'continuidade' NOT NULL;

-- ===== 0056_amused_annihilus =====
CREATE TABLE `notas_fiscais_repasse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profissionalId` int NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`arquivoKey` varchar(512) NOT NULL,
	`arquivoUrl` text NOT NULL,
	`nomeArquivo` varchar(255) NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`enviadoPor` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notas_fiscais_repasse_id` PRIMARY KEY(`id`),
	CONSTRAINT `notas_fiscais_repasse_profissional_competencia_unique` UNIQUE(`profissionalId`,`competencia`)
);

CREATE TABLE `pagamentos_repasse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`atendimentoId` int NOT NULL,
	`profissionalId` int NOT NULL,
	`competencia` varchar(7) NOT NULL,
	`status` enum('pendente','pago') NOT NULL DEFAULT 'pendente',
	`dataPagamento` timestamp,
	`marcadoPor` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pagamentos_repasse_id` PRIMARY KEY(`id`),
	CONSTRAINT `pagamentos_repasse_atendimentoId_unique` UNIQUE(`atendimentoId`)
);

SET FOREIGN_KEY_CHECKS=1;
