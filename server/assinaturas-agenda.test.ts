import { describe, expect, it } from 'vitest';
import {
  getAtendimentosComAssinatura,
  getAtendimentosComStatusAssinatura,
} from '../shared/assinaturasAgenda';
import { resolverEstadoBadgeAssinatura } from '../shared/estadoBadgeAssinatura';

describe('assinaturas exibidas na Agenda', () => {
  const atendimentos = [
    { id: 10, data: '2026-08-10', guiaId: 7 },
    { id: 11, data: '2026-08-11', guiaId: 7 },
    { id: 12, data: '2026-08-12', guiaId: 7 },
  ];

  it('marca somente o atendimento com assinatura SADT direta', () => {
    const resultado = getAtendimentosComAssinatura(
      atendimentos,
      [{ id: 7, atendimentoId: 10 }],
      [{ atendimentoId: 11, status: 'assinado', assinaturaDataUrl: 'data:image/png;base64,assinatura' }],
      [],
    );

    expect(Array.from(resultado)).toEqual([11]);
  });

  it('não reconhece assinatura direta registrada para outro profissional', () => {
    const resultado = getAtendimentosComAssinatura(
      [{ id: 15, data: '2026-08-15', guiaId: 15, pacienteId: 8, profissionalId: 4, convenioId: 2 }],
      [{ id: 15, atendimentoId: 15, pacienteId: 8, profissionalId: 4, convenioId: 2 }],
      [{ atendimentoId: 15, guiaId: 15, profissionalId: 9, dataSessao: '2026-08-15', status: 'assinado', assinaturaDataUrl: 'data:image/png;base64,assinatura' }],
      [],
    );

    expect(resultado.size).toBe(0);
  });

  it('usa a data específica da assinatura legada', () => {
    const resultado = getAtendimentosComAssinatura(
      atendimentos,
      [{ id: 7, atendimentoId: 10 }],
      [],
      [{
        guiaId: 7,
        sessaoNumero: 2,
        datasAtendimento: JSON.stringify(['2026-08-11']),
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(Array.from(resultado)).toEqual([11]);
    expect(resultado.has(10)).toBe(false);
    expect(resultado.has(12)).toBe(false);
  });

  it('não marca link pendente ou sessão sem assinatura', () => {
    const resultado = getAtendimentosComAssinatura(
      atendimentos,
      [{ id: 7, atendimentoId: 10 }],
      [{ atendimentoId: 10, status: 'pendente', assinaturaDataUrl: null }],
      [{ guiaId: 7, sessaoNumero: 1, assinaturaPacienteUrl: '', token: 'token-pendente' }],
    );

    expect(resultado.size).toBe(0);
  });

  it('marca somente a sessão que tem link pendente', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      atendimentos,
      [{ id: 7, atendimentoId: 10 }],
      [],
      [{ guiaId: 7, sessaoNumero: 1, assinaturaPacienteUrl: '', token: 'token-pendente' }],
    );

    expect(Array.from(resultado.pendentes)).toEqual([10]);
    expect(Array.from(resultado.assinados)).toEqual([]);
  });

  it('marca a guia Bradesco sem assinatura como pendente mesmo antes de gerar o link', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{ id: 71, data: '2026-09-03', guiaId: 701, assinaturaDigitalObrigatoria: true }],
      [{ id: 701, atendimentoId: 71 }],
      [],
      [],
    );

    expect(Array.from(resultado.pendentes)).toEqual([71]);
    expect(resultado.assinados.size).toBe(0);
  });

  it('não marca como pendente a guia de convênio com assinatura física', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{ id: 72, data: '2026-09-03', guiaId: 702, assinaturaDigitalObrigatoria: false }],
      [{ id: 702, atendimentoId: 72 }],
      [],
      [],
    );

    expect(resultado.pendentes.size).toBe(0);
  });

  it('não exibe pendência digital de guia física mesmo com um registro histórico pendente', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{ id: 73, data: '2026-09-10', guiaId: 703, assinaturaDigitalObrigatoria: false }],
      [{ id: 703, atendimentoId: 73 }],
      [{ atendimentoId: 73, guiaId: 703, dataSessao: '2026-09-10', status: 'pendente' }],
      [],
    );

    expect(resultado.pendentes.size).toBe(0);
  });

  it('vincula a falta de assinatura somente à data do agendamento ainda não assinada', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        { id: 81, data: '2026-08-12', guiaId: 801, assinaturaDigitalObrigatoria: true },
        { id: 82, data: '2026-08-19', guiaId: 801, assinaturaDigitalObrigatoria: true },
      ],
      [{ id: 801, atendimentoId: 81 }],
      [{
        atendimentoId: 81,
        guiaId: 801,
        dataSessao: '19/08/2026',
        status: 'assinado',
        assinaturaDataUrl: 'data:image/png;base64,assinatura',
      }],
      [],
    );

    expect(resultado.assinados.has(81)).toBe(false);
    expect(resultado.pendentes.has(81)).toBe(true);
    expect(resultado.assinados.has(82)).toBe(true);
    expect(resultado.pendentes.has(82)).toBe(false);
  });

  it('atualiza cada data da série mesmo quando somente a primeira sessão possui guiaId', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        {
          id: 91,
          data: '2026-08-12',
          guiaId: 901,
          serieId: 'serie-assinatura-901',
          pacienteId: 9,
          profissionalId: 4,
          convenioId: 2,
          assinaturaDigitalObrigatoria: true,
        },
        {
          id: 92,
          data: '2026-08-19',
          serieId: 'serie-assinatura-901',
          pacienteId: 9,
          profissionalId: 4,
          convenioId: 2,
          assinaturaDigitalObrigatoria: true,
        },
      ],
      [{
        id: 901,
        atendimentoId: 91,
        serieId: 'serie-assinatura-901',
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
      }],
      [],
      [{
        guiaId: 901,
        datasAtendimento: '["2026-08-19"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(resultado.pendentes.has(91)).toBe(true);
    expect(resultado.assinados.has(92)).toBe(true);
    expect(resultado.pendentes.has(92)).toBe(false);
  });

  it('reconhece comprovante legado órfão somente na sessão sem guia do mesmo contexto e data', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{
        id: 93,
        data: '2026-09-08',
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
        assinaturaDigitalObrigatoria: true,
      }],
      [{ id: 903, pacienteId: 9, profissionalId: 4, convenioId: 2 }],
      [],
      [{
        guiaId: 903,
        pacienteId: 9,
        datasAtendimento: '["2026-09-08"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(Array.from(resultado.assinados)).toEqual([93]);
    expect(resultado.pendentes.has(93)).toBe(false);
  });

  it('reconhece comprovante legado órfão quando a guia estiver ligada apenas a uma sessão histórica diferente', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        { id: 89, data: '2026-08-11', pacienteId: 9, profissionalId: 4, convenioId: 2 },
        {
          id: 96,
          data: '2026-09-08',
          pacienteId: 9,
          profissionalId: 4,
          convenioId: 2,
          assinaturaDigitalObrigatoria: true,
        },
      ],
      [{ id: 905, atendimentoId: 89, pacienteId: 9, profissionalId: 4, convenioId: 2 }],
      [],
      [{
        guiaId: 905,
        pacienteId: 9,
        datasAtendimento: '["2026-09-08"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(Array.from(resultado.assinados)).toEqual([96]);
    expect(resultado.pendentes.has(96)).toBe(false);
  });

  it('não reconhece comprovante legado órfão quando houver mais de uma sessão possível na mesma data', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        { id: 94, data: '2026-09-08', pacienteId: 9, profissionalId: 4, convenioId: 2 },
        { id: 95, data: '2026-09-08', pacienteId: 9, profissionalId: 4, convenioId: 2 },
      ],
      [{ id: 904, pacienteId: 9, profissionalId: 4, convenioId: 2 }],
      [],
      [{
        guiaId: 904,
        pacienteId: 9,
        datasAtendimento: '["2026-09-08"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(resultado.assinados.size).toBe(0);
  });

  it('não reconhece comprovante legado órfão quando a série explícita da guia divergir da sessão', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{
        id: 97,
        data: '2026-09-08',
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
        serieId: 'serie-atendimento',
      }],
      [{
        id: 906,
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
        serieId: 'serie-outra',
      }],
      [],
      [{
        guiaId: 906,
        pacienteId: 9,
        datasAtendimento: '["2026-09-08"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(resultado.assinados.size).toBe(0);
  });

  it('não reconhece assinatura antiga de uma guia diferente, mesmo na mesma data', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{
        id: 41,
        data: '2026-08-11',
        guiaId: 101,
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
      }],
      [
        { id: 101, pacienteId: 9, profissionalId: 4, convenioId: 2 },
        {
          id: 202,
          pacienteId: 9,
          profissionalId: 4,
          convenioId: 2,
          assinadoPaciente: 1,
          assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
          dataAssinaturaPaciente: '2026-08-11 15:00:33',
        },
      ],
      [],
      [],
    );

    expect(Array.from(resultado.assinados)).toEqual([]);
    expect(resultado.pendentes.has(41)).toBe(false);
  });

  it('não reutiliza uma assinatura antiga em data ou contexto diferente', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{
        id: 41,
        data: '2026-08-11',
        guiaId: 101,
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
      }],
      [{
        id: 202,
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 3,
        assinadoPaciente: 1,
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
        dataAssinaturaPaciente: '2026-08-10 15:00:33',
      }],
      [],
      [],
    );

    expect(resultado.assinados.size).toBe(0);
  });
  it("reconcilia assinatura SADT histórica por guia, contexto e data", () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{
        id: 51,
        data: "2026-08-11",
        pacienteId: 9,
        profissionalId: 4,
        convenioId: 2,
        serieId: 'serie-historica',
      }],
      [{ id: 201, pacienteId: 9, profissionalId: 4, convenioId: 2, serieId: 'serie-historica' }],
      [{
        guiaId: 201,
        dataSessao: "2026-08-11",
        status: "assinado",
        assinaturaDataUrl: "data:image/png;base64,assinatura",
      }],
      [],
    );

    expect(Array.from(resultado.assinados)).toEqual([51]);
    expect(resultado.pendentes.has(51)).toBe(false);
  });

  it('prioriza o comprovante assinado da guia sobre o link SADT pendente da mesma sessão', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [{ id: 1830560, data: '2026-08-13', pacienteId: 1, profissionalId: 570007, convenioId: 630007, guiaId: 2190003 }],
      [{ id: 2190003, atendimentoId: 1830560, pacienteId: 1, profissionalId: 570007, convenioId: 630007, assinadoPaciente: 1 }],
      [{ atendimentoId: 1830560, guiaId: 2190003, dataSessao: '2026-08-13', status: 'pendente' }],
      [{ guiaId: 2190003, sessaoNumero: 1, datasAtendimento: '["2026-08-13"]', assinaturaPacienteUrl: 'data:image/png;base64,assinatura-real' }],
    );

    expect(resultado.assinados.has(1830560)).toBe(true);
    expect(resultado.pendentes.has(1830560)).toBe(false);
  });
});


it('não reconcilia assinatura legada de outra guia somente por paciente e data', () => {
  const resultado = getAtendimentosComStatusAssinatura(
    [
      { id: 41, data: '2026-08-04', guiaId: 999, pacienteId: 1, profissionalId: 2, convenioId: 3 },
      { id: 42, data: '2026-08-11', guiaId: 999, pacienteId: 1, profissionalId: 2, convenioId: 3 },
    ],
    [
      { id: 900, pacienteId: 1, profissionalId: 2, convenioId: 3 },
      { id: 999, pacienteId: 1, profissionalId: 2, convenioId: 3 },
    ],
    [],
    [
      { guiaId: 900, datasAtendimento: '["2026-08-04"]', assinaturaPacienteUrl: 'data:image/png;base64,ok' },
      { guiaId: 900, datasAtendimento: '["2026-08-04"]', token: 'link-antigo' },
    ],
  );

  expect(resultado.assinados.has(41)).toBe(false);
  expect(resultado.pendentes.has(41)).toBe(false);
  expect(resultado.assinados.has(42)).toBe(false);
});

it('prioriza assinatura serializada sobre pendência serializada no cartão da agenda', () => {
  expect(resolverEstadoBadgeAssinatura({
    assinadoPaciente: '1',
    assinaturaPendente: 'true',
    guiaId: 2190003,
  })).toBe('assinado');
});
