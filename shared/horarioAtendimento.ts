export function normalizarHoraAtendimento(valor: string | null | undefined): string {
  const correspondencia = String(valor || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!correspondencia) return '';
  const hora = Number(correspondencia[1]);
  const minuto = Number(correspondencia[2]);
  if (hora > 23 || minuto > 59) return '';
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

/** Calcula a hora de término sem alterar a data exibida da sessão. */
export function calcularHoraFinalAtendimento(
  horaInicial: string | null | undefined,
  duracaoMinutos: number | string | null | undefined,
): string {
  const inicial = normalizarHoraAtendimento(horaInicial);
  const duracao = Number(duracaoMinutos);
  if (!inicial || !Number.isFinite(duracao) || duracao <= 0) return '';

  const [hora, minuto] = inicial.split(':').map(Number);
  const total = (hora * 60 + minuto + Math.round(duracao)) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
