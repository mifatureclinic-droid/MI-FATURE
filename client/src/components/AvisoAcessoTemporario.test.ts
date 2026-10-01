import { describe, expect, it } from "vitest";
import { deveExibirAvisoAcessoTemporario } from "./AvisoAcessoTemporario";

describe("deveExibirAvisoAcessoTemporario", () => {
  it("exibe somente para o e-mail destinatário antes de 28/08 às 08h em Manaus", () => {
    expect(
      deveExibirAvisoAcessoTemporario(
        "Carelli@carelliassociados.com.br",
        new Date("2026-08-28T07:59:59-04:00"),
      ),
    ).toBe(true);
  });

  it("oculta para outros usuários e a partir do horário de expiração", () => {
    expect(
      deveExibirAvisoAcessoTemporario(
        "outro.usuario@carelliassociados.com.br",
        new Date("2026-08-27T09:00:00-04:00"),
      ),
    ).toBe(false);
    expect(
      deveExibirAvisoAcessoTemporario(
        "carelli@carelliassociados.com.br",
        new Date("2026-08-28T08:00:00-04:00"),
      ),
    ).toBe(false);
  });
});
