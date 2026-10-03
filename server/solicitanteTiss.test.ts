import { describe, expect, it } from "vitest";
import { resolverDadosSolicitanteTiss } from "../shared/solicitanteTiss";

describe("dados do solicitante TISS", () => {
  it("prioriza os campos editados no pré-faturamento e preserva o código Orizon", () => {
    expect(resolverDadosSolicitanteTiss({
      codigoPrestadorPadrao: "000376402",
      profissionalPadrao: { nome: "Profissional da guia", codigoConselho: "11", numeroConselho: "999", codigoCBO: "251510" },
      dadosPrefaturamento: JSON.stringify({
        codigoOperadoraSolicitante: "000376402",
        nomeProfissionalSolicitante: "Dra. Solicitante",
        conselhoProfissionalSolicitante: "CRM",
        numeroConselhoSolicitante: "12345",
        ufSolicitante: "AM",
        codigoCBOSolicitante: "225125",
      }),
    })).toEqual({
      codigoPrestadorSolicitante: "000376402",
      nomeProfissionalSolicitante: "Dra. Solicitante",
      conselhoProfissionalSolicitante: "01",
      numeroConselhoSolicitante: "12345",
      ufSolicitante: "AM",
      codigoCBOSolicitante: "225125",
    });
  });
});
