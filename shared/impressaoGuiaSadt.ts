/** Altura útil aproximada da folha A4 horizontal com margens de 3 mm, em CSS pixels. */
export const ALTURA_UTIL_A4_HORIZONTAL_PX = 771;

/**
 * Determina o zoom necessário para que a guia inteira caiba em uma única folha.
 * O valor é limitado a 1 para nunca ampliar a guia e a 0,15 para evitar zoom zero.
 */
export function calcularEscalaImpressaoGuiaSadt(alturaConteudoPx: number): number {
  if (!Number.isFinite(alturaConteudoPx) || alturaConteudoPx <= 0) return 1;

  const escala = ALTURA_UTIL_A4_HORIZONTAL_PX / alturaConteudoPx;
  return Math.min(1, Math.max(0.15, Number(escala.toFixed(3))));
}
