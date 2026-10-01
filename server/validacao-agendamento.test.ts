import { describe, expect, it } from 'vitest';
import { validarIdentificadoresAgendamento } from '../shared/validacaoAgendamento';

describe('validação de dados obrigatórios do agendamento', () => {
  it('bloqueia a criação de série sem convênio, sem enviar NaN ao servidor', () => {
    expect(validarIdentificadoresAgendamento({
      pacienteId: '10',
      profissionalId: '20',
      convenioId: '',
    })).toEqual({ valido: false, mensagem: 'Selecione um convênio antes de agendar.' });
  });

  it('aceita identificadores numéricos válidos para agendamento em série', () => {
    expect(validarIdentificadoresAgendamento({
      pacienteId: '10',
      profissionalId: '20',
      convenioId: '30',
    })).toEqual({
      valido: true,
      ids: { pacienteId: 10, profissionalId: 20, convenioId: 30 },
    });
  });
});
