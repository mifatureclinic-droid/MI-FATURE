import { describe, expect, it } from 'vitest';
import { deveExibirPendenciaProntuarioNaAgenda } from '../shared/pendenciaProntuarioAgenda';

describe('pendência de prontuário na Agenda', () => {
  const hoje = '2026-08-30';

  it('sinaliza uma sessão já ocorrida sem prontuário mesmo antes da assinatura ser regularizada', () => {
    expect(deveExibirPendenciaProntuarioNaAgenda({
      data: '2026-08-21',
      status: 'agendado',
      prontuarioFeito: 0,
    }, hoje)).toBe(true);
  });

  it('não sinaliza sessão futura, falta, cancelamento ou prontuário já preenchido', () => {
    expect(deveExibirPendenciaProntuarioNaAgenda({ data: '2026-09-01', status: 'agendado', prontuarioFeito: 0 }, hoje)).toBe(false);
    expect(deveExibirPendenciaProntuarioNaAgenda({ data: '2026-08-21', status: 'falta', prontuarioFeito: 0 }, hoje)).toBe(false);
    expect(deveExibirPendenciaProntuarioNaAgenda({ data: '2026-08-21', status: 'cancelado', prontuarioFeito: 0 }, hoje)).toBe(false);
    expect(deveExibirPendenciaProntuarioNaAgenda({ data: '2026-08-21', status: 'realizado', prontuarioFeito: 1 }, hoje)).toBe(false);
  });
});
