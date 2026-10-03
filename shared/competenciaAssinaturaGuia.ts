import { obterPrimeiraDataAtendimentoDaAssinatura } from './datasAtendimentoAssinatura';

function obterCompetencia(valor: Date | string | null | undefined): string | null {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 7);
  }

  const data = typeof valor === 'string' ? valor.slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data.slice(0, 7) : null;
}

/**
 * Uma assinatura somente compõe a guia quando a sessão clínica pertence à
 * mesma competência da emissão da guia. O momento da assinatura não substitui
 * a data clínica e não pode deslocar sessões entre meses.
 */
export function assinaturaPertenceCompetenciaDaGuia(
  datasAtendimento: unknown,
  dataEmissaoGuia: Date | string | null | undefined,
): boolean {
  const dataSessao = obterPrimeiraDataAtendimentoDaAssinatura(datasAtendimento);
  const competenciaGuia = obterCompetencia(dataEmissaoGuia);
  return Boolean(dataSessao && competenciaGuia && dataSessao.slice(0, 7) === competenciaGuia);
}
