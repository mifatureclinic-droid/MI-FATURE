/** Remove a máscara do CNPJ para respeitar o campo TISS e o limite de 14 dígitos do lote. */
export function normalizarCnpjPrestadorTiss(valor: unknown): string {
  return String(valor ?? '').replace(/\D/g, '').slice(0, 14);
}


/**
 * Código do contratado/prestador que deve alimentar o campo 13 da Guia SADT.
 * O cadastro do convênio tem precedência sobre o código geral do prestador.
 */
export function resolverCodigoClinicaNaOperadoraTiss(params: {
  codigoNaOperadora?: unknown;
  codigoPrestadorNaOperadora?: unknown;
  cnpj?: unknown;
}): string {
  const codigoDoConvenio = String(params.codigoNaOperadora ?? '').trim();
  if (codigoDoConvenio) return codigoDoConvenio;

  const codigoGeral = String(params.codigoPrestadorNaOperadora ?? '').trim();
  if (codigoGeral) return codigoGeral;

  return normalizarCnpjPrestadorTiss(params.cnpj);
}
