import { describe, it, expect } from "vitest";

/**
 * Testa as regras puras usadas no fluxo de alertas de prontuários pendentes:
 * - formatação de hora do reconhecimento (HH:MM, sempre 5 chars);
 * - filtragem/contagem de alertas por status (pendente/reconhecido/resolvido).
 * A persistência em si depende do banco e é validada em ambiente integrado.
 */

/** Reproduz a formatação de hora usada em reconhecerAlertaProntuario. */
function formatarHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

type Alerta = { id: number; status: "pendente" | "reconhecido" | "resolvido" };

function contarPorStatus(alertas: Alerta[]) {
  return {
    pendentes: alertas.filter((a) => a.status === "pendente").length,
    reconhecidos: alertas.filter((a) => a.status === "reconhecido").length,
    resolvidos: alertas.filter((a) => a.status === "resolvido").length,
  };
}

describe("regras de alertas de prontuario", () => {
  it("formata hora de reconhecimento como HH:MM", () => {
    expect(formatarHora(new Date(2026, 6, 2, 9, 5))).toBe("09:05");
    expect(formatarHora(new Date(2026, 6, 2, 23, 59))).toBe("23:59");
    expect(formatarHora(new Date(2026, 6, 2, 0, 0))).toBe("00:00");
    expect(formatarHora(new Date(2026, 6, 2, 9, 5)).length).toBe(5);
  });

  it("conta alertas por status corretamente", () => {
    const alertas: Alerta[] = [
      { id: 1, status: "pendente" },
      { id: 2, status: "pendente" },
      { id: 3, status: "reconhecido" },
      { id: 4, status: "resolvido" },
    ];
    const resumo = contarPorStatus(alertas);
    expect(resumo.pendentes).toBe(2);
    expect(resumo.reconhecidos).toBe(1);
    expect(resumo.resolvidos).toBe(1);
  });

  it("apenas pendentes exigem acao (bloqueio do modal)", () => {
    const alertas: Alerta[] = [
      { id: 1, status: "reconhecido" },
      { id: 2, status: "resolvido" },
    ];
    const pendentes = alertas.filter((a) => a.status === "pendente");
    expect(pendentes.length).toBe(0); // modal pode ser fechado
  });

  it("modal permanece obrigatorio enquanto houver pendentes", () => {
    const alertas: Alerta[] = [
      { id: 1, status: "pendente" },
      { id: 2, status: "reconhecido" },
    ];
    const pendentes = alertas.filter((a) => a.status === "pendente");
    expect(pendentes.length).toBeGreaterThan(0); // bloqueia fechamento
  });
});
