import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const agenda = readFileSync(new URL('../client/src/pages/Agenda.tsx', import.meta.url), 'utf8');
const router = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');
const banco = readFileSync(new URL('./db.ts', import.meta.url), 'utf8');

describe('guia assinada da Agenda', () => {
  it('envia guia, paciente e profissional do atendimento selecionado', () => {
    expect(agenda).toContain('setGuiaAssinadaSelecionada({');
    expect(agenda).toContain('profissionalId: atendimento.profissionalId');
    expect(router).toContain('guiaId: z.number().positive(), profissionalId: z.number().positive()');
  });

  it('consulta uma única guia no mesmo contexto profissional', () => {
    const inicio = banco.indexOf('export async function getGuiaAssinadaComAssinaturas');
    const fim = banco.indexOf('// Verificar quais pacientes têm guia SADT assinada', inicio);
    const trecho = banco.slice(inicio, fim);

    expect(trecho).toContain('eq(guias.id, contexto.guiaId)');
    expect(trecho).toContain('eq(guias.profissionalId, contexto.profissionalId)');
    expect(trecho).toContain('await getAssinaturasGuia(guia.id)');
    expect(trecho).not.toContain('orderBy(desc(guias.dataAssinaturaPaciente))');
  });
});
