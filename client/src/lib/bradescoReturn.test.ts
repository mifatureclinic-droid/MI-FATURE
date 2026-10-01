import { describe, expect, it } from "vitest";
import { buildBradescoReturnPayload, isBradescoReturnReady } from "./bradescoReturn";

describe("retorno Bradesco no painel", () => {
  it("prepara o envio ao portal preservando protocolo e senha retornados", () => {
    const form = {
      status: "enviado_portal" as const,
      protocoloBradesco: "137697929",
      numeroAutorizacaoBradesco: "",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "",
      validadeAutorizacao: "",
      sessoesAutorizadas: "",
      motivoNegacao: "",
    };

    expect(isBradescoReturnReady(form)).toBe(true);
    expect(buildBradescoReturnPayload(1, form)).toMatchObject({
      autorizacaoId: 1,
      status: "enviado_portal",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
    });
  });

  it("exige protocolo antes de registrar uma solicitação enviada", () => {
    expect(isBradescoReturnReady({
      status: "enviado_portal",
      protocoloBradesco: "  ",
      numeroAutorizacaoBradesco: "",
      senhaAutorizacaoBradesco: "",
      dataAutorizacao: "",
      validadeAutorizacao: "",
      sessoesAutorizadas: "",
      motivoNegacao: "",
    })).toBe(false);
  });

  it("exige protocolo, senha e data para registrar uma liberação sem validade e sessões", () => {
    const form = {
      status: "liberada" as const,
      protocoloBradesco: "137697929",
      numeroAutorizacaoBradesco: "",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "2026-08-16",
      validadeAutorizacao: "",
      sessoesAutorizadas: "",
      motivoNegacao: "",
    };

    expect(isBradescoReturnReady(form)).toBe(true);
    expect(buildBradescoReturnPayload(1, form)).toMatchObject({
      autorizacaoId: 1,
      status: "liberada",
      protocoloBradesco: "137697929",
      senhaAutorizacaoBradesco: "KLS3NB3",
      dataAutorizacao: "2026-08-16",
      validadeAutorizacao: undefined,
      sessoesAutorizadas: undefined,
    });
    expect(isBradescoReturnReady({ ...form, senhaAutorizacaoBradesco: "" })).toBe(false);
  });
});
