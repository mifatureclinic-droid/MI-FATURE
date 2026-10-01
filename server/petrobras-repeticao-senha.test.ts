import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Petrobras — repetição de autorização no pré-faturamento', () => {
  it('identifica Petrobras e ignora somente a validação de duplicidade', () => {
    const router = readFileSync(resolve(process.cwd(), 'server/routers.ts'), 'utf8');
    expect(router).toContain("/petrobras/i.test(String(convenioRows[0]?.nome ?? ''))");
    expect(router).toContain('if (!convenioEhPetrobras)');
    expect(router).toContain('senha e número de guia principal');
  });
});
