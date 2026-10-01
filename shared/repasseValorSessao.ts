export type DadosValorGuiaParaRepasse = {
  valor?: number | string | null;
  valorTotalGeral?: number | string | null;
  valorProcedimentos?: number | string | null;
  totalSessoes?: number | null;
};

export const VALOR_SESSAO_LUMINAR = 60.61;
export const VALOR_SESSAO_BRADESCO_MEDISERVICE = 48.24;
export const PERCENTUAL_REPASSE_BRADESCO_MEDISERVICE = 0.42;

function normalizarNomeConvenio(nome: string | null | undefined): string {
  return (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function usaRegraBradescoMediservice(
  convenioNome?: string | null,
  codigoProcedimento?: string | null,
): boolean {
  const convenio = normalizarNomeConvenio(convenioNome);
  const ehConvenioAlvo = convenio.includes('bradesco') || convenio.includes('mediservice') || convenio.includes('medservice');
  return ehConvenioAlvo && String(codigoProcedimento || '') === '50000470';
}

export function obterPercentualEspecialDeRepasse(
  convenioNome?: string | null,
  codigoProcedimento?: string | null,
): number | null {
  return usaRegraBradescoMediservice(convenioNome, codigoProcedimento)
    ? PERCENTUAL_REPASSE_BRADESCO_MEDISERVICE
    : null;
}

function paraNumero(valor: number | string | null | undefined): number {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

const CONVENIOS_PACOTE_AVALIACAO_NEUROPSICOLOGICA = new Set([
  'proasa saude',
  'proasa para',
  'petrobras ams',
  'postal saude (correios)',
]);

/**
 * Pacotes neuropsicológicos têm preço global. A regra é limitada aos quatro
 * convênios homologados para não alterar o cálculo dos demais convênios.
 */
export function ehPacoteAvaliacaoNeuropsicologica(
  convenioNome?: string | null,
  tipoAtendimento?: string | null,
): boolean {
  const tipo = normalizarNomeConvenio(tipoAtendimento);
  return CONVENIOS_PACOTE_AVALIACAO_NEUROPSICOLOGICA.has(normalizarNomeConvenio(convenioNome))
    && tipo.includes('avaliacao')
    && tipo.includes('neuro');
}

/**
 * O cadastro do procedimento é a referência do valor global do pacote. Para
 * guias sem procedimento vinculado, utiliza o total já gravado na guia como
 * valor global, sem aplicar um divisor adicional antes do rateio da série.
 */
export function resolverValorBaseDoPacoteNeuropsicologico(
  guia: DadosValorGuiaParaRepasse | null | undefined,
  valorProcedimentoAtual?: number | string | null,
): number {
  const valorDoProcedimento = paraNumero(valorProcedimentoAtual);
  if (valorDoProcedimento > 0) return valorDoProcedimento;
  if (!guia) return 0;

  const valorDaGuia = paraNumero(guia.valorTotalGeral)
    || paraNumero(guia.valorProcedimentos)
    || paraNumero(guia.valor);
  return valorDaGuia;
}

/** Distribui o pacote pelo total de atendimentos ativos criados na mesma série. */
export function calcularValorPacoteNeuropsicologicoPorAtendimento(
  valorPacote: number | string | null | undefined,
  totalAtendimentosDaSerie: number | null | undefined,
): number {
  const quantidade = Math.max(Number(totalAtendimentosDaSerie ?? 1) || 1, 1);
  return paraNumero(valorPacote) / quantidade;
}

/**
 * Divide o preço global de um pacote em valores de sessão com duas casas
 * decimais, distribuindo os centavos remanescentes nas primeiras sessões.
 * Assim, a soma das linhas da guia SADT sempre permanece exatamente igual ao
 * valor autorizado do pacote.
 */
export function ratearValorPacotePorSessao(
  valorPacote: number | string | null | undefined,
  totalSessoes: number | null | undefined,
): number[] {
  const quantidade = Math.max(Number(totalSessoes ?? 1) || 1, 1);
  const totalEmCentavos = Math.round(paraNumero(valorPacote) * 100);
  const baseEmCentavos = Math.floor(totalEmCentavos / quantidade);
  const centavosRemanescentes = totalEmCentavos % quantidade;

  return Array.from(
    { length: quantidade },
    (_, indice) => (baseEmCentavos + (indice < centavosRemanescentes ? 1 : 0)) / 100,
  );
}

/** Calcula o total autorizado de uma série a partir do valor unitário do procedimento. */
export function calcularValorTotalAutorizadoDaSerie(
  valorUnitario: number | string | null | undefined,
  totalSessoes: number | null | undefined,
): number {
  const quantidade = Math.max(Number(totalSessoes ?? 1) || 1, 1);
  return paraNumero(valorUnitario) * quantidade;
}

/**
 * Guias de série guardam o valor total autorizado. Para o repasse, cada
 * atendimento realizado recebe apenas a quota correspondente à sua sessão.
 */
export function calcularValorBrutoPorSessao(
  guia: DadosValorGuiaParaRepasse | null | undefined,
  convenioNome?: string | null,
  codigoProcedimento?: string | null,
  valorProcedimentoAtual?: number | string | null,
): number {
  if (normalizarNomeConvenio(convenioNome).includes('luminar')) {
    return VALOR_SESSAO_LUMINAR;
  }
  if (usaRegraBradescoMediservice(convenioNome, codigoProcedimento)) {
    return VALOR_SESSAO_BRADESCO_MEDISERVICE;
  }
  // O cadastro de procedimento é a referência atual do convênio. Assim, uma
  // guia histórica não mantém um valor antigo na tela de repasse após ajuste.
  const valorAtualDoProcedimento = paraNumero(valorProcedimentoAtual);
  if (valorAtualDoProcedimento > 0) return valorAtualDoProcedimento;
  if (!guia) return 0;
  const totalSessoes = Math.max(Number(guia.totalSessoes ?? 1) || 1, 1);
  const valorTotal = paraNumero(guia.valorTotalGeral)
    || paraNumero(guia.valorProcedimentos)
    || paraNumero(guia.valor);
  return valorTotal / totalSessoes;
}
