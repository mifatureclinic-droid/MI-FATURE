import { describe, expect, it } from "vitest";
import { convenioExigeNumeroLoteTissA12, ehConvenioPostalSaude, normalizarNumeroLotePostalSaude } from "../shared/numeroLotePostalSaude";

describe("número de lote XML da Postal Saúde", () => {
  it("reconhece Postal Saúde sem diferenciar caixa ou acentuação", () => {
    expect(ehConvenioPostalSaude("POSTAL SAÚDE")).toBe(true);
    expect(ehConvenioPostalSaude("Postal Saude")).toBe(true);
    expect(ehConvenioPostalSaude("POSTAL SAUDE (CORREIOS)")).toBe(true);
    expect(ehConvenioPostalSaude("Postal Saúde Empresarial")).toBe(false);
    expect(ehConvenioPostalSaude("Bradesco Saúde")).toBe(false);
  });

  it("remove o prefixo visual e limita o número de lote a doze caracteres", () => {
    expect(normalizarNumeroLotePostalSaude("LOTE-202609-10887")).toBe("202609-10887");
    expect(normalizarNumeroLotePostalSaude("LOTE-202609-1234567")).toBe("2609-1234567");
  });

  it("aplica a limitação do campo TISS também ao GEAP", () => {
    expect(convenioExigeNumeroLoteTissA12("GEAP")).toBe(true);
    expect(convenioExigeNumeroLoteTissA12("Luminar")).toBe(true);
    expect(convenioExigeNumeroLoteTissA12("Bradesco Saúde")).toBe(true);
  });
});
