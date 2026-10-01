import { XMLParser, XMLValidator } from "fast-xml-parser";

/**
 * Validador estrutural do XML no padrão TISS 4.02.00 (ANS).
 *
 * Em vez de depender de um validador XSD nativo (libxml) ou baseado em Java
 * — que não são garantidos no runtime de deploy —, este módulo implementa a
 * validação a partir das regras extraídas dos XSDs oficiais da ANS presentes
 * em `server/tiss-schemas/` (Componente de Comunicação 04.01.00):
 *
 *  - tissV4_02_00.xsd        → elemento raiz `mensagemTISS`, ordem cabecalho→corpo→epilogo
 *  - tissComplexTypesV4...   → estrutura do cabeçalho e da guia
 *  - tissGuiasV4_02_00.xsd   → estrutura da guiaSP-SADT e do loteGuias
 *  - tissSimpleTypesV4_02_00.xsd → padrões dos tipos simples (data, hora, registroANS, textos, enums)
 *
 * O objetivo é reproduzir as rejeições mais comuns dos portais das operadoras
 * (campos obrigatórios ausentes, ordem incorreta, formato de data/hora/valor
 * inválido, registro ANS fora do padrão, versão não suportada, hash ausente).
 */

export interface TissValidationError {
  /** Caminho lógico do problema, ex: "mensagemTISS > cabecalho > Padrao" */
  path: string;
  /** Mensagem legível descrevendo a rejeição */
  message: string;
  /** Severidade: "error" impede o envio; "warning" é recomendação */
  severity: "error" | "warning";
}

export interface TissValidationResult {
  valid: boolean;
  version: string;
  errors: TissValidationError[];
  warnings: TissValidationError[];
}

const ANS_NS = "http://www.ans.gov.br/padroes/tiss/schemas";

// Enumerações e padrões derivados do XSD oficial (tissSimpleTypesV4_01_00.xsd)
// Enumerações e padrões derivados do XSD oficial (tissSimpleTypesV4_02_00.xsd)
const VERSOES_SUPORTADAS = ["4.00.00", "4.00.01", "4.01.00", "4.02.00"];
const TIPOS_TRANSACAO = [
  "ENVIO_LOTE_GUIAS",
  "ENVIO_ANEXO",
  "SOLIC_DEMONSTRATIVO_RETORNO",
  "SOLIC_STATUS_PROTOCOLO",
  "SOLICITACAO_PROCEDIMENTOS",
  "SOLICITA_STATUS_AUTORIZACAO",
  "VERIFICA_ELEGIBILIDADE",
  "CANCELA_GUIA",
  "COMUNICACAO_BENEFICIARIO",
  "RECURSO_GLOSA",
  "SOLIC_STATUS_RECURSO_GLOSA",
  "ENVIO_DOCUMENTOS",
];

// st_data → xsd:date (AAAA-MM-DD)
const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
// st_hora → xsd:time (HH:MM:SS[.sss][±TZ])
const RE_HORA = /^\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}:\d{2}|Z)?$/;
// st_registroANS → 6 dígitos
const RE_REGISTRO_ANS = /^\d{6}$/;
// valores monetários → decimal com no máximo 2 casas
const RE_MONETARIO = /^\d+(\.\d{1,2})?$/;

/** Remove o prefixo de namespace de uma chave (ans:cabecalho → cabecalho). */
function localName(key: string): string {
  const idx = key.indexOf(":");
  return idx >= 0 ? key.slice(idx + 1) : key;
}

/** Normaliza um objeto/array vindo do parser em array. */
function asArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Obtém a chave real (com ou sem prefixo ans:) de um objeto para um dado
 * nome local, retornando o valor associado.
 */
function getChild(obj: Record<string, any> | undefined, name: string): any {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of Object.keys(obj)) {
    if (localName(key) === name) return obj[key];
  }
  return undefined;
}

/** Retorna as chaves (nomes locais) de um objeto na ordem em que aparecem. */
function childOrder(obj: Record<string, any> | undefined): string[] {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj)
    .filter((k) => k !== "#text" && !k.startsWith("@_"))
    .map(localName);
}

function toText(v: any): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "object") {
    if ("#text" in v) return String(v["#text"]);
    return "";
  }
  return String(v);
}

/**
 * Valida o XML TISS gerado contra as regras derivadas do XSD oficial da ANS.
 */
export function validarXmlTiss(xml: string): TissValidationResult {
  const errors: TissValidationError[] = [];
  const warnings: TissValidationError[] = [];
  let version = "";

  // 1) XML bem-formado
  const wellFormed = XMLValidator.validate(xml, { allowBooleanAttributes: true });
  if (wellFormed !== true) {
    errors.push({
      path: "documento",
      message: `XML mal formado: ${wellFormed.err.msg} (linha ${wellFormed.err.line}).`,
      severity: "error",
    });
    return { valid: false, version, errors, warnings };
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    trimValues: true,
    // Preserva a ordem dos filhos é útil, mas o modo padrão já mantém a ordem
    // de inserção das chaves, o que usamos para checar a sequência.
  });

  let doc: Record<string, any>;
  try {
    doc = parser.parse(xml);
  } catch (e: any) {
    errors.push({ path: "documento", message: `Falha ao interpretar o XML: ${e?.message ?? e}`, severity: "error" });
    return { valid: false, version, errors, warnings };
  }

  // 2) Declaração de encoding (a maioria das operadoras exige ISO-8859-1)
  const encodingMatch = xml.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i);
  if (!encodingMatch) {
    warnings.push({
      path: "declaracao",
      message: "Declaração XML sem encoding explícito; recomenda-se ISO-8859-1.",
      severity: "warning",
    });
  } else if (!/iso-8859-1/i.test(encodingMatch[1])) {
    warnings.push({
      path: "declaracao",
      message: `Encoding "${encodingMatch[1]}" pode ser rejeitado; o padrão TISS adota ISO-8859-1.`,
      severity: "warning",
    });
  }

  // 3) Elemento raiz mensagemTISS
  const rootKey = Object.keys(doc).find((k) => localName(k) === "mensagemTISS");
  if (!rootKey) {
    errors.push({
      path: "documento",
      message: 'Elemento raiz "ans:mensagemTISS" não encontrado.',
      severity: "error",
    });
    return { valid: false, version, errors, warnings };
  }
  const root = doc[rootKey];

  // 3.1) Namespace ANS declarado
  const nsDeclarado = Object.keys(root).some(
    (k) => k.startsWith("@_xmlns") && String(root[k]) === ANS_NS,
  );
  if (!nsDeclarado) {
    errors.push({
      path: "mensagemTISS",
      message: `Namespace oficial da ANS ausente ou incorreto (esperado "${ANS_NS}").`,
      severity: "error",
    });
  }

  // 4) Ordem obrigatória: cabecalho → (corpo) → epilogo → [Signature]
  const ordem = childOrder(root);
  const posCabecalho = ordem.indexOf("cabecalho");
  const posEpilogo = ordem.indexOf("epilogo");
  const corpoNome = ordem.find((n) => n === "prestadorParaOperadora" || n === "operadoraParaPrestador");
  const posCorpo = corpoNome ? ordem.indexOf(corpoNome) : -1;

  if (posCabecalho === -1) {
    errors.push({ path: "mensagemTISS", message: 'Bloco obrigatório "cabecalho" ausente.', severity: "error" });
  }
  if (posEpilogo === -1) {
    errors.push({ path: "mensagemTISS", message: 'Bloco obrigatório "epilogo" ausente.', severity: "error" });
  }
  if (posCabecalho !== -1 && posCorpo !== -1 && posCabecalho > posCorpo) {
    errors.push({
      path: "mensagemTISS",
      message: 'Ordem inválida: "cabecalho" deve preceder o corpo da mensagem.',
      severity: "error",
    });
  }
  if (posCorpo !== -1 && posEpilogo !== -1 && posCorpo > posEpilogo) {
    errors.push({
      path: "mensagemTISS",
      message: 'Ordem inválida: o corpo da mensagem deve preceder o "epilogo".',
      severity: "error",
    });
  }
  if (posCabecalho !== -1 && posEpilogo !== -1 && posCabecalho > posEpilogo) {
    errors.push({
      path: "mensagemTISS",
      message: 'Ordem inválida: "cabecalho" deve preceder o "epilogo".',
      severity: "error",
    });
  }

  // 5) Validação do cabeçalho
  const cabecalho = getChild(root, "cabecalho");
  if (cabecalho) {
    version = validarCabecalho(cabecalho, errors);
  }

  // 6) Validação do corpo (loteGuias / guiaSP-SADT)
  const corpo = corpoNome ? getChild(root, corpoNome) : undefined;
  if (corpoNome === "prestadorParaOperadora" && corpo) {
    validarLoteGuias(corpo, errors, warnings);
  }

  // 7) Validação do epílogo (hash obrigatório)
  const epilogo = getChild(root, "epilogo");
  if (epilogo) {
    const hash = toText(getChild(epilogo, "hash"));
    if (!hash) {
      errors.push({
        path: "mensagemTISS > epilogo > hash",
        message: "Hash do epílogo ausente. É obrigatório o MD5 de integridade da mensagem.",
        severity: "error",
      });
    } else if (!/^[a-f0-9]{32}$/i.test(hash)) {
      errors.push({
        path: "mensagemTISS > epilogo > hash",
        message: `Hash "${hash}" não está no formato MD5 (32 caracteres hexadecimais).`,
        severity: "error",
      });
    }
  }

  return {
    valid: errors.length === 0,
    version,
    errors,
    warnings,
  };
}

function validarCabecalho(cabecalho: Record<string, any>, errors: TissValidationError[]): string {
  const base = "mensagemTISS > cabecalho";
  let version = "";

  // identificacaoTransacao
  const idTrans = getChild(cabecalho, "identificacaoTransacao");
  if (!idTrans) {
    errors.push({ path: base, message: 'Bloco "identificacaoTransacao" ausente no cabeçalho.', severity: "error" });
  } else {
    const tipo = toText(getChild(idTrans, "tipoTransacao"));
    if (!tipo) {
      errors.push({ path: `${base} > tipoTransacao`, message: '"tipoTransacao" é obrigatório.', severity: "error" });
    } else if (!TIPOS_TRANSACAO.includes(tipo)) {
      errors.push({
        path: `${base} > tipoTransacao`,
        message: `Valor "${tipo}" inválido para tipoTransacao. Valores aceitos incluem ENVIO_LOTE_GUIAS.`,
        severity: "error",
      });
    }

    const seq = toText(getChild(idTrans, "sequencialTransacao"));
    if (!seq) {
      errors.push({ path: `${base} > sequencialTransacao`, message: '"sequencialTransacao" é obrigatório.', severity: "error" });
    } else if (seq.length > 12) {
      errors.push({
        path: `${base} > sequencialTransacao`,
        message: `"sequencialTransacao" excede 12 caracteres (${seq.length}).`,
        severity: "error",
      });
    }

    const data = toText(getChild(idTrans, "dataRegistroTransacao"));
    if (!RE_DATA.test(data)) {
      errors.push({
        path: `${base} > dataRegistroTransacao`,
        message: `Data "${data}" inválida. Formato exigido: AAAA-MM-DD.`,
        severity: "error",
      });
    }

    const hora = toText(getChild(idTrans, "horaRegistroTransacao"));
    if (!RE_HORA.test(hora)) {
      errors.push({
        path: `${base} > horaRegistroTransacao`,
        message: `Hora "${hora}" inválida. Formato exigido: HH:MM:SS.`,
        severity: "error",
      });
    }
  }

  // origem
  const origem = getChild(cabecalho, "origem");
  if (!origem) {
    errors.push({ path: `${base} > origem`, message: 'Bloco "origem" ausente no cabeçalho.', severity: "error" });
  }

  // destino
  const destino = getChild(cabecalho, "destino");
  if (!destino) {
    errors.push({ path: `${base} > destino`, message: 'Bloco "destino" ausente no cabeçalho.', severity: "error" });
  } else {
    const registroANS = toText(getChild(destino, "registroANS"));
    if (registroANS && !RE_REGISTRO_ANS.test(registroANS)) {
      errors.push({
        path: `${base} > destino > registroANS`,
        message: `registroANS "${registroANS}" inválido. Deve conter exatamente 6 dígitos.`,
        severity: "error",
      });
    }
  }

  // Padrao (versão)
  version = toText(getChild(cabecalho, "Padrao"));
  if (!version) {
    errors.push({ path: `${base} > Padrao`, message: 'Elemento "Padrao" (versão) é obrigatório.', severity: "error" });
  } else if (!VERSOES_SUPORTADAS.includes(version)) {
    errors.push({
      path: `${base} > Padrao`,
      message: `Versão "${version}" não suportada. Utilize 4.02.00 (ou 4.01.00).`,
      severity: "error",
    });
  }

  // Ordem do cabeçalho: identificacaoTransacao → origem → destino → Padrao
  const ordemCab = childOrder(cabecalho).filter((n) =>
    ["identificacaoTransacao", "origem", "destino", "Padrao"].includes(n),
  );
  const ordemEsperada = ["identificacaoTransacao", "origem", "destino", "Padrao"];
  const filtradaEsperada = ordemEsperada.filter((n) => ordemCab.includes(n));
  if (JSON.stringify(ordemCab) !== JSON.stringify(filtradaEsperada)) {
    errors.push({
      path: base,
      message: `Ordem do cabeçalho inválida. Esperado: ${filtradaEsperada.join(" → ")}; encontrado: ${ordemCab.join(" → ")}.`,
      severity: "error",
    });
  }

  return version;
}

function validarLoteGuias(
  corpo: Record<string, any>,
  errors: TissValidationError[],
  warnings: TissValidationError[],
) {
  const base = "mensagemTISS > prestadorParaOperadora > loteGuias";
  const lote = getChild(corpo, "loteGuias");
  if (!lote) {
    errors.push({
      path: "mensagemTISS > prestadorParaOperadora",
      message: 'Bloco "loteGuias" ausente.',
      severity: "error",
    });
    return;
  }

  const numeroLote = toText(getChild(lote, "numeroLote"));
  if (!numeroLote) {
    errors.push({ path: `${base} > numeroLote`, message: '"numeroLote" é obrigatório.', severity: "error" });
  } else if (numeroLote.length > 12) {
    errors.push({
      path: `${base} > numeroLote`,
      message: `"numeroLote" excede 12 caracteres (${numeroLote.length}).`,
      severity: "error",
    });
  }

  const guiasTISS = getChild(lote, "guiasTISS");
  if (!guiasTISS) {
    errors.push({ path: `${base} > guiasTISS`, message: 'Bloco "guiasTISS" ausente.', severity: "error" });
    return;
  }

  const guias = asArray(getChild(guiasTISS, "guiaSP-SADT"));
  if (guias.length === 0) {
    errors.push({
      path: `${base} > guiasTISS`,
      message: "Nenhuma guiaSP-SADT encontrada no lote.",
      severity: "error",
    });
    return;
  }
  if (guias.length > 100) {
    errors.push({
      path: `${base} > guiasTISS`,
      message: `O lote possui ${guias.length} guias; o máximo permitido por lote é 100.`,
      severity: "error",
    });
  }

  guias.forEach((g: Record<string, any>, i: number) => {
    validarGuiaSPSADT(g, i + 1, errors, warnings);
  });
}

function validarGuiaSPSADT(
  guia: Record<string, any>,
  indice: number,
  errors: TissValidationError[],
  warnings: TissValidationError[],
) {
  const base = `guiaSP-SADT[${indice}]`;

  // cabecalhoGuia
  const cab = getChild(guia, "cabecalhoGuia");
  if (!cab) {
    errors.push({ path: `${base} > cabecalhoGuia`, message: '"cabecalhoGuia" ausente.', severity: "error" });
  } else {
    const registroANS = toText(getChild(cab, "registroANS"));
    if (!RE_REGISTRO_ANS.test(registroANS)) {
      errors.push({
        path: `${base} > cabecalhoGuia > registroANS`,
        message: `registroANS "${registroANS}" inválido (6 dígitos).`,
        severity: "error",
      });
    }
    const numGuia = toText(getChild(cab, "numeroGuiaPrestador"));
    if (!numGuia) {
      errors.push({
        path: `${base} > cabecalhoGuia > numeroGuiaPrestador`,
        message: '"numeroGuiaPrestador" é obrigatório.',
        severity: "error",
      });
    } else if (numGuia.length > 20) {
      errors.push({
        path: `${base} > cabecalhoGuia > numeroGuiaPrestador`,
        message: `"numeroGuiaPrestador" excede 20 caracteres.`,
        severity: "error",
      });
    }
  }

  // dadosBeneficiario (obrigatório)
  const benef = getChild(guia, "dadosBeneficiario");
  if (!benef) {
    errors.push({ path: `${base} > dadosBeneficiario`, message: '"dadosBeneficiario" ausente.', severity: "error" });
  } else {
    const carteira = toText(getChild(benef, "numeroCarteira"));
    if (!carteira) {
      warnings.push({
        path: `${base} > dadosBeneficiario > numeroCarteira`,
        message: "numeroCarteira vazio; a operadora pode rejeitar a guia.",
        severity: "warning",
      });
    }
  }

  // procedimentosExecutados (obrigatório para SP/SADT)
  const procExec = getChild(guia, "procedimentosExecutados");
  const procs = procExec ? asArray(getChild(procExec, "procedimentoExecutado")) : [];
  if (procs.length === 0) {
    errors.push({
      path: `${base} > procedimentosExecutados`,
      message: "A guia SP/SADT deve conter ao menos um procedimento executado.",
      severity: "error",
    });
  } else {
    procs.forEach((p: Record<string, any>, j: number) => {
      const proc = getChild(p, "procedimento");
      const codigo = toText(getChild(proc, "codigoProcedimento"));
      if (!codigo) {
        errors.push({
          path: `${base} > procedimentoExecutado[${j + 1}] > codigoProcedimento`,
          message: "Código do procedimento (TUSS) é obrigatório.",
          severity: "error",
        });
      }
      const vUnit = toText(getChild(p, "valorUnitario"));
      if (vUnit && !RE_MONETARIO.test(vUnit)) {
        errors.push({
          path: `${base} > procedimentoExecutado[${j + 1}] > valorUnitario`,
          message: `Valor unitário "${vUnit}" inválido (máx. 2 casas decimais).`,
          severity: "error",
        });
      }
      const vTot = toText(getChild(p, "valorTotal"));
      if (vTot && !RE_MONETARIO.test(vTot)) {
        errors.push({
          path: `${base} > procedimentoExecutado[${j + 1}] > valorTotal`,
          message: `Valor total "${vTot}" inválido (máx. 2 casas decimais).`,
          severity: "error",
        });
      }
    });
  }

  // valorTotal da guia
  const valorTotal = getChild(guia, "valorTotal");
  if (!valorTotal) {
    warnings.push({
      path: `${base} > valorTotal`,
      message: "Bloco valorTotal ausente na guia.",
      severity: "warning",
    });
  } else {
    const vGeral = toText(getChild(valorTotal, "valorTotalGeral"));
    if (vGeral && !RE_MONETARIO.test(vGeral)) {
      errors.push({
        path: `${base} > valorTotal > valorTotalGeral`,
        message: `valorTotalGeral "${vGeral}" inválido (máx. 2 casas decimais).`,
        severity: "error",
      });
    }
  }
}
