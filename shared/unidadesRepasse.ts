/** Normaliza a quantidade de unidades remuneráveis de um atendimento. */
export function normalizarUnidadesRepasse(valor: number | null | undefined): number {
  const unidades = Math.trunc(Number(valor ?? 1));
  return Number.isFinite(unidades) && unidades > 0 ? unidades : 1;
}

export function calcularValorComUnidades(valorUnitario: number, unidades: number | null | undefined): number {
  return Math.round(valorUnitario * normalizarUnidadesRepasse(unidades) * 100) / 100;
}
