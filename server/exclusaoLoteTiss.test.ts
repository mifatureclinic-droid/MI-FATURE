import { describe, expect, it } from "vitest";
import { loteTissPodeSerExcluido, mensagemLoteTissNaoExcluivel } from "../shared/exclusaoLoteTiss";

describe("regras de exclusão de lote TISS", () => {
  it("permite excluir somente lotes abertos ou gerados", () => {
    expect(loteTissPodeSerExcluido("aberto")).toBe(true);
    expect(loteTissPodeSerExcluido("gerado")).toBe(true);
    expect(loteTissPodeSerExcluido("enviado")).toBe(false);
    expect(loteTissPodeSerExcluido("processado")).toBe(false);
  });

  it("explica a proteção de lotes enviados", () => {
    expect(mensagemLoteTissNaoExcluivel("enviado")).toContain("enviado");
  });
});
