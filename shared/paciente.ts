/**
 * Extrai o id de um paciente devolvido por uma mutation de criação.
 *
 * O backend pode devolver a linha criada (`id`) ou, em drivers MySQL,
 * metadados do INSERT (`insertId`). Valores ausentes, nulos e inválidos
 * resultam em null para que a interface possa apresentar uma mensagem clara
 * em vez de lançar erro ao chamar toString().
 */
export function getPacienteIdFromCreateResult(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;

  const source = data as { id?: unknown; insertId?: unknown };
  const rawId = source.id ?? source.insertId;
  const numericId = typeof rawId === 'number' ? rawId : Number(rawId);

  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}

export function formatPacienteIdForSelect(data: unknown): string | null {
  const pacienteId = getPacienteIdFromCreateResult(data);
  return pacienteId === null ? null : String(pacienteId);
}

export default getPacienteIdFromCreateResult;

