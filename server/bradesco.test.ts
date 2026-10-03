import crypto from "crypto";
import { describe, expect, it, beforeEach, vi } from "vitest";

const getDbMock = vi.hoisted(() => vi.fn());

vi.mock("./db", () => ({ getDb: getDbMock }));

import { __bradescoInternals, bradescoRouter } from "./routers/bradesco";

function decryptPassword(value: string, secret: string) {
  const [ivHex, encrypted] = value.split(":");
  const key = crypto.createHash("sha256").update(secret).digest();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, Buffer.from(ivHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "hex")), decipher.final()]).toString("utf8");
}

describe("Bradesco — preparação segura da autorização", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "segredo-de-teste-bradesco";
  });

  it("cifra a senha com IV aleatório e permite a recuperação apenas no servidor", () => {
    const senha = "Senha!123";
    const primeira = __bradescoInternals.encryptPassword(senha);
    const segunda = __bradescoInternals.encryptPassword(senha);

    expect(primeira).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
    expect(segunda).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);
    expect(primeira).not.toBe(segunda);
    expect(decryptPassword(primeira, "segredo-de-teste-bradesco")).toBe(senha);
  });

  it("normaliza datas de formulário sem deslocar o dia da autorização", () => {
    expect(__bradescoInternals.asDate("2026-09-01")?.toISOString()).toContain("2026-09-01T12:00:00.000Z");
    expect(__bradescoInternals.asDate(undefined)).toBeNull();
  });

  it("seleciona somente guias do período de setembro, excluindo agosto", () => {
    const guias = [
      { id: 1, dataEmissao: new Date("2026-08-31T12:00:00.000Z") },
      { id: 2, dataEmissao: new Date("2026-09-01T12:00:00.000Z") },
      { id: 3, dataEmissao: new Date("2026-09-30T12:00:00.000Z") },
      { id: 4, dataEmissao: new Date("2026-10-01T12:00:00.000Z") },
    ];

    const resultado = __bradescoInternals.filterGuidesByPeriod(guias, "2026-09-01", "2026-09-30");

    expect(resultado.map((guia) => guia.id)).toEqual([2, 3]);
    expect(__bradescoInternals.LOTE_BRADESCO_SETEMBRO_2026).toEqual({ inicio: "2026-09-01", fim: "2026-09-30" });
  });

  it("mantém um histórico cumulativo e auditável da solicitação", () => {
    const primeiro = __bradescoInternals.formatLog("Solicitação preparada.");
    const historico = __bradescoInternals.formatLog("Retorno autorizado.", primeiro);

    expect(historico).toContain("Solicitação preparada.");
    expect(historico).toContain("Retorno autorizado.");
    expect(historico.split("\n")).toHaveLength(2);
  });

  it("não duplica uma entrada de retorno quando o mesmo resultado é reaplicado", () => {
    const primeiro = __bradescoInternals.formatLog("Resultado registrado: liberada.");
    const reaplicado = __bradescoInternals.formatLog("Resultado registrado: liberada.", primeiro);

    expect(reaplicado).toBe(primeiro);
    expect(reaplicado.match(/Resultado registrado: liberada\./g)).toHaveLength(1);
  });

  it("contabiliza explicitamente a liberação do Theo nas estatísticas da fila", () => {
    const estatisticas = __bradescoInternals.calculateBradescoAuthorizationStats([
      { status: "pendente" },
      { status: "liberada" },
      { status: "enviado_portal" },
    ]);

    expect(estatisticas).toMatchObject({
      total: 3,
      pendente: 1,
      liberada: 1,
      enviadoPortal: 1,
      autorizado: 0,
    });
  });

  it("reflete o protocolo enviado na guia sem duplicar a nota de auditoria", () => {
    const nota = __bradescoInternals.formatPortalSubmissionGuideNote("137697929");
    const primeira = __bradescoInternals.appendGuideAuditNote("Observação clínica existente.", nota);
    const segunda = __bradescoInternals.appendGuideAuditNote(primeira, nota);

    expect(nota).toBe("Autorização Bradesco enviada ao portal; protocolo 137697929. Aguarda análise da operadora.");
    expect(primeira).toContain("Observação clínica existente.");
    expect(segunda).toBe(primeira);
  });

  it("registra enviado_portal e anota o protocolo na guia vinculada pela mutation", async () => {
    const atualizacoes: Array<{ tabela: unknown; valores: Record<string, unknown> }> = [];
    const where = vi.fn()
      .mockResolvedValueOnce([{ id: 1, guiaId: 2070020, quantidadeSessoes: 4, logExecucao: null }])
      .mockResolvedValueOnce([{ observacoesTISS: "Observação clínica existente." }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      update: vi.fn((tabela) => ({
        set: vi.fn((valores) => ({
          where: vi.fn(async () => {
            atualizacoes.push({ tabela, valores });
            return [{ affectedRows: 1 }];
          }),
        })),
      })),
    };
    getDbMock.mockResolvedValue(db);
    const caller = bradescoRouter.createCaller({ user: { id: 1, role: "admin" } } as any);

    await caller.registrarResultado({
      autorizacaoId: 1,
      status: "enviado_portal",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
    });

    expect(atualizacoes).toHaveLength(2);
    expect(atualizacoes[0].valores).toMatchObject({
      status: "enviado_portal",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
    });
    expect(atualizacoes[1].valores.observacoesTISS).toBe(
      "Observação clínica existente.\nAutorização Bradesco enviada ao portal; protocolo 137697929. Aguarda análise da operadora."
    );
  });

  it("registra liberação do portal sem preencher validade ou sessões não retornadas", async () => {
    const atualizacoes: Array<{ tabela: unknown; valores: Record<string, unknown> }> = [];
    const where = vi.fn()
      .mockResolvedValueOnce([{ id: 1, guiaId: 2070020, quantidadeSessoes: 4, logExecucao: null }])
      .mockResolvedValueOnce([{ observacoesTISS: "Observação clínica existente." }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      update: vi.fn((tabela) => ({
        set: vi.fn((valores) => ({
          where: vi.fn(async () => {
            atualizacoes.push({ tabela, valores });
            return [{ affectedRows: 1 }];
          }),
        })),
      })),
    };
    getDbMock.mockResolvedValue(db);
    const caller = bradescoRouter.createCaller({ user: { id: 1, role: "admin" } } as any);

    await caller.registrarResultado({
      autorizacaoId: 1,
      status: "liberada",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "2026-08-16",
    });

    expect(atualizacoes).toHaveLength(2);
    expect(atualizacoes[0].valores).toMatchObject({
      status: "liberada",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
      validadeAutorizacaoBradesco: null,
      sessoesAutorizadas: undefined,
    });
    expect(atualizacoes[1].valores).toMatchObject({
      senhaAutorizacao: "KLS3NB3",
      dataAutorizacao: expect.any(Date),
    });
    expect(atualizacoes[1].valores).not.toHaveProperty("dataValidadeSenha");
    expect(atualizacoes[1].valores.observacoesTISS).toContain("Dados não informados pelo portal nesta consulta: validade e sessões.");
  });

  it("substitui a nota liberada da mesma solicitação quando o retorno é corrigido", async () => {
    const atualizacoes: Array<{ tabela: unknown; valores: Record<string, unknown> }> = [];
    const notaInicial = "Observação clínica existente.\nAutorização Bradesco liberada pelo portal; protocolo 137697929; senha KLS3NB3; data 2026-08-16. Dados não informados pelo portal nesta consulta: validade e sessões.";
    const where = vi.fn()
      .mockResolvedValueOnce([{ id: 1, guiaId: 2070020, quantidadeSessoes: 4, logExecucao: null }])
      .mockResolvedValueOnce([{ observacoesTISS: "Observação clínica existente." }])
      .mockResolvedValueOnce([{ id: 1, guiaId: 2070020, quantidadeSessoes: 4, logExecucao: "[2026-08-16T14:56:03.709Z] Resultado registrado: liberada." }])
      .mockResolvedValueOnce([{ observacoesTISS: notaInicial }]);
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })),
      update: vi.fn((tabela) => ({
        set: vi.fn((valores) => ({
          where: vi.fn(async () => {
            atualizacoes.push({ tabela, valores });
            return [{ affectedRows: 1 }];
          }),
        })),
      })),
    };
    getDbMock.mockResolvedValue(db);
    const caller = bradescoRouter.createCaller({ user: { id: 1, role: "admin" } } as any);

    await caller.registrarResultado({
      autorizacaoId: 1,
      status: "liberada",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "2026-08-16",
    });
    await caller.registrarResultado({
      autorizacaoId: 1,
      status: "liberada",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "2026-08-15",
    });

    const notaCorrigida = atualizacoes[3].valores.observacoesTISS as string;
    expect(notaCorrigida).toContain("data 2026-08-15");
    expect(notaCorrigida).not.toContain("data 2026-08-16");
    expect(notaCorrigida.match(/Autorização Bradesco liberada pelo portal/g)).toHaveLength(1);
  });

  it("aplica o modo assistido sob demanda configurado antes de sinalizar a execução", async () => {
    const atualizacoes: Array<Record<string, unknown>> = [];
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 1, pedidoMedicoUrl: "https://storage.example.com/pedido.pdf", tentativas: 0, logExecucao: null }]) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ modoExecucao: "assistido_sob_demanda" }]) })) })) });
    const db = {
      select,
      update: vi.fn(() => ({
        set: vi.fn((valores) => ({
          where: vi.fn(async () => {
            atualizacoes.push(valores);
            return [{ affectedRows: 1 }];
          }),
        })),
      })),
    };
    getDbMock.mockResolvedValue(db);
    const caller = bradescoRouter.createCaller({ user: { id: 1, role: "admin" } } as any);

    await caller.sinalizarExecucaoAssistida({ autorizacaoId: 1 });

    expect(__bradescoInternals.MODO_EXECUCAO_ASSISTIDO).toBe("assistido_sob_demanda");
    expect(atualizacoes[0]).toMatchObject({ status: "aguardando_acao_humana" });
    expect(atualizacoes[0].logExecucao).toContain("Modo assistido sob demanda iniciado.");
  });

  it("impede uma guia incompleta de entrar no piloto assistido", () => {
    const pendencias = __bradescoInternals.getPilotMissingRequirements({
      numeroCarteira: "",
      nomeMedicoSolicitante: "",
      crmMedicoSolicitante: "",
      ufMedicoSolicitante: "",
      cbosMedicoSolicitante: "",
      pedidoMedicoUrl: "arquivo-local.pdf",
    });

    expect(pendencias).toEqual([
      "número da carteirinha",
      "nome do médico solicitante",
      "CRM ou conselho do solicitante",
      "UF do solicitante",
      "CBOS do solicitante",
      "encaminhamento médico anexado",
    ]);
  });

  it("libera o piloto quando o encaminhamento e os dados do solicitante estão completos", () => {
    expect(__bradescoInternals.getPilotMissingRequirements({
      numeroCarteira: "123456789",
      nomeMedicoSolicitante: "Dra. Maria Silva",
      crmMedicoSolicitante: "12345",
      ufMedicoSolicitante: "AM",
      cbosMedicoSolicitante: "223905",
      pedidoMedicoUrl: "https://storage.example.com/encaminhamento.pdf",
    })).toEqual([]);
  });

  it("aceita o encaminhamento interno da pasta do paciente e rejeita caminhos inseguros", () => {
    const anexoInterno = "/manus-storage/pacientes/630081/anexos/1786580021197-pedido.pdf";
    expect(__bradescoInternals.hasValidDocumentUrl(anexoInterno)).toBe(true);
    expect(__bradescoInternals.hasValidDocumentUrl("/manus-storage/pacientes/630081/anexos/../segredo.pdf")).toBe(false);
    expect(__bradescoInternals.getPilotMissingRequirements({
      numeroCarteira: "123456789",
      nomeMedicoSolicitante: "Dra. Beatriz Viana",
      crmMedicoSolicitante: "12439",
      ufMedicoSolicitante: "AM",
      cbosMedicoSolicitante: "225125",
      pedidoMedicoUrl: anexoInterno,
    })).toEqual([]);
  });

  it("oferece o encaminhamento já cadastrado na ficha do paciente sem duplicá-lo", () => {
    const documentoDaFicha = "https://storage.example.com/pedido-medico.pdf";
    expect(__bradescoInternals.getReferralOptions([], documentoDaFicha)).toEqual([
      {
        id: "pedido-cadastrado",
        nome: "Encaminhamento cadastrado na ficha do paciente",
        categoria: "encaminhamento",
        fileUrl: documentoDaFicha,
      },
    ]);
    expect(__bradescoInternals.getReferralOptions([
      { id: 9, nome: "Pedido", categoria: "encaminhamento", fileUrl: documentoDaFicha },
    ], documentoDaFicha)).toHaveLength(1);
  });
});
