import { createHash } from "crypto";
import { create } from "xmlbuilder2";
import { DOMParser } from "@xmldom/xmldom";
import { validarProfissionalTiss, getDescricaoConselho, getDescricaoCBO } from "./tissInterfaces";
import { normalizarCodigoCboTiss, normalizarNumeroConselhoTiss } from "../shared/identificacaoProfissionalTiss";
import { EquipeSadtTiss } from "../shared/equipeSadtTiss";
import { normalizarNumeroLoteTiss } from "../shared/numeroLotePostalSaude";

/**
 * Valida a combinação Conselho (Tabela 26) + CBO (Tabela 24) antes de gerar o XML.
 * Lança erro descritivo se a combinação for inválida (causaria glosa automática).
 */
export function validarProfissionalParaXML(codigoConselho: string, codigoCBO: string): void {
  if (!codigoCBO) return; // CBO opcional — não bloqueia se não informado
  const valido = validarProfissionalTiss(codigoConselho, codigoCBO);
  if (!valido) {
    const conselho = getDescricaoConselho(codigoConselho) ?? codigoConselho;
    const cbo = getDescricaoCBO(codigoCBO) ?? codigoCBO;
    throw new Error(
      `Combinação inválida para o TISS: ${conselho} (${codigoConselho}) não pode usar CBO ${cbo} (${codigoCBO}). Isso causaria glosa automática na operadora.`
    );
  }
}

/**
 * Gerador de XML no padrão TISS 4.02.00 (ANS) para a Guia SP/SADT.
 *
 * Estrutura de blocos:
 *  - ans:cabecalho (identificacaoTransacao, origem, destino, Padrao)
 *  - ans:prestadorParaOperadora / ans:loteGuias (numeroLote, guiasTISS/guiaSP-SADT)
 *  - ans:epilogo / ans:hash (MD5 sobre a concatenação do conteúdo das tags)
 *
 * Namespace oficial ANS 4.02.00. A codificação declarada deve corresponder aos
 * bytes do arquivo efetivamente baixado pelo navegador.
 */

const ANS_NS = "http://www.ans.gov.br/padroes/tiss/schemas";
const XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";
const SCHEMA_LOCATION = `${ANS_NS} tissV4_02_00.xsd`;

export interface TissProcedimento {
  sequencial?: number;
  dataExecucao?: string; // AAAA-MM-DD
  horaInicio?: string;   // HH:MM:SS (opcional — usado em terapias)
  horaFim?: string;      // HH:MM:SS (opcional — usado em terapias)
  codigoTabela?: string; // 22 = TUSS
  codigoProcedimento: string;
  descricaoProcedimento: string;
  quantidadeExecutada: number;
  viaAcesso?: string;
  tecnicaUtilizada?: string;
  reducaoAcrescimo?: string;
  valorUnitario: number;
  valorTotal: number;
  equipeSadt?: EquipeSadtTiss[];
}

export interface TissGuia {
  numeroGuiaPrestador: string;
  numeroGuiaOperadora?: string | null;
  registroANS: string;
  // Autorização
  senhaAutorizacao?: string | null;
  dataAutorizacao?: string | null;
  dataValidadeSenha?: string | null;
  // Beneficiário
  numeroCarteira: string;
  validadeCarteira?: string | null;
  atendimentoRN?: "S" | "N";
  nomeBeneficiario: string;
  // Solicitante / Executante
  codigoPrestadorNaOperadora: string;
  codigoPrestadorSolicitante?: string;
  nomeContratado: string;
  cnes?: string | null;
  dataSolicitacao?: string | null;
  // Profissional executante
  nomeProfissional: string;
  conselhoProfissional?: string; // 06=CRM (default)
  numeroConselhoProfissional: string;
  ufConselho: string;
  cbos?: string | null;
  // Profissional solicitante (campos 15 a 19; quando editados no Pré-faturamento)
  nomeProfissionalSolicitante?: string | null;
  conselhoProfissionalSolicitante?: string | null;
  numeroConselhoSolicitante?: string | null;
  ufSolicitante?: string | null;
  cbosSolicitante?: string | null;
  // Atendimento
  tipoAtendimento?: string;     // default 05
  indicacaoAcidente?: string;   // default 9
  caraterAtendimento?: string;  // 1=Eletivo 2=Urgência
  regimeAtendimento?: string;   // NOVO 4.02.00: campo 91 (obrigatório)
  saudeOcupacional?: string;    // NOVO 4.02.00: campo 92 (opcional)
  motivoEncerramento?: string;  // campo 36
  // Diagnóstico
  cid10Principal?: string | null;
  indicacaoClinica?: string | null;
  // Procedimentos
  procedimentos: TissProcedimento[];
  // Valores
  valorProcedimentos: number;
  valorTotalGeral: number;
}

export interface TissLoteConfig {
  versaoTISS?: string;           // default 4.02.00
  tipoTransacao?: string;        // default ENVIO_LOTE_GUIAS
  sequencialTransacao: string;
  dataRegistro?: string;         // AAAA-MM-DD
  horaRegistro?: string;         // HH:MM:SS
  numeroLote: string;
  registroANS: string;           // operadora destino
  cnpjPrestador: string;
  codigoPrestadorNaOperadora: string;
  encoding?: string;             // default ISO-8859-1; Postal Saúde usa UTF-8 no download web
  limitarNumeroLoteA12?: boolean;
  identificarPrestadorPorCnpj?: boolean;
}

function esc(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function money(v: number | null | undefined): string {
  return (v ?? 0).toFixed(2);
}

function onlyDigits(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

/** Tabela de domínio TISS para UF, usando os códigos IBGE de duas posições. */
const CODIGO_UF_TISS: Record<string, string> = {
  AC: "12", AL: "27", AP: "16", AM: "13", BA: "29", CE: "23", DF: "53",
  ES: "32", GO: "52", MA: "21", MT: "51", MS: "50", MG: "31", PA: "15",
  PB: "25", PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24", RS: "43",
  RO: "11", RR: "14", SC: "42", SP: "35", SE: "28", TO: "17",
};

function normalizarUfTiss(uf: string | null | undefined): string {
  const valor = (uf ?? "").trim().toUpperCase();
  return CODIGO_UF_TISS[valor] ?? valor;
}

/**
 * A Tabela 76 da ANS define 01 como Regime de Atendimento Ambulatorial.
 * Guias históricas que receberam o valor 11 antes da correção são tratadas
 * como ambulatoriais para que a regeneração do lote não produza um domínio
 * inválido.
 */
function normalizarRegimeAtendimentoTiss(regime: string | null | undefined): string {
  const valor = (regime ?? "").trim().toUpperCase();
  if (!valor || valor === "AMBULATORIAL" || valor === "11") return "01";
  return /^\d+$/.test(valor) ? valor.padStart(2, "0") : valor;
}

/**
 * O domínio dm_tipoAtendimento da versão 4.02.00 não aceita mais o código
 * legado 05. O código 23 representa Exame no domínio vigente.
 */
function normalizarTipoAtendimentoTiss(tipo: string | null | undefined): string {
  const valor = (tipo ?? "").trim().toUpperCase();
  if (!valor || valor === "05" || valor === "EXAME" || valor === "EXAME AMBULATORIAL") {
    return "23";
  }
  return /^\d+$/.test(valor) ? valor.padStart(2, "0") : valor;
}

/** O tipo `st_hora` do XSD TISS é `xs:time`, que requer os segundos. */
function normalizarHoraTiss(hora: string | null | undefined): string | undefined {
  const valor = String(hora ?? "").trim();
  const partes = /^(?:([01]\d|2[0-3]):([0-5]\d))(?:[:]([0-5]\d))?$/.exec(valor);
  if (!partes) return undefined;
  return `${partes[1]}:${partes[2]}:${partes[3] ?? "00"}`;
}

/**
 * Constrói o bloco de guias (sem cabeçalho/epílogo).
 * Retorna o XML das guias em ordem, usado tanto na montagem quanto no hash.
 */
function buildGuiasXML(guias: TissGuia[], cnpjContratado?: string): string {
  let out = "";
  for (const g of guias) {
    out += "<ans:guiaSP-SADT>";
    // Cabeçalho da guia
    out += "<ans:cabecalhoGuia>";
    out += `<ans:registroANS>${esc(g.registroANS)}</ans:registroANS>`;
    out += `<ans:numeroGuiaPrestador>${esc(g.numeroGuiaPrestador)}</ans:numeroGuiaPrestador>`;
    out += "</ans:cabecalhoGuia>";
    // Autorização
    if (g.senhaAutorizacao || g.dataAutorizacao || g.dataValidadeSenha) {
      out += "<ans:dadosAutorizacao>";
      if (g.dataAutorizacao) out += `<ans:dataAutorizacao>${esc(g.dataAutorizacao)}</ans:dataAutorizacao>`;
      if (g.senhaAutorizacao) out += `<ans:senha>${esc(g.senhaAutorizacao)}</ans:senha>`;
      if (g.dataValidadeSenha) out += `<ans:dataValidadeSenha>${esc(g.dataValidadeSenha)}</ans:dataValidadeSenha>`;
      out += "</ans:dadosAutorizacao>";
    }
    // O validador Bradesco exige número de carteirinha neste bloco.
    out += "<ans:dadosBeneficiario>";
    out += `<ans:numeroCarteira>${esc(g.numeroCarteira)}</ans:numeroCarteira>`;
    if (g.validadeCarteira) out += `<ans:validadeCarteira>${esc(g.validadeCarteira)}</ans:validadeCarteira>`;
    out += `<ans:atendimentoRN>${esc(g.atendimentoRN ?? "N")}</ans:atendimentoRN>`;
    out += "</ans:dadosBeneficiario>";
    // Solicitante deve preceder o executante no leiaute aceito pela operadora.
    out += "<ans:dadosSolicitante>";
    const codigoSolicitante = g.codigoPrestadorSolicitante ?? g.codigoPrestadorNaOperadora;
    if (cnpjContratado) {
      out += "<ans:contratadoSolicitante>";
      out += `<ans:cnpjContratado>${esc(cnpjContratado)}</ans:cnpjContratado>`;
      out += "</ans:contratadoSolicitante>";
    } else if (codigoSolicitante) {
      out += "<ans:contratadoSolicitante>";
      out += `<ans:codigoPrestadorNaOperadora>${esc(codigoSolicitante)}</ans:codigoPrestadorNaOperadora>`;
      out += "</ans:contratadoSolicitante>";
    }
    if (g.nomeContratado) out += `<ans:nomeContratadoSolicitante>${esc(g.nomeContratado)}</ans:nomeContratadoSolicitante>`;
    out += "<ans:profissionalSolicitante>";
    out += `<ans:nomeProfissional>${esc(g.nomeProfissionalSolicitante ?? g.nomeProfissional)}</ans:nomeProfissional>`;
    out += `<ans:conselhoProfissional>${esc(g.conselhoProfissionalSolicitante ?? g.conselhoProfissional ?? "11")}</ans:conselhoProfissional>`;
    out += `<ans:numeroConselhoProfissional>${esc(normalizarNumeroConselhoTiss(g.numeroConselhoSolicitante ?? g.numeroConselhoProfissional))}</ans:numeroConselhoProfissional>`;
    out += `<ans:UF>${esc(normalizarUfTiss(g.ufSolicitante ?? g.ufConselho))}</ans:UF>`;
    const cbo = normalizarCodigoCboTiss(g.cbosSolicitante ?? g.cbos);
    if (cbo) out += `<ans:CBOS>${esc(cbo)}</ans:CBOS>`;
    out += "</ans:profissionalSolicitante>";
    out += "</ans:dadosSolicitante>";
    // A solicitação deve ficar entre solicitante e executante.
    out += "<ans:dadosSolicitacao>";
    out += `<ans:dataSolicitacao>${esc(g.dataSolicitacao ?? "")}</ans:dataSolicitacao>`;
    out += `<ans:caraterAtendimento>${esc(g.caraterAtendimento ?? "1")}</ans:caraterAtendimento>`;
    if (g.indicacaoClinica) out += `<ans:indicacaoClinica>${esc(g.indicacaoClinica)}</ans:indicacaoClinica>`;
    out += "</ans:dadosSolicitacao>";
    // O XSD da Guia SP/SADT 4.02.00 permite somente contratado e CNES neste bloco.
    out += "<ans:dadosExecutante>";
    if (cnpjContratado) {
      out += "<ans:contratadoExecutante>";
      out += `<ans:cnpjContratado>${esc(cnpjContratado)}</ans:cnpjContratado>`;
      out += "</ans:contratadoExecutante>";
    } else if (g.codigoPrestadorNaOperadora) {
      out += "<ans:contratadoExecutante>";
      out += `<ans:codigoPrestadorNaOperadora>${esc(g.codigoPrestadorNaOperadora)}</ans:codigoPrestadorNaOperadora>`;
      out += "</ans:contratadoExecutante>";
    }
    if (g.cnes) out += `<ans:CNES>${esc(g.cnes)}</ans:CNES>`;
    out += "</ans:dadosExecutante>";
    // Dados do atendimento (4.02.00: regimeAtendimento obrigatório, saudeOcupacional opcional)
    out += "<ans:dadosAtendimento>";
    out += `<ans:tipoAtendimento>${esc(normalizarTipoAtendimentoTiss(g.tipoAtendimento))}</ans:tipoAtendimento>`;
    out += `<ans:indicacaoAcidente>${esc(g.indicacaoAcidente ?? "9")}</ans:indicacaoAcidente>`;
    // Campo 91 — Regime de Atendimento (obrigatório na 4.02.00)
    out += `<ans:regimeAtendimento>${esc(normalizarRegimeAtendimentoTiss(g.regimeAtendimento))}</ans:regimeAtendimento>`;
    // Campo 92 — Saúde Ocupacional (opcional)
    if (g.saudeOcupacional) {
      out += `<ans:saudeOcupacional>${esc(g.saudeOcupacional)}</ans:saudeOcupacional>`;
    }
    if (g.motivoEncerramento) {
      out += `<ans:motivoEncerramento>${esc(g.motivoEncerramento)}</ans:motivoEncerramento>`;
    }
    out += "</ans:dadosAtendimento>";
    // Diagnóstico
    if (g.cid10Principal) {
      out += "<ans:dadosDiagnostico>";
      if (g.cid10Principal) out += `<ans:CID10Principal>${esc(g.cid10Principal)}</ans:CID10Principal>`;
      out += "</ans:dadosDiagnostico>";
    }
    // Procedimentos executados
    out += "<ans:procedimentosExecutados>";
    for (const p of g.procedimentos) {
      out += "<ans:procedimentoExecutado>";
      if (p.sequencial !== undefined) out += `<ans:sequencialItem>${esc(p.sequencial)}</ans:sequencialItem>`;
      if (p.dataExecucao) out += `<ans:dataExecucao>${esc(p.dataExecucao)}</ans:dataExecucao>`;
      const horaInicial = normalizarHoraTiss(p.horaInicio);
      const horaFinal = normalizarHoraTiss(p.horaFim);
      if (horaInicial) out += `<ans:horaInicial>${esc(horaInicial)}</ans:horaInicial>`;
      if (horaFinal) out += `<ans:horaFinal>${esc(horaFinal)}</ans:horaFinal>`;
      out += "<ans:procedimento>";
      out += `<ans:codigoTabela>${esc(p.codigoTabela ?? "22")}</ans:codigoTabela>`;
      out += `<ans:codigoProcedimento>${esc(p.codigoProcedimento)}</ans:codigoProcedimento>`;
      out += `<ans:descricaoProcedimento>${esc(p.descricaoProcedimento)}</ans:descricaoProcedimento>`;
      out += "</ans:procedimento>";
      out += `<ans:quantidadeExecutada>${esc(p.quantidadeExecutada)}</ans:quantidadeExecutada>`;
      out += `<ans:viaAcesso>${esc(p.viaAcesso ?? "1")}</ans:viaAcesso>`;
      out += `<ans:tecnicaUtilizada>${esc(p.tecnicaUtilizada ?? "1")}</ans:tecnicaUtilizada>`;
      out += `<ans:reducaoAcrescimo>${esc(p.reducaoAcrescimo ?? "1")}</ans:reducaoAcrescimo>`;
      out += `<ans:valorUnitario>${money(p.valorUnitario)}</ans:valorUnitario>`;
      out += `<ans:valorTotal>${money(p.valorTotal)}</ans:valorTotal>`;
      for (const equipe of p.equipeSadt ?? []) {
        out += "<ans:equipeSadt>";
        out += `<ans:grauPart>${esc(equipe.grauPart)}</ans:grauPart>`;
        out += "<ans:codProfissional>";
        if (equipe.cpfContratado) {
          out += `<ans:cpfContratado>${esc(onlyDigits(equipe.cpfContratado))}</ans:cpfContratado>`;
        } else if (equipe.codigoProfissional) {
          out += `<ans:codigoPrestadorNaOperadora>${esc(equipe.codigoProfissional)}</ans:codigoPrestadorNaOperadora>`;
        }
        out += "</ans:codProfissional>";
        out += `<ans:nomeProf>${esc(equipe.nomeProf)}</ans:nomeProf>`;
        out += `<ans:conselho>${esc(equipe.conselho)}</ans:conselho>`;
        out += `<ans:numeroConselhoProfissional>${esc(normalizarNumeroConselhoTiss(equipe.numeroConselhoProfissional))}</ans:numeroConselhoProfissional>`;
        out += `<ans:UF>${esc(normalizarUfTiss(equipe.uf))}</ans:UF>`;
        out += `<ans:CBOS>${esc(normalizarCodigoCboTiss(equipe.cbos))}</ans:CBOS>`;
        out += "</ans:equipeSadt>";
      }
      out += "</ans:procedimentoExecutado>";
    }
    out += "</ans:procedimentosExecutados>";
    // Valor total
    out += "<ans:valorTotal>";
    out += `<ans:valorProcedimentos>${money(g.valorProcedimentos)}</ans:valorProcedimentos>`;
    out += `<ans:valorTotalGeral>${money(g.valorTotalGeral)}</ans:valorTotalGeral>`;
    out += "</ans:valorTotal>";
    out += "</ans:guiaSP-SADT>";
  }
  return out;
}

/**
 * Calcula o hash MD5 TISS pela concatenação dos textos de elementos-folha
 * em ordem de documento. O padrão exige valores em UTF-8 para o digest,
 * mesmo quando o arquivo XML é declarado como ISO-8859-1.
 */
export function calcularHashTISS(xmlSemEpilogo: string): string {
  const document = new DOMParser().parseFromString(xmlSemEpilogo, "application/xml");
  const parserErrors = document.getElementsByTagName("parsererror");
  if (parserErrors.length > 0 || !document.documentElement) {
    throw new Error("Não foi possível calcular o hash: XML TISS malformado.");
  }

  const hashElements = Array.from(document.getElementsByTagNameNS(ANS_NS, "hash"));
  if (hashElements.length > 1) {
    throw new Error("Não foi possível calcular o hash: o XML contém mais de um elemento hash.");
  }
  if (hashElements[0]) hashElements[0].textContent = "";

  const valores: string[] = [];
  const coletarFolhas = (element: Element) => {
    const filhosElementos = Array.from(element.childNodes).filter(
      child => child.nodeType === child.ELEMENT_NODE,
    ) as Element[];
    if (filhosElementos.length === 0) {
      valores.push(element.textContent ?? "");
      return;
    }
    filhosElementos.forEach(coletarFolhas);
  };

  coletarFolhas(document.documentElement as unknown as Element);
  return createHash("md5").update(valores.join(""), "utf8").digest("hex");
}

/**
 * Gera o XML completo do lote no padrão TISS 4.02.00.
 *
 * Mudanças em relação à 4.01.00:
 *  - versão padrão: "4.02.00"
 *  - xsi:schemaLocation aponta para tissV4_02_00.xsd
 *  - campo 91 (regimeAtendimento) obrigatório em dadosAtendimento
 *  - campo 92 (saudeOcupacional) opcional em dadosAtendimento
 *  - indicacaoClinica incluída em dadosDiagnostico quando presente
 */
export function gerarXmlTissSPSADT(config: TissLoteConfig, guias: TissGuia[]): { xml: string; hash: string } {
  const versao = config.versaoTISS ?? "4.02.00";
  const tipoTransacao = config.tipoTransacao ?? "ENVIO_LOTE_GUIAS";
  const encoding = config.encoding ?? "ISO-8859-1";
  const now = new Date();
  const dataRegistro = config.dataRegistro ?? now.toISOString().split("T")[0];
  const horaRegistro = config.horaRegistro ?? now.toTimeString().split(" ")[0];

  // Cabeçalho
  let cabecalho = "<ans:cabecalho>";
  cabecalho += "<ans:identificacaoTransacao>";
  cabecalho += `<ans:tipoTransacao>${esc(tipoTransacao)}</ans:tipoTransacao>`;
  cabecalho += `<ans:sequencialTransacao>${esc(config.sequencialTransacao)}</ans:sequencialTransacao>`;
  cabecalho += `<ans:dataRegistroTransacao>${esc(dataRegistro)}</ans:dataRegistroTransacao>`;
  cabecalho += `<ans:horaRegistroTransacao>${esc(horaRegistro)}</ans:horaRegistroTransacao>`;
  cabecalho += "</ans:identificacaoTransacao>";
  cabecalho += "<ans:origem>";
  cabecalho += "<ans:identificacaoPrestador>";
  const codigoPrestadorNaOperadora = (config.codigoPrestadorNaOperadora ?? "").trim();
  const cnpjPrestador = onlyDigits(config.cnpjPrestador);
  const identificarPrestadorPorCnpj = Boolean(config.identificarPrestadorPorCnpj && cnpjPrestador);
  if (identificarPrestadorPorCnpj) {
    cabecalho += `<ans:CNPJ>${esc(cnpjPrestador)}</ans:CNPJ>`;
  } else if (codigoPrestadorNaOperadora) {
    cabecalho += `<ans:codigoPrestadorNaOperadora>${esc(codigoPrestadorNaOperadora)}</ans:codigoPrestadorNaOperadora>`;
  } else if (cnpjPrestador) {
    cabecalho += `<ans:CNPJ>${esc(cnpjPrestador)}</ans:CNPJ>`;
  }
  cabecalho += "</ans:identificacaoPrestador>";
  cabecalho += "</ans:origem>";
  cabecalho += "<ans:destino>";
  cabecalho += `<ans:registroANS>${esc(config.registroANS)}</ans:registroANS>`;
  cabecalho += "</ans:destino>";
  cabecalho += `<ans:Padrao>${esc(versao)}</ans:Padrao>`;
  cabecalho += "</ans:cabecalho>";

  // Corpo
  // A crítica 441 exige que o contratado executante seja idêntico ao
  // identificador de prestador informado no cabeçalho do lote.
  const numeroLoteTiss = config.limitarNumeroLoteA12
    ? normalizarNumeroLoteTiss(config.numeroLote)
    : String(config.numeroLote ?? "");
  const guiasComCodigoDoCabecalho = !identificarPrestadorPorCnpj && codigoPrestadorNaOperadora
    ? guias.map(guia => ({ ...guia, codigoPrestadorNaOperadora }))
    : guias;
  const guiasXml = buildGuiasXML(
    guiasComCodigoDoCabecalho,
    identificarPrestadorPorCnpj ? cnpjPrestador : undefined,
  );
  let corpo = "<ans:prestadorParaOperadora>";
  corpo += "<ans:loteGuias>";
  corpo += `<ans:numeroLote>${esc(numeroLoteTiss)}</ans:numeroLote>`;
  corpo += "<ans:guiasTISS>";
  corpo += guiasXml;
  corpo += "</ans:guiasTISS>";
  corpo += "</ans:loteGuias>";
  corpo += "</ans:prestadorParaOperadora>";

  // XML sem epílogo (para hash) — schemaLocation atualizado para 4.02.00
  const abertura =
    `<ans:mensagemTISS xmlns:ans="${ANS_NS}" ` +
    `xmlns:xsi="${XSI_NS}" ` +
    `xsi:schemaLocation="${SCHEMA_LOCATION}">`;
  const semEpilogo = abertura + cabecalho + corpo;

  const xmlParaHash = semEpilogo + "<ans:epilogo><ans:hash></ans:hash></ans:epilogo></ans:mensagemTISS>";
  const hash = calcularHashTISS(xmlParaHash);

  const epilogo = `<ans:epilogo><ans:hash>${hash}</ans:hash></ans:epilogo>`;

  const xml =
    `<?xml version="1.0" encoding="${encoding}"?>\n` +
    semEpilogo +
    epilogo +
    "</ans:mensagemTISS>";

  return { xml, hash };
}

/**
 * Utilitário auxiliar usando xmlbuilder2 para gerar XML de guia SP/SADT mínima.
 * Útil para testes e validações pontuais sem montar o lote completo.
 */
export function gerarXmlGuiaSadtMinimo(dados: {
  sequencialTransacao: string;
  numeroLote: string;
  registroANS: string;
  numeroGuiaPrestador: string;
  numeroCarteira: string;
  nomeBeneficiario: string;
}): string {
  const dataAtual = new Date().toISOString().split("T")[0];
  const horaAtual = new Date().toTimeString().split(" ")[0];

  const doc = create({ version: "1.0", encoding: "UTF-8" })
    .ele("ans:mensagemTISS", {
      "xmlns:ans": ANS_NS,
      "xmlns:xsi": XSI_NS,
      "xsi:schemaLocation": SCHEMA_LOCATION,
    })
      .ele("ans:cabecalho")
        .ele("ans:identificacaoTransacao")
          .ele("ans:tipoTransacao").txt("ENVIO_LOTE_GUIAS").up()
          .ele("ans:sequencialTransacao").txt(dados.sequencialTransacao).up()
          .ele("ans:dataRegistroTransacao").txt(dataAtual).up()
          .ele("ans:horaRegistroTransacao").txt(horaAtual).up()
        .up()
        .ele("ans:Padrao").txt("4.02.00").up()
      .up()
      .ele("ans:prestadorParaOperadora")
        .ele("ans:loteGuias")
          .ele("ans:numeroLote").txt(dados.numeroLote).up()
          .ele("ans:guiasTISS")
            .ele("ans:guiaSP-SADT")
              .ele("ans:cabecalhoGuia")
                .ele("ans:registroANS").txt(dados.registroANS).up()
                .ele("ans:numeroGuiaPrestador").txt(dados.numeroGuiaPrestador).up()
              .up()
              .ele("ans:dadosBeneficiario")
                .ele("ans:numeroCarteira").txt(dados.numeroCarteira).up()
                .ele("ans:atendimentoRN").txt("N").up()
                .ele("ans:nomeBeneficiario").txt(dados.nomeBeneficiario).up()
              .up()
            .up()
          .up()
        .up()
      .up()
    .up();

  return doc.end({ prettyPrint: true });
}
