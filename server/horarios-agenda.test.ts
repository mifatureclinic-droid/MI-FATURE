import { describe, expect, it } from 'vitest';
import { mesclarHorariosDaAgenda } from '../shared/horariosAgenda';

describe('horários exatos da agenda', () => {
  it('mantém a grade base e insere o horário real sem deslocar cartões existentes', () => {
    expect(mesclarHorariosDaAgenda(
      ['14:30', '15:00', '15:30'],
      ['14:40'],
    )).toEqual(['14:30', '14:40', '15:00', '15:30']);
  });

  it('não duplica horários que já pertencem à grade padrão', () => {
    expect(mesclarHorariosDaAgenda(['14:30', '15:00'], ['14:30', '15:00']))
      .toEqual(['14:30', '15:00']);
  });
});
