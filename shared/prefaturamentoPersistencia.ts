export type CamposPrefaturamento = Record<string, unknown>;

/**
 * Lê com segurança o espelho do formulário salvo na guia. Conteúdo legado,
 * malformado ou vazio deve abrir a guia normalmente, sem lançar erro na UI.
 */
export function reidratarCamposPrefaturamento(valor: unknown): CamposPrefaturamento {
  if (!valor) return {};
  if (typeof valor === 'object' && !Array.isArray(valor)) return valor as CamposPrefaturamento;
  if (typeof valor !== 'string') return {};

  try {
    const resultado = JSON.parse(valor);
    return resultado && typeof resultado === 'object' && !Array.isArray(resultado)
      ? resultado as CamposPrefaturamento
      : {};
  } catch {
    return {};
  }
}

/**
 * Mescla uma edição parcial ao espelho já salvo. Campos enviados pelo formulário
 * prevalecem inclusive quando são vazios ou zero, para respeitar limpezas e
 * correções intencionais sem apagar outros campos editáveis da guia.
 */
export function mesclarCamposPrefaturamento(
  existente: unknown,
  atualizacao: CamposPrefaturamento,
): CamposPrefaturamento {
  return {
    ...reidratarCamposPrefaturamento(existente),
    ...atualizacao,
  };
}

/**
 * As imagens e metadados de assinatura são mantidos em assinaturasGuias.
 * Não devem ser duplicados no espelho textual da guia, pois assinaturas em
 * base64 ultrapassam o limite da coluna TEXT e impedem salvar o pré-faturamento.
 */
export function removerHistoricoAssinaturasDoPrefaturamento(
  campos: CamposPrefaturamento,
): CamposPrefaturamento {
  const { historicoAssinaturas: _historicoAssinaturas, ...camposPersistiveis } = campos;
  return camposPersistiveis;
}

/** Serializa campos inclusive quando têm string vazia ou subtotal zero. */
export function serializarCamposPrefaturamento(campos: CamposPrefaturamento): string {
  return JSON.stringify(removerHistoricoAssinaturasDoPrefaturamento(campos));
}
