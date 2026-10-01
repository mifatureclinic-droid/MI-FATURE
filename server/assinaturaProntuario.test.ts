import { describe, expect, it } from 'vitest';
import { getAtendimentosComStatusAssinatura } from '../shared/assinaturasAgenda';
import { podeRegistrarProntuarioPorAssinatura } from './assinaturaProntuario';

const atendimentos = [
  {
    id: 101,
    pacienteId: 10,
    profissionalId: 20,
    convenioId: 30,
    data: '2026-08-18',
    guiaId: 500,
    assinaturaDigitalObrigatoria: true,
  },
  {
    id: 102,
    pacienteId: 10,
    profissionalId: 20,
    convenioId: 30,
    data: '2026-08-25',
    guiaId: 500,
    assinaturaDigitalObrigatoria: true,
  },
];

describe('bloqueio de prontuário por assinatura do paciente', () => {
  it('mantém fechado o prontuário da sessão digital sem assinatura', () => {
    const status = getAtendimentosComStatusAssinatura(atendimentos, [{
      id: 500,
      pacienteId: 10,
      profissionalId: 20,
      convenioId: 30,
    }], [], []);

    expect(podeRegistrarProntuarioPorAssinatura({
      atendimentoId: 101,
      assinaturaDigitalObrigatoria: true,
      atendimentosAssinados: status.assinados,
    })).toBe(false);
  });

  it('libera somente a sessão cuja assinatura corresponde à data do atendimento', () => {
    const status = getAtendimentosComStatusAssinatura(atendimentos, [{
      id: 500,
      pacienteId: 10,
      profissionalId: 20,
      convenioId: 30,
    }], [], [{
      guiaId: 500,
      pacienteId: 10,
      datasAtendimento: JSON.stringify(['2026-08-18']),
      assinaturaPacienteUrl: 'data:image/png;base64,assinatura-valida',
    }]);

    expect(status.assinados).toEqual(new Set([101]));
    expect(podeRegistrarProntuarioPorAssinatura({
      atendimentoId: 101,
      assinaturaDigitalObrigatoria: true,
      atendimentosAssinados: status.assinados,
    })).toBe(true);
    expect(podeRegistrarProntuarioPorAssinatura({
      atendimentoId: 102,
      assinaturaDigitalObrigatoria: true,
      atendimentosAssinados: status.assinados,
    })).toBe(false);
  });

  it('libera convênio de guia física sem exigir assinatura digital', () => {
    expect(podeRegistrarProntuarioPorAssinatura({
      atendimentoId: 102,
      assinaturaDigitalObrigatoria: false,
      atendimentosAssinados: new Set(),
    })).toBe(true);
  });
});
