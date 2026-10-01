import { describe, expect, it } from 'vitest';
import { getAtendimentosComStatusAssinatura } from '../shared/assinaturasAgenda';

describe('assinaturas de guia órfãs na agenda', () => {
  it('não associa prova órfã por paciente e data a uma guia diferente', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        { id: 4680001, pacienteId: 93, data: '2026-08-06', status: 'cancelado' },
        { id: 1830242, pacienteId: 93, data: '2026-08-06', status: 'realizado' },
      ],
      [],
      [],
      [{
        guiaId: 240259,
        pacienteId: 93,
        datasAtendimento: '["2026-08-06"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(resultado.assinados.has(1830242)).toBe(false);
    expect(resultado.assinados.has(4680001)).toBe(false);
    expect(resultado.pendentes.has(1830242)).toBe(false);
  });
});
