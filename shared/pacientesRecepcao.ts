export interface PacienteResumoRecepcao {
  id: number;
  nome: string;
  cpf: string | null;
  dataNascimento: string | Date | null;
  telefone: string | null;
  whatsapp: string | null;
  dataVencimentoPedido: string | Date | null;
}

/** A recepção localiza cadastros pelo nome ou CPF sem carregar anexos e documentos. */
export function filtrarPacientesDaRecepcao(
  pacientes: PacienteResumoRecepcao[],
  termo: string,
): PacienteResumoRecepcao[] {
  const busca = termo.trim().toLocaleLowerCase('pt-BR');
  if (!busca) return pacientes;

  return pacientes.filter((paciente) =>
    paciente.nome.toLocaleLowerCase('pt-BR').includes(busca)
    || (paciente.cpf ?? '').includes(termo.trim()),
  );
}
