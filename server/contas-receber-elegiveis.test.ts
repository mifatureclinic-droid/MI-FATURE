import { describe, expect, it } from 'vitest';
import { contaReceberEntraNoRepasse } from '../shared/contasReceberElegiveis';

describe('contas a receber elegíveis ao repasse', () => {
  it('mantém uma conta manual legítima', () => {
    expect(contaReceberEntraNoRepasse({ descricao: 'Recebimento de convênio' }, null)).toBe(true);
  });

  it('mantém pagamento particular confirmado e vinculado', () => {
    expect(contaReceberEntraNoRepasse({ descricao: 'Pagamento recebido - CELIA (Ref: 08/08/2026)' }, 300002)).toBe(true);
  });

  it('remove tentativa particular sem pagamento ativo vinculado', () => {
    expect(contaReceberEntraNoRepasse({ descricao: 'Pagamento recebido - CELIA (Ref: 08/08/2026)' }, null)).toBe(false);
  });
});
