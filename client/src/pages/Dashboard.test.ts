import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Dashboard", () => {
  it("não exibe a seção de Atendimentos Recentes", () => {
    const source = readFileSync(new URL("./Dashboard.tsx", import.meta.url), "utf8");
    expect(source).not.toContain(">Atendimentos Recentes<");
  });
});
