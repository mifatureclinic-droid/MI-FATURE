/**
 * Normaliza o campo 36 para YYYY-MM-DD sem instanciar Date para entradas
 * de calendário. Isso evita deslocamento de dia entre UTC e Manaus (UTC-4).
 */
export function normalizarDataExecucaoCampo36(valor: unknown): string | undefined {
  if (typeof valor !== 'string' || !valor.trim()) return undefined;
  const entrada = valor.trim();

  const brasileiro = entrada.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brasileiro) return `${brasileiro[3]}-${brasileiro[2]}-${brasileiro[1]}`;

  const iso = entrada.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  return undefined;
}
