/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AvisoAcessoTemporario } from "./AvisoAcessoTemporario";

describe("AvisoAcessoTemporario", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-27T12:00:00-04:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("abre um diálogo prioritário para João Carelli e permite confirmar a leitura", () => {
    render(<AvisoAcessoTemporario email="Carelli@carelliassociados.com.br" />);

    expect(screen.getByRole("dialog", { name: "Acesso temporário para visualização" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Entendi" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("não abre o diálogo para outros usuários", () => {
    render(<AvisoAcessoTemporario email="outro.usuario@carelliassociados.com.br" />);

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
