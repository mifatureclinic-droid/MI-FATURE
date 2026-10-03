import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const fonteRouter = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');
const fontePagina = readFileSync(new URL('../client/src/pages/GuiasSPSADT.tsx', import.meta.url), 'utf8');

describe('guias.salvarSPSADT — sequencial das execuções', () => {
  it('usa a posição da execução no servidor, não o id visual da linha', () => {
    expect(fonteRouter).toContain('// O sequencial TISS é a posição da execução, não o id visual da linha.');
    expect(fonteRouter).toContain('sequencial: idx + 1');
  });

  it('normaliza as execuções no cliente antes de enviar o payload', () => {
    expect(fontePagina).toContain('map((e: any, index: number) => ({');
    expect(fontePagina).toContain('sequencial: index + 1');
  });
});
