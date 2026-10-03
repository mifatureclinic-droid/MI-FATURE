import { describe, expect, it } from 'vitest';
import { distanciaDescritor, distanciaEmMetros } from '../shared/pontoSeguranca';

describe('segurança do ponto por face e perímetro', () => {
  it('calcula a distância geográfica usada pela geocerca', () => {
    expect(distanciaEmMetros(-3.119, -60.0217, -3.119, -60.0217)).toBe(0);
    expect(distanciaEmMetros(-3.119, -60.0217, -3.120, -60.0217)).toBeGreaterThan(100);
  });

  it('aceita somente descritores faciais com o tamanho esperado', () => {
    const base = Array(128).fill(0.1);
    expect(distanciaDescritor(base, [...base])).toBe(0);
    expect(distanciaDescritor(base, Array(127).fill(0.1))).toBe(Infinity);
  });
});
