import { describe, it, expect } from "vitest";
import { gerarXmlTissSPSADT, type TissGuia, type TissLoteConfig } from "./tissXml";
import { validarXmlTiss } from "./tissXsdValidacao";

function guiaValida(): TissGuia {
  return {
    numeroGuiaPrestador: "GUIA123",
    registroANS: "123456",
    numeroCarteira: "0011223344",
    nomeBeneficiario: "MARIA DA SILVA",
    codigoPrestadorNaOperadora: "PREST001",
    nomeContratado: "CLINICA MIFATURE",
    nomeProfissional: "DR JOAO SOUZA",
    numeroConselhoProfissional: "12345",
    ufConselho: "SP",
    cid10Principal: "J06",
    procedimentos: [
      {
        sequencial: 1,
        dataExecucao: "2026-06-30",
        codigoTabela: "22",
        codigoProcedimento: "10101012",
        descricaoProcedimento: "Consulta",
        quantidadeExecutada: 1,
        valorUnitario: 120.0,
        valorTotal: 120.0,
      },
    ],
    valorProcedimentos: 120.0,
    valorTotalGeral: 120.0,
  };
}

function configValida(): TissLoteConfig {
  return {
    sequencialTransacao: "1",
    numeroLote: "LOTE001",
    registroANS: "123456",
    cnpjPrestador: "12345678000199",
    codigoPrestadorNaOperadora: "PREST001",
    dataRegistro: "2026-07-01",
    horaRegistro: "10:30:00",
  };
}

describe("Validação XSD TISS (ANS 4.02.00)", () => {
  it("aprova um XML válido gerado pelo próprio gerador", () => {
    const { xml } = gerarXmlTissSPSADT(configValida(), [guiaValida()]);
    const res = validarXmlTiss(xml);
    if (!res.valid) {
      // Ajuda no diagnóstico caso quebre no futuro
      console.error("Erros inesperados:", JSON.stringify(res.errors, null, 2));
    }
    expect(res.valid).toBe(true);
    expect(res.version).toBe("4.02.00");
    expect(res.errors).toHaveLength(0);
  });

  it("aprova identificadores de contratado por CNPJ quando a operadora exige CNPJ", () => {
    const { xml } = gerarXmlTissSPSADT({
      ...configValida(),
      cnpjPrestador: "22.218.474/0001-47",
      identificarPrestadorPorCnpj: true,
    }, [guiaValida()]);
    const res = validarXmlTiss(xml);

    expect(xml).toContain("<ans:CNPJ>22218474000147</ans:CNPJ>");
    expect(xml).toContain("<ans:cnpjContratado>22218474000147</ans:cnpjContratado>");
    expect(res.valid).toBe(true);
  });

  it("reprova XML mal formado", () => {
    const res = validarXmlTiss("<ans:mensagemTISS><ans:cabecalho></ans:mensagemTISS>");
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /mal formado/i.test(e.message))).toBe(true);
  });

  it("reprova quando o elemento raiz não é mensagemTISS", () => {
    const res = validarXmlTiss('<?xml version="1.0"?><raiz></raiz>');
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /mensagemTISS/.test(e.message))).toBe(true);
  });

  it("reprova versão não suportada", () => {
    const cfg = { ...configValida(), versaoTISS: "3.05.00" };
    const { xml } = gerarXmlTissSPSADT(cfg, [guiaValida()]);
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.path.includes("Padrao"))).toBe(true);
  });

  it("reprova registroANS fora do padrão de 6 dígitos", () => {
    const cfg = { ...configValida(), registroANS: "12AB" };
    const { xml } = gerarXmlTissSPSADT(cfg, [guiaValida()]);
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /registroANS/.test(e.path))).toBe(true);
  });

  it("reprova data de registro em formato inválido", () => {
    const cfg = { ...configValida(), dataRegistro: "01/07/2026" };
    const { xml } = gerarXmlTissSPSADT(cfg, [guiaValida()]);
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /dataRegistroTransacao/.test(e.path))).toBe(true);
  });

  it("reprova guia sem procedimentos executados", () => {
    const g = guiaValida();
    g.procedimentos = [];
    const { xml } = gerarXmlTissSPSADT(configValida(), [g]);
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /procedimento/i.test(e.message))).toBe(true);
  });

  it("emite aviso quando o encoding não é ISO-8859-1", () => {
    const cfg = { ...configValida(), encoding: "UTF-8" };
    const { xml } = gerarXmlTissSPSADT(cfg, [guiaValida()]);
    const res = validarXmlTiss(xml);
    expect(res.warnings.some((w) => /ISO-8859-1/i.test(w.message))).toBe(true);
  });

  it("reprova hash de epílogo ausente/ inválido", () => {
    let { xml } = gerarXmlTissSPSADT(configValida(), [guiaValida()]);
    // Corrompe o hash
    xml = xml.replace(/<ans:hash>[a-f0-9]+<\/ans:hash>/i, "<ans:hash>XYZ</ans:hash>");
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => /hash/i.test(e.path))).toBe(true);
  });

  it("valida múltiplas guias no lote", () => {
    const { xml } = gerarXmlTissSPSADT(configValida(), [guiaValida(), guiaValida(), guiaValida()]);
    const res = validarXmlTiss(xml);
    expect(res.valid).toBe(true);
  });
});
