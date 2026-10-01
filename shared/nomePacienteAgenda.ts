type PacienteResumoAgenda = {
  id: number | string;
  nome?: string | null;
};

function nomeValido(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const nome = valor.trim();
  return nome.length > 0 ? nome : null;
}

/**
 * Prioriza o nome entregue no próprio atendimento. Assim, o cartão da Agenda
 * não depende da consulta paralela de pacientes para mostrar a identificação.
 */
export function resolverNomePacienteAgenda({
  pacienteId,
  pacienteNome,
  pacientes,
}: {
  pacienteId: number | string | null | undefined;
  pacienteNome?: string | null;
  pacientes: PacienteResumoAgenda[];
}): string {
  const nomeDoAtendimento = nomeValido(pacienteNome);
  if (nomeDoAtendimento) return nomeDoAtendimento;

  const paciente = pacientes.find((item) => String(item.id) === String(pacienteId));
  const nomeDoCadastro = nomeValido(paciente?.nome);
  return nomeDoCadastro ?? 'Paciente sem cadastro';
}
