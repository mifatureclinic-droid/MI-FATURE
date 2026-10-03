import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');

describe('identificação de prestador da Luminar no Factiss', () => {
  it('usa o CNPJ também para a Luminar nos fluxos de criação, validação e reexportação', () => {
    const regras = fonte.match(/identificarPrestadorPorCnpj: ehPostalSaude \|\| ehLuminar/g) ?? [];
    expect(regras).toHaveLength(3);
  });
});
