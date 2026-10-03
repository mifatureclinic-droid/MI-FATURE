import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Prontuário — layout clínico", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Prontuario.tsx"), "utf8");

  it("mantém a escolha entre anamnese e continuidade e o histórico real ao lado do editor", () => {
    expect(source).toContain("tipoRegistro");
    expect(source).toContain("Anamnese");
    expect(source).toContain("Continuidade");
    expect(source).toContain("Histórico de prontuários");
    expect(source).toContain("historicoProntuariosApi as any[]");
    expect(source).toContain("bg-[#707b42]");
  });
});
