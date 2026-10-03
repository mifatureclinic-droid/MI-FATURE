import { describe, expect, it } from 'vitest';
import { obterPeriodoMes } from '../shared/periodoFinanceiro';

describe('obterPeriodoMes', () => {
  it('retorna todo o mês de agosto, sem limitar ao dia atual ou à última semana', () => {
    expect(obterPeriodoMes(new Date(2026, 7, 13))).toEqual({
      inicio: '2026-08-01',
      fim: '2026-08-31',
    });
  });
});
