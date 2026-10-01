import { describe, expect, it } from "vitest";
import { resolverEmailDoLoginInterno } from "./emailLoginInterno";

describe("resolverEmailDoLoginInterno", () => {
  it("prioriza o e-mail usado no login interno sobre a conta OAuth do navegador", () => {
    expect(
      resolverEmailDoLoginInterno(
        " Carelli@carelliassociados.com.br ",
        "mifatureclinic@gmail.com",
      ),
    ).toBe("carelli@carelliassociados.com.br");
  });

  it("usa o e-mail OAuth apenas quando não há login interno registrado", () => {
    expect(resolverEmailDoLoginInterno(null, "MifatureClinic@gmail.com")).toBe(
      "mifatureclinic@gmail.com",
    );
  });
});
