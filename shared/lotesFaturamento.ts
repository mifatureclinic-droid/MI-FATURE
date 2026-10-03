export type LoteFaturamentoFiltro = {
  convenioId?: number | string | null;
};

export function filtrarLotesPorConvenio<T extends LoteFaturamentoFiltro>(
  lotes: T[],
  convenioId: string,
): T[] {
  if (convenioId === 'todos') return lotes;
  return lotes.filter((lote) => String(lote.convenioId) === convenioId);
}

export function formatarDataGuiaTiss(data: string | Date | null | undefined): string {
  if (!data) return '-';
  const valor = typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)
    ? new Date(`${data}T00:00:00`)
    : new Date(data);
  return Number.isNaN(valor.getTime()) ? '-' : valor.toLocaleDateString('pt-BR');
}
