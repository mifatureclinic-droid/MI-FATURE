import { describe, expect, it } from "vitest";
import { exibirHashIntegridade, statusAssinaturaSadt } from "../shared/historicoAssinaturasGuia";

describe("histórico de assinaturas da guia", () => {
  it("exibe o hash completo, sem abreviar a integridade da assinatura", () => {
    const hash = "a".repeat(64);
    expect(exibirHashIntegridade(hash)).toBe(hash);
  });

  it("informa quando não há hash gravado e traduz o status SADT", () => {
    expect(exibirHashIntegridade(null)).toBe("Hash não disponível");
    expect(statusAssinaturaSadt("assinado")).toBe("Assinado");
    expect(statusAssinaturaSadt("pendente")).toBe("Pendente");
  });
});
