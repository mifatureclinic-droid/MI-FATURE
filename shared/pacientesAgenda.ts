export interface PacienteResumoAgenda {
  id: number;
  nome: string;
  cpf: string;
  telefone: string | null;
  whatsapp: string | null;
}

/**
 * Mantém a busca da Agenda limitada aos dados indispensáveis para localizar o
 * paciente e iniciar os fluxos de contato, sem depender do cadastro completo.
 */
export function filtrarPacientesDaAgenda<T extends Pick<PacienteResumoAgenda, 'nome' | 'cpf'>>(
  pacientes: T[],
  busca: string,
): T[] {
  const termo = busca.trim();
  if (termo.length < 3) return [];

  const termoLower = termo.toLowerCase();
  const digitosBusca = termo.replace(/\D/g, '');

  return pacientes.filter((paciente) => {
    const nomeLower = (paciente.nome || '').toLowerCase();
    const inicioNome = nomeLower.startsWith(termoLower);
    const inicioPalavra = nomeLower.split(' ').some((palavra) => palavra.startsWith(termoLower));
    const cpfMatch = Boolean(digitosBusca) && (paciente.cpf || '').replace(/\D/g, '').includes(digitosBusca);

    return inicioNome || inicioPalavra || cpfMatch;
  }).slice(0, 8);
}
