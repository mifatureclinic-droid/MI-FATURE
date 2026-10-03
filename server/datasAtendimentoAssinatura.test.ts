import { describe, expect, it } from "vitest";
import { atualizarPrimeiraDataAtendimentoDaAssinatura, formatarDatasAtendimentoDaAssinatura, obterPrimeiraDataAtendimentoDaAssinatura } from "../shared/datasAtendimentoAssinatura";

describe("formatarDatasAtendimentoDaAssinatura", () => {
  it("mostra a data clínica declarada no link, sem usar a data de assinatura", () => {
    expect(formatarDatasAtendimentoDaAssinatura('["2026-08-12"]')).toBe("12/08/2026");
  });

  it("não inventa uma data de atendimento quando o registro não a declara", () => {
    expect(formatarDatasAtendimentoDaAssinatura(null)).toBeNull();
    expect(formatarDatasAtendimentoDaAssinatura("[\"data-invalida\"]")).toBeNull();
  });

  it("altera a data clínica da primeira sessão sem modificar outras datas declaradas", () => {
    const atualizado = atualizarPrimeiraDataAtendimentoDaAssinatura('["2026-08-08", "2026-08-15"]', '2026-08-01');
    expect(atualizado).toBe('["2026-08-01","2026-08-15"]');
    expect(obterPrimeiraDataAtendimentoDaAssinatura(atualizado)).toBe('2026-08-01');
  });
});
