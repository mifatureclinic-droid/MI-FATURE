import { describe, expect, it } from 'vitest';
import { criarMensagemAgendamentoSucesso } from '../shared/agendamentoFeedback';

describe('mensagem de confirmação de agendamento', () => {
  it('confirma um agendamento simples com paciente e profissional', () => {
    expect(criarMensagemAgendamentoSucesso({
      pacienteNome: 'Maria da Silva',
      profissionalNome: 'Dra. Suzy Jesus',
    })).toBe('O agendamento de Maria da Silva foi realizado com sucesso com Dra. Suzy Jesus.');
  });

  it('informa a quantidade de sessões quando é uma série', () => {
    expect(criarMensagemAgendamentoSucesso({
      pacienteNome: 'Maria da Silva',
      profissionalNome: 'Dra. Suzy Jesus',
      quantidade: 8,
    })).toBe('As 8 sessões de Maria da Silva foram agendadas com sucesso para Dra. Suzy Jesus.');
  });
});
