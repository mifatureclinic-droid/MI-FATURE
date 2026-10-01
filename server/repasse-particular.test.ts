import { describe, expect, it } from 'vitest';
import { calcularRepasseParticular, ehConvenioParticular, exigeComprovanteDePagamento } from '../shared/repasseParticular';

describe('repasse particular para Contas a Pagar', () => {
  it('reconhece a cobrança direta de Particular e Mente Aberta', () => {
    expect(ehConvenioParticular('Particular')).toBe(true);
    expect(ehConvenioParticular('MENTE ABERTA')).toBe(true);
    expect(ehConvenioParticular('BRADESCO SAUDE')).toBe(false);
  });

  it('exige comprovante somente para Mente Aberta', () => {
    expect(exigeComprovanteDePagamento('MENTE ABERTA')).toBe(true);
    expect(exigeComprovanteDePagamento('Particular')).toBe(false);
  });

  it('calcula 50% do pagamento particular com precisão de centavos', () => {
    expect(calcularRepasseParticular(100)).toBe(50);
    expect(calcularRepasseParticular('697.28')).toBe(348.64);
  });
});
