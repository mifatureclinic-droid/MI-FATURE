import { describe, expect, it } from 'vitest';
import { formatarResumoProcedimentoSalvo } from '../shared/procedimentoFeedback';

describe('confirmação visual do procedimento salvo', () => {
  it('exibe código, descrição e valor formatados', () => {
    expect(formatarResumoProcedimentoSalvo({
      codigo: 'VS-001',
      descricao: 'Sessão de psicoterapia',
      valor: '70.00',
    })).toBe('Código: VS-001 · Descrição: Sessão de psicoterapia · Valor: R$ 70.00');
  });

  it('preserva valores informados pelo cadastro', () => {
    expect(formatarResumoProcedimentoSalvo({
      codigo: '50000470',
      descricao: 'Sessão em psicoterapia individual',
      valor: '140.50',
    })).toContain('R$ 140.50');
  });
});
