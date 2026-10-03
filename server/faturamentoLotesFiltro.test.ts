import { describe, expect, it } from 'vitest';
import { filtrarLotesPorConvenio, formatarDataGuiaTiss } from '../shared/lotesFaturamento';

describe('lotes de faturamento', () => {
  it('retorna todos os lotes quando o filtro é todos', () => {
    const lotes = [{ id: 1, convenioId: 10 }, { id: 2, convenioId: 20 }];
    expect(filtrarLotesPorConvenio(lotes, 'todos')).toEqual(lotes);
  });

  it('filtra somente os lotes do convênio selecionado', () => {
    const lotes = [{ id: 1, convenioId: 10 }, { id: 2, convenioId: 20 }, { id: 3, convenioId: 10 }];
    expect(filtrarLotesPorConvenio(lotes, '10')).toEqual([
      { id: 1, convenioId: 10 },
      { id: 3, convenioId: 10 },
    ]);
  });

  it('formata datas de guia sem deslocar o dia por fuso horário', () => {
    expect(formatarDataGuiaTiss('2026-09-14')).toBe('14/09/2026');
    expect(formatarDataGuiaTiss(null)).toBe('-');
  });
});
