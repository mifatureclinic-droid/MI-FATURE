import { describe, expect, it } from 'vitest';
import { TIPOS_ATENDIMENTO_DISPONIVEIS } from '@shared/tiposAtendimento';

describe('tipos disponíveis de atendimento', () => {
  it('mantém somente os tipos autorizados para novos agendamentos', () => {
    expect(TIPOS_ATENDIMENTO_DISPONIVEIS).toEqual([
      '1º Consulta',
      'Avaliação Neuropsicológica',
      'TEA - ABA',
      'Psicologia',
      'Outro',
    ]);
  });

  it.each(['Sessão', 'Psiquiatria', 'Fisioterapia', 'Fonoaudiologia', 'Nutrição', 'Terapia Ocupacional'])(
    'não disponibiliza %s para novos agendamentos',
    (tipo) => expect(TIPOS_ATENDIMENTO_DISPONIVEIS).not.toContain(tipo),
  );
});
