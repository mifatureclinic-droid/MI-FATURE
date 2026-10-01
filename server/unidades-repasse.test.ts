import { describe, expect, it } from 'vitest';
import { calcularValorComUnidades, normalizarUnidadesRepasse } from '../shared/unidadesRepasse';

describe('unidades de repasse', () => {
  it('preserva uma unidade como padrão e aceita duas unidades no piloto', () => {
    expect(normalizarUnidadesRepasse(null)).toBe(1);
    expect(normalizarUnidadesRepasse(0)).toBe(1);
    expect(normalizarUnidadesRepasse(2)).toBe(2);
    expect(calcularValorComUnidades(67.19, 2)).toBe(134.38);
  });
});
