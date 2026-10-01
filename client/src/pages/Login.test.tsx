/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invalidateAuth = vi.fn();
const mutateLogin = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: invalidateAuth } } }),
    auth: {
      loginManual: {
        useMutation: (options: { onSuccess: () => Promise<void> }) => ({
          mutate: (input: { email: string; senha: string }) => {
            mutateLogin(input);
            void options.onSuccess();
          },
          isPending: false,
        }),
      },
    },
  },
}));

import { Login } from "./Login";

describe("Login", () => {
  beforeEach(() => {
    invalidateAuth.mockReset();
    mutateLogin.mockReset();
  });

  it("entrega ao portal o e-mail usado no login interno", async () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "Carelli@carelliassociados.com.br" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-teste" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mutateLogin).toHaveBeenCalledWith({
        email: "Carelli@carelliassociados.com.br",
        senha: "senha-teste",
      });
      expect(onLogin).toHaveBeenCalledWith("Carelli@carelliassociados.com.br");
    });
  });
});
