import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import {
  anexosPaciente,
  bradescoAutorizacoes,
  bradescoCredenciais,
  convenios,
  guiaProcedimentos,
  guias,
  pacientes,
  profissionais,
} from "../../drizzle/schema";
import { adminPerfilProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

const statusSchema = z.enum([
  "pendente_documentacao",
  "pendente",
  "aguardando_acao_humana",
  "enviado_portal",
  "liberada",
  "autorizado",
  "negado",
  "erro",
  "cancelado",
]);

const LOTE_BRADESCO_SETEMBRO_2026 = { inicio: "2026-09-01", fim: "2026-09-30" } as const;
const MODO_EXECUCAO_ASSISTIDO = "assistido_sob_demanda" as const;

function encryptPassword(senha: string) {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET || "bradesco-key").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return `${iv.toString("hex")}:${Buffer.concat([cipher.update(senha, "utf8"), cipher.final()]).toString("hex")}`;
}

function asDate(value?: string | null) {
  return value ? new Date(`${value}T12:00:00`) : null;
}

function filterGuidesByPeriod<T extends { dataEmissao: Date | string | null }>(rows: T[], inicio?: string, fim?: string) {
  const dataInicial = asDate(inicio)?.getTime();
  const dataFinal = asDate(fim)?.getTime();
  return rows.filter((row) => {
    if (!row.dataEmissao) return false;
    const dataDaGuia = new Date(row.dataEmissao).getTime();
    return (!dataInicial || dataDaGuia >= dataInicial) && (!dataFinal || dataDaGuia <= dataFinal);
  });
}

function hasValidDocumentUrl(value?: string | null) {
  if (!value) return false;
  if (/^\/manus-storage\/pacientes\/\d+\/anexos\/[A-Za-z0-9._/-]+$/.test(value) && !value.includes("..")) {
    return true;
  }
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

const documentUrlSchema = z.string().min(1).refine(hasValidDocumentUrl, {
  message: "Selecione um encaminhamento válido da pasta do paciente.",
});

function getPilotMissingRequirements(input: {
  numeroCarteira?: string | null;
  nomeMedicoSolicitante?: string | null;
  crmMedicoSolicitante?: string | null;
  ufMedicoSolicitante?: string | null;
  cbosMedicoSolicitante?: string | null;
  pedidoMedicoUrl?: string | null;
}) {
  const missing: string[] = [];
  if (!input.numeroCarteira?.trim()) missing.push("número da carteirinha");
  if (!input.nomeMedicoSolicitante?.trim()) missing.push("nome do médico solicitante");
  if (!input.crmMedicoSolicitante?.trim()) missing.push("CRM ou conselho do solicitante");
  if (!input.ufMedicoSolicitante?.trim()) missing.push("UF do solicitante");
  if (!input.cbosMedicoSolicitante?.trim()) missing.push("CBOS do solicitante");
  if (!hasValidDocumentUrl(input.pedidoMedicoUrl)) missing.push("encaminhamento médico anexado");
  return missing;
}

type ReferralOption = { id: number | string; nome: string; categoria: string | null; fileUrl: string };

function getReferralOptions(anexos: ReferralOption[], pedidoMedicoUrl?: string | null) {
  const validAttachments = anexos.filter((anexo) => hasValidDocumentUrl(anexo.fileUrl));
  if (!hasValidDocumentUrl(pedidoMedicoUrl) || validAttachments.some((anexo) => anexo.fileUrl === pedidoMedicoUrl)) {
    return validAttachments;
  }
  return [{
    id: "pedido-cadastrado",
    nome: "Encaminhamento cadastrado na ficha do paciente",
    categoria: "encaminhamento",
    fileUrl: pedidoMedicoUrl!,
  }, ...validAttachments];
}

function formatLog(entry: string, previous?: string | null) {
  if (previous?.includes(entry)) return previous;
  return [previous, `[${new Date().toISOString()}] ${entry}`].filter(Boolean).join("\n");
}

function formatPortalSubmissionGuideNote(protocoloBradesco?: string | null) {
  const protocolo = protocoloBradesco?.trim();
  return `Autorização Bradesco enviada ao portal${protocolo ? `; protocolo ${protocolo}` : ""}. Aguarda análise da operadora.`;
}

function formatPortalReleasedGuideNote(input: {
  protocoloBradesco?: string | null;
  senhaAutorizacaoBradesco?: string | null;
  dataAutorizacao?: string | null;
  validadeAutorizacao?: string | null;
  sessoesAutorizadas?: number | null;
}) {
  const informados = [
    input.protocoloBradesco?.trim() ? `protocolo ${input.protocoloBradesco.trim()}` : null,
    input.senhaAutorizacaoBradesco?.trim() ? `senha ${input.senhaAutorizacaoBradesco.trim()}` : null,
    input.dataAutorizacao ? `data ${input.dataAutorizacao}` : null,
    input.validadeAutorizacao ? `validade ${input.validadeAutorizacao}` : null,
    input.sessoesAutorizadas ? `${input.sessoesAutorizadas} sessões` : null,
  ].filter(Boolean).join("; ");
  const ausentes = [
    !input.validadeAutorizacao ? "validade" : null,
    !input.sessoesAutorizadas ? "sessões" : null,
  ].filter(Boolean);
  return `Autorização Bradesco liberada pelo portal${informados ? `; ${informados}` : ""}.${ausentes.length ? ` Dados não informados pelo portal nesta consulta: ${ausentes.join(" e ")}.` : ""}`;
}

function appendGuideAuditNote(previous: string | null | undefined, note: string) {
  if (previous?.includes(note)) return previous;
  return [previous, note].filter(Boolean).join("\n");
}

function upsertPortalReleasedGuideNote(previous: string | null | undefined, input: {
  protocoloBradesco?: string | null;
  senhaAutorizacaoBradesco?: string | null;
  dataAutorizacao?: string | null;
  validadeAutorizacao?: string | null;
  sessoesAutorizadas?: number | null;
}) {
  const protocolo = input.protocoloBradesco?.trim();
  const prefixo = protocolo ? `Autorização Bradesco liberada pelo portal; protocolo ${protocolo};` : null;
  const preservadas = previous
    ?.split("\n")
    .filter((linha) => !prefixo || !linha.startsWith(prefixo))
    .join("\n");
  return appendGuideAuditNote(preservadas, formatPortalReleasedGuideNote(input));
}

type BradescoAuthorizationStats = {
  total: number;
  pendenteDocumentacao: number;
  pendente: number;
  aguardandoAcaoHumana: number;
  enviadoPortal: number;
  liberada: number;
  autorizado: number;
  negado: number;
  erro: number;
};

function calculateBradescoAuthorizationStats(rows: Array<{ status: string | null }>): BradescoAuthorizationStats {
  const stats: BradescoAuthorizationStats = {
    total: 0,
    pendenteDocumentacao: 0,
    pendente: 0,
    aguardandoAcaoHumana: 0,
    enviadoPortal: 0,
    liberada: 0,
    autorizado: 0,
    negado: 0,
    erro: 0,
  };
  for (const row of rows) {
    stats.total++;
    if (row.status === "pendente_documentacao") stats.pendenteDocumentacao++;
    if (row.status === "pendente") stats.pendente++;
    if (row.status === "aguardando_acao_humana") stats.aguardandoAcaoHumana++;
    if (row.status === "enviado_portal") stats.enviadoPortal++;
    if (row.status === "liberada") stats.liberada++;
    if (row.status === "autorizado") stats.autorizado++;
    if (row.status === "negado") stats.negado++;
    if (row.status === "erro") stats.erro++;
  }
  return stats;
}

async function carregarDadosDaGuia(guiaId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });

  const [guia] = await db.select().from(guias).where(eq(guias.id, guiaId));
  if (!guia) throw new TRPCError({ code: "NOT_FOUND", message: "Guia não encontrada." });

  const [[paciente], [profissional], [convenio], anexos] = await Promise.all([
    db.select().from(pacientes).where(eq(pacientes.id, guia.pacienteId)),
    db.select().from(profissionais).where(eq(profissionais.id, guia.profissionalId)),
    db.select().from(convenios).where(eq(convenios.id, guia.convenioId)),
    db.select().from(anexosPaciente).where(eq(anexosPaciente.pacienteId, guia.pacienteId)).orderBy(desc(anexosPaciente.createdAt)),
  ]);
  if (!paciente || !profissional || !convenio) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A guia precisa ter paciente, profissional e convênio válidos." });
  }
  if (!convenio.nome.toLowerCase().includes("bradesco")) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Esta guia não pertence ao convênio Bradesco." });
  }

  return { guia, paciente, profissional, convenio, anexos };
}

export const bradescoRouter = router({
  getCredenciais: adminPerfilProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: bradescoCredenciais.id,
      cpfResponsavel: bradescoCredenciais.cpfResponsavel,
      cnpjPrestador: bradescoCredenciais.cnpjPrestador,
      nomePrestador: bradescoCredenciais.nomePrestador,
      convenioId: bradescoCredenciais.convenioId,
      modoExecucao: bradescoCredenciais.modoExecucao,
      ativo: bradescoCredenciais.ativo,
      updatedAt: bradescoCredenciais.updatedAt,
    }).from(bradescoCredenciais).where(eq(bradescoCredenciais.ativo, 1));
  }),

  salvarCredenciais: adminPerfilProcedure.input(z.object({
    id: z.number().optional(),
    cpfResponsavel: z.string().min(11),
    cnpjPrestador: z.string().min(14),
    nomePrestador: z.string().max(255).optional(),
    senhaLogin: z.string().min(1),
    convenioId: z.number().optional(),
    modoExecucao: z.literal(MODO_EXECUCAO_ASSISTIDO).default(MODO_EXECUCAO_ASSISTIDO),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    const valores = {
      cpfResponsavel: input.cpfResponsavel,
      cnpjPrestador: input.cnpjPrestador,
      nomePrestador: input.nomePrestador,
      senhaLogin: encryptPassword(input.senhaLogin),
      convenioId: input.convenioId,
      modoExecucao: input.modoExecucao,
      updatedAt: new Date(),
    };
    if (input.id) {
      await db.update(bradescoCredenciais).set(valores).where(eq(bradescoCredenciais.id, input.id));
      return { id: input.id };
    }
    const [result] = await db.insert(bradescoCredenciais).values({ ...valores, ativo: 1 });
    return { id: Number((result as { insertId: number }).insertId) };
  }),

  guiasDisponiveis: protectedProcedure.input(z.object({
    inicio: z.string().optional(),
    fim: z.string().optional(),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      id: guias.id,
      numeroGuia: guias.numeroGuia,
      pacienteId: guias.pacienteId,
      nomePaciente: pacientes.nome,
      procedimento: guias.procedimento,
      cid10: guias.cid10Principal,
      totalSessoes: guias.totalSessoes,
      saldoSessoes: guias.saldoSessoes,
      dataEmissao: guias.dataEmissao,
      serieId: guias.serieId,
      convenioNome: convenios.nome,
    }).from(guias)
      .innerJoin(pacientes, eq(pacientes.id, guias.pacienteId))
      .innerJoin(convenios, eq(convenios.id, guias.convenioId))
      .where(and(
        eq(guias.status, "rascunho"),
        input.inicio ? gte(guias.dataEmissao, asDate(input.inicio)!) : undefined,
        input.fim ? lte(guias.dataEmissao, asDate(input.fim)!) : undefined,
      ))
      .orderBy(desc(guias.dataEmissao))
      .limit(200);
    return filterGuidesByPeriod(rows, input.inicio, input.fim)
      .filter((row) => row.convenioNome.toLowerCase().includes("bradesco") && Boolean(row.serieId));
  }),

  prepararGuia: protectedProcedure.input(z.object({ guiaId: z.number() })).query(async ({ input }) => {
    const { guia, paciente, profissional, anexos } = await carregarDadosDaGuia(input.guiaId);
    const [procedimentoGuia] = await (await getDb())!
      .select({ codigoTUSS: guiaProcedimentos.codigoProcedimento, descricao: guiaProcedimentos.descricaoProcedimento })
      .from(guiaProcedimentos)
      .where(eq(guiaProcedimentos.guiaId, guia.id))
      .limit(1);
    return {
      guia: {
        id: guia.id,
        numeroGuia: guia.numeroGuia,
        codigoTUSS: procedimentoGuia?.codigoTUSS || "",
        descricaoProcedimento: procedimentoGuia?.descricao || guia.procedimento,
        cid10: guia.cid10Principal || "F41",
        quantidadeSessoes: guia.totalSessoes || 1,
        dataInicio: guia.dataEmissao,
      },
      paciente: {
        id: paciente.id,
        nome: paciente.nome,
        numeroCarteira: paciente.numeroCarteira,
        validadeCarteira: paciente.validadeCarteira,
        pedidoMedicoUrl: paciente.pedidoMedicoUrl,
        nomeMedicoSolicitante: paciente.nomeMedicoSolicitante || profissional.nome,
        crmMedicoSolicitante: paciente.crmMedicoSolicitante || profissional.numeroConselho || profissional.crm,
        ufMedicoSolicitante: paciente.ufMedicoSolicitante || profissional.uf,
        cbosMedicoSolicitante: paciente.cbosMedicoSolicitante || profissional.cbos || profissional.codigoCBO,
      },
      anexos: getReferralOptions(
        anexos.map((anexo) => ({ id: anexo.id, nome: anexo.nome, categoria: anexo.categoria, fileUrl: anexo.fileUrl })),
        paciente.pedidoMedicoUrl,
      ),
    };
  }),

  criarDaGuia: protectedProcedure.input(z.object({
    guiaId: z.number(),
    codigoTUSS: z.string().min(1),
    descricaoProcedimento: z.string().optional(),
    cid10: z.string().min(2).max(10).default("F41"),
    quantidadeSessoes: z.number().min(1).max(200),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    pedidoMedicoUrl: documentUrlSchema.optional(),
    pedidoMedicoNomeArquivo: z.string().max(255).optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    const existente = await db.select({ id: bradescoAutorizacoes.id })
      .from(bradescoAutorizacoes).where(eq(bradescoAutorizacoes.guiaId, input.guiaId));
    if (existente.length) throw new TRPCError({ code: "CONFLICT", message: "Esta guia já está na fila de autorizações Bradesco." });
    const { guia, paciente, profissional } = await carregarDadosDaGuia(input.guiaId);
    const estaNoLoteProtegido = filterGuidesByPeriod(
      [{ dataEmissao: guia.dataEmissao }],
      LOTE_BRADESCO_SETEMBRO_2026.inicio,
      LOTE_BRADESCO_SETEMBRO_2026.fim,
    ).length === 1;
    if (!estaNoLoteProtegido) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Neste piloto, somente guias emitidas entre 01/09/2026 e 30/09/2026 podem entrar na fila Bradesco. As guias de agosto foram preservadas.",
      });
    }
    if (!/^\d{8}$/.test(input.codigoTUSS)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Informe o código TUSS de 8 dígitos antes de liberar a guia ao piloto." });
    }
    if (!input.dataInicio || !input.dataFim) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Informe as datas inicial e final da série antes de liberar a guia ao piloto." });
    }
    if (!input.pedidoMedicoNomeArquivo?.trim()) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Selecione o encaminhamento médico anexado na pasta do paciente." });
    }
    const pedidoUrl = input.pedidoMedicoUrl;
    const missingRequirements = getPilotMissingRequirements({
      numeroCarteira: guia.numeroCarteira || paciente.numeroCarteira,
      nomeMedicoSolicitante: paciente.nomeMedicoSolicitante || profissional.nome,
      crmMedicoSolicitante: paciente.crmMedicoSolicitante || profissional.numeroConselho || profissional.crm,
      ufMedicoSolicitante: paciente.ufMedicoSolicitante || profissional.uf,
      cbosMedicoSolicitante: paciente.cbosMedicoSolicitante || profissional.cbos || profissional.codigoCBO,
      pedidoMedicoUrl: pedidoUrl,
    });
    if (missingRequirements.length) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `A guia ainda não está pronta para o piloto: ${missingRequirements.join(", ")}.`,
      });
    }
    const status = "pendente";
    const [result] = await db.insert(bradescoAutorizacoes).values({
      guiaId: guia.id,
      pacienteId: paciente.id,
      convenioId: guia.convenioId,
      numeroCarteira: guia.numeroCarteira || paciente.numeroCarteira,
      validadeCarteira: guia.validadeCarteira || paciente.validadeCarteira,
      nomePaciente: paciente.nome,
      codigoTUSS: input.codigoTUSS,
      descricaoProcedimento: input.descricaoProcedimento || guia.procedimento,
      cid10: input.cid10 || guia.cid10Principal || "F41",
      quantidadeSessoes: input.quantidadeSessoes,
      dataInicio: asDate(input.dataInicio) || guia.dataEmissao,
      dataFim: asDate(input.dataFim),
      nomeMedicoSolicitante: paciente.nomeMedicoSolicitante || profissional.nome,
      crmMedicoSolicitante: paciente.crmMedicoSolicitante || profissional.numeroConselho || profissional.crm,
      ufMedicoSolicitante: paciente.ufMedicoSolicitante || profissional.uf,
      cbosMedicoSolicitante: paciente.cbosMedicoSolicitante || profissional.cbos || profissional.codigoCBO,
      pedidoMedicoUrl: pedidoUrl,
      pedidoMedicoNomeArquivo: input.pedidoMedicoNomeArquivo,
      status,
      solicitadoPor: ctx.user.id,
      logExecucao: formatLog(status === "pendente" ? "Solicitação preparada a partir da guia." : "Solicitação criada com pendência de encaminhamento médico."),
    });
    return { id: Number((result as { insertId: number }).insertId), status };
  }),

  listar: protectedProcedure.input(z.object({ status: statusSchema.optional(), limit: z.number().min(1).max(200).default(50) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(bradescoAutorizacoes)
      .where(input.status ? eq(bradescoAutorizacoes.status, input.status) : undefined)
      .orderBy(desc(bradescoAutorizacoes.updatedAt)).limit(input.limit);
  }),

  estatisticas: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return calculateBradescoAuthorizationStats([]);
    const rows = await db.select({ status: bradescoAutorizacoes.status }).from(bradescoAutorizacoes);
    return calculateBradescoAuthorizationStats(rows);
  }),

  sinalizarExecucaoAssistida: protectedProcedure.input(z.object({ autorizacaoId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    const [row] = await db.select().from(bradescoAutorizacoes).where(eq(bradescoAutorizacoes.id, input.autorizacaoId));
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
    if (!row.pedidoMedicoUrl) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Anexe o encaminhamento médico antes de enviar ao portal." });
    const [credencial] = await db.select({ modoExecucao: bradescoCredenciais.modoExecucao })
      .from(bradescoCredenciais)
      .where(eq(bradescoCredenciais.ativo, 1))
      .limit(1);
    if (!credencial || credencial.modoExecucao !== MODO_EXECUCAO_ASSISTIDO) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configure o modo assistido sob demanda nas credenciais Bradesco antes de iniciar a execução." });
    }
    await db.update(bradescoAutorizacoes).set({
      status: "aguardando_acao_humana",
      tentativas: row.tentativas + 1,
      ultimaTentativa: new Date(),
      logExecucao: formatLog("Modo assistido sob demanda iniciado. Aguardando validação humana de CAPTCHA/sessão no portal Bradesco.", row.logExecucao),
      updatedAt: new Date(),
    }).where(eq(bradescoAutorizacoes.id, input.autorizacaoId));
    return { success: true };
  }),

  registrarResultado: protectedProcedure.input(z.object({
    autorizacaoId: z.number(),
    status: z.enum(["autorizado", "negado", "enviado_portal", "liberada"]),
    protocoloBradesco: z.string().max(50).optional(),
    numeroAutorizacaoBradesco: z.string().max(40).optional(),
    senhaAutorizacaoBradesco: z.string().max(30).optional(),
    dataAutorizacao: z.string().optional(),
    validadeAutorizacao: z.string().optional(),
    sessoesAutorizadas: z.number().min(1).max(200).optional(),
    motivoNegacao: z.string().max(3000).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    const [row] = await db.select().from(bradescoAutorizacoes).where(eq(bradescoAutorizacoes.id, input.autorizacaoId));
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada." });
    if (input.status === "autorizado" && (!input.numeroAutorizacaoBradesco || !input.senhaAutorizacaoBradesco || !input.validadeAutorizacao)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Número, senha e validade são obrigatórios para registrar uma autorização." });
    }
    if (input.status === "liberada" && (!input.protocoloBradesco || !input.senhaAutorizacaoBradesco || !input.dataAutorizacao)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Protocolo, senha e data são obrigatórios para registrar uma liberação do portal." });
    }
    await db.update(bradescoAutorizacoes).set({
      status: input.status,
      protocoloBradesco: input.protocoloBradesco,
      numeroAutorizacaoBradesco: input.numeroAutorizacaoBradesco,
      senhaAutorizacaoBradesco: input.senhaAutorizacaoBradesco,
      dataAutorizacaoBradesco: asDate(input.dataAutorizacao),
      validadeAutorizacaoBradesco: asDate(input.validadeAutorizacao),
      sessoesAutorizadas: input.sessoesAutorizadas,
      motivoNegacao: input.motivoNegacao,
      logExecucao: formatLog(`Resultado registrado: ${input.status}.`, row.logExecucao),
      updatedAt: new Date(),
    }).where(eq(bradescoAutorizacoes.id, input.autorizacaoId));
    if (input.status === "enviado_portal") {
      const [guia] = await db.select({ observacoesTISS: guias.observacoesTISS })
        .from(guias)
        .where(eq(guias.id, row.guiaId));
      if (!guia) throw new TRPCError({ code: "NOT_FOUND", message: "Guia vinculada à solicitação não encontrada." });
      const nota = formatPortalSubmissionGuideNote(input.protocoloBradesco);
      await db.update(guias).set({
        observacoesTISS: appendGuideAuditNote(guia.observacoesTISS, nota),
        updatedAt: new Date(),
      }).where(eq(guias.id, row.guiaId));
    }
    if (input.status === "liberada") {
      const [guia] = await db.select({ observacoesTISS: guias.observacoesTISS })
        .from(guias)
        .where(eq(guias.id, row.guiaId));
      if (!guia) throw new TRPCError({ code: "NOT_FOUND", message: "Guia vinculada à solicitação não encontrada." });
      await db.update(guias).set({
        senhaAutorizacao: input.senhaAutorizacaoBradesco,
        dataAutorizacao: asDate(input.dataAutorizacao) || new Date(),
        observacoesTISS: upsertPortalReleasedGuideNote(guia.observacoesTISS, input),
        updatedAt: new Date(),
      }).where(eq(guias.id, row.guiaId));
    }
    if (input.status === "autorizado") {
      const duplicada = await db.select({ id: guias.id, numeroGuia: guias.numeroGuia })
        .from(guias)
        .where(and(
          ne(guias.id, row.guiaId),
          eq(guias.numeroGuiaPrincipal, input.numeroAutorizacaoBradesco!),
        )).limit(1);
      if (duplicada.length) {
        throw new TRPCError({ code: "CONFLICT", message: `O número de autorização já está vinculado à guia ${duplicada[0].numeroGuia}.` });
      }
      await db.update(guias).set({
        numeroGuiaPrincipal: input.numeroAutorizacaoBradesco,
        senhaAutorizacao: input.senhaAutorizacaoBradesco,
        dataAutorizacao: asDate(input.dataAutorizacao) || new Date(),
        dataValidadeSenha: asDate(input.validadeAutorizacao),
        saldoSessoes: input.sessoesAutorizadas ?? row.quantidadeSessoes,
        totalSessoes: input.sessoesAutorizadas ?? row.quantidadeSessoes,
        cid10Principal: row.cid10,
        updatedAt: new Date(),
      }).where(eq(guias.id, row.guiaId));
    }
    return { success: true };
  }),

  cancelar: protectedProcedure.input(z.object({ autorizacaoId: z.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
    await db.update(bradescoAutorizacoes).set({ status: "cancelado", updatedAt: new Date() })
      .where(and(eq(bradescoAutorizacoes.id, input.autorizacaoId), inArray(bradescoAutorizacoes.status, ["pendente_documentacao", "pendente", "erro"])));
    return { success: true };
  }),
});

export const __bradescoInternals = { asDate, appendGuideAuditNote, calculateBradescoAuthorizationStats, encryptPassword, filterGuidesByPeriod, formatLog, formatPortalReleasedGuideNote, formatPortalSubmissionGuideNote, getPilotMissingRequirements, getReferralOptions, hasValidDocumentUrl, LOTE_BRADESCO_SETEMBRO_2026, MODO_EXECUCAO_ASSISTIDO };
