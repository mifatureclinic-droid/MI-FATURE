import { describe, expect, it } from 'vitest';
import { assinaturaPertenceCompetenciaDaGuia } from './competenciaAssinaturaGuia';

describe('assinaturaPertenceCompetenciaDaGuia', () => {
  it('mantém a assinatura da sessão no mesmo mês da guia', () => {
    expect(assinaturaPertenceCompetenciaDaGuia('["2026-08-19"]', '2026-08-01')).toBe(true);
  });

  it('exclui assinatura de mês anterior ou seguinte', () => {
    expect(assinaturaPertenceCompetenciaDaGuia('["2026-07-30"]', '2026-08-01')).toBe(false);
    expect(assinaturaPertenceCompetenciaDaGuia('["2026-09-02"]', '2026-08-01')).toBe(false);
  });

  it('não utiliza assinaturas sem data clínica verificável', () => {
    expect(assinaturaPertenceCompetenciaDaGuia(null, '2026-08-01')).toBe(false);
  });
});
