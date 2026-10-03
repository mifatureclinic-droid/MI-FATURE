/** @vitest-environment jsdom */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConteudoSomenteLeitura } from "./ConteudoSomenteLeitura";

describe("ConteudoSomenteLeitura", () => {
  it("desabilita controles de alteração quando o modo leitura está ativo", () => {
    render(
      <ConteudoSomenteLeitura ativo>
        <input aria-label="Nome" />
        <textarea aria-label="Observação" />
        <select aria-label="Status"><option>Ativo</option></select>
        <button type="button">Salvar</button>
      </ConteudoSomenteLeitura>,
    );

    expect(screen.getByLabelText("Nome").matches(":disabled")).toBe(true);
    expect(screen.getByLabelText("Observação").matches(":disabled")).toBe(true);
    expect(screen.getByLabelText("Status").matches(":disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "Salvar" }).matches(":disabled")).toBe(true);
  });

  it("mantém controles ativos para usuários que podem editar", () => {
    const { container } = render(
      <ConteudoSomenteLeitura ativo={false}>
        <input aria-label="Nome" />
        <button type="button">Salvar</button>
      </ConteudoSomenteLeitura>,
    );

    expect(container.querySelector("input")?.matches(":disabled")).toBe(false);
    expect(container.querySelector("button")?.matches(":disabled")).toBe(false);
  });
});
