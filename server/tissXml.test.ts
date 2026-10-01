import { describe, it, expect } from "vitest";
import { createHash } from "crypto";
import { gerarXmlTissSPSADT, calcularHashTISS, TissGuia, TissLoteConfig } from "./tissXml";
import { obterRegistroAnsTiss } from "../shared/registroAnsTiss";

const config: TissLoteConfig = {
  sequencialTransacao: "1",
  numeroLote: "1001",
  registroANS: "123456",
  cnpjPrestador: "12.345.678/0001-99",
  codigoPrestadorNaOperadora: "PREST001",
  dataRegistro: "2026-07-02",
  horaRegistro: "10:00:00",
};

const guia: TissGuia = {
  numeroGuiaPrestador: "G-001",
  registroANS: "123456",
  numeroCarteira: "999888777",
  nomeBeneficiario: "Maria Silva",
  codigoPrestadorNaOperadora: "PREST001",
  codigoPrestadorSolicitante: "0000376402",
  nomeContratado: "Clinica Mifature",
  cnes: "1234567",
  nomeProfissional: "Dr. João Souza",
  numeroConselhoProfissional: "54321",
  ufConselho: "AM",
  cid10Principal: "F41.1",
  procedimentos: [
    {
      sequencial: 1,
      dataExecucao: "2026-07-01",
      horaInicio: "15:00",
      horaFim: "15:50",
      codigoProcedimento: "50000470",
      descricaoProcedimento: "Sessao de psicoterapia",
      quantidadeExecutada: 1,
      valorUnitario: 120.0,
      valorTotal: 120.0,
    },
  ],
  valorProcedimentos: 120.0,
  valorTotalGeral: 120.0,
};

describe("gerarXmlTissSPSADT", () => {
  it("gera XML com cabecalho, guia e epilogo com hash", () => {
    const { xml, hash } = gerarXmlTissSPSADT(config, [guia]);
    expect(xml).toContain("<?xml version=\"1.0\"");
    expect(xml).toContain("ans:mensagemTISS");
    expect(xml).toContain("<ans:Padrao>4.02.00</ans:Padrao>");
    expect(xml).toContain("<ans:numeroLote>1001</ans:numeroLote>");
    expect(xml).toContain("ans:guiaSP-SADT");
    expect(xml).toContain("<ans:numeroGuiaPrestador>G-001</ans:numeroGuiaPrestador>");
    expect(xml).toContain("<ans:dataExecucao>2026-07-01</ans:dataExecucao>");
    expect(xml).toContain("<ans:horaInicial>15:00:00</ans:horaInicial>");
    expect(xml).toContain("<ans:horaFinal>15:50:00</ans:horaFinal>");
    expect(xml).toContain("<ans:codigoProcedimento>50000470</ans:codigoProcedimento>");
    expect(xml.indexOf("<ans:horaInicial>15:00:00</ans:horaInicial>")).toBeLessThan(xml.indexOf("<ans:horaFinal>15:50:00</ans:horaFinal>"));
    expect(xml.indexOf("<ans:horaFinal>15:50:00</ans:horaFinal>")).toBeLessThan(xml.indexOf("<ans:procedimento>"));
    expect(xml).not.toContain("<ans:horaInicio>");
    expect(xml).toContain("<ans:UF>13</ans:UF>");
    expect(xml).toContain("<ans:regimeAtendimento>01</ans:regimeAtendimento>");
    expect(xml).toContain("<ans:viaAcesso>1</ans:viaAcesso>");
    expect(xml).toContain("<ans:tecnicaUtilizada>1</ans:tecnicaUtilizada>");
    expect(xml).toContain("<ans:valorTotalGeral>120.00</ans:valorTotalGeral>");
    expect(xml).toContain(`<ans:hash>${hash}</ans:hash>`);
    expect(hash).toMatch(/^[a-f0-9]{32}$/);
  });

  it("emite 418374 no destino quando o XML é da Luminar", () => {
    const registroANS = obterRegistroAnsTiss({ nomeConvenio: "LUMINAR SAÚDE", registroANS: "000000" });
    const { xml } = gerarXmlTissSPSADT({ ...config, registroANS }, [{ ...guia, registroANS }]);

    expect(xml).toContain("<ans:destino><ans:registroANS>418374</ans:registroANS></ans:destino>");
  });

  it("emite o CNPJ da clínica no XML Luminar para identificação do prestador no Factiss", () => {
    const { xml } = gerarXmlTissSPSADT({
      ...config,
      registroANS: "418374",
      cnpjPrestador: "22.218.474/0001-47",
      codigoPrestadorNaOperadora: "17154-0",
      identificarPrestadorPorCnpj: true,
    }, [{
      ...guia,
      codigoPrestadorNaOperadora: "17154-0",
      codigoPrestadorSolicitante: "17154-0",
    }]);

    const cnpj = "22218474000147";
    expect(xml).toContain(`<ans:origem><ans:identificacaoPrestador><ans:CNPJ>${cnpj}</ans:CNPJ></ans:identificacaoPrestador></ans:origem>`);
    expect(xml).toContain(`<ans:contratadoSolicitante><ans:cnpjContratado>${cnpj}</ans:cnpjContratado></ans:contratadoSolicitante>`);
    expect(xml).toContain(`<ans:contratadoExecutante><ans:cnpjContratado>${cnpj}</ans:cnpjContratado></ans:contratadoExecutante>`);
    expect(xml).not.toContain("<ans:codigoPrestadorNaOperadora>17154-0</ans:codigoPrestadorNaOperadora>");
  });

  it("limita o número de lote a doze caracteres quando o convênio exige esse formato", () => {
    const { xml } = gerarXmlTissSPSADT({
      ...config,
      numeroLote: "LOTE-202609-10887000",
      limitarNumeroLoteA12: true,
    }, [guia]);

    expect(xml).toContain("<ans:numeroLote>609-10887000</ans:numeroLote>");
    expect(xml).not.toContain("202609-10887000");
    expect(xml).not.toContain("LOTE-");
  });

  it("não inclui nome do beneficiário no bloco de carteirinha", () => {
    const g2 = { ...guia, nomeBeneficiario: "Ana & José <Teste>" };
    const { xml } = gerarXmlTissSPSADT(config, [g2]);
    expect(xml).toContain("<ans:numeroCarteira>999888777</ans:numeroCarteira>");
    expect(xml).not.toContain("<ans:nomeBeneficiario>");
    expect(xml).not.toContain("Ana & José <Teste>");
  });

  it("usa o código Orizon na origem e no executante", () => {
    const { xml } = gerarXmlTissSPSADT({ ...config, codigoPrestadorNaOperadora: "000376402" }, [{
      ...guia,
      codigoPrestadorNaOperadora: "CODIGO-DIVERGENTE",
    }]);
    expect(xml).toContain("<ans:origem><ans:identificacaoPrestador><ans:codigoPrestadorNaOperadora>000376402</ans:codigoPrestadorNaOperadora></ans:identificacaoPrestador></ans:origem>");
    expect(xml).not.toContain("<ans:origem><ans:identificacaoPrestador><ans:CNPJ>");
    expect(xml).toContain("<ans:contratadoExecutante><ans:codigoPrestadorNaOperadora>000376402</ans:codigoPrestadorNaOperadora></ans:contratadoExecutante>");
    expect(xml).not.toContain("CODIGO-DIVERGENTE");
  });

  it("usa CNPJ do contratado em todos os identificadores quando a operadora exige CNPJ", () => {
    const { xml } = gerarXmlTissSPSADT({
      ...config,
      cnpjPrestador: "22.218.474/0001-47",
      codigoPrestadorNaOperadora: "000376402",
      identificarPrestadorPorCnpj: true,
    }, [{
      ...guia,
      codigoPrestadorNaOperadora: "CODIGO-DIVERGENTE",
      codigoPrestadorSolicitante: "CODIGO-SOLICITANTE-DIVERGENTE",
    }]);

    const cnpj = "22218474000147";
    expect(xml).toContain(`<ans:origem><ans:identificacaoPrestador><ans:CNPJ>${cnpj}</ans:CNPJ></ans:identificacaoPrestador></ans:origem>`);
    expect(xml).toContain(`<ans:contratadoSolicitante><ans:cnpjContratado>${cnpj}</ans:cnpjContratado></ans:contratadoSolicitante>`);
    expect(xml).toContain(`<ans:contratadoExecutante><ans:cnpjContratado>${cnpj}</ans:cnpjContratado></ans:contratadoExecutante>`);
    expect(xml).not.toContain("000376402");
    expect(xml).not.toContain("CODIGO-DIVERGENTE");
    expect(xml).not.toContain("CODIGO-SOLICITANTE-DIVERGENTE");
  });

  it("gera beneficiário, solicitante e solicitação na sequência exigida pelo Bradesco", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia]);
    expect(xml).toContain("<ans:numeroCarteira>999888777</ans:numeroCarteira>");
    expect(xml).not.toContain("<ans:nomeBeneficiario>");
    expect(xml).toContain("</ans:dadosBeneficiario><ans:dadosSolicitante><ans:contratadoSolicitante><ans:codigoPrestadorNaOperadora>0000376402</ans:codigoPrestadorNaOperadora></ans:contratadoSolicitante><ans:nomeContratadoSolicitante>Clinica Mifature</ans:nomeContratadoSolicitante><ans:profissionalSolicitante>");
    expect(xml).toContain("</ans:dadosSolicitante><ans:dadosSolicitacao><ans:dataSolicitacao></ans:dataSolicitacao><ans:caraterAtendimento>1</ans:caraterAtendimento></ans:dadosSolicitacao><ans:dadosExecutante><ans:contratadoExecutante>");
    expect(xml).toContain("</ans:contratadoExecutante><ans:CNES>1234567</ans:CNES></ans:dadosExecutante>");
    expect(xml).not.toContain("<ans:nomeContratadoExecutante>");
    expect(xml).not.toContain("<ans:profissionalExecutante>");
    expect(xml).toContain("<ans:quantidadeExecutada>1</ans:quantidadeExecutada><ans:viaAcesso>1</ans:viaAcesso><ans:tecnicaUtilizada>1</ans:tecnicaUtilizada><ans:reducaoAcrescimo>1</ans:reducaoAcrescimo><ans:valorUnitario>120.00</ans:valorUnitario>");
    expect(xml).toContain("</ans:contratadoExecutante><ans:CNES>1234567</ans:CNES></ans:dadosExecutante>");
  });

  it("emite razão social, número de conselho e CBO no formato TISS", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{
      ...guia,
      nomeContratado: "T C SEVERINO",
      numeroConselhoProfissional: "20ª/07358",
      cbos: "2515-10",
    }]);
    expect(xml).toContain("<ans:nomeContratadoSolicitante>T C SEVERINO</ans:nomeContratadoSolicitante>");
    expect(xml).toContain("<ans:numeroConselhoProfissional>07358</ans:numeroConselhoProfissional>");
    expect(xml).toContain("<ans:CBOS>251510</ans:CBOS>");
  });

  it("emite 376402 e todos os campos editados do médico solicitante", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{
      ...guia,
      codigoPrestadorSolicitante: "376402",
      nomeProfissionalSolicitante: "Dra. Maria Solicitante",
      conselhoProfissionalSolicitante: "01",
      numeroConselhoSolicitante: "CRM/12345",
      ufSolicitante: "AM",
      cbosSolicitante: "2251-25",
    }]);
    expect(xml).toContain("<ans:codigoPrestadorNaOperadora>376402</ans:codigoPrestadorNaOperadora>");
    expect(xml).toContain("<ans:nomeProfissional>Dra. Maria Solicitante</ans:nomeProfissional>");
    expect(xml).toContain("<ans:conselhoProfissional>01</ans:conselhoProfissional>");
    expect(xml).toContain("<ans:numeroConselhoProfissional>12345</ans:numeroConselhoProfissional>");
    expect(xml).toContain("<ans:CBOS>225125</ans:CBOS>");
  });

  it("emite todos os dados do profissional executante em equipeSadt após os valores", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{
      ...guia,
      procedimentos: [{
        ...guia.procedimentos[0],
        equipeSadt: [{
          grauPart: "12",
          cpfContratado: "123.456.789-09",
          nomeProf: "JAIRO DE ASSIS MASCAREN",
          conselho: "11",
          numeroConselhoProfissional: "20ª/07358",
          uf: "AM",
          cbos: "2515-45",
        }],
      }],
    }]);
    const equipeEsperada = "<ans:equipeSadt><ans:grauPart>12</ans:grauPart><ans:codProfissional><ans:cpfContratado>12345678909</ans:cpfContratado></ans:codProfissional><ans:nomeProf>JAIRO DE ASSIS MASCAREN</ans:nomeProf><ans:conselho>11</ans:conselho><ans:numeroConselhoProfissional>07358</ans:numeroConselhoProfissional><ans:UF>13</ans:UF><ans:CBOS>251545</ans:CBOS></ans:equipeSadt>";
    expect(xml).toContain(equipeEsperada);
    expect(xml.indexOf("<ans:valorTotal>120.00</ans:valorTotal>")).toBeLessThan(xml.indexOf("<ans:equipeSadt>"));
  });

  it("normaliza o tipo de atendimento legado 05 para Exame 23", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{ ...guia, tipoAtendimento: "05" }]);
    expect(xml).toContain("<ans:tipoAtendimento>23</ans:tipoAtendimento>");
    expect(xml).not.toContain("<ans:tipoAtendimento>05</ans:tipoAtendimento>");
  });

  it("normaliza o valor histórico 11 para o regime ambulatorial 01", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{ ...guia, regimeAtendimento: "11" }]);
    expect(xml).toContain("<ans:regimeAtendimento>01</ans:regimeAtendimento>");
    expect(xml).not.toContain("<ans:regimeAtendimento>11</ans:regimeAtendimento>");
  });

  it("normaliza as horas do procedimento para o formato xs:time exigido pela Luminar", () => {
    const { xml } = gerarXmlTissSPSADT(config, [{
      ...guia,
      procedimentos: [{
        ...guia.procedimentos[0],
        horaInicio: "15:00",
        horaFim: "15:30",
      }],
    }]);

    expect(xml).toContain("<ans:horaInicial>15:00:00</ans:horaInicial>");
    expect(xml).toContain("<ans:horaFinal>15:30:00</ans:horaFinal>");
    expect(xml).not.toContain("<ans:horaInicial>15:00</ans:horaInicial>");
    expect(xml).not.toContain("<ans:horaFinal>15:30</ans:horaFinal>");
  });

  it("hash e deterministico para o mesmo conteudo", () => {
    const a = gerarXmlTissSPSADT(config, [guia]).hash;
    const b = gerarXmlTissSPSADT(config, [guia]).hash;
    expect(a).toBe(b);
  });

  it("calcularHashTISS ignora nomes de tags e espaços entre elementos", () => {
    const h1 = calcularHashTISS("<raiz><a>123</a>  <b>456</b></raiz>");
    const h2 = calcularHashTISS("<raiz><x>123</x><y>456</y></raiz>");
    expect(h1).toBe(h2); // mesmo conteudo textual 123456
  });

  it("calcula o hash com valores de folhas e codificação UTF-8", () => {
    const xml = `<ans:mensagem xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas"><ans:grupo><ans:campo>sessão</ans:campo></ans:grupo><ans:hash>antigo</ans:hash></ans:mensagem>`;
    const esperado = createHash("md5").update("sessão", "utf8").digest("hex");
    expect(calcularHashTISS(xml)).toBe(esperado);
  });

  it("mantém a declaração UTF-8 compatível com os bytes baixados e com o hash do epílogo", () => {
    const { xml, hash } = gerarXmlTissSPSADT({ ...config, encoding: "UTF-8" }, [guia]);
    const xmlBaixado = Buffer.from(xml, "utf8").toString("utf8");

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xmlBaixado).toBe(xml);
    expect(calcularHashTISS(xmlBaixado)).toBe(hash);
  });

  it("emite o XML Luminar sem prefixo de lote, sem numeroGuiaOperadora inválido e com hash conferível", () => {
    const { xml, hash } = gerarXmlTissSPSADT({
      ...config,
      numeroLote: "LOTE-202609-98376",
      limitarNumeroLoteA12: true,
      encoding: "UTF-8",
      registroANS: "418374",
    }, [{
      ...guia,
      registroANS: "418374",
      numeroGuiaOperadora: "AUTORIZACAO-QUE-NAO-PERTENCE-A-SP-SADT",
    }]);

    expect(xml).toContain("<ans:numeroLote>202609-98376</ans:numeroLote>");
    expect(xml).not.toContain("LOTE-202609-98376");
    expect(xml).not.toContain("<ans:numeroGuiaOperadora>");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(calcularHashTISS(Buffer.from(xml, "utf8").toString("utf8"))).toBe(hash);
  });

  it("mantém lote GEAP limitado e hash conferível quando o arquivo é baixado em UTF-8", () => {
    const { xml, hash } = gerarXmlTissSPSADT({
      ...config,
      numeroLote: "LOTE-202609-59295",
      limitarNumeroLoteA12: true,
      encoding: "UTF-8",
    }, [guia]);

    const xmlBaixado = Buffer.from(xml, "utf8").toString("utf8");
    expect(xml).toContain("<ans:numeroLote>202609-59295</ans:numeroLote>");
    expect(xml).not.toContain("<ans:numeroLote>LOTE-202609-59295</ans:numeroLote>");
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(calcularHashTISS(xmlBaixado)).toBe(hash);
  });

  it("gera multiplas guias no mesmo lote", () => {
    const { xml } = gerarXmlTissSPSADT(config, [guia, { ...guia, numeroGuiaPrestador: "G-002" }]);
    const ocorrencias = (xml.match(/ans:guiaSP-SADT/g) || []).length;
    // cada guia gera tag de abertura e fechamento => 2 guias = 4 ocorrencias
    expect(ocorrencias).toBe(4);
  });
});
