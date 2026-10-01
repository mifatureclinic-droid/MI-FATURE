import { describe, expect, it } from 'vitest';
import { validarFormasPagamentoDividido } from '../shared/formasPagamento';

describe('recebimento com duas formas de pagamento', () => {
  it('aceita duas formas cuja soma é exatamente o total', () => {
    expect(validarFormasPagamentoDividido(100, [
      { metodoPagamento: 'pix', valor: 60 },
      { metodoPagamento: 'dinheiro', valor: 40 },
    ])).toEqual({
      valido: true,
      formas: [
        { metodoPagamento: 'pix', valor: 60 },
        { metodoPagamento: 'dinheiro', valor: 40 },
      ],
    });
  });

  it('preserva o fluxo legado quando há somente uma forma', () => {
    expect(validarFormasPagamentoDividido(100, undefined)).toEqual({ valido: true, formas: [] });
  });

  it('rejeita soma diferente do total e valores inválidos', () => {
    expect(validarFormasPagamentoDividido(100, [
      { metodoPagamento: 'pix', valor: 60 },
      { metodoPagamento: 'dinheiro', valor: 30 },
    ])).toEqual({ valido: false, mensagem: 'A soma das duas formas deve ser igual ao valor total do recebimento.' });
    expect(validarFormasPagamentoDividido(100, [
      { metodoPagamento: 'pix', valor: 100 },
      { metodoPagamento: 'dinheiro', valor: 0 },
    ])).toEqual({ valido: false, mensagem: 'Cada forma de pagamento deve ter valor maior que zero.' });
  });

  it('rejeita duas parcelas registradas na mesma forma de pagamento', () => {
    expect(validarFormasPagamentoDividido(100, [
      { metodoPagamento: 'pix', valor: 60 },
      { metodoPagamento: 'pix', valor: 40 },
    ])).toEqual({ valido: false, mensagem: 'As duas formas de pagamento devem ser diferentes.' });
  });
});
