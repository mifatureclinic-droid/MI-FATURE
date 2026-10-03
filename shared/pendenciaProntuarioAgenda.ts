import { chaveDataAgenda } from './dataAgenda';

export interface AtendimentoParaPendenciaProntuarioAgenda {
  data?: unknown;
  status?: string | null;
  prontuarioFeito?: number | boolean | null;
}

/**
 * O alerta de prontuário é administrativo: deve tornar visível uma sessão já
 * ocorrida sem prontuário, inclusive quando a assinatura ainda precisa ser
 * regularizada. A permissão de preencher o prontuário continua sendo conferida
 * separadamente pelo vínculo estrito da assinatura.
 */
export function deveExibirPendenciaProntuarioNaAgenda(
  atendimento: AtendimentoParaPendenciaProntuarioAgenda,
  dataReferencia: unknown,
): boolean {
  if (atendimento.prontuarioFeito === 1 || atendimento.prontuarioFeito === true) return false;
  if (atendimento.status === 'cancelado' || atendimento.status === 'falta') return false;

  const dataAtendimento = chaveDataAgenda(atendimento.data);
  const dataAtual = chaveDataAgenda(dataReferencia);
  return Boolean(dataAtendimento && dataAtual && dataAtendimento <= dataAtual);
}
