import { describe, it, expect } from "vitest";
import { getHistoricoProntuariosPaciente } from "./db-prontuarios";

describe("Filtro de Datas em Prontuários", () => {
  it("deve retornar histórico sem filtro de datas", async () => {
    // Testa que a função funciona sem parâmetros de data
    const resultado = await getHistoricoProntuariosPaciente(1);
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("deve aceitar data de início como parâmetro", async () => {
    const dataInicio = new Date("2026-01-01");
    const resultado = await getHistoricoProntuariosPaciente(1, dataInicio);
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("deve aceitar data de fim como parâmetro", async () => {
    const dataFim = new Date("2026-12-31");
    const resultado = await getHistoricoProntuariosPaciente(1, undefined, dataFim);
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("deve aceitar ambas as datas como parâmetros", async () => {
    const dataInicio = new Date("2026-01-01");
    const dataFim = new Date("2026-12-31");
    const resultado = await getHistoricoProntuariosPaciente(1, dataInicio, dataFim);
    expect(Array.isArray(resultado)).toBe(true);
  });

  it("deve retornar array vazio para paciente inexistente", async () => {
    const resultado = await getHistoricoProntuariosPaciente(99999);
    expect(resultado).toEqual([]);
  });

  it("deve filtrar por período específico", async () => {
    // Teste com período específico
    const dataInicio = new Date("2026-01-15");
    const dataFim = new Date("2026-02-15");
    const resultado = await getHistoricoProntuariosPaciente(1, dataInicio, dataFim);
    
    // Verificar que todos os resultados estão dentro do período
    resultado.forEach((item: any) => {
      if (item.dataAtendimento) {
        const dataAtendimento = new Date(item.dataAtendimento);
        expect(dataAtendimento.getTime()).toBeGreaterThanOrEqual(dataInicio.getTime());
        expect(dataAtendimento.getTime()).toBeLessThanOrEqual(dataFim.getTime());
      }
    });
  });
});
