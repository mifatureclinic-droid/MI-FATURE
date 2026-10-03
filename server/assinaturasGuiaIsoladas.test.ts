import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonteDb = readFileSync(new URL('./db.ts', import.meta.url), 'utf8');
const fonteModal = readFileSync(new URL('../client/src/components/GuiaSadtAssinaturaModal.tsx', import.meta.url), 'utf8');

describe('isolamento de assinaturas na Guia SADT', () => {
  it('prioriza a guia enviada pela Agenda e não monta histórico de outras guias', () => {
    const inicio = fonteDb.indexOf('export async function getGuiaComSessoesPorPaciente');
    const fim = fonteDb.indexOf('export async function registrarAssinaturaGuiaSessao', inicio);
    const trecho = fonteDb.slice(inicio, fim);

    expect(trecho).toContain('if (opcoes.guiaId)');
    expect(trecho).toContain('eq(guias.id, opcoes.guiaId)');
    expect(trecho).toContain('const assinaturas = await getAssinaturasGuia(guia.id);');
    expect(trecho).toContain('assinaturasHistoricas: []');
    expect(trecho).not.toContain('const condicoesHistorico');
  });

  it('exige a guia aberta e não concatena assinaturas históricas de outra guia no campo de assinatura', () => {
    expect(fonteModal).toContain('guiaId: number;');
    expect(fonteModal).toContain('enabled: open && pacienteId > 0 && guiaId > 0');
    expect(fonteModal).toContain('encontrarAssinaturaDaSessao(\n    sessoesAnteriores,');
    expect(fonteModal).not.toContain('Guia original: {assinatura.numeroGuia}');
  });
});
