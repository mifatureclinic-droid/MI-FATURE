import { describe, it, expect } from "vitest";
import {
  getHistoricoProntuariosPaciente,
  getProntuarioById,
  updateProntuario,
  getProntuariosPendentes,
} from "./db-prontuarios";

describe("Prontuários", () => {
  it("deve obter histórico de prontuários do paciente", async () => {
    const historico = await getHistoricoProntuariosPaciente(1);
    expect(Array.isArray(historico)).toBe(true);
  });

  it("deve retornar null ao buscar prontuário inexistente", async () => {
    const prontuario = await getProntuarioById(99999);
    expect(prontuario).toBeNull();
  });

  it("deve validar que updateProntuario requer campos", async () => {
    try {
      await updateProntuario(1, {});
      expect.fail("Deveria ter lançado erro");
    } catch (error: any) {
      expect(error.message).toContain("Nenhum campo fornecido");
    }
  });

  it("deve obter prontuários pendentes", async () => {
    const pendentes = await getProntuariosPendentes();
    expect(Array.isArray(pendentes)).toBe(true);
  });

  it("deve retornar array vazio para histórico de paciente inexistente", async () => {
    const historico = await getHistoricoProntuariosPaciente(99999);
    expect(Array.isArray(historico)).toBe(true);
    expect(historico.length).toBe(0);
  });
});
