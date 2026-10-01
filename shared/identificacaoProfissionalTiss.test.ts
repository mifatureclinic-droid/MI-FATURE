import { describe, expect, it } from "vitest";
import {
  normalizarCodigoCboTiss,
  normalizarNumeroConselhoTiss,
  resolverCodigoCboProfissionalTiss,
} from "./identificacaoProfissionalTiss";

describe("identificação profissional TISS", () => {
  it("separa o número de registro do prefixo regional do conselho", () => {
    expect(normalizarNumeroConselhoTiss("20ª/07358")).toBe("07358");
    expect(normalizarNumeroConselhoTiss("CRP/04615")).toBe("04615");
  });

  it("normaliza CBO para os seis dígitos transmitidos no XML", () => {
    expect(normalizarCodigoCboTiss("2515-10")).toBe("251510");
    expect(normalizarCodigoCboTiss("251510")).toBe("251510");
  });

  it("preenche apenas CBO ausente que possua mapeamento inequívoco", () => {
    expect(resolverCodigoCboProfissionalTiss({ especialidade: "Psicologia" })).toBe("251510");
    expect(resolverCodigoCboProfissionalTiss({ especialidade: "Neuropsicólogo" })).toBe("251545");
    expect(resolverCodigoCboProfissionalTiss({ codigoCBO: "251510", especialidade: "Neuropsicólogo" })).toBe("251510");
  });
});
