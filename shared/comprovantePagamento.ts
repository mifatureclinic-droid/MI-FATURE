export function normalizarChaveComprovante(valor: string | null | undefined): string | null {
  const bruto = String(valor ?? '').trim();
  if (!bruto) return null;

  if (/^https?:\/\//i.test(bruto)) {
    try {
      const caminho = new URL(bruto).pathname;
      const marcador = '/manus-storage/';
      const indice = caminho.indexOf(marcador);
      return indice >= 0 ? caminho.slice(indice + marcador.length) || null : null;
    } catch {
      return null;
    }
  }

  return bruto.replace(/^\/?manus-storage\//, '') || null;
}
