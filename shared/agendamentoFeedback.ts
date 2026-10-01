export interface AgendamentoSucessoResumo {
  pacienteNome: string;
  profissionalNome: string;
  quantidade?: number;
}

export function criarMensagemAgendamentoSucesso(resumo: AgendamentoSucessoResumo): string {
  if (resumo.quantidade && resumo.quantidade > 1) {
    return `As ${resumo.quantidade} sessões de ${resumo.pacienteNome} foram agendadas com sucesso para ${resumo.profissionalNome}.`;
  }

  return `O agendamento de ${resumo.pacienteNome} foi realizado com sucesso com ${resumo.profissionalNome}.`;
}
