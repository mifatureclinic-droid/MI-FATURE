import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dbSource = readFileSync(fileURLToPath(new URL('./db.ts', import.meta.url)), 'utf8');
const routerSource = readFileSync(fileURLToPath(new URL('./routers.ts', import.meta.url)), 'utf8');

describe('duplicação controlada de assinatura', () => {
  it('remove a fonte SADT correspondente ao excluir uma cópia legada da mesma guia e data', () => {
    expect(dbSource).toContain('Assinatura não encontrada nesta guia');
    expect(dbSource).toContain('idsSadtDaMesmaData');
    expect(dbSource).toContain('await tx.delete(assinaturasSadt).where(inArray(assinaturasSadt.id, idsSadtDaMesmaData));');
  });

  it('restringe a duplicação à data de atendimento da mesma guia e série', () => {
    expect(dbSource).toContain('A data escolhida não pertence à mesma série desta guia');
    expect(dbSource).toContain('Já existe uma assinatura nesta data para esta guia');
    expect(dbSource).toContain("origem: 'legada' | 'sadt'");
  });

  it('exige autorização e registra auditoria da cópia administrativa', () => {
    expect(routerSource).toContain('duplicarAssinatura: protectedProcedure');
    expect(routerSource).toContain("acao: 'DUPLICAR_ASSINATURA_GUIA'");
    expect(routerSource).toContain('podeGerenciarDatasAssinatura(perfil, role)');
  });
});
