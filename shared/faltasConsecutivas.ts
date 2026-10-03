export type EventoParaRegraDeFaltas = {
  data: string | Date;
  status: string | null | undefined;
};

function normalizarData(data: string | Date) {
  if (typeof data === 'string') return data.slice(0, 10);
  return data.toISOString().slice(0, 10);
}

function diferencaEmDias(dataInicial: string, dataFinal: string) {
  const inicio = Date.parse(`${dataInicial}T12:00:00Z`);
  const fim = Date.parse(`${dataFinal}T12:00:00Z`);
  return Math.round((fim - inicio) / 86_400_000);
}

export function encontrarDuasFaltasConsecutivas(eventos: EventoParaRegraDeFaltas[], janelaDias = 30) {
  const historico = eventos
    .filter(evento => evento.status !== 'cancelado')
    .map(evento => ({ ...evento, dataNormalizada: normalizarData(evento.data) }))
    .sort((a, b) => a.dataNormalizada.localeCompare(b.dataNormalizada));

  let faltaAnterior: string | null = null;

  for (const evento of historico) {
    if (evento.status !== 'falta') {
      faltaAnterior = null;
      continue;
    }

    if (faltaAnterior && diferencaEmDias(faltaAnterior, evento.dataNormalizada) <= janelaDias) {
      return [faltaAnterior, evento.dataNormalizada];
    }

    faltaAnterior = evento.dataNormalizada;
  }

  return null;
}
