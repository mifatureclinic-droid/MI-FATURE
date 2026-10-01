import { describe, expect, it } from 'vitest';
import { criarAtualizacaoReagendamentoIndividual } from '../shared/reagendamentoIndividual';

describe('reagendamento individual', () => {
  it('atualiza somente a data quando o usuário não altera o horário', () => {
    expect(criarAtualizacaoReagendamentoIndividual('2026-08-20', '')).toEqual({ data: '2026-08-20' });
  });

  it('atualiza somente o horário quando o usuário não altera a data', () => {
    expect(criarAtualizacaoReagendamentoIndividual('', '16:00')).toEqual({ hora: '16:00' });
  });

  it('não inclui dados de série nem de outros atendimentos', () => {
    const atualizacao = criarAtualizacaoReagendamentoIndividual('2026-08-20', '16:00');

    expect(atualizacao).toEqual({ data: '2026-08-20', hora: '16:00' });
    expect(atualizacao).not.toHaveProperty('serieId');
    expect(atualizacao).not.toHaveProperty('atendimentoAnteriorId');
  });
});
