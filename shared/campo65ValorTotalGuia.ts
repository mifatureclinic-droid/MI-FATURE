export interface TotaisCampo65 {
  procedimentos: number;
  taxasAlugueis?: number | null;
  materiais?: number | null;
  opme?: number | null;
  medicamentos?: number | null;
  gasesMedicinais?: number | null;
}

function numeroSeguro(valor: number | null | undefined): number {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
}

/** Calcula o campo 65 da Guia SADT sem depender de arredondamentos da tela. */
export function calcularValorTotalCampo65(totais: TotaisCampo65): number {
  return Number((
    numeroSeguro(totais.procedimentos) +
    numeroSeguro(totais.taxasAlugueis) +
    numeroSeguro(totais.materiais) +
    numeroSeguro(totais.opme) +
    numeroSeguro(totais.medicamentos) +
    numeroSeguro(totais.gasesMedicinais)
  ).toFixed(2));
}
