export function ehConvenioPostalSaude(nomeConvenio: string | null | undefined): boolean {
  const nomeNormalizado = normalizarNomeConvenio(nomeConvenio);

  // Variações reais do cadastro da mesma operadora; não alcança outros convênios.
  return nomeNormalizado === "postal saude" || nomeNormalizado === "postal saude (correios)";
}

function normalizarNomeConvenio(nomeConvenio: string | null | undefined): string {
  return String(nomeConvenio ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * A mensagem TISS limita `numeroLote` a 12 caracteres. Estes convênios
 * recebem arquivo baixado em UTF-8 e devem normalizar o identificador antes
 * da emissão para que o campo e o hash sejam conferidos sobre o mesmo XML.
 */
export function convenioExigeNumeroLoteTissA12(nomeConvenio: string | null | undefined): boolean {
  const nomeNormalizado = normalizarNomeConvenio(nomeConvenio);
  return ehConvenioPostalSaude(nomeConvenio)
    || nomeNormalizado === "luminar"
    || nomeNormalizado === "geap"
    || nomeNormalizado === "bradesco saude";
}

/**
 * O campo `numeroLote` do XML TISS aceita no máximo 12 caracteres.
 * Remove somente o prefixo visual de tela "LOTE-" e preserva o identificador final.
 */
export function normalizarNumeroLoteTiss(numeroLote: string): string {
  const semPrefixoVisual = String(numeroLote ?? "")
    .trim()
    .replace(/^lote[-_\s]*/i, "");

  return semPrefixoVisual.length <= 12
    ? semPrefixoVisual
    : semPrefixoVisual.slice(-12);
}

/** Regra mantida para compatibilidade com os fluxos exclusivos da Postal Saúde. */
export function normalizarNumeroLotePostalSaude(numeroLote: string): string {
  return normalizarNumeroLoteTiss(numeroLote);
}
