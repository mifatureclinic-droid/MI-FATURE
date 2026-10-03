export type LinhaRelatorioFinanceiro = {
  descricao: string;
  valor: number;
  dataVencimento: string;
  status: string;
  tipo?: string | null;
  convenio?: string | null;
  paciente?: string | null;
  profissional?: string | null;
  fornecedor?: string | null;
  categoria?: string | null;
};

function escaparCsv(valor: string | number | null | undefined): string {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`;
}

function normalizarValor(valor: number): string {
  return Number(valor || 0).toFixed(2).replace('.', ',');
}

function formatarDataDiaMesAno(valor: string | null | undefined): string {
  if (!valor) return '';
  const dataTexto = String(valor);
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataTexto);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const brasileira = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(dataTexto);
  if (brasileira) return `${brasileira[1]}/${brasileira[2]}/${brasileira[3]}`;
  return dataTexto;
}

/** Gera um CSV compatível com Excel a partir das contas exibidas no Financeiro. */
export function gerarCsvRelatorioFinanceiro(input: {
  contasReceber: LinhaRelatorioFinanceiro[];
  contasPagar: LinhaRelatorioFinanceiro[];
  dataInicio?: string;
  dataFim?: string;
}): string {
  const linhas = [
    ['Relatório Financeiro'],
    ['Período', `${formatarDataDiaMesAno(input.dataInicio) || 'Início'} a ${formatarDataDiaMesAno(input.dataFim) || 'Fim'}`],
    [],
    ['Fluxo', 'Tipo', 'Descrição', 'Beneficiário / Convênio', 'Vencimento', 'Valor (R$)', 'Status', 'Categoria'],
  ];

  const adicionar = (fluxo: 'Contas a Receber' | 'Contas a Pagar', conta: LinhaRelatorioFinanceiro) => {
    const beneficiario = fluxo === 'Contas a Receber'
      ? conta.convenio || conta.paciente || ''
      : conta.profissional || conta.fornecedor || '';
    linhas.push([
      fluxo,
      conta.tipo || (fluxo === 'Contas a Receber' ? 'Receita' : 'Despesa'),
      conta.descricao,
      beneficiario,
      formatarDataDiaMesAno(conta.dataVencimento),
      normalizarValor(conta.valor),
      conta.status,
      conta.categoria || '',
    ]);
  };

  input.contasReceber.forEach(conta => adicionar('Contas a Receber', conta));
  input.contasPagar.forEach(conta => adicionar('Contas a Pagar', conta));

  const totalReceber = input.contasReceber.reduce((total, conta) => total + Number(conta.valor || 0), 0);
  const totalPagar = input.contasPagar.reduce((total, conta) => total + Number(conta.valor || 0), 0);
  linhas.push([]);
  linhas.push(['Resumo', '', 'Total a Receber', '', '', normalizarValor(totalReceber), '', '']);
  linhas.push(['Resumo', '', 'Total a Pagar', '', '', normalizarValor(totalPagar), '', '']);
  linhas.push(['Resumo', '', 'Saldo Previsto', '', '', normalizarValor(totalReceber - totalPagar), '', '']);

  return `\uFEFF${linhas.map(linha => linha.map(escaparCsv).join(';')).join('\r\n')}`;
}
