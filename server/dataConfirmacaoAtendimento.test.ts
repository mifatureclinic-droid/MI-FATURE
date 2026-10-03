import { describe, expect, it } from "vitest";
import {
  extrairDataCalendario,
  formatarDataConfirmacaoManaus,
} from "../shared/dataConfirmacaoAtendimento";

describe("data da confirmação de atendimento", () => {
  it("preserva o dia do campo DATE recebido como meia-noite UTC", () => {
    expect(extrairDataCalendario(new Date("2026-08-20T00:00:00.000Z"))).toBe("2026-08-20");
    expect(formatarDataConfirmacaoManaus(new Date("2026-08-20T00:00:00.000Z"))).toContain("20 de agosto de 2026");
  });

  it("aceita a data textual do agendamento sem deslocamento de fuso", () => {
    expect(extrairDataCalendario("2026-08-20")).toBe("2026-08-20");
    expect(formatarDataConfirmacaoManaus("2026-08-20")).toContain("20 de agosto de 2026");
  });
});
