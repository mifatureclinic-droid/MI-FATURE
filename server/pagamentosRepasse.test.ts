import { describe, expect, it } from 'vitest';
import { intervaloDaCompetencia, notaFiscalAceita, obterCompetenciaRepasse } from '../shared/pagamentosRepasse';

describe('pagamentos de repasse por competência', () => {
  it('deriva a competência sem deslocar a data clínica do atendimento', () => {
    expect(obterCompetenciaRepasse('2026-09-01')).toBe('2026-09');
    expect(obterCompetenciaRepasse('2026-08-31T23:30:00.000Z')).toBe('2026-08');
    expect(intervaloDaCompetencia('2026-02')).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' });
    expect(intervaloDaCompetencia('2028-02')).toEqual({ inicio: '2028-02-01', fim: '2028-02-29' });
  });

  it('aceita somente os formatos e o tamanho permitidos para a nota fiscal', () => {
    expect(notaFiscalAceita('application/pdf', 1)).toBe(true);
    expect(notaFiscalAceita('image/jpeg', 10 * 1024 * 1024)).toBe(true);
    expect(notaFiscalAceita('application/xml', 100)).toBe(false);
    expect(notaFiscalAceita('application/pdf', 10 * 1024 * 1024 + 1)).toBe(false);
  });
});
