import { describe, expect, it } from 'vitest';
import { normalizarDataExecucaoCampo36 } from '../shared/dataExecucaoCampo36';

describe('campo 36 — data de execução', () => {
  it('converte edição manual brasileira sem alterar o dia em Manaus', () => {
    expect(normalizarDataExecucaoCampo36('20/08/2026')).toBe('2026-08-20');
  });

  it('preserva datas ISO e descarta valores inválidos', () => {
    expect(normalizarDataExecucaoCampo36('2026-08-20T00:00:00.000Z')).toBe('2026-08-20');
    expect(normalizarDataExecucaoCampo36('20-08-2026')).toBeUndefined();
    expect(normalizarDataExecucaoCampo36('Invalid Date')).toBeUndefined();
  });
});
