/**
 * Uma guia só pode abranger a série quando o usuário escolhe isso
 * expressamente. Sem essa escolha, toda criação é individual.
 */
export function deveCriarGuiaParaSerie(
  vincularSerie: boolean,
  serieId?: string | null,
): boolean {
  return vincularSerie && typeof serieId === 'string' && serieId.trim().length > 0;
}
