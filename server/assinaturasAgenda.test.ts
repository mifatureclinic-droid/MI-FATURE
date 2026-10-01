import { describe, expect, it } from 'vitest';
import { getAtendimentosComStatusAssinatura } from '@shared/assinaturasAgenda';

const atendimentoDaSerieA = {
  id: 101,
  data: '2026-08-31',
  guiaId: 10,
  pacienteId: 1,
  profissionalId: 2,
  convenioId: 3,
  serieId: 'serie-a',
  assinaturaDigitalObrigatoria: true,
};

const guiaDaSerieB = {
  id: 20,
  pacienteId: 1,
  profissionalId: 2,
  convenioId: 3,
  serieId: 'serie-b',
};

describe('isolamento de assinaturas entre séries', () => {
  it('não reconhece uma assinatura de guia legada em atendimento de outra série', () => {
    const status = getAtendimentosComStatusAssinatura(
      [atendimentoDaSerieA],
      [guiaDaSerieB],
      [],
      [{ guiaId: 20, datasAtendimento: JSON.stringify(['2026-08-31']), assinaturaPacienteUrl: 'assinatura' }],
    );

    expect(status.assinados.has(101)).toBe(false);
    expect(status.pendentes.has(101)).toBe(true);
  });

  it('não confia em atendimentoId histórico quando a guia aponta para outra série', () => {
    const status = getAtendimentosComStatusAssinatura(
      [atendimentoDaSerieA],
      [guiaDaSerieB],
      [{ atendimentoId: 101, guiaId: 20, profissionalId: 2, dataSessao: '2026-08-31', assinaturaDataUrl: 'assinatura' }],
      [],
    );

    expect(status.assinados.has(101)).toBe(false);
    expect(status.pendentes.has(101)).toBe(true);
  });

  it('não usa contexto de paciente e profissional para atravessar séries', () => {
    const status = getAtendimentosComStatusAssinatura(
      [atendimentoDaSerieA],
      [guiaDaSerieB],
      [{ guiaId: 20, profissionalId: 2, dataSessao: '2026-08-31', assinaturaDataUrl: 'assinatura' }],
      [],
    );

    expect(status.assinados.has(101)).toBe(false);
    expect(status.pendentes.has(101)).toBe(true);
  });

  it('reconhece a assinatura digital registrada na própria guia apenas na mesma data clínica', () => {
    const atendimentoDaMesmaData = {
      ...atendimentoDaSerieA,
      id: 102,
      data: '2026-08-20',
    };
    const atendimentoDeOutraData = {
      ...atendimentoDaSerieA,
      id: 103,
      data: '2026-08-27',
    };
    const guiaDaPropriaSerie = {
      ...atendimentoDaSerieA,
      assinadoPaciente: 1,
      assinaturaPacienteUrl: 'assinatura-digital',
      dataAssinaturaPaciente: '2026-08-20T14:00:00.000Z',
    };

    const status = getAtendimentosComStatusAssinatura(
      [atendimentoDaMesmaData, atendimentoDeOutraData],
      [guiaDaPropriaSerie],
      [],
      [],
    );

    expect(status.assinados.has(102)).toBe(true);
    expect(status.pendentes.has(102)).toBe(false);
    expect(status.assinados.has(103)).toBe(false);
    expect(status.pendentes.has(103)).toBe(true);
  });
});
