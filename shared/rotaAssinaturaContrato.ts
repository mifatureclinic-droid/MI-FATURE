const PREFIXO_ROTA_ASSINATURA_CONTRATO = '/assinar-contrato/';

export function extrairTokenAssinaturaContrato(localizacao: string) {
  if (!localizacao.startsWith(PREFIXO_ROTA_ASSINATURA_CONTRATO)) return '';

  return localizacao
    .slice(PREFIXO_ROTA_ASSINATURA_CONTRATO.length)
    .split(/[?#]/, 1)[0]
    .trim();
}
