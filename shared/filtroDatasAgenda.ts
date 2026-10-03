import { chaveDataAgenda } from './dataAgenda';

/** Quatro profissionais podem exibir competências distintas de até 31 dias. */
export const MAXIMO_DATAS_POR_CONSULTA_AGENDA = 124;

export function obterDatasVisiveisDaAgenda(
  selectedDates: Record<number, Date>,
  selectedProfIds: number[],
  hoje: Date,
): string[] {
  const candidatas = selectedProfIds.length > 0
    ? selectedProfIds.map((profissionalId) => selectedDates[profissionalId] ?? hoje)
    : [hoje];

  return Array.from(new Set(
    candidatas.flatMap(obterDatasDoMesDaAgenda),
  ));
}

/**
 * A Agenda exibe uma data por coluna, mas deve manter em memória todos os
 * atendimentos da competência visível. Assim, trocar de dia não esvazia a
 * lista nem exige uma nova carga para cada data do mesmo mês.
 */
function obterDatasDoMesDaAgenda(referencia: Date): string[] {
  if (!(referencia instanceof Date) || Number.isNaN(referencia.getTime())) return [];

  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  return Array.from({ length: ultimoDia }, (_, indice) => {
    const data = new Date(ano, mes, indice + 1, 12);
    return chaveDataAgenda(data);
  }).filter((data): data is string => data !== null);
}

export function normalizarDatasParaConsultaAgenda(datas?: string[]): string[] {
  return Array.from(new Set(datas ?? []))
    .filter((data) => /^\d{4}-\d{2}-\d{2}$/.test(data));
}

/**
 * Evita uma Agenda sem pacientes quando a filtragem de datas falha por uma
 * divergência de serialização/fuso. A tela ainda filtra visualmente pela data
 * escolhida; o retorno seguro serve apenas para restaurar os dados da grade.
 */
export function deveUsarRetornoSeguroDaAgenda(
  datasSelecionadas: string[],
  quantidadeAtendimentos: number,
): boolean {
  return datasSelecionadas.length > 0 && quantidadeAtendimentos === 0;
}
