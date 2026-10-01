import { describe, it, expect } from "vitest";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { gerarXmlTissSPSADT, TissGuia, TissLoteConfig } from "./tissXml";

const config: TissLoteConfig = {
  sequencialTransacao: "42",
  numeroLote: "2001",
  registroANS: "654321",
  cnpjPrestador: "12.345.678/0001-99",
  codigoPrestadorNaOperadora: "000376402",
  dataRegistro: "2026-07-02",
  horaRegistro: "10:00:00",
};

const guia: TissGuia = {
  numeroGuiaPrestador: "G-100",
  registroANS: "654321",
  numeroCarteira: "111222333",
  nomeBeneficiario: "Carlos Andrade",
  codigoPrestadorNaOperadora: "000376402",
  nomeContratado: "Clinica Mifature",
  nomeProfissional: "Dra. Ana Lima",
  numeroConselhoProfissional: "12345",
  ufConselho: "AM",
  senhaAutorizacao: "AUT-999",
  dataAutorizacao: "2026-06-30",
  cid10Principal: "F41.1",
  procedimentos: [
    {
      sequencial: 1,
      dataExecucao: "2026-07-01",
      codigoProcedimento: "50000470",
      descricaoProcedimento: "Sessao de psicoterapia",
      quantidadeExecutada: 2,
      valorUnitario: 120.0,
      valorTotal: 240.0,
    },
  ],
  valorProcedimentos: 240.0,
  valorTotalGeral: 240.0,
};

describe("validacao estrutural do XML TISS", () => {
  it("gera XML bem-formado (sintaticamente valido)", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia]);
    const resultado = XMLValidator.validate(xml);
    expect(resultado).toBe(true);
  });

  it("contem todos os blocos obrigatorios do padrao TISS", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia]);
    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
    });
    const doc = parser.parse(xml);

    const mensagem = doc.mensagemTISS;
    expect(mensagem).toBeDefined();

    // Cabecalho
    const cab = mensagem.cabecalho;
    expect(cab).toBeDefined();
    expect(cab.identificacaoTransacao.sequencialTransacao).toBe(42);
    expect(cab.identificacaoTransacao.tipoTransacao).toBe("ENVIO_LOTE_GUIAS");
    expect(cab.origem.identificacaoPrestador.codigoPrestadorNaOperadora).toBe(376402);
    expect(cab.destino.registroANS).toBe(654321);
    expect(String(cab.Padrao)).toBe("4.02.00");

    // Corpo / lote
    const lote = mensagem.prestadorParaOperadora.loteGuias;
    expect(lote.numeroLote).toBe(2001);
    const guiaSadt = lote.guiasTISS["guiaSP-SADT"];
    expect(guiaSadt).toBeDefined();
    expect(guiaSadt.cabecalhoGuia.numeroGuiaPrestador).toBe("G-100");
    expect(guiaSadt.dadosExecutante.contratadoExecutante.codigoPrestadorNaOperadora).toBe(376402);

    // Beneficiario
    expect(guiaSadt.dadosBeneficiario.numeroCarteira).toBe(111222333);
    expect(guiaSadt.dadosBeneficiario.nomeBeneficiario).toBeUndefined();

    // Autorizacao
    expect(guiaSadt.dadosAutorizacao.senha).toBe("AUT-999");

    // Procedimento
    const proc = guiaSadt.procedimentosExecutados.procedimentoExecutado;
    expect(proc.procedimento.codigoProcedimento).toBe(50000470);
    expect(proc.quantidadeExecutada).toBe(2);

    // Epilogo com hash
    expect(mensagem.epilogo.hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it("ordem dos blocos principais respeita cabecalho -> corpo -> epilogo", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia]);
    const posCabecalho = xml.indexOf("<ans:cabecalho>");
    const posCorpo = xml.indexOf("<ans:prestadorParaOperadora>");
    const posEpilogo = xml.indexOf("<ans:epilogo>");
    expect(posCabecalho).toBeGreaterThan(-1);
    expect(posCorpo).toBeGreaterThan(posCabecalho);
    expect(posEpilogo).toBeGreaterThan(posCorpo);
  });

  it("valores monetarios usam duas casas decimais", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia]);
    expect(xml).toContain("<ans:valorUnitario>120.00</ans:valorUnitario>");
    expect(xml).toContain("<ans:valorTotal>240.00</ans:valorTotal>");
    expect(xml).toContain("<ans:valorTotalGeral>240.00</ans:valorTotalGeral>");
  });

  it("lote com multiplas guias permanece bem-formado", () => {
    const { xml } = gerarXmlTissSPSADT(config, [
      guia,
      { ...guia, numeroGuiaPrestador: "G-101", nomeBeneficiario: "Beatriz Nunes" },
    ]);
    expect(XMLValidator.validate(xml)).toBe(true);
    const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
    const doc = parser.parse(xml);
    const guias = doc.mensagemTISS.prestadorParaOperadora.loteGuias.guiasTISS["guiaSP-SADT"];
    expect(Array.isArray(guias)).toBe(true);
    expect(guias.length).toBe(2);
  });
});
