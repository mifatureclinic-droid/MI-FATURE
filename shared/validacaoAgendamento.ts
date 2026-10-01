export type IdentificadoresObrigatoriosAgendamento = {
  pacienteId: number;
  profissionalId: number;
  convenioId: number;
};

export type ResultadoValidacaoAgendamento =
  | { valido: true; ids: IdentificadoresObrigatoriosAgendamento }
  | { valido: false; mensagem: string };

function obterIdPositivo(valor: string | number | null | undefined): number | null {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

/** Valida os vínculos obrigatórios antes de criar uma sessão avulsa ou em série. */
export function validarIdentificadoresAgendamento(input: {
  pacienteId?: string | number | null;
  profissionalId?: string | number | null;
  convenioId?: string | number | null;
}): ResultadoValidacaoAgendamento {
  const pacienteId = obterIdPositivo(input.pacienteId);
  if (pacienteId == null) return { valido: false, mensagem: 'Selecione um paciente antes de agendar.' };

  const profissionalId = obterIdPositivo(input.profissionalId);
  if (profissionalId == null) return { valido: false, mensagem: 'Selecione um profissional antes de agendar.' };

  const convenioId = obterIdPositivo(input.convenioId);
  if (convenioId == null) return { valido: false, mensagem: 'Selecione um convênio antes de agendar.' };

  return { valido: true, ids: { pacienteId, profissionalId, convenioId } };
}
