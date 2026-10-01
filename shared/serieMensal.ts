function chaveMensal(data: Date | string): string {
  if (typeof data === 'string') {
    const correspondenciaIso = data.match(/^(\d{4})-(\d{2})/);
    if (correspondenciaIso) return `${correspondenciaIso[1]}-${correspondenciaIso[2]}`;
  }

  const normalizada = data instanceof Date ? data : new Date(data);
  if (Number.isNaN(normalizada.getTime())) return '';
  return `${normalizada.getUTCFullYear()}-${String(normalizada.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Uma série de faturamento não pode carregar sessões para outro mês-calendário. */
export function serieDeveIniciarNovoMes(
  primeiraDataDaSerie: Date | string | null | undefined,
  dataDeInicio: Date | string,
): boolean {
  if (!primeiraDataDaSerie) return false;
  const mesExistente = chaveMensal(primeiraDataDaSerie);
  const mesSolicitado = chaveMensal(dataDeInicio);
  return Boolean(mesExistente && mesSolicitado && mesExistente !== mesSolicitado);
}
