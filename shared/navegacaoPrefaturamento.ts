export const CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO = 'mifature:guia-prefaturamento-direcionada';

export function lerGuiaPrefaturamentoDirecionada(valor: string | null): number | null {
  const guiaId = Number(valor);
  return Number.isInteger(guiaId) && guiaId > 0 ? guiaId : null;
}

type GuiaCriadaOuReutilizada = { guiaId?: number | null };

/**
 * Uma criação em série pode envolver mais de uma guia. Só direcionamos
 * automaticamente quando há uma única guia inequívoca para abrir.
 */
export function obterGuiaUnicaParaPrefaturamento(
  grupos: GuiaCriadaOuReutilizada[][],
): number | null {
  const ids = [...new Set(
    grupos.flat().map(({ guiaId }) => guiaId).filter((guiaId): guiaId is number =>
      typeof guiaId === "number" && Number.isInteger(guiaId) && guiaId > 0,
    ),
  )];
  return ids.length === 1 ? ids[0] : null;
}
