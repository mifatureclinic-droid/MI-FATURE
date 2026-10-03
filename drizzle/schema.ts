import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, date, tinyint, uniqueIndex } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  perfil: varchar("perfil", { length: 50 }).default("user"),
  senha: varchar("senha", { length: 255 }),
  profissionalVinculadoId: int("profissionalVinculadoId"),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Jornada contratual configurada pelo master para cada recepcionista. */
export const pontoJornadas = mysqlTable("pontoJornadas", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  horaEntrada: varchar("horaEntrada", { length: 5 }).notNull().default("08:00"),
  inicioIntervalo: varchar("inicioIntervalo", { length: 5 }).notNull().default("12:00"),
  fimIntervalo: varchar("fimIntervalo", { length: 5 }).notNull().default("13:00"),
  horaSaida: varchar("horaSaida", { length: 5 }).notNull().default("17:00"),
  toleranciaMarcacaoMinutos: int("toleranciaMarcacaoMinutos").notNull().default(5),
  toleranciaDiariaMinutos: int("toleranciaDiariaMinutos").notNull().default(10),
  adicionalHoraExtra: decimal("adicionalHoraExtra", { precision: 5, scale: 2 }).notNull().default("50.00"),
  valorHora: decimal("valorHora", { precision: 10, scale: 2 }).notNull().default("0.00"),
  ativo: tinyint("ativo").notNull().default(1),
  criadoPorUsuarioId: int("criadoPorUsuarioId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("ponto_jornadas_usuario_unico").on(table.usuarioId)]);

/** Espelho diário de marcações: entrada, intervalo, retorno e saída. */
export const pontoRegistros = mysqlTable("pontoRegistros", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  data: date("data").notNull(),
  entrada: varchar("entrada", { length: 5 }),
  inicioIntervalo: varchar("inicioIntervalo", { length: 5 }),
  fimIntervalo: varchar("fimIntervalo", { length: 5 }),
  saida: varchar("saida", { length: 5 }),
  status: varchar("status", { length: 20 }).notNull().default("aberto"),
  justificativa: text("justificativa"),
  ajustadoPorUsuarioId: int("ajustadoPorUsuarioId"),
  metodoValidacao: varchar("metodoValidacao", { length: 30 }).notNull().default("manual"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  precisaoMetros: int("precisaoMetros"),
  distanciaMetros: int("distanciaMetros"),
  confiancaFacial: decimal("confiancaFacial", { precision: 6, scale: 4 }),
  fechado: tinyint("fechado").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("ponto_registros_usuario_data_unico").on(table.usuarioId, table.data)]);

/** Trilha de auditoria obrigatória para correções realizadas pelo master. */
export const pontoAjustes = mysqlTable("pontoAjustes", {
  id: int("id").autoincrement().primaryKey(),
  registroId: int("registroId").notNull(),
  ajustadoPorUsuarioId: int("ajustadoPorUsuarioId").notNull(),
  valoresAnteriores: text("valoresAnteriores").notNull(),
  valoresNovos: text("valoresNovos").notNull(),
  justificativa: text("justificativa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Ocorrências justificadas que dispensam marcação e não devem ser apuradas como falta. */
export const pontoOcorrencias = mysqlTable("pontoOcorrencias", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  tipo: mysqlEnum("tipo", ["folga", "ferias", "atestado"]).notNull(),
  dataInicio: date("dataInicio").notNull(),
  dataFim: date("dataFim").notNull(),
  observacao: text("observacao"),
  registradoPorUsuarioId: int("registradoPorUsuarioId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Fechamento mensal efetuado pelo master, que bloqueia novas alterações na competência. */
export const pontoFechamentos = mysqlTable("pontoFechamentos", {
  id: int("id").autoincrement().primaryKey(),
  competencia: varchar("competencia", { length: 7 }).notNull(),
  fechadoPorUsuarioId: int("fechadoPorUsuarioId").notNull(),
  observacao: text("observacao"),
  fechadoEm: timestamp("fechadoEm").defaultNow().notNull(),
}, (table) => [uniqueIndex("ponto_fechamentos_competencia_unico").on(table.competencia)]);

/** Descritor facial criptograficamente sensível, usado somente para autenticar o ponto. */
export const pontoBiometrias = mysqlTable("pontoBiometrias", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  descritorFacial: text("descritorFacial").notNull(),
  consentimentoVersao: varchar("consentimentoVersao", { length: 20 }).notNull(),
  consentidoEm: timestamp("consentidoEm").defaultNow().notNull(),
  revogadoEm: timestamp("revogadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("ponto_biometrias_usuario_unico").on(table.usuarioId)]);

/** Registro de consentimento destacado, separado do cadastro biométrico. */
export const pontoConsentimentos = mysqlTable("pontoConsentimentos", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuarioId").notNull(),
  versao: varchar("versao", { length: 20 }).notNull(),
  aceito: tinyint("aceito").notNull(),
  texto: text("texto").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

/** Geocerca configurada pelo master para as batidas presenciais. */
export const pontoLocalidades = mysqlTable("pontoLocalidades", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 120 }).notNull().default("CLÍNICA CLIPSI"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  raioMetros: int("raioMetros").notNull().default(150),
  ativo: tinyint("ativo").notNull().default(1),
  atualizadoPorUsuarioId: int("atualizadoPorUsuarioId"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * SystemConfig table — configurações globais do sistema
 */
export const systemConfig = mysqlTable("systemConfig", {
  id: int("id").autoincrement().primaryKey(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: text("valor"),
  descricao: varchar("descricao", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;

/**
 * Pacientes table
 */
export const pacientes = mysqlTable("pacientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).notNull().unique(),
  dataNascimento: date("dataNascimento").notNull(),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  whatsapp: varchar("whatsapp", { length: 20 }),
  recebeLembretesWhatsapp: tinyint("recebeLembretesWhatsapp").default(1),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  cartaoSUS: varchar("cartaoSUS", { length: 20 }),
  convenioId: int("convenioId"),
  numeroCarteira: varchar("numeroCarteira", { length: 50 }),
  validadeCarteira: date("validadeCarteira"),
  pedidoMedicoUrl: text("pedidoMedicoUrl"),
  dataVencimentoPedido: date("dataVencimentoPedido"),
  alertaVencimentoEnviado: tinyint("alertaVencimentoEnviado").default(0),
  anexoUrl: text("anexoUrl"),
  // Dados do médico solicitante para autorização GEAP
  nomeMedicoSolicitante: varchar("nomeMedicoSolicitante", { length: 255 }),
  crmMedicoSolicitante: varchar("crmMedicoSolicitante", { length: 20 }),
  ufMedicoSolicitante: varchar("ufMedicoSolicitante", { length: 2 }),
  cbosMedicoSolicitante: varchar("cbosMedicoSolicitante", { length: 10 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Paciente = typeof pacientes.$inferSelect;
export type InsertPaciente = typeof pacientes.$inferInsert;

/**
 * Profissionais table
 */
export const profissionais = mysqlTable("profissionais", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cpf: varchar("cpf", { length: 14 }).unique(),
  dataNascimento: date("dataNascimento"),
  crm: varchar("crm", { length: 50 }).notNull().unique(),
  especialidade: varchar("especialidade", { length: 100 }).notNull(),
  conselhoProfissional: varchar("conselhoProfissional", { length: 10 }).default("CRM"),
  codigoConselho: varchar("codigoConselho", { length: 2 }),
  numeroConselho: varchar("numeroConselho", { length: 30 }),
  codigoCBO: varchar("codigoCBO", { length: 10 }),
  cbos: varchar("cbos", { length: 10 }),
  uf: varchar("uf", { length: 2 }),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  anexoUrl: text("anexoUrl"),
  percentualRepasse: decimal("percentualRepasse", { precision: 5, scale: 2 }).default("70.00"),
  percentualConvenio: decimal("percentualConvenio", { precision: 5, scale: 2 }).default("70.00"),
  percentualParticular: decimal("percentualParticular", { precision: 5, scale: 2 }).default("70.00"),
  percentualTesteAvulso: decimal("percentualTesteAvulso", { precision: 5, scale: 2 }).default("70.00"),
  percentualAvaliacaoNeuropsicologica: decimal("percentualAvaliacaoNeuropsicologica", { precision: 5, scale: 2 }).default("70.00"),
  ativo: tinyint("ativo").default(1).notNull(),
  duracaoPadrao: int("duracaoPadrao").default(30).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profissional = typeof profissionais.$inferSelect;
export type InsertProfissional = typeof profissionais.$inferInsert;

/**
 * Convênios table
 */
export const convenios = mysqlTable("convenios", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  cnpj: varchar("cnpj", { length: 18 }),  // sem unique — vários convênios podem compartilhar o mesmo CNPJ contratante
  tipoIdentificacao: varchar("tipoIdentificacao", { length: 50 }),
  codigoOperadora: varchar("codigoOperadora", { length: 10 }),
  registroANS: varchar("registroANS", { length: 20 }),
  codigoNaOperadora: varchar("codigoNaOperadora", { length: 50 }),
  contratado: varchar("contratado", { length: 255 }),
  planos: text("planos"),
  logoUrl: text("logoUrl"),
  email: varchar("email", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  aniversarioConvenio: date("aniversarioConvenio"),
  alertaAniversarioEnviado: tinyint("alertaAniversarioEnviado").default(0),
  anexoUrl: text("anexoUrl"),
  ativo: tinyint("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Convenio = typeof convenios.$inferSelect;
export type InsertConvenio = typeof convenios.$inferInsert;

/**
 * Autorizações table
 */
export const autorizacoes = mysqlTable("autorizacoes", {
  id: int("id").autoincrement().primaryKey(),
  numeroAutorizacao: varchar("numeroAutorizacao", { length: 20 }).notNull().unique(),
  pacienteId: int("pacienteId").notNull(),
  convenioId: int("convenioId").notNull(),
  procedimento: varchar("procedimento", { length: 255 }).notNull(),
  dataAutorizacao: date("dataAutorizacao").notNull(),
  dataValidade: date("dataValidade").notNull(),
  quantidadeSessoes: int("quantidadeSessoes"),
  status: mysqlEnum("status", ["ativa", "utilizada", "expirada", "cancelada"]).default("ativa").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Autorizacao = typeof autorizacoes.$inferSelect;
export type InsertAutorizacao = typeof autorizacoes.$inferInsert;

/**
 * Atendimentos table
 */
export const atendimentos = mysqlTable("atendimentos", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  convenioId: int("convenioId").notNull(),
  data: date("data").notNull(),
  hora: varchar("hora", { length: 5 }).notNull(),
  duracao: int("duracao"),
  // Quantidade remunerável de blocos na mesma data. O padrão mantém uma sessão;
  // o valor pode ser elevado, de forma auditável, em pilotos de atendimento longo.
  unidadesRepasse: int("unidadesRepasse").notNull().default(1),
  tipo: varchar("tipo", { length: 50 }).notNull(),
  descricao: text("descricao"),
  status: mysqlEnum("status", ["agendado", "realizado", "cancelado", "falta"]).default("agendado").notNull(),
  recorrencia: varchar("recorrencia", { length: 50 }),
  serieId: varchar("serieId", { length: 36 }),
  diasSemana: varchar("diasSemana", { length: 50 }),
  dataLimiteProntuario: timestamp("dataLimiteProntuario"),
  liberadoPorMaster: tinyint("liberadoPorMaster").default(0),
  motLiberacao: text("motLiberacao"),
  reagendadoPara: int("reagendadoPara"),
  atendimentoAnteriorId: int("atendimentoAnteriorId"),
  prontuarioFeito: tinyint("prontuarioFeito").default(0),
  procedimentoConvenioId: int("procedimentoConvenioId"),
  guiaId: int("guiaId"),
  compartilhadoCom: text("compartilhadoCom"),
  lembreteSolicitado: tinyint("lembreteSolicitado").default(0),
  lembreteEnviado: tinyint("lembreteEnviado").default(0),
  dataEnvioLembrete: timestamp("dataEnvioLembrete"),
  confirmacaoAtendimento: tinyint("confirmacaoAtendimento"),
  dataConfirmacao: timestamp("dataConfirmacao"),
  confirmacaoToken: varchar("confirmacaoToken", { length: 128 }),
  confirmacaoTokenExpiresAt: timestamp("confirmacaoTokenExpiresAt"),
  confirmacaoStatus: mysqlEnum("confirmacaoStatus", ["pendente", "confirmado", "cancelado"]).default("pendente"),
  pagamentoParticularId: int("pagamentoParticularId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Atendimento = typeof atendimentos.$inferSelect;
export type InsertAtendimento = typeof atendimentos.$inferInsert;

/**
 * Guias SP/SADT table
 */
export const guias = mysqlTable("guias", {
  id: int("id").autoincrement().primaryKey(),
  numeroGuia: varchar("numeroGuia", { length: 20 }).notNull().unique(),
  pacienteId: int("pacienteId").notNull(),
  guiaPrincipalId: int("guiaPrincipalId"), // Vincula guia de série à guia principal
  profissionalId: int("profissionalId").notNull(),
  convenioId: int("convenioId").notNull(),
  autorizacaoId: int("autorizacaoId"),
  atendimentoId: int("atendimentoId"),
  dataEmissao: date("dataEmissao").notNull(),
  procedimento: varchar("procedimento", { length: 255 }).notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["rascunho", "emitida", "enviada", "processada", "paga", "glosa"]).default("rascunho").notNull(),
  repasseFinalizado: tinyint("repasseFinalizado").default(0),
  assinadoPaciente: tinyint("assinadoPaciente").default(0),
  dataAssinaturaPaciente: timestamp("dataAssinaturaPaciente"),
  assinaturaPacienteUrl: text("assinaturaPacienteUrl"),
  totalSessoes: int("totalSessoes").default(0),
  saldoSessoes: int("saldoSessoes").default(0), // Saldo de sessões disponíveis para a série
  // ===== Campos TISS SP/SADT ====
  loteId: int("loteId"),
  numeroGuiaOperadora: varchar("numeroGuiaOperadora", { length: 20 }),
  numeroGuiaPrincipal: varchar("numeroGuiaPrincipal", { length: 20 }),
  // Autorização
  senhaAutorizacao: varchar("senhaAutorizacao", { length: 20 }),
  dataAutorizacao: date("dataAutorizacao"),
  dataValidadeSenha: date("dataValidadeSenha"),
  // Beneficiário
  numeroCarteira: varchar("numeroCarteira", { length: 20 }),
  validadeCarteira: date("validadeCarteira"),
  atendimentoRN: mysqlEnum("atendimentoRN", ["S", "N"]).default("N"),
  // Atendimento (tabelas de domínio TISS)
  caraterAtendimento: mysqlEnum("caraterAtendimento", ["1", "2"]).default("1"), // 1=Eletivo 2=Urgência/Emergência
  tipoAtendimento: varchar("tipoAtendimento", { length: 2 }).default("05"),
  indicacaoAcidente: varchar("indicacaoAcidente", { length: 1 }).default("9"), // 0=trab 1=trânsito 2=outros 9=não acidente
  tipoConsulta: varchar("tipoConsulta", { length: 1 }),
  regimeAtendimento: varchar("regimeAtendimento", { length: 2 }),
  // Diagnóstico
  cid10Principal: varchar("cid10Principal", { length: 10 }),
  // Valores totais
  valorProcedimentos: decimal("valorProcedimentos", { precision: 10, scale: 2 }),
  valorTaxasAlugueis: decimal("valorTaxasAlugueis", { precision: 10, scale: 2 }),
  valorMateriais: decimal("valorMateriais", { precision: 10, scale: 2 }),
  valorOPME: decimal("valorOPME", { precision: 10, scale: 2 }),
  valorMedicamentos: decimal("valorMedicamentos", { precision: 10, scale: 2 }),
  valorGasesMedicinais: decimal("valorGasesMedicinais", { precision: 10, scale: 2 }),
  valorTotalGeral: decimal("valorTotalGeral", { precision: 10, scale: 2 }),
  indicacaoClinica: text("indicacaoClinica"),
  motivoEncerramento: varchar("motivoEncerramento", { length: 2 }),
  saudeOcupacional: varchar("saudeOcupacional", { length: 1 }),
  // Mantém o espelho dos demais campos editáveis do formulário oficial sem
  // perder informações que ainda não possuem coluna própria na guia.
  dadosPrefaturamento: text("dadosPrefaturamento"),
  observacoesTISS: text("observacoesTISS"),
  numeroGuiaInterno: varchar("numeroGuiaInterno", { length: 30 }),
  // ===== Campos de Série =====
  serieId: varchar("serieId", { length: 36 }),
  serieNumero: int("serieNumero"),
  serieSessaoInicio: int("serieSessaoInicio"),
  serieSessaoFim: int("serieSessaoFim"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guia = typeof guias.$inferSelect;
export type InsertGuia = typeof guias.$inferInsert;

/**
 * Prontuários table
 */
export const prontuarios = mysqlTable("prontuarios", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  atendimentoId: int("atendimentoId").notNull(),
  tipoRegistro: mysqlEnum("tipoRegistro", ["anamnese", "continuidade"]).default("continuidade").notNull(),
  queixa: text("queixa"),
  diagnostico: text("diagnostico"),
  tratamento: text("tratamento"),
  observacoes: text("observacoes"),
  statusAtraso: mysqlEnum("statusAtraso", ["noTempo", "atrasado", "liberado"]).default("noTempo").notNull(),
  contratoTerapeuticoAssinado: tinyint("contratoTerapeuticoAssinado").default(0),
  dataAssinaturaContrato: timestamp("dataAssinaturaContrato"),
  contratoTerapeuticoUrl: text("contratoTerapeuticoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prontuario = typeof prontuarios.$inferSelect;
export type InsertProntuario = typeof prontuarios.$inferInsert;

/**
 * Faturamento table
 */
export const faturamentos = mysqlTable("faturamentos", {
  id: int("id").autoincrement().primaryKey(),
  numeroNota: varchar("numeroNota", { length: 20 }).notNull().unique(),
  convenioId: int("convenioId").notNull(),
  dataEmissao: date("dataEmissao").notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  totalGuias: int("totalGuias").notNull(),
  valorTotal: decimal("valorTotal", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["rascunho", "emitida", "enviada", "recebida", "paga", "parcial"]).default("rascunho").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Faturamento = typeof faturamentos.$inferSelect;
export type InsertFaturamento = typeof faturamentos.$inferInsert;

/**
 * Liberações de Prontuário table
 */
export const liberacoesProntuario = mysqlTable("liberacoesProntuario", {
  id: int("id").autoincrement().primaryKey(),
  atendimentoId: int("atendimentoId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  masterId: int("masterId").notNull(),
  motivo: text("motivo").notNull(),
  status: mysqlEnum("status", ["pendente", "aprovada", "rejeitada"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LiberacaoProntuario = typeof liberacoesProntuario.$inferSelect;
export type InsertLiberacaoProntuario = typeof liberacoesProntuario.$inferInsert;

/**
 * Tabela de Procedimentos (Tabela ANS)
 */
export const tabelaProcedimentos = mysqlTable("tabelaProcedimentos", {
  id: int("id").autoincrement().primaryKey(),
  codigoANS: varchar("codigoANS", { length: 10 }).notNull().unique(),
  descricao: text("descricao").notNull(),
  especialidade: varchar("especialidade", { length: 100 }),
  grupoANS: varchar("grupoANS", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TabelaProcedimento = typeof tabelaProcedimentos.$inferSelect;
export type InsertTabelaProcedimento = typeof tabelaProcedimentos.$inferInsert;

/**
 * Procedimentos por Convênio (Valores e Códigos específicos do convênio)
 */
export const procedimentosPorConvenio = mysqlTable("procedimentosPorConvenio", {
  id: int("id").autoincrement().primaryKey(),
  convenioId: int("convenioId").notNull(),
  tabelaProcedimentoId: int("tabelaProcedimentoId").notNull(),
  codigoConvenio: varchar("codigoConvenio", { length: 20 }).notNull(),
  descricaoConvenio: text("descricaoConvenio"),
  tabelaOrigem: varchar("tabelaOrigem", { length: 255 }),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  valorMinimo: decimal("valorMinimo", { precision: 10, scale: 2 }),
  valorMaximo: decimal("valorMaximo", { precision: 10, scale: 2 }),
  ativo: tinyint("ativo").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProcedimentoPorConvenio = typeof procedimentosPorConvenio.$inferSelect;
export type InsertProcedimentoPorConvenio = typeof procedimentosPorConvenio.$inferInsert;


/**
 * Histórico de Alterações de Atendimentos
 */
export const historicoAlteracoes = mysqlTable("historicoAlteracoes", {
  id: int("id").autoincrement().primaryKey(),
  atendimentoId: int("atendimentoId").notNull().references(() => atendimentos.id, { onDelete: "cascade" }),
  usuarioId: int("usuarioId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tipoAlteracao: varchar("tipoAlteracao", { length: 50 }).notNull(), // 'data', 'hora', 'profissional', 'status'
  valorAnterior: text("valorAnterior"),
  valorNovo: text("valorNovo"),
  descricao: text("descricao"),
  dataHora: timestamp("dataHora").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricoAlteracao = typeof historicoAlteracoes.$inferSelect;
export type InsertHistoricoAlteracao = typeof historicoAlteracoes.$inferInsert;

/**
 * Contratos Terapêuticos table
 */
export const contratosTerapêuticos = mysqlTable("contratosTerapêuticos", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  conteudo: text("conteudo").notNull(),
  assinado: tinyint("assinado").default(0),
  dataAssinatura: timestamp("dataAssinatura"),
  assinaturaPacienteUrl: text("assinaturaPacienteUrl"),
  hashAssinatura: varchar("hashAssinatura", { length: 255 }),
  tokenAssinatura: varchar("tokenAssinatura", { length: 128 }),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  ativo: tinyint("ativo").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContratoTerapeutico = typeof contratosTerapêuticos.$inferSelect;
export type InsertContratoTerapeutico = typeof contratosTerapêuticos.$inferInsert;

/**
 * Assinaturas de Guias table
 */
export const assinaturasGuias = mysqlTable("assinaturasGuias", {
  id: int("id").autoincrement().primaryKey(),
  guiaId: int("guiaId").notNull(),
  pacienteId: int("pacienteId").notNull(),
  assinaturaPacienteUrl: text("assinaturaPacienteUrl"),
  dataAssinatura: timestamp("dataAssinatura").defaultNow().notNull(),
  hashAssinatura: varchar("hashAssinatura", { length: 255 }),
  sessaoNumero: int("sessaoNumero").notNull(),
  // Token para assinatura via WhatsApp (público, sem autenticação)
  token: varchar("token", { length: 128 }),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Datas de atendimento incluídas no link (JSON array de strings "YYYY-MM-DD")
  datasAtendimento: text("datasAtendimento"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AssinaturaGuia = typeof assinaturasGuias.$inferSelect;
export type InsertAssinaturaGuia = typeof assinaturasGuias.$inferInsert;

/**
 * Itens de Procedimento da Guia SP/SADT (procedimentosExecutados no TISS)
 */
export const guiaProcedimentos = mysqlTable("guiaProcedimentos", {
  id: int("id").autoincrement().primaryKey(),
  guiaId: int("guiaId").notNull(),
  sequencial: int("sequencial").notNull().default(1),
  dataExecucao: date("dataExecucao"),
  horaInicial: varchar("horaInicial", { length: 5 }),
  horaFinal: varchar("horaFinal", { length: 5 }),
  codigoTabela: varchar("codigoTabela", { length: 2 }).default("22"), // 22 = TUSS
  codigoProcedimento: varchar("codigoProcedimento", { length: 15 }).notNull(), // código TUSS
  descricaoProcedimento: varchar("descricaoProcedimento", { length: 255 }).notNull(),
  quantidadeExecutada: decimal("quantidadeExecutada", { precision: 10, scale: 2 }).notNull().default("1"),
  valorUnitario: decimal("valorUnitario", { precision: 10, scale: 2 }).notNull().default("0"),
  valorTotal: decimal("valorTotal", { precision: 10, scale: 2 }).notNull().default("0"),
  reducaoAcrescimo: decimal("reducaoAcrescimo", { precision: 5, scale: 2 }).default("1"),
  profissionalId: int("profissionalId"), // profissional executante desta linha
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GuiaProcedimento = typeof guiaProcedimentos.$inferSelect;
export type InsertGuiaProcedimento = typeof guiaProcedimentos.$inferInsert;

/**
 * Lotes de Faturamento TISS (agrupam guias para envio à operadora)
 */
export const lotesFaturamento = mysqlTable("lotesFaturamento", {
  id: int("id").autoincrement().primaryKey(),
  numeroLote: varchar("numeroLote", { length: 20 }).notNull(),
  convenioId: int("convenioId").notNull(),
  versaoTISS: varchar("versaoTISS", { length: 10 }).default("4.01.00").notNull(),
  tipoTransacao: varchar("tipoTransacao", { length: 30 }).default("ENVIO_LOTE_GUIAS").notNull(),
  sequencialTransacao: varchar("sequencialTransacao", { length: 12 }),
  registroANS: varchar("registroANS", { length: 6 }),
  cnpjPrestador: varchar("cnpjPrestador", { length: 14 }),
  codigoPrestadorNaOperadora: varchar("codigoPrestadorNaOperadora", { length: 14 }),
  nomePrestador: varchar("nomePrestador", { length: 255 }),
  cnesPrestador: varchar("cnesPrestador", { length: 7 }),
  quantidadeGuias: int("quantidadeGuias").default(0),
  valorTotalLote: decimal("valorTotalLote", { precision: 12, scale: 2 }).default("0"),
  hashXML: varchar("hashXML", { length: 32 }),
  xmlKey: varchar("xmlKey", { length: 255 }),
  xmlUrl: text("xmlUrl"),
  status: mysqlEnum("status", ["aberto", "gerado", "enviado", "processado"]).default("aberto").notNull(),
  dataGeracao: timestamp("dataGeracao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoteFaturamento = typeof lotesFaturamento.$inferSelect;
export type InsertLoteFaturamento = typeof lotesFaturamento.$inferInsert;

/**
 * Dados do Prestador (configuração única da clínica para o TISS)
 */
export const dadosPrestador = mysqlTable("dadosPrestador", {
  id: int("id").autoincrement().primaryKey(),
  razaoSocial: varchar("razaoSocial", { length: 255 }).notNull(),
  nomeFantasia: varchar("nomeFantasia", { length: 255 }),
  cnpj: varchar("cnpj", { length: 18 }).notNull(),
  cnes: varchar("cnes", { length: 7 }),
  codigoPrestadorNaOperadora: varchar("codigoPrestadorNaOperadora", { length: 14 }),
  versaoTISSPadrao: varchar("versaoTISSPadrao", { length: 10 }).default("4.01.00"),
  // Campos de endereço e contato
  cep: varchar("cep", { length: 10 }),
  logradouro: varchar("logradouro", { length: 255 }),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  telefone: varchar("telefone", { length: 20 }),
  celular: varchar("celular", { length: 20 }),
  email: varchar("email", { length: 255 }),
  site: varchar("site", { length: 255 }),
  // Dados bancários
  banco: varchar("banco", { length: 100 }),
  agencia: varchar("agencia", { length: 20 }),
  conta: varchar("conta", { length: 30 }),
  tipoConta: varchar("tipoConta", { length: 20 }),
  pix: varchar("pix", { length: 255 }),
  // Responsável técnico
  nomeResponsavel: varchar("nomeResponsavel", { length: 255 }),
  cpfResponsavel: varchar("cpfResponsavel", { length: 14 }),
  crmResponsavel: varchar("crmResponsavel", { length: 50 }),
  emailResponsavel: varchar("emailResponsavel", { length: 255 }),
  telefoneResponsavel: varchar("telefoneResponsavel", { length: 20 }),
    // Configurações ANS
  registroANS: varchar("registroANS", { length: 20 }),
  inscricaoEstadual: varchar("inscricaoEstadual", { length: 30 }),
  inscricaoMunicipal: varchar("inscricaoMunicipal", { length: 30 }),
  // Logo da clínica
  logoUrl: text("logoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DadosPrestador = typeof dadosPrestador.$inferSelect;
export type InsertDadosPrestador = typeof dadosPrestador.$inferInsert;

/**
 * Alertas de prontuários pendentes.
 * Registra o reconhecimento obrigatório ("Ciente") do profissional sobre
 * atendimentos realizados sem prontuário preenchido. Um registro é criado
 * por (profissionalId + atendimentoId). Os campos `dataReconhecimento` e
 * `horaReconhecimento` marcam quando o profissional clicou em "Ciente".
 */
export const alertasProntuarioPendente = mysqlTable("alertasProntuarioPendente", {
  id: int("id").autoincrement().primaryKey(),
  atendimentoId: int("atendimentoId").notNull(),
  profissionalId: int("profissionalId").notNull(),
  status: mysqlEnum("status", ["pendente", "reconhecido", "resolvido"]).default("pendente").notNull(),
  dataAlerta: timestamp("dataAlerta").defaultNow().notNull(),
  dataReconhecimento: timestamp("dataReconhecimento"),
  horaReconhecimento: varchar("horaReconhecimento", { length: 5 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertaProntuarioPendente = typeof alertasProntuarioPendente.$inferSelect;
export type InsertAlertaProntuarioPendente = typeof alertasProntuarioPendente.$inferInsert;
/** Registro diário de ciência dos avisos obrigatórios exibidos aos profissionais. */
export const cienciasAvisosProfissionais = mysqlTable("cienciasAvisosProfissionais", {
  id: int("id").autoincrement().primaryKey(),
  codigoAviso: varchar("codigoAviso", { length: 100 }).notNull(),
  userId: int("userId").notNull(),
  profissionalId: int("profissionalId"),
  dataReferencia: date("dataReferencia").notNull(),
  dataCiencia: timestamp("dataCiencia").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CienciaAvisoProfissional = typeof cienciasAvisosProfissionais.$inferSelect;
export type InsertCienciaAvisoProfissional = typeof cienciasAvisosProfissionais.$inferInsert;


/**
 * Anamnese do paciente (acesso restrito: master e profissional)
 */
export const anamneses = mysqlTable("anamneses", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("pacienteId").notNull(),
  profissionalId: int("profissionalId"),
  tokenPreenchimento: varchar("tokenPreenchimento", { length: 128 }),
  tokenPreenchimentoExpiresAt: timestamp("tokenPreenchimentoExpiresAt"),
  preenchidaPeloPaciente: tinyint("preenchidaPeloPaciente").default(0).notNull(),
  dataPreenchimentoPaciente: timestamp("dataPreenchimentoPaciente"),
  dataEnvioWhatsapp: timestamp("dataEnvioWhatsapp"),
  queixaPrincipal: text("queixaPrincipal"),
  historiaDoenca: text("historiaDoenca"),
  historiaFamiliar: text("historiaFamiliar"),
  historiaSocial: text("historiaSocial"),
  antecedentesPatologicos: text("antecedentesPatologicos"),
  medicamentosEmUso: text("medicamentosEmUso"),
  alergias: text("alergias"),
  cirurgiasAnteriores: text("cirurgiasAnteriores"),
  habitos: text("habitos"),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Anamnese = typeof anamneses.$inferSelect;
export type InsertAnamnese = typeof anamneses.$inferInsert;



/**
 * Notificações in-app geradas por eventos do sistema (confirmações, cancelamentos, assinaturas).
 * Permite filtrar e marcar como lidas directamente na interface.
 */
export const notificacoesInApp = mysqlTable("notificacoes_in_app", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", [
    "confirmacao",    // paciente confirmou a consulta
    "cancelamento",   // paciente cancelou a consulta
    "assinatura",     // paciente assinou a guia SADT
    "sistema",        // outros eventos do sistema
  ]).notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  conteudo: text("conteudo"),
  lida: tinyint("lida").default(0).notNull(),
  // Referências opcionais para navegação directa
  atendimentoId: int("atendimentoId"),
  guiaId: int("guiaId"),
  pacienteNome: varchar("pacienteNome", { length: 255 }),
  profissionalNome: varchar("profissionalNome", { length: 255 }),
  convenioNome: varchar("convenioNome", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NotificacaoInApp = typeof notificacoesInApp.$inferSelect;
export type InsertNotificacaoInApp = typeof notificacoesInApp.$inferInsert;


/**
 * Subscrições Stripe — regista o plano activo de cada clínica no portal MiFatureClinic
 */
export const subscricoes = mysqlTable("subscricoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripePriceId: varchar("stripePriceId", { length: 255 }),
  plano: mysqlEnum("plano", ["starter", "clinica", "premium"]).notNull(),
  status: mysqlEnum("status", ["active", "trialing", "past_due", "canceled", "incomplete"]).default("incomplete").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscricao = typeof subscricoes.$inferSelect;
export type InsertSubscricao = typeof subscricoes.$inferInsert;

/**
 * Assinaturas Digitais de Guias SADT
 * Cada registo representa um pedido de assinatura enviado ao paciente.
 * O token é gerado pelo sistema e enviado via WhatsApp.
 * Ao assinar, o hash SHA-256 da assinatura é calculado e guardado.
 */
export const assinaturasSadt = mysqlTable("assinaturasSadt", {
  id: int("id").autoincrement().primaryKey(),
  // Referências (guiaId e profissionalId opcionais para suportar migração de dados históricos)
  guiaId: int("guiaId"),
  pacienteId: int("pacienteId").notNull(),
  profissionalId: int("profissionalId"),
  atendimentoId: int("atendimentoId"),
  // Dados da sessão
  numeroSessao: int("numeroSessao").default(1).notNull(),
  dataSessao: date("dataSessao").notNull(),
  procedimento: varchar("procedimento", { length: 255 }).notNull(),
  // Dados do paciente (snapshot)
  pacienteNome: varchar("pacienteNome", { length: 255 }).notNull(),
  pacienteCpf: varchar("pacienteCpf", { length: 14 }),
  pacienteWhatsapp: varchar("pacienteWhatsapp", { length: 20 }),
  // Token de acesso público
  token: varchar("token", { length: 128 }).notNull().unique(),
  tokenExpiresAt: timestamp("tokenExpiresAt").notNull(),
  // Assinatura
  status: mysqlEnum("status", ["pendente", "assinado", "expirado", "cancelado"]).default("pendente").notNull(),
  assinaturaDataUrl: text("assinaturaDataUrl"),   // base64 do canvas
  assinaturaHash: varchar("assinaturaHash", { length: 64 }), // SHA-256
  ipAssinatura: varchar("ipAssinatura", { length: 45 }),
  userAgentAssinatura: text("userAgentAssinatura"),
  dataAssinatura: timestamp("dataAssinatura"),
  // Recusa de assinatura
  motivoRecusa: text("motivoRecusa"),               // preenchido quando paciente não assina
  // PDF comprovante
  pdfUrl: text("pdfUrl"),                            // URL do PDF gerado após assinatura
  // Envio WhatsApp
  whatsappEnviado: tinyint("whatsappEnviado").default(0).notNull(),
  dataEnvioWhatsapp: timestamp("dataEnvioWhatsapp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssinaturaSadt = typeof assinaturasSadt.$inferSelect;
export type InsertAssinaturaSadt = typeof assinaturasSadt.$inferInsert;

/**
 * Credenciais GEAP — armazena as credenciais de acesso ao portal da operadora GEAP
 * por clínica/prestador. Permite que o robô RPA faça login automaticamente.
 */
export const geapCredenciais = mysqlTable("geapCredenciais", {
  id: int("id").autoincrement().primaryKey(),
  // Identificação do prestador na GEAP
  codigoPrestador: varchar("codigoPrestador", { length: 20 }).notNull(), // ex: 3038084
  nomePrestador: varchar("nomePrestador", { length: 255 }),
  // Credenciais de acesso
  cpfLogin: varchar("cpfLogin", { length: 14 }).notNull(),    // CPF usado para login
  senhaLogin: varchar("senhaLogin", { length: 255 }).notNull(), // senha encriptada
  // Estado da sessão (token JWT capturado pelo robô)
  accessToken: text("accessToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  // Configurações
  ativo: tinyint("ativo").default(1).notNull(),
  convenioId: int("convenioId"), // convênio GEAP associado no sistema
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeapCredencial = typeof geapCredenciais.$inferSelect;
export type InsertGeapCredencial = typeof geapCredenciais.$inferInsert;

/**
 * Autorizações GEAP — rastreia cada pedido de autorização submetido ao portal GEAP
 * pelo robô RPA. Cada registo corresponde a uma guia SP/SADT que precisa de autorização.
 */
export const geapAutorizacoes = mysqlTable("geapAutorizacoes", {
  id: int("id").autoincrement().primaryKey(),
  // Referências internas
  guiaId: int("guiaId"),          // guia SP/SADT associada no sistema
  pacienteId: int("pacienteId").notNull(),
  convenioId: int("convenioId").notNull(),
  // Dados do beneficiário GEAP
  numeroCarteira: varchar("numeroCarteira", { length: 50 }),
  nomePaciente: varchar("nomePaciente", { length: 255 }).notNull(),
  // Dados do pedido de autorização
  codigoTUSS: varchar("codigoTUSS", { length: 15 }).notNull(), // código do procedimento
  descricaoProcedimento: varchar("descricaoProcedimento", { length: 255 }),
  cid10: varchar("cid10", { length: 10 }),
  quantidadeSessoes: int("quantidadeSessoes").notNull().default(1),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  // Tipo de atendimento
  tipoAtendimento: mysqlEnum("tipoAtendimento", ["ambulatorial", "eletivo"]).default("ambulatorial").notNull(),
  // Dados do médico solicitante
  nomeMedicoSolicitante: varchar("nomeMedicoSolicitante", { length: 255 }).notNull(),
  crmMedicoSolicitante: varchar("crmMedicoSolicitante", { length: 20 }).notNull(),
  ufMedicoSolicitante: varchar("ufMedicoSolicitante", { length: 2 }).notNull(),
  cbosMedicoSolicitante: varchar("cbosMedicoSolicitante", { length: 10 }).notNull(),
  // Anexos enviados ao portal GEAP — discriminados por tipo
  pedidoMedicoUrl: text("pedidoMedicoUrl"),       // URL do pedido médico (obrigatório)
  pedidoMedicoNomeArquivo: varchar("pedidoMedicoNomeArquivo", { length: 255 }),
  pedidoMedicoTamanho: int("pedidoMedicoTamanho"), // tamanho em bytes
  pedidoMedicoTipo: varchar("pedidoMedicoTipo", { length: 50 }), // ex: application/pdf, image/jpeg
  relatorioUrl: text("relatorioUrl"),             // URL do relatório/laudo (obrigatório)
  relatorioNomeArquivo: varchar("relatorioNomeArquivo", { length: 255 }),
  relatorioTamanho: int("relatorioTamanho"),       // tamanho em bytes
  relatorioTipo: varchar("relatorioTipo", { length: 50 }), // ex: application/pdf, image/jpeg
  // Metadados de upload
  anexosUploadadoEm: timestamp("anexosUploadadoEm"), // quando os anexos foram enviados para S3
  // Estado do robô
  status: mysqlEnum("status", [
    "pendente",      // aguardando execução do robô
    "processando",   // robô em execução
    "autorizado",    // autorização obtida com sucesso
    "negado",        // autorização negada pela operadora
    "erro",          // erro durante a execução
    "cancelado",     // cancelado pelo utilizador
  ]).default("pendente").notNull(),
  // Resultado da autorização
  numeroAutorizacaoGeap: varchar("numeroAutorizacaoGeap", { length: 30 }), // número retornado pela GEAP
  dataAutorizacaoGeap: date("dataAutorizacaoGeap"),
  validadeAutorizacaoGeap: date("validadeAutorizacaoGeap"),
  motivoNegacao: text("motivoNegacao"),
  // Log do robô
  logExecucao: text("logExecucao"),    // log detalhado da execução
  tentativas: int("tentativas").default(0).notNull(),
  ultimaTentativa: timestamp("ultimaTentativa"),
  // Metadados
  solicitadoPor: int("solicitadoPor"), // userId do operador que solicitou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GeapAutorizacao = typeof geapAutorizacoes.$inferSelect;
export type InsertGeapAutorizacao = typeof geapAutorizacoes.$inferInsert;

/**
 * Credenciais do Portal do Referenciado Bradesco. A senha é sempre gravada
 * criptografada pelo backend e nunca é devolvida para o navegador.
 */
export const bradescoCredenciais = mysqlTable("bradescoCredenciais", {
  id: int("id").autoincrement().primaryKey(),
  cpfResponsavel: varchar("cpfResponsavel", { length: 14 }).notNull(),
  cnpjPrestador: varchar("cnpjPrestador", { length: 18 }).notNull(),
  nomePrestador: varchar("nomePrestador", { length: 255 }),
  senhaLogin: varchar("senhaLogin", { length: 255 }).notNull(),
  modoExecucao: mysqlEnum("modoExecucao", ["assistido_sob_demanda"]).default("assistido_sob_demanda").notNull(),
  ativo: tinyint("ativo").default(1).notNull(),
  convenioId: int("convenioId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BradescoCredencial = typeof bradescoCredenciais.$inferSelect;

/**
 * Fila de pedidos SADT para o portal do referenciado Bradesco. O vínculo por
 * guia permite que o retorno da operadora atualize a guia de série correta.
 */
export const bradescoAutorizacoes = mysqlTable("bradescoAutorizacoes", {
  id: int("id").autoincrement().primaryKey(),
  guiaId: int("guiaId").notNull(),
  pacienteId: int("pacienteId").notNull(),
  convenioId: int("convenioId").notNull(),
  numeroCarteira: varchar("numeroCarteira", { length: 50 }),
  validadeCarteira: date("validadeCarteira"),
  nomePaciente: varchar("nomePaciente", { length: 255 }).notNull(),
  codigoTUSS: varchar("codigoTUSS", { length: 20 }).notNull(),
  descricaoProcedimento: varchar("descricaoProcedimento", { length: 255 }),
  cid10: varchar("cid10", { length: 10 }).notNull().default("F41"),
  quantidadeSessoes: int("quantidadeSessoes").notNull().default(1),
  dataInicio: date("dataInicio"),
  dataFim: date("dataFim"),
  nomeMedicoSolicitante: varchar("nomeMedicoSolicitante", { length: 255 }),
  crmMedicoSolicitante: varchar("crmMedicoSolicitante", { length: 30 }),
  ufMedicoSolicitante: varchar("ufMedicoSolicitante", { length: 2 }),
  cbosMedicoSolicitante: varchar("cbosMedicoSolicitante", { length: 10 }),
  pedidoMedicoUrl: text("pedidoMedicoUrl"),
  pedidoMedicoNomeArquivo: varchar("pedidoMedicoNomeArquivo", { length: 255 }),
  status: mysqlEnum("status", [
    "pendente_documentacao",
    "pendente",
    "aguardando_acao_humana",
    "enviado_portal",
    "liberada",
    "autorizado",
    "negado",
    "erro",
    "cancelado",
  ]).default("pendente").notNull(),
  protocoloBradesco: varchar("protocoloBradesco", { length: 50 }),
  numeroAutorizacaoBradesco: varchar("numeroAutorizacaoBradesco", { length: 40 }),
  senhaAutorizacaoBradesco: varchar("senhaAutorizacaoBradesco", { length: 30 }),
  dataAutorizacaoBradesco: date("dataAutorizacaoBradesco"),
  validadeAutorizacaoBradesco: date("validadeAutorizacaoBradesco"),
  sessoesAutorizadas: int("sessoesAutorizadas"),
  motivoNegacao: text("motivoNegacao"),
  logExecucao: text("logExecucao"),
  tentativas: int("tentativas").default(0).notNull(),
  ultimaTentativa: timestamp("ultimaTentativa"),
  solicitadoPor: int("solicitadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BradescoAutorizacao = typeof bradescoAutorizacoes.$inferSelect;


// ===================== EXTRATO BANCÁRIO =====================
export const extratoBancario = mysqlTable("extrato_bancario", {
  id: int("id").autoincrement().primaryKey(),
  banco: varchar("banco", { length: 50 }).notNull().default("Bradesco"),
  agencia: varchar("agencia", { length: 20 }),
  conta: varchar("conta", { length: 30 }),
  data: date("data").notNull(),
  descricao: text("descricao").notNull(),
  documento: varchar("documento", { length: 50 }),
  credito: decimal("credito", { precision: 15, scale: 2 }),
  debito: decimal("debito", { precision: 15, scale: 2 }),
  tipo: mysqlEnum("tipo", ["credito", "debito", "saldo"]).notNull(),
  categoria: varchar("categoria", { length: 100 }),
  conciliado: tinyint("conciliado").default(0),
  contaFinanceiraId: int("contaFinanceiraId"),
  arquivoOrigem: varchar("arquivoOrigem", { length: 255 }),
  importadoPor: int("importadoPor"),
  importadoEm: timestamp("importadoEm").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExtratoBancario = typeof extratoBancario.$inferSelect;
export type InsertExtratoBancario = typeof extratoBancario.$inferInsert;

// ===================== CONTAS A PAGAR =====================
export const contasPagar = mysqlTable("contas_pagar", {
  id: int("id").autoincrement().primaryKey(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }),
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataPagamento: date("dataPagamento"),
  status: mysqlEnum("status", ["pendente", "pago", "atrasado", "cancelado"]).default("pendente").notNull(),
  observacoes: text("observacoes"),
  // Vínculo do repasse criado automaticamente a partir de um pagamento particular.
  pagamentoAtendimentoId: int("pagamentoAtendimentoId").unique(),
  extratoBancarioId: int("extratoBancarioId"),
  origemExtrato: tinyint("origemExtrato").default(0),
  criadoPor: int("criadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContaPagar = typeof contasPagar.$inferSelect;
export type InsertContaPagar = typeof contasPagar.$inferInsert;

// ===================== PAGAMENTOS DE REPASSE =====================
// Cada atendimento elegível pode receber baixa individual. A competência é
// derivada da data do atendimento e permite ao profissional consultar apenas
// os pagamentos do mês selecionado.
export const pagamentosRepasse = mysqlTable("pagamentos_repasse", {
  id: int("id").autoincrement().primaryKey(),
  atendimentoId: int("atendimentoId").notNull().unique(),
  profissionalId: int("profissionalId").notNull(),
  competencia: varchar("competencia", { length: 7 }).notNull(),
  status: mysqlEnum("status", ["pendente", "pago"]).default("pendente").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  marcadoPor: int("marcadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PagamentoRepasse = typeof pagamentosRepasse.$inferSelect;
export type InsertPagamentoRepasse = typeof pagamentosRepasse.$inferInsert;

// Uma nota fiscal é associada ao profissional e à competência. O arquivo fica
// no armazenamento de documentos; o banco guarda somente seus metadados.
export const notasFiscaisRepasse = mysqlTable("notas_fiscais_repasse", {
  id: int("id").autoincrement().primaryKey(),
  profissionalId: int("profissionalId").notNull(),
  competencia: varchar("competencia", { length: 7 }).notNull(),
  arquivoKey: varchar("arquivoKey", { length: 512 }).notNull(),
  arquivoUrl: text("arquivoUrl").notNull(),
  nomeArquivo: varchar("nomeArquivo", { length: 255 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  enviadoPor: int("enviadoPor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("notas_fiscais_repasse_profissional_competencia_unique").on(table.profissionalId, table.competencia),
]);
export type NotaFiscalRepasse = typeof notasFiscaisRepasse.$inferSelect;
export type InsertNotaFiscalRepasse = typeof notasFiscaisRepasse.$inferInsert;

// ===================== CONTAS A RECEBER =====================
export const contasReceber = mysqlTable("contas_receber", {
  id: int("id").autoincrement().primaryKey(),
  descricao: varchar("descricao", { length: 255 }).notNull(),
  categoria: varchar("categoria", { length: 100 }),
  valor: decimal("valor", { precision: 15, scale: 2 }).notNull(),
  dataVencimento: date("dataVencimento").notNull(),
  dataRecebimento: date("dataRecebimento"),
  status: mysqlEnum("status", ["pendente", "recebido", "atrasado", "cancelado"]).default("pendente").notNull(),
  observacoes: text("observacoes"),
  extratoBancarioId: int("extratoBancarioId"),
  origemExtrato: tinyint("origemExtrato").default(0),
  pagamentoAtendimentoId: int("pagamentoAtendimentoId"),
  criadoPor: int("criadoPor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContaReceber = typeof contasReceber.$inferSelect;
export type InsertContaReceber = typeof contasReceber.$inferInsert;

// ===================== HORÁRIOS DE TRABALHO DOS PROFISSIONAIS =====================
export const horariosProfissional = mysqlTable("horarios_profissional", {
  id: int("id").autoincrement().primaryKey(),
  profissionalId: int("profissionalId").notNull(),
  // 0=Domingo, 1=Segunda, 2=Terça, 3=Quarta, 4=Quinta, 5=Sexta, 6=Sábado
  diaSemana: int("diaSemana").notNull(),
  horaInicio: varchar("horaInicio", { length: 5 }).notNull(), // "08:00"
  horaFim: varchar("horaFim", { length: 5 }).notNull(),       // "18:00"
  ativo: tinyint("ativo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type HorarioProfissional = typeof horariosProfissional.$inferSelect;
export type InsertHorarioProfissional = typeof horariosProfissional.$inferInsert;

export const anexosPaciente = mysqlTable("anexos_paciente", {
  id: int("id").autoincrement().primaryKey(),
  pacienteId: int("paciente_id").notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: varchar("descricao", { length: 500 }),
  categoria: varchar("categoria", { length: 100 }).default("outros"),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  fileUrl: varchar("file_url", { length: 1000 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  tamanho: int("tamanho"),
  uploadedBy: int("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type AnexoPaciente = typeof anexosPaciente.$inferSelect;
export type InsertAnexoPaciente = typeof anexosPaciente.$inferInsert;

export const coresAtendimento = mysqlTable('cores_atendimento', {
  id: int('id').primaryKey().autoincrement(),
  tipo: varchar('tipo', { length: 100 }).notNull().unique(),
  cor: varchar('cor', { length: 20 }).notNull().default('#3b82f6'),
  corTexto: varchar('cor_texto', { length: 20 }).notNull().default('#ffffff'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
export type CoreAtendimento = typeof coresAtendimento.$inferSelect;
export type InsertCoreAtendimento = typeof coresAtendimento.$inferInsert;

// ===================== PAGAMENTOS DE ATENDIMENTOS (PARTICULARES) =====================
export const pagamentosAtendimento = mysqlTable('pagamentos_atendimento', {
  id: int('id').autoincrement().primaryKey(),
  atendimentoId: int('atendimentoId').notNull(),
  pacienteId: int('pacienteId').notNull(),
  profissionalId: int('profissionalId').notNull(),
  valor: decimal('valor', { precision: 15, scale: 2 }).notNull(),
  dataPagamento: timestamp('dataPagamento').notNull(),
  referenciaDatas: varchar('referenciaDatas', { length: 255 }).notNull(),
  metodoPagamento: mysqlEnum('metodoPagamento', ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro']).notNull(),
  // Duas formas podem compor o mesmo recebimento; o campo legado acima mantém
  // compatibilidade com relatórios e registros já existentes.
  formasPagamento: text('formasPagamento'),
  observacoes: text('observacoes'),
  comprovanteUrl: text('comprovanteUrl'),
  comprovanteKey: text('comprovanteKey'),
  atendimentosVinculados: text('atendimentosVinculados'),
  contaReceberCriadaId: int('contaReceberCriadaId'),
  criadoPor: int('criadoPor'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});
export type PagamentoAtendimento = typeof pagamentosAtendimento.$inferSelect;
export type InsertPagamentoAtendimento = typeof pagamentosAtendimento.$inferInsert;

// ===================== AUDITORIA / RASTREABILIDADE =====================
export const auditoria = mysqlTable('auditoria', {
  id: int('id').autoincrement().primaryKey(),
  /** Usuário que realizou a ação */
  usuarioId: int('usuarioId'),
  usuarioNome: varchar('usuarioNome', { length: 255 }),
  usuarioPerfil: varchar('usuarioPerfil', { length: 50 }),
  /** Tipo de entidade afetada: atendimento, prontuario, paciente, etc. */
  entidade: varchar('entidade', { length: 100 }).notNull(),
  /** ID do registro afetado */
  entidadeId: int('entidadeId'),
  /** Ação realizada: criar, editar, excluir, status, etc. */
  acao: varchar('acao', { length: 100 }).notNull(),
  /** Descrição legível da ação */
  descricao: text('descricao'),
  /** Dados anteriores (JSON) */
  dadosAnteriores: text('dadosAnteriores'),
  /** Dados novos (JSON) */
  dadosNovos: text('dadosNovos'),
  /** IP do cliente */
  ip: varchar('ip', { length: 64 }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
});
export type Auditoria = typeof auditoria.$inferSelect;
export type InsertAuditoria = typeof auditoria.$inferInsert;
