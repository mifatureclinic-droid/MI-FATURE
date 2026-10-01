export const METODOS_PAGAMENTO = [
  'dinheiro',
  'cartao_credito',
  'cartao_debito',
  'pix',
  'transferencia',
  'outro',
] as const;

export type MetodoPagamento = typeof METODOS_PAGAMENTO[number];

export type FormaPagamentoDividida = {
  metodoPagamento: MetodoPagamento;
  valor: number;
};

function paraCentavos(valor: number): number | null {
  if (!Number.isFinite(valor) || valor <= 0) return null;
  return Math.round(valor * 100);
}

/**
 * Garante que o recebimento dividido tenha exatamente duas formas válidas e
 * que a soma em centavos seja idêntica ao valor total do recebimento.
 */
export function validarFormasPagamentoDividido(
  valorTotal: number,
  formasPagamento: FormaPagamentoDividida[] | undefined,
): { valido: true; formas: FormaPagamentoDividida[] } | { valido: false; mensagem: string } {
  if (!formasPagamento) return { valido: true, formas: [] };
  if (formasPagamento.length !== 2) {
    return { valido: false, mensagem: 'Informe exatamente duas formas de pagamento.' };
  }

  const totalEmCentavos = paraCentavos(valorTotal);
  if (totalEmCentavos === null) {
    return { valido: false, mensagem: 'O valor total do recebimento é inválido.' };
  }

  let somaEmCentavos = 0;
  for (const forma of formasPagamento) {
    if (!METODOS_PAGAMENTO.includes(forma.metodoPagamento)) {
      return { valido: false, mensagem: 'A forma de pagamento informada é inválida.' };
    }
    const valorEmCentavos = paraCentavos(forma.valor);
    if (valorEmCentavos === null) {
      return { valido: false, mensagem: 'Cada forma de pagamento deve ter valor maior que zero.' };
    }
    somaEmCentavos += valorEmCentavos;
  }

  if (formasPagamento[0].metodoPagamento === formasPagamento[1].metodoPagamento) {
    return { valido: false, mensagem: 'As duas formas de pagamento devem ser diferentes.' };
  }

  if (somaEmCentavos !== totalEmCentavos) {
    return { valido: false, mensagem: 'A soma das duas formas deve ser igual ao valor total do recebimento.' };
  }

  return {
    valido: true,
    formas: formasPagamento.map(forma => ({
      metodoPagamento: forma.metodoPagamento,
      valor: Number(forma.valor.toFixed(2)),
    })),
  };
}
