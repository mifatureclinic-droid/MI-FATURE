import { describe, expect, it } from "vitest";
import { normalizarPedidoMedicoOpcional } from "../shared/pedidoMedicoOpcional";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("normalizarPedidoMedicoOpcional", () => {
  it("permite o cadastro sem anexo ou vencimento do pedido médico", () => {
    expect(normalizarPedidoMedicoOpcional({ pedidoMedicoUrl: "", dataVencimentoPedido: "" })).toEqual({
      pedidoMedicoUrl: undefined,
      dataVencimentoPedido: undefined,
    });
  });

  it("mantém os campos quando o pedido médico é informado", () => {
    expect(normalizarPedidoMedicoOpcional({
      pedidoMedicoUrl: "pedido.pdf",
      dataVencimentoPedido: "2026-08-12",
    })).toEqual({
      pedidoMedicoUrl: "pedido.pdf",
      dataVencimentoPedido: "2026-08-12",
    });
  });

  it("não mantém bloqueio de vencimento obrigatório no formulário de pacientes", () => {
    const formulario = readFileSync(resolve(process.cwd(), "client/src/pages/Pacientes.tsx"), "utf8");

    expect(formulario).not.toContain("A data de vencimento do pedido médico é obrigatória!");
    expect(formulario).toContain("noValidate");
    expect(formulario).toContain("required={false}");
  });
});
