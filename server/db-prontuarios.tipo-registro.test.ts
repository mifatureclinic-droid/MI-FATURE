import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db";
import { createProntuarioCompleto } from "./db-prontuarios";

describe("createProntuarioCompleto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persiste a escolha de anamnese no novo prontuário", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn(() => ({ values }));
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn(() => ({ where: updateWhere }));
    const update = vi.fn(() => ({ set: updateSet }));
    const selectLimit = vi.fn().mockResolvedValue([]);
    const selectOrderBy = vi.fn(() => ({ limit: selectLimit }));
    const selectWhere = vi.fn(() => ({ orderBy: selectOrderBy }));
    const selectFrom = vi.fn(() => ({ where: selectWhere }));
    const select = vi.fn(() => ({ from: selectFrom }));

    vi.mocked(getDb).mockResolvedValue({ insert, update, select } as any);

    await createProntuarioCompleto({
      pacienteId: 1,
      profissionalId: 2,
      atendimentoId: 3,
      tipoRegistro: "anamnese",
    });

    expect(values).toHaveBeenCalledWith(expect.objectContaining({
      pacienteId: 1,
      atendimentoId: 3,
      tipoRegistro: "anamnese",
    }));
  });
});
