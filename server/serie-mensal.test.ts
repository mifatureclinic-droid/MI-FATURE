import { describe, expect, it } from 'vitest';
import { serieDeveIniciarNovoMes } from '../shared/serieMensal';

describe('séries mensais', () => {
  it('mantém sessões dentro do mesmo mês-calendário na mesma série', () => {
    expect(serieDeveIniciarNovoMes('2026-08-06', '2026-08-27')).toBe(false);
  });

  it('abre nova série ao iniciar uma sessão em outro mês', () => {
    expect(serieDeveIniciarNovoMes('2026-08-27', '2026-09-03')).toBe(true);
  });
});
