import { describe, expect, it } from "vitest";
import { calcularValorTotalCampo65 } from "@shared/campo65ValorTotalGuia";

describe("campo 65 — valor total da guia", () => {
  it("soma automaticamente procedimentos e subtotais", () => {
    expect(calcularValorTotalCampo65({
      procedimentos: 180,
      taxasAlugueis: 5.5,
      materiais: 12.25,
      opme: 0,
      medicamentos: 7.25,
      gasesMedicinais: 1,
    })).toBe(206);
  });

  it("trata valores ausentes como zero", () => {
    expect(calcularValorTotalCampo65({ procedimentos: 90 })).toBe(90);
  });
});
