import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fontePagina = readFileSync(new URL('./GuiasSPSADT.tsx', import.meta.url), 'utf8');

describe('GuiasSPSADT — assinaturas por guia', () => {
  it('consulta assinaturas pelo identificador da guia aberta', () => {
    const inicio = fontePagina.indexOf('const entradaAssinaturasDaGuia');
    const fim = fontePagina.indexOf('// Buscar dados enriquecidos da guia', inicio);
    const trechoConsulta = fontePagina.slice(inicio, fim);

    expect(trechoConsulta).toContain('criarEntradaAssinaturasDaGuia(guiaPrefaturamento?.id)');
    expect(trechoConsulta).toContain('entradaAssinaturasDaGuia ?? { guiaId: 0 }');
    expect(trechoConsulta).not.toContain('pacienteId: guiaPrefaturamento?.pacienteId');
  });
});
