import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('atualização da tela de repasse', () => {
  it('reconsulta o repasse ao montar a tela e periodicamente', () => {
    const pagina = readFileSync(resolve(process.cwd(), 'client/src/pages/Repasse.tsx'), 'utf8');
    expect(pagina).toContain("refetchOnMount: 'always'");
    expect(pagina).toContain('refetchInterval: 15_000');
  });
});
