import { describe, expect, it } from "vitest";
import { __anexosInternals } from "./routers/anexos";

describe("validação de anexos de pacientes", () => {
  it("normaliza o PDF quando o navegador não informa o MIME type", () => {
    expect(__anexosInternals.normalizarMimeType("", "pedido-medico.pdf")).toBe("application/pdf");
  });

  it("decodifica um arquivo base64 válido", () => {
    expect(__anexosInternals.decodificarUploadBase64("data:application/pdf;base64,UERG").toString()).toBe("PDF");
  });

  it("rejeita conteúdo base64 inválido antes de enviar ao armazenamento", () => {
    expect(() => __anexosInternals.decodificarUploadBase64("arquivo inválido")).toThrow("arquivo enviado está inválido");
  });
});
