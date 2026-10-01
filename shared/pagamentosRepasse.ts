export type StatusPagamentoRepasse = 'pendente' | 'pago';

/** Retorna a competência YYYY-MM sem converter a data clínica para outro dia. */
export function obterCompetenciaRepasse(data: string | Date | null | undefined): string {
  if (!data) return '';
  const texto = data instanceof Date ? data.toISOString().slice(0, 10) : String(data);
  const correspondencia = texto.match(/^(\d{4})-(\d{2})/);
  return correspondencia ? `${correspondencia[1]}-${correspondencia[2]}` : '';
}

export function intervaloDaCompetencia(competencia: string): { inicio: string; fim: string } {
  const [ano, mes] = competencia.split('-').map(Number);
  if (!ano || !mes || mes < 1 || mes > 12) {
    throw new Error('Competência inválida. Use o formato AAAA-MM.');
  }
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return {
    inicio: `${competencia}-01`,
    fim: `${competencia}-${String(ultimoDia).padStart(2, '0')}`,
  };
}

export function notaFiscalAceita(mimeType: string, tamanhoBytes: number): boolean {
  const formatos = new Set(['application/pdf', 'image/jpeg', 'image/png']);
  return formatos.has(mimeType) && tamanhoBytes > 0 && tamanhoBytes <= 10 * 1024 * 1024;
}
