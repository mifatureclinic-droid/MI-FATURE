import { describe, expect, it } from "vitest";
import { usuarioTemAcessoSomenteLeitura } from "./acessoSomenteLeitura";

describe("usuarioTemAcessoSomenteLeitura", () => {
  it("reconhece o e-mail autorizado mesmo com maiúsculas ou espaços", () => {
    expect(usuarioTemAcessoSomenteLeitura(" Carelli@carelliassociados.com.br ")).toBe(true);
  });

  it("mantém os demais usuários fora do modo somente leitura", () => {
    expect(usuarioTemAcessoSomenteLeitura("outro.usuario@carelliassociados.com.br")).toBe(false);
  });
});
