import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync(new URL('./FaturamentoTISS.tsx', import.meta.url), 'utf8');

describe('abertura direcionada de lote TISS', () => {
  it('lê o lote selecionado na URL e mostra seus dados completos', () => {
    expect(fonte).toContain("new URLSearchParams(window.location.search).get('loteId')");
    expect(fonte).toContain('Lote aberto a partir do Pré-faturamento');
    expect(fonte).toContain('Informações do lote selecionado');
  });
});
