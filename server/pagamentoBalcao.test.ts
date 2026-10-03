import { describe, expect, it } from 'vitest';
import { ehConvenioOab, permitePagamentoNoBalcao, podeRegistrarRecebimentoOabNoBalcao } from '../shared/pagamentoBalcao';

describe('convênios com recebimento no balcão', () => {
  it('reconhece OAB e suas variações para pagamento no balcão', () => {
    expect(ehConvenioOab('OAB')).toBe(true);
    expect(permitePagamentoNoBalcao('OAB Amazonas')).toBe(true);
  });

  it('mantém particular e Vale Saúde no fluxo existente', () => {
    expect(permitePagamentoNoBalcao('Particular')).toBe(true);
    expect(permitePagamentoNoBalcao('Vale Saúde')).toBe(true);
    expect(permitePagamentoNoBalcao('BRADESCO SAUDE')).toBe(false);
  });

  it('limita o registro OAB aos perfis administrativos do balcão', () => {
    expect(podeRegistrarRecebimentoOabNoBalcao('Recepção')).toBe(true);
    expect(podeRegistrarRecebimentoOabNoBalcao('master')).toBe(true);
    expect(podeRegistrarRecebimentoOabNoBalcao('profissional')).toBe(false);
  });
});
