import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAtendimentosComStatusAssinatura } from '../shared/assinaturasAgenda';

const fonteDb = readFileSync(new URL('./db.ts', import.meta.url), 'utf8');

describe('projeção de série da guia para a Agenda', () => {
  it('entrega a série da guia ao resolvedor da Agenda', () => {
    const inicio = fonteDb.indexOf('export async function getAtendimentos(');
    const fim = fonteDb.indexOf('// Guias', inicio);
    const trecho = fonteDb.slice(inicio, fim);

    expect(trecho).toContain('serieId: guias.serieId');
  });

  it('reconhece a assinatura da sessão sem guia direta quando a guia da série é projetada', () => {
    const status = getAtendimentosComStatusAssinatura(
      [{
        id: 23040004,
        data: '2026-09-08',
        guiaId: null,
        serieId: 'serie-setembro',
        pacienteId: 1080,
        profissionalId: 570002,
        convenioId: 600002,
        assinaturaDigitalObrigatoria: true,
      }],
      [{
        id: 6990001,
        serieId: 'serie-setembro',
        pacienteId: 1080,
        profissionalId: 570002,
        convenioId: 600002,
      }],
      [],
      [{
        guiaId: 6990001,
        datasAtendimento: '["2026-09-08"]',
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura',
      }],
    );

    expect(Array.from(status.assinados)).toEqual([23040004]);
    expect(status.pendentes.size).toBe(0);
  });
});
