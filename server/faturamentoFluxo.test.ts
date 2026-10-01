import { describe, it, expect } from "vitest";
import { XMLValidator, XMLParser } from "fast-xml-parser";
import { gerarXmlTissSPSADT, TissGuia } from "./tissXml";

/**
 * Reproduz a lógica de mapeamento usada no router faturamentoTISS.gerarLote,
 * transformando registros do banco (guia + procedimentos + paciente + profissional
 * + prestador + convenio) na estrutura TissGuia. Isso valida o "fluxo completo"
 * de faturamento sem depender de banco/OAuth.
 */

type GuiaDB = {
  id: number;
  numeroGuia: string;
  numeroGuiaOperadora?: string | null;
  pacienteId: number;
  profissionalId: number;
  procedimento: string;
  valor: string;
  senhaAutorizacao?: string | null;
  dataAutorizacao?: string | null;
  numeroCarteira?: string | null;
  atendimentoRN?: string | null;
  caraterAtendimento?: string | null;
  tipoAtendimento?: string | null;
  indicacaoAcidente?: string | null;
  cid10Principal?: string | null;
  codigoTUSS?: string | null;
};

type ProcDB = {
  sequencial: number;
  codigoProcedimento: string;
  descricaoProcedimento: string;
  quantidadeExecutada: string;
  valorUnitario: string;
  valorTotal: string;
  dataExecucao?: string | null;
};

const prestador = {
  razaoSocial: "Clinica Mifature LTDA",
  nomeFantasia: "MIFATURE",
  cnpj: "12345678000199",
  cnes: "1234567",
  codigoPrestadorNaOperadora: "PREST001",
};

const convenio = { id: 1, nome: "Unimed", registroANS: "326305" };
const paciente = { id: 10, nome: "Maria Silva" };
const profissional = { id: 20, nome: "Dr. Joao Souza", crm: "54321", uf: "AM" };

/** Reimplementa o mapeamento do router para uma guia. */
function mapearGuia(g: GuiaDB, procs: ProcDB[]): TissGuia {
  let procedimentos = procs;
  if (procedimentos.length === 0) {
    procedimentos = [
      {
        sequencial: 1,
        codigoProcedimento: g.codigoTUSS || "00000000",
        descricaoProcedimento: g.procedimento,
        quantidadeExecutada: "1",
        valorUnitario: String(g.valor),
        valorTotal: String(g.valor),
      },
    ];
  }
  const valorProcedimentos = procedimentos.reduce((s, p) => s + Number(p.valorTotal), 0);
  return {
    numeroGuiaPrestador: g.numeroGuia,
    numeroGuiaOperadora: g.numeroGuiaOperadora,
    registroANS: convenio.registroANS,
    senhaAutorizacao: g.senhaAutorizacao,
    dataAutorizacao: g.dataAutorizacao ?? null,
    numeroCarteira: g.numeroCarteira || "",
    atendimentoRN: (g.atendimentoRN as any) || "N",
    nomeBeneficiario: paciente.nome,
    codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora,
    nomeContratado: prestador.nomeFantasia || prestador.razaoSocial,
    cnes: prestador.cnes,
    nomeProfissional: profissional.nome,
    numeroConselhoProfissional: profissional.crm,
    ufConselho: profissional.uf,
    caraterAtendimento: (g.caraterAtendimento as any) || "1",
    tipoAtendimento: g.tipoAtendimento || "23",
    indicacaoAcidente: g.indicacaoAcidente || "9",
    cid10Principal: g.cid10Principal,
    procedimentos: procedimentos.map((p) => ({
      sequencial: p.sequencial,
      dataExecucao: p.dataExecucao ?? undefined,
      codigoProcedimento: p.codigoProcedimento,
      descricaoProcedimento: p.descricaoProcedimento,
      quantidadeExecutada: Number(p.quantidadeExecutada),
      valorUnitario: Number(p.valorUnitario),
      valorTotal: Number(p.valorTotal),
    })),
    valorProcedimentos,
    valorTotalGeral: valorProcedimentos,
  };
}

describe("fluxo completo de faturamento (mapeamento -> XML)", () => {
  it("gera lote valido a partir de guia com procedimentos detalhados", () => {
    const g: GuiaDB = {
      id: 1,
      numeroGuia: "GUIA-2026-001",
      pacienteId: 10,
      profissionalId: 20,
      procedimento: "Consulta",
      valor: "150.00",
      numeroCarteira: "123456789",
      senhaAutorizacao: "AUT-123",
      dataAutorizacao: "2026-06-30",
      cid10Principal: "F41.1",
    };
    const procs: ProcDB[] = [
      {
        sequencial: 1,
        codigoProcedimento: "10101012",
        descricaoProcedimento: "Consulta em consultorio",
        quantidadeExecutada: "1",
        valorUnitario: "150.00",
        valorTotal: "150.00",
        dataExecucao: "2026-07-01",
      },
    ];
    const guiaTiss = mapearGuia(g, procs);
    const { xml, hash } = gerarXmlTissSPSADT(
      {
        sequencialTransacao: "1",
        numeroLote: "5001",
        registroANS: convenio.registroANS,
        cnpjPrestador: prestador.cnpj,
        codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora,
      },
      [guiaTiss],
    );

    expect(XMLValidator.validate(xml)).toBe(true);
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
    expect(guiaTiss.valorTotalGeral).toBe(150);
    expect(xml).toContain("<ans:codigoProcedimento>10101012</ans:codigoProcedimento>");
    expect(xml).toContain("<ans:numeroGuiaPrestador>GUIA-2026-001</ans:numeroGuiaPrestador>");
  });

  it("usa fallback quando a guia nao tem procedimentos detalhados", () => {
    const g: GuiaDB = {
      id: 2,
      numeroGuia: "GUIA-2026-002",
      pacienteId: 10,
      profissionalId: 20,
      procedimento: "Sessao de fisioterapia",
      valor: "80.00",
      numeroCarteira: "987654321",
    };
    const guiaTiss = mapearGuia(g, []);
    expect(guiaTiss.procedimentos).toHaveLength(1);
    expect(guiaTiss.procedimentos[0].descricaoProcedimento).toBe("Sessao de fisioterapia");
    expect(guiaTiss.valorTotalGeral).toBe(80);

    const { xml } = gerarXmlTissSPSADT(
      {
        sequencialTransacao: "2",
        numeroLote: "5002",
        registroANS: convenio.registroANS,
        cnpjPrestador: prestador.cnpj,
        codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora,
      },
      [guiaTiss],
    );
    expect(XMLValidator.validate(xml)).toBe(true);
    expect(xml).toContain("<ans:valorTotalGeral>80.00</ans:valorTotalGeral>");
  });

  it("soma corretamente o valor total do lote com multiplas guias", () => {
    const g1 = mapearGuia(
      { id: 1, numeroGuia: "A", pacienteId: 10, profissionalId: 20, procedimento: "X", valor: "100.00", numeroCarteira: "1" },
      [],
    );
    const g2 = mapearGuia(
      { id: 2, numeroGuia: "B", pacienteId: 10, profissionalId: 20, procedimento: "Y", valor: "250.50", numeroCarteira: "2" },
      [],
    );
    const valorTotalLote = [g1, g2].reduce((s, g) => s + g.valorTotalGeral, 0);
    expect(valorTotalLote).toBeCloseTo(350.5, 2);

    const { xml } = gerarXmlTissSPSADT(
      {
        sequencialTransacao: "3",
        numeroLote: "5003",
        registroANS: convenio.registroANS,
        cnpjPrestador: prestador.cnpj,
        codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora,
      },
      [g1, g2],
    );
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const doc = parser.parse(xml);
    const guias = doc.mensagemTISS.prestadorParaOperadora.loteGuias.guiasTISS["guiaSP-SADT"];
    expect(guias.length).toBe(2);
  });
});
