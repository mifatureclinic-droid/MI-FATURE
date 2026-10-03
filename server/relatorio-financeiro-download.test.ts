import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('disparo de download do relatório financeiro', () => {
  it('mantém a URL do arquivo ativa até o navegador iniciar o download', () => {
    const pagina = readFileSync(resolve(process.cwd(), 'client/src/pages/Financeiro.tsx'), 'utf8');

    expect(pagina).toContain("link.download = `relatorio-financeiro-");
    expect(pagina).toContain('window.setTimeout(() => {');
    expect(pagina).toContain('URL.revokeObjectURL(url);');
    expect(pagina).toContain('}, 1000);');
  });
});
