export function criarEntradaAssinaturasDaGuia(guiaId: number | null | undefined): { guiaId: number } | null {
  return typeof guiaId === 'number' && guiaId > 0 ? { guiaId } : null;
}
