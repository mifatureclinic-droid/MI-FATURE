import { describe, expect, it } from 'vitest';
import { obterDatasIniciaisDaRecepcaoAgenda } from '@shared/datasIniciaisRecepcaoAgenda';

describe('datas iniciais da Agenda para recepção', () => {
  it('mantém hoje quando o profissional selecionado possui atendimento ativo no dia', () => {
    const resultado = obterDatasIniciaisDaRecepcaoAgenda(
      [10],
      [{ profissionalId: 10, data: '2026-08-31', status: 'agendado' }],
      new Date(2026, 7, 31, 12),
    );

    expect(resultado[10]).toEqual(new Date(2026, 7, 31, 12));
  });

  it('posiciona o profissional na última data com paciente quando hoje está vazio', () => {
    const resultado = obterDatasIniciaisDaRecepcaoAgenda(
      [10],
      [
        { profissionalId: 10, data: '2026-08-14', status: 'agendado' },
        { profissionalId: 10, data: '2026-08-28', status: 'realizado' },
        { profissionalId: 10, data: '2026-08-30', status: 'cancelado' },
      ],
      new Date(2026, 7, 31, 12),
    );

    expect(resultado[10]).toEqual(new Date(2026, 7, 28, 12));
  });

  it('não altera a data de profissional sem atendimento ativo', () => {
    const resultado = obterDatasIniciaisDaRecepcaoAgenda(
      [10, 20],
      [{ profissionalId: 10, data: '2026-08-28', status: 'agendado' }],
      new Date(2026, 7, 31, 12),
    );

    expect(Object.keys(resultado)).toEqual(['10']);
  });
});
