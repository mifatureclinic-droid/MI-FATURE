export const PERCENTUAL_REPASSE_PARTICULAR = 0.5;

function normalizarNomeConvenio(convenio: string | null | undefined): string {
  return String(convenio ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function ehConvenioParticular(convenio: string | null | undefined): boolean {
  const nomeNormalizado = normalizarNomeConvenio(convenio);
  return /^particular\b/.test(nomeNormalizado) || nomeNormalizado === 'mente aberta';
}

/** O convênio Mente Aberta exige arquivo de pagamento para confirmar novas sessões. */
export function exigeComprovanteDePagamento(convenio: string | null | undefined): boolean {
  return normalizarNomeConvenio(convenio) === 'mente aberta';
}

export function calcularRepasseParticular(valorRecebido: number | string): number {
  const valor = Number(valorRecebido);
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  return Number((valor * PERCENTUAL_REPASSE_PARTICULAR).toFixed(2));
}
