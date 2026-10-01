import { describe, expect, it } from 'vitest';
import { encontrarDuasFaltasConsecutivas } from '../shared/faltasConsecutivas';

describe('regra de duas faltas consecutivas em 30 dias', () => {
  it('alerta quando duas faltas seguidas ocorrem em até 30 dias', () => {
    expect(encontrarDuasFaltasConsecutivas([
      { data: '2026-08-01', status: 'falta' },
      { data: '2026-08-08', status: 'falta' },
    ])).toEqual(['2026-08-01', '2026-08-08']);
  });

  it('não alerta quando um atendimento realizado interrompe as faltas', () => {
    expect(encontrarDuasFaltasConsecutivas([
      { data: '2026-08-01', status: 'falta' },
      { data: '2026-08-05', status: 'realizado' },
      { data: '2026-08-08', status: 'falta' },
    ])).toBeNull();
  });

  it('não alerta quando as faltas estão separadas por mais de 30 dias', () => {
    expect(encontrarDuasFaltasConsecutivas([
      { data: '2026-06-01', status: 'falta' },
      { data: '2026-07-02', status: 'falta' },
    ])).toBeNull();
  });

  it('ignora cancelamentos entre faltas sem tratar a ausência administrativa como atendimento', () => {
    expect(encontrarDuasFaltasConsecutivas([
      { data: '2026-08-01', status: 'falta' },
      { data: '2026-08-04', status: 'cancelado' },
      { data: '2026-08-08', status: 'falta' },
    ])).toEqual(['2026-08-01', '2026-08-08']);
  });
});
