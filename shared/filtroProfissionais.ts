export interface InicializacaoFiltroProfissionais {
  perfil?: string;
  quantidadeProfissionais: number;
  quantidadeSelecionados: number;
  limpezaManual: boolean;
}

export const MAXIMO_PROFISSIONAIS_VISIVEIS_NA_AGENDA = 4;

/**
 * A seleção automática é útil apenas na primeira carga. Depois que a pessoa
 * limpa o filtro por vontade própria, a Agenda deve respeitar a grade vazia.
 */
export function deveInicializarFiltroProfissionais({
  perfil,
  quantidadeProfissionais,
  quantidadeSelecionados,
  limpezaManual,
}: InicializacaoFiltroProfissionais): boolean {
  return (
    perfil !== 'profissional' &&
    quantidadeProfissionais > 0 &&
    quantidadeSelecionados === 0 &&
    !limpezaManual
  );
}

/**
 * A primeira consulta da Agenda não pode depender de atendimentos já
 * carregados: quando o dia inicial não retorna registros, isso criava uma
 * dependência circular e a grade podia permanecer sem profissionais.
 */
export function obterIdsIniciaisDaAgenda(profissionais: Array<{ id?: unknown }>): number[] {
  return Array.from(new Set(
    profissionais
      .map((profissional) => Number(profissional.id))
      .filter((id) => Number.isInteger(id) && id > 0),
  )).slice(0, MAXIMO_PROFISSIONAIS_VISIVEIS_NA_AGENDA);
}

/**
 * Evita uma grade vazia entre o carregamento dos profissionais e o efeito que
 * persiste a seleção automática. A limpeza manual continua sendo respeitada.
 */
export function obterIdsVisiveisDaAgenda(
  profissionais: Array<{ id?: unknown }>,
  idsSelecionados: number[],
  limpezaManual: boolean,
): number[] {
  if (idsSelecionados.length > 0 || limpezaManual) return idsSelecionados;
  return obterIdsIniciaisDaAgenda(profissionais);
}

/**
 * O profissional não escolhe colunas: a consulta deve sempre usar o seu
 * vínculo autenticado, inclusive quando a seleção administrativa está vazia.
 */
export function obterIdsParaConsultaDaAgenda({
  perfil,
  idsSelecionados,
  profissionalVinculadoId,
}: {
  perfil?: string;
  idsSelecionados: number[];
  profissionalVinculadoId?: unknown;
}): number[] {
  const idVinculado = Number(profissionalVinculadoId);
  if (perfil === 'profissional' && Number.isInteger(idVinculado) && idVinculado > 0) {
    return [idVinculado];
  }
  return idsSelecionados;
}
