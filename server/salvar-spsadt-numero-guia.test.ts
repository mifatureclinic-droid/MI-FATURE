import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('salvarSPSADT — número da guia do prestador', () => {
  it('preserva o identificador técnico único e salva o número no campo interno editável', () => {
    const routers = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
    const inicio = routers.indexOf('// Campo 2: Nº Guia do Prestador.');
    const fim = routers.indexOf('// Autorização', inicio);
    const trecho = routers.slice(inicio, fim);

    expect(trecho).toContain('updateData.numeroGuiaInterno = numeroGuiaSincronizado;');
    expect(trecho).not.toContain('updateData.numeroGuia = numeroGuiaSincronizado;');
  });
});
