import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createPagamentoAtendimento: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock('./db', () => ({
  createPagamentoAtendimento: mocks.createPagamentoAtendimento,
  getDb: mocks.getDb,
}));

vi.mock('./storage', () => ({
  storagePut: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

vi.mock('./db-auditoria', () => ({ registrarAuditoria: vi.fn() }));

import { pagamentosRouter } from './routers/pagamentos';

describe('Pagamentos — Mente Aberta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recusa Mente Aberta sem comprovante antes de criar ou vincular pagamento', async () => {
    const whereAtendimentos = vi.fn().mockResolvedValue([
      { id: 19680001, pacienteId: 8640001, profissionalId: 570005, convenioId: 5010001, pagamentoId: null },
    ]);
    const limitConvenio = vi.fn().mockResolvedValue([{ nome: 'MENTE ABERTA' }]);
    const whereConvenio = vi.fn().mockReturnValue({ limit: limitConvenio });
    const from = vi.fn()
      .mockReturnValueOnce({ where: whereAtendimentos })
      .mockReturnValueOnce({ where: whereConvenio });

    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });

    const caller = pagamentosRouter.createCaller({ user: { id: 1, role: 'admin' } } as any);

    await expect(caller.criar({
      atendimentoId: 19680001,
      pacienteId: 8640001,
      profissionalId: 570005,
      valor: 1,
      dataPagamento: new Date('2026-09-04T12:00:00.000Z'),
      referenciaDatas: '04/09/2026',
      metodoPagamento: 'pix',
      atendimentosVinculados: [],
    })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'Anexe o comprovante de pagamento para registrar atendimento do convênio Mente Aberta.',
    });

    expect(mocks.createPagamentoAtendimento).not.toHaveBeenCalled();
  });

  it('recusa duas formas de pagamento cuja soma diverge do recebimento antes de acessar o banco', async () => {
    const caller = pagamentosRouter.createCaller({ user: { id: 1, role: 'admin' } } as any);

    await expect(caller.criar({
      atendimentoId: 19680001,
      pacienteId: 8640001,
      profissionalId: 570005,
      valor: 100,
      dataPagamento: new Date('2026-09-04T12:00:00.000Z'),
      referenciaDatas: '04/09/2026',
      metodoPagamento: 'pix',
      formasPagamento: [
        { metodoPagamento: 'pix', valor: 60 },
        { metodoPagamento: 'dinheiro', valor: 30 },
      ],
      atendimentosVinculados: [],
    })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'A soma das duas formas deve ser igual ao valor total do recebimento.',
    });

    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(mocks.createPagamentoAtendimento).not.toHaveBeenCalled();
  });

  it('encaminha as duas formas válidas para o mesmo recebimento', async () => {
    const whereAtendimentos = vi.fn().mockResolvedValue([
      { id: 19680001, pacienteId: 8640001, profissionalId: 570005, convenioId: 5010001, pagamentoId: null },
    ]);
    const limitConvenio = vi.fn().mockResolvedValue([{ nome: 'Particular' }]);
    const whereConvenio = vi.fn().mockReturnValue({ limit: limitConvenio });
    const from = vi.fn()
      .mockReturnValueOnce({ where: whereAtendimentos })
      .mockReturnValueOnce({ where: whereConvenio });
    const whereAtualizacao = vi.fn().mockResolvedValue(undefined);
    const dbConn = {
      select: vi.fn(() => ({ from })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: whereAtualizacao })) })),
    };
    mocks.getDb.mockResolvedValue(dbConn);
    mocks.createPagamentoAtendimento.mockResolvedValue(990001);

    const caller = pagamentosRouter.createCaller({ user: { id: 1, role: 'admin' } } as any);
    await expect(caller.criar({
      atendimentoId: 19680001,
      pacienteId: 8640001,
      profissionalId: 570005,
      valor: 100,
      dataPagamento: new Date('2026-09-04T12:00:00.000Z'),
      referenciaDatas: '04/09/2026',
      metodoPagamento: 'pix',
      formasPagamento: [
        { metodoPagamento: 'pix', valor: 60 },
        { metodoPagamento: 'dinheiro', valor: 40 },
      ],
      atendimentosVinculados: [],
    })).resolves.toMatchObject({ success: true, pagamentoId: 990001 });

    expect(mocks.createPagamentoAtendimento).toHaveBeenCalledWith(expect.objectContaining({
      valor: 100,
      metodoPagamento: 'pix',
      formasPagamento: [
        { metodoPagamento: 'pix', valor: 60 },
        { metodoPagamento: 'dinheiro', valor: 40 },
      ],
    }));
  });
});
