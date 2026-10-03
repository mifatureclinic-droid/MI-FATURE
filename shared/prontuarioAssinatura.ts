export interface IndicadorProntuarioAssinaturaInput {
  perfil?: string | null;
  atendimentoSelecionado: boolean;
  assinaturaPaciente?: boolean | number | null;
  prontuarioFeito?: boolean | number | null;
}

export function deveExibirAssinaturaPendenteProntuario({
  perfil,
  atendimentoSelecionado,
  assinaturaPaciente,
  prontuarioFeito,
}: IndicadorProntuarioAssinaturaInput): boolean {
  const perfilAutorizado = perfil === 'administrador' || perfil === 'profissional';
  const assinaturaConfirmada = assinaturaPaciente === true || assinaturaPaciente === 1;
  const prontuarioConcluido = prontuarioFeito === true || prontuarioFeito === 1;

  return perfilAutorizado && atendimentoSelecionado && assinaturaConfirmada && !prontuarioConcluido;
}

export function obterAbaAtalhoProntuario(input: IndicadorProntuarioAssinaturaInput): 'novo' | null {
  return deveExibirAssinaturaPendenteProntuario(input) ? 'novo' : null;
}
