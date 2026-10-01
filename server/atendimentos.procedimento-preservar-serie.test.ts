import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const routersPath = fileURLToPath(new URL('./routers.ts', import.meta.url));
const routers = readFileSync(routersPath, 'utf8');
const inicioAtualizacao = routers.indexOf('if (input.data.procedimentoConvenioId !== undefined)');
const fimAtualizacao = routers.indexOf('if (input.data.reagendadoPara !== undefined)', inicioAtualizacao);
const blocoProcedimento = routers.slice(inicioAtualizacao, fimAtualizacao);

describe('atendimentos.update — alteração de procedimento', () => {
  it('preserva os vínculos existentes de série e guia ao trocar o procedimento', () => {
    expect(blocoProcedimento).toContain('procedimentoFoiAlterado(');
    expect(blocoProcedimento).toContain('série, guia e assinaturas existentes foram preservadas');
    expect(blocoProcedimento).not.toContain('updateData.serieId =');
    expect(blocoProcedimento).not.toContain('updateData.guiaId = null');
  });
});
