/** Extrai com segurança o identificador retornado pelo INSERT de uma guia. */
export function extrairIdDaGuiaCriada(resultado: unknown): number | null {
  const fonte = Array.isArray(resultado) ? resultado[0] : resultado;
  if (!fonte || typeof fonte !== 'object') return null;

  const bruto = (fonte as { insertId?: unknown; id?: unknown }).insertId
    ?? (fonte as { id?: unknown }).id;
  const id = Number(bruto);
  return Number.isInteger(id) && id > 0 ? id : null;
}
