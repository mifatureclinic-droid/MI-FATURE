import { describe, expect, it } from "vitest";
import { chaveDataAgenda, horarioAgendaValido, normalizarDataAgenda } from "../shared/dataAgenda";

describe("dados da Agenda", () => {
  it("interpreta datas SQL sem recuar o dia no fuso de Manaus", () => {
    const data = normalizarDataAgenda("2026-08-07");
    expect(data).not.toBeNull();
    expect(data?.getDate()).toBe(7);
    expect(data?.getDay()).toBe(5);
  });

  it("preserva a chave de data vinda de Date UTC", () => {
    expect(chaveDataAgenda(new Date("2026-08-07T00:00:00.000Z"))).toBe("2026-08-07");
  });

  it("ignora datas e horários incompletos sem lançar erro no render", () => {
    expect(normalizarDataAgenda("0000-00-00")).toBeNull();
    expect(chaveDataAgenda(undefined)).toBeNull();
    expect(horarioAgendaValido(undefined)).toBe(false);
    expect(horarioAgendaValido("24:30")).toBe(false);
    expect(horarioAgendaValido("14:40")).toBe(true);
  });
});
