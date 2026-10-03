import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";
import { deleteProntuario } from "./db-prontuarios";

describe("deleteProntuario", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("limpa o indicador de prontuário do atendimento ao excluir o registro", async () => {
    const selectLimit = vi.fn().mockResolvedValue([{ atendimentoId: 123 }]);
    const selectWhere = vi.fn(() => ({ limit: selectLimit }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    const select = vi.fn(() => ({ from: selectFrom }));
    const deleteWhere = vi.fn().mockResolvedValue(undefined);
    const deleteFn = vi.fn(() => ({ where: deleteWhere }));
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const update = vi.fn(() => ({ set: updateSet }));
    const tx = { select, delete: deleteFn, update };
    const transaction = vi.fn(async (callback: (transaction: typeof tx) => Promise<void>) => callback(tx));

    vi.mocked(getDb).mockResolvedValue({ transaction } as any);

    await deleteProntuario(99);

    expect(deleteFn).toHaveBeenCalledTimes(1);
    expect(updateSet).toHaveBeenCalledWith({ prontuarioFeito: 0 });
    expect(updateWhere).toHaveBeenCalledTimes(1);
  });
});
