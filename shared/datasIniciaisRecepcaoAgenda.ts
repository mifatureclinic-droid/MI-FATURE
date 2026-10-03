import { chaveDataAgenda } from './dataAgenda';

interface AtendimentoDaAgenda {
  profissionalId: number;
  data: string | Date | null | undefined;
  status?: string | null;
}

function criarDataLocal(chave: string): Date | null {
  const [ano, mes, dia] = chave.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia, 12);
  return data.getFullYear() === ano && data.getMonth() === mes - 1 && data.getDate() === dia
    ? data
    : null;
}

/**
 * Para a recepção, evita abrir a grade em um dia sem consultas. Para cada
 * profissional selecionado escolhe a data mais recente da competência que
 * contém atendimento ativo; se houver atendimento hoje, mantém o dia atual.
 */
export function obterDatasIniciaisDaRecepcaoAgenda(
  profissionaisSelecionados: number[],
  atendimentos: AtendimentoDaAgenda[],
  hoje: Date,
): Record<number, Date> {
  const chaveHoje = chaveDataAgenda(hoje);
  const resultado: Record<number, Date> = {};

  profissionaisSelecionados.forEach((profissionalId) => {
    const datas = atendimentos
      .filter((atendimento) => atendimento.profissionalId === profissionalId && atendimento.status !== 'cancelado')
      .map((atendimento) => chaveDataAgenda(atendimento.data))
      .filter((data): data is string => data !== null)
      .sort();

    if (datas.length === 0) return;
    const chavePrioritaria = chaveHoje && datas.includes(chaveHoje)
      ? chaveHoje
      : datas[datas.length - 1];
    const dataPrioritaria = criarDataLocal(chavePrioritaria);
    if (dataPrioritaria) resultado[profissionalId] = dataPrioritaria;
  });

  return resultado;
}
