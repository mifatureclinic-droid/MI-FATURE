import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fontePagina = readFileSync(new URL('./GuiasSPSADT.tsx', import.meta.url), 'utf8');

describe('abertura da Guia SADT oficial', () => {
  it('abre o pré-faturamento oficial ao visualizar uma guia emitida', () => {
    expect(fontePagina).toContain('title="Abrir Guia SADT oficial"');
    expect(fontePagina).toContain('setGuiaPrefaturamento(guia);');
    expect(fontePagina).toContain('setShowPrefaturamento(true);');
  });

  it('confirma o salvamento antes de atualizar consultas em segundo plano', () => {
    const indiceMutacao = fontePagina.indexOf('await salvarSPSADTMutation.mutateAsync({');
    const indiceFechamento = fontePagina.indexOf('setShowPrefaturamento(false);', indiceMutacao);
    const indiceAtualizacaoEmSegundoPlano = fontePagina.indexOf('void (async () => {', indiceMutacao);

    expect(indiceMutacao).toBeGreaterThanOrEqual(0);
    expect(indiceFechamento).toBeGreaterThan(indiceMutacao);
    expect(indiceAtualizacaoEmSegundoPlano).toBeGreaterThan(indiceFechamento);
    expect(fontePagina).toContain('Guia SADT salva, mas a atualização visual será tentada na próxima abertura.');
  });
});
