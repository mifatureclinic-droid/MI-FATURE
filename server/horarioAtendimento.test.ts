import { describe, expect, it } from 'vitest';
import { calcularHoraFinalAtendimento, normalizarHoraAtendimento } from '../shared/horarioAtendimento';

describe('horários da execução da Guia SADT', () => {
  it('normaliza horário inicial para HH:MM', () => {
    expect(normalizarHoraAtendimento('9:05:00')).toBe('09:05');
  });

  it('calcula hora final pela duração do atendimento', () => {
    expect(calcularHoraFinalAtendimento('15:00', 50)).toBe('15:50');
  });

  it('lida com término após meia-noite e rejeita horário incompleto', () => {
    expect(calcularHoraFinalAtendimento('23:40', 30)).toBe('00:10');
    expect(calcularHoraFinalAtendimento('', 50)).toBe('');
  });
});
