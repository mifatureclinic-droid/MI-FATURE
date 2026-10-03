import { describe, expect, it } from "vitest";
import { ehConvenioLuminar, obterRegistroAnsTiss } from "../shared/registroAnsTiss";

describe("Registro ANS TISS por convênio", () => {
  it("usa 418374 para o cadastro Luminar Saúde, mesmo se o campo vier divergente", () => {
    expect(ehConvenioLuminar("LUMINAR SAÚDE")).toBe(true);
    expect(obterRegistroAnsTiss({
      nomeConvenio: "LUMINAR SAÚDE",
      registroANS: "000000",
      codigoOperadora: "418374",
    })).toBe("418374");
  });

  it("reconhece complemento do mesmo nome sem transformar outro convênio", () => {
    expect(obterRegistroAnsTiss({ nomeConvenio: "Luminar Saúde Empresarial", registroANS: "123456" })).toBe("418374");
    expect(obterRegistroAnsTiss({ nomeConvenio: "Postal Saúde", registroANS: "419133" })).toBe("419133");
  });

  it("mantém o valor cadastrado para convênios não Luminar", () => {
    expect(obterRegistroAnsTiss({ nomeConvenio: "Bradesco Saúde", registroANS: "005711" })).toBe("005711");
  });
});
