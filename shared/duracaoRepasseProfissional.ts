function normalizarNome(nome: string | null | undefined): string {
  return (nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ehDraThiffane(nome: string | null | undefined): boolean {
  return normalizarNome(nome).includes('thiffane');
}

function ehAvaliacaoNeuropsicologica(contexto: string | null | undefined): boolean {
  return normalizarNome(contexto).includes('neuropsic');
}

export function profissionalRecebeDuasUnidadesPorHora(
  nome: string | null | undefined,
  contexto?: string | null,
): boolean {
  const nomeNormalizado = normalizarNome(nome);
  const excecaoPorNome = ['nayara', 'jessica', 'vanessa', 'loriene', 'katia']
    .some((excecao) => nomeNormalizado.includes(excecao));
  const excecaoJairoNeuropsicologia = nomeNormalizado.includes('jairo')
    && ehAvaliacaoNeuropsicologica(contexto);
  return !excecaoPorNome && !excecaoJairoNeuropsicologia;
}

export function opcoesDuracaoParaProfissional(nome: string | null | undefined): number[] {
  const nomeNormalizado = normalizarNome(nome);
  return nomeNormalizado.includes('thiffane') || nomeNormalizado.includes('silmara')
    ? [30, 60]
    : [30, 40, 60];
}

/** Uma hora equivale a duas unidades, exceto para Nayara, Jéssica e Vanessa. */
export function unidadesRepassePorDuracao(
  nome: string | null | undefined,
  duracao: number | null | undefined,
  dataAtendimento: Date | string | null | undefined,
  contexto?: string | null,
): number {
  void dataAtendimento;
  return profissionalRecebeDuasUnidadesPorHora(nome, contexto) && Number(duracao) === 60 ? 2 : 1;
}
