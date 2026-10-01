import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  editarDataSessaoAssinaturaSadt: vi.fn().mockResolvedValue({ success: true }),
  excluirAssinaturaSadt: vi.fn().mockResolvedValue({ ok: true, totalSessoes: 3 }),
}));

vi.mock('../db', () => ({
  editarDataSessaoAssinaturaSadt: mocks.editarDataSessaoAssinaturaSadt,
  excluirAssinaturaSadt: mocks.excluirAssinaturaSadt,
}));

import { assinaturasRouter } from './assinaturas';

describe('assinaturas.editarDataSessao', () => {
  it('atualiza somente a data clínica de uma assinatura SADT para utilizador autorizado', async () => {
    const caller = assinaturasRouter.createCaller({
      user: {
        id: 1,
        email: 'recepcao@clipsi.com.br',
        role: 'user',
        perfil: 'recepcao',
      },
      req: {} as any,
      res: {} as any,
    } as any);

    await expect(caller.editarDataSessao({ assinaturaId: 42, novaDataSessao: '2026-08-08' }))
      .resolves.toEqual({ success: true });

    expect(mocks.editarDataSessaoAssinaturaSadt).toHaveBeenCalledWith(42, '2026-08-08');
  });

  it('exclui a assinatura SADT pela guia informada para utilizador autorizado', async () => {
    const caller = assinaturasRouter.createCaller({
      user: {
        id: 1,
        email: 'recepcao@clipsi.com.br',
        role: 'user',
        perfil: 'recepcao',
      },
      req: {} as any,
      res: {} as any,
    } as any);

    await expect(caller.excluirAssinatura({ assinaturaId: 690193, guiaId: 1770036 }))
      .resolves.toEqual({ ok: true, totalSessoes: 3 });

    expect(mocks.excluirAssinaturaSadt).toHaveBeenCalledWith(690193, 1770036);
  });
});
