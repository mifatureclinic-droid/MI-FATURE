function preencher(valor: number): string {
  return String(valor).padStart(2, '0');
}

export function obterPeriodoMes(dataReferencia: Date): { inicio: string; fim: string } {
  const ano = dataReferencia.getFullYear();
  const mes = dataReferencia.getMonth();
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();
  return {
    inicio: `${ano}-${preencher(mes + 1)}-01`,
    fim: `${ano}-${preencher(mes + 1)}-${preencher(ultimoDia)}`,
  };
}
