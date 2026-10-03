import { describe, expect, it } from "vitest";
import { NOME_FANTASIA_CLINICA } from "../shared/nomeClinica";

describe("nome padrão da clínica", () => {
  it("usa CLINICA CLIPSI quando o cadastro não estiver disponível", () => {
    expect(NOME_FANTASIA_CLINICA).toBe("CLINICA CLIPSI");
  });
});
