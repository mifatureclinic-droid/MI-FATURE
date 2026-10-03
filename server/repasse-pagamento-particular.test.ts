import { describe, expect, it } from 'vitest';
import { contarSessoesDoPagamentoParticular, pagamentoParticularConfirmaRecebimento, resolverValorBrutoDoRepasse } from '../shared/repassePagamentoParticular';

describe('repasse de pagamentos particulares vinculados', () => {
  it('prioriza o valor efetivamente recebido no pagamento particular', () => {
    expect(resolverValorBrutoDoRepasse({ valorDaGuia: 200, valorDoPagamento: 220, ehParticular: true })).toBe(220);
  });

  it('distribui o pagamento particular pelo total de sessões vinculadas', () => {
    const quantidade = contarSessoesDoPagamentoParticular(1830098, '[1830444,1830760,1831052]');
    expect(quantidade).toBe(4);
    expect(resolverValorBrutoDoRepasse({
      valorDaGuia: 0,
      valorDoPagamento: 400,
      ehParticular: true,
      quantidadeSessoesVinculadas: quantidade,
    })).toBe(100);
  });

  it('protege o cálculo quando o vínculo legado não possui JSON válido', () => {
    expect(contarSessoesDoPagamentoParticular(1830098, 'formato antigo')).toBe(1);
    expect(contarSessoesDoPagamentoParticular(1830098, '[1830098,1830098]')).toBe(1);
  });

  it('preserva o valor da guia quando não há pagamento particular vinculado', () => {
    expect(resolverValorBrutoDoRepasse({ valorDaGuia: 200, valorDoPagamento: null, ehParticular: true })).toBe(200);
    expect(resolverValorBrutoDoRepasse({ valorDaGuia: 42.32, valorDoPagamento: 100, ehParticular: false })).toBe(42.32);
  });

  it('marca como recebido apenas o particular pago que não foi glosado', () => {
    expect(pagamentoParticularConfirmaRecebimento({ ehParticular: true, pagamentoId: 510001, guiaGlosada: false })).toBe(true);
    expect(pagamentoParticularConfirmaRecebimento({ ehParticular: true, pagamentoId: 510001, guiaGlosada: true })).toBe(false);
    expect(pagamentoParticularConfirmaRecebimento({ ehParticular: false, pagamentoId: 510001, guiaGlosada: false })).toBe(false);
  });
});
