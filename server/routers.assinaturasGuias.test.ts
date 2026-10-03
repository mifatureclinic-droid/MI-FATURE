import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonteRouter = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');

describe('assinaturasGuias.list', () => {
  it('prioriza a guia individual quando guia e paciente forem informados', () => {
    const inicio = fonteRouter.indexOf('assinaturasGuias: router({');
    const fim = fonteRouter.indexOf('historicoCompleto:', inicio);
    const trechoListagem = fonteRouter.slice(inicio, fim);

    expect(trechoListagem.indexOf('if (input.guiaId && input.guiaId > 0)')).toBeGreaterThan(-1);
    expect(trechoListagem.indexOf('if (input.pacienteId && input.pacienteId > 0)')).toBeGreaterThan(-1);
    expect(trechoListagem.indexOf('if (input.guiaId && input.guiaId > 0)'))
      .toBeLessThan(trechoListagem.indexOf('if (input.pacienteId && input.pacienteId > 0)'));
  });

  it('aplica a mesma normalização de permissão usada pelos botões do Pré-faturamento', () => {
    const inicio = fonteRouter.indexOf('assinaturasGuias: router({');
    const fim = fonteRouter.indexOf('// ─── Dashboard', inicio);
    const trechoAssinaturas = fonteRouter.slice(inicio, fim);

    expect(trechoAssinaturas).toContain('podeGerenciarDatasAssinatura(perfil, role)');
  });
});
