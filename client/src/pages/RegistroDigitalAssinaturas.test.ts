import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("RegistroDigitalAssinaturas", () => {
  it("mantém as evidências técnicas e a impressão do registro digital", () => {
    const source = readFileSync(new URL("./RegistroDigitalAssinaturas.tsx", import.meta.url), "utf8");
    expect(source).toContain("Registro Digital de Assinaturas");
    expect(source).toContain("Hash SHA-256 de integridade");
    expect(source).toContain("window.print()");
  });
});
