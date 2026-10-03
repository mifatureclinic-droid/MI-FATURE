export interface AtualizacaoReagendamentoIndividual {
  data?: string;
  hora?: string;
}

/**
 * Monta uma atualização exclusivamente para o atendimento selecionado.
 * Não inclui serieId, pacienteId ou outros campos capazes de alterar sessões vizinhas.
 */
export function criarAtualizacaoReagendamentoIndividual(
  novaData?: string,
  novaHora?: string,
): AtualizacaoReagendamentoIndividual {
  const atualizacao: AtualizacaoReagendamentoIndividual = {};
  if (novaData?.trim()) atualizacao.data = novaData;
  if (novaHora?.trim()) atualizacao.hora = novaHora;
  return atualizacao;
}
