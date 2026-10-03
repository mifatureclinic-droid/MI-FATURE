import { describe, expect, it } from 'vitest';
import { procedimentoFoiAlterado } from '@shared/conjuntoGuia';

describe('conjunto de sessões e guia', () => {
  it('identifica quando o procedimento não foi modificado', () => {
    expect(procedimentoFoiAlterado(600005, 600005)).toBe(false);
  });

  it('identifica a troca de procedimento sem decidir recriar série ou guia', () => {
    expect(procedimentoFoiAlterado(600005, 600002)).toBe(true);
    expect(procedimentoFoiAlterado(null, 600002)).toBe(true);
  });
});
