export function resolverSerieDaGuiaPrefaturamento(
  serieDaGuia: string | null | undefined,
  serieDoAtendimentoVinculado: string | null | undefined,
): string | null {
  const serieNormalizadaDaGuia = typeof serieDaGuia === 'string' ? serieDaGuia.trim() : '';
  if (serieNormalizadaDaGuia) return serieNormalizadaDaGuia;

  const serieNormalizadaDoAtendimento = typeof serieDoAtendimentoVinculado === 'string'
    ? serieDoAtendimentoVinculado.trim()
    : '';
  return serieNormalizadaDoAtendimento || null;
}
