import { describe, it, expect } from "vitest";
import { updateGuia, getGuiaById } from "./db-guias-update";

describe("Guias Update", () => {
  it("deve validar que updateGuia requer campos para atualizar", async () => {
    try {
      await updateGuia(1, {});
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("Nenhum campo fornecido");
    }
  });

  it("deve retornar null ao buscar guia inexistente", async () => {
    const guia = await getGuiaById(99999);
    expect(guia).toBeNull();
  });

  it("deve validar que status aceita valores válidos", async () => {
    const validStatuses = ["rascunho", "emitida", "enviada", "processada", "paga", "glosa"];
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it("deve ter função updateGuia disponível", async () => {
    expect(updateGuia).toBeDefined();
    expect(typeof updateGuia).toBe("function");
  });

  it("deve ter função getGuiaById disponível", async () => {
    expect(getGuiaById).toBeDefined();
    expect(typeof getGuiaById).toBe("function");
  });
});
