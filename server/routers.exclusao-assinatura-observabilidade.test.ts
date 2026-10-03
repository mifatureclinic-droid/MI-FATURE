import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const fonteRouter = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');
const fonteRouterSadt = readFileSync(new URL('./routers/assinaturas.ts', import.meta.url), 'utf8');

describe('observabilidade da exclusão legada de assinatura', () => {
  it('registra a solicitação, o sucesso e retorna a causa acionável em falha', () => {
    const trecho = fonteRouter.slice(fonteRouter.indexOf('excluirAssinatura: protectedProcedure'), fonteRouter.indexOf('duplicarAssinatura: protectedProcedure'));
    expect(trecho).toContain('[Assinaturas] exclusão legada solicitada');
    expect(trecho).toContain('[Assinaturas] exclusão legada concluída');
    expect(trecho).toContain('[Assinaturas] exclusão legada recusada');
    expect(trecho).toContain('Não foi possível excluir esta assinatura:');
  });

  it('chama a exclusão SADT por importação estática e retorna logs de conclusão ou recusa', () => {
    const trecho = fonteRouterSadt.slice(fonteRouterSadt.indexOf('excluirAssinatura: protectedProcedure'), fonteRouterSadt.indexOf('// ─── PROTEGIDO: listar assinaturas de um paciente'));
    expect(fonteRouterSadt).toContain('excluirAssinaturaSadt,');
    expect(trecho).not.toContain("await import('../db')");
    expect(trecho).toContain('[Assinaturas] exclusão SADT solicitada');
    expect(trecho).toContain('[Assinaturas] exclusão SADT concluída');
    expect(trecho).toContain('[Assinaturas] exclusão SADT recusada');
  });
});
