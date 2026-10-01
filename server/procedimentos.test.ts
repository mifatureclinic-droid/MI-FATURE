import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { getProcedimentosPorConvenio, getProcedimentosPorEspecialidade } from "./db-procedimentos";
import { convenios, tabelaProcedimentos, procedimentosPorConvenio } from "../drizzle/schema";

describe("Procedimentos por Convênio", () => {
  let convenioId: number;
  let tabelaProcedimentoId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Criar convênio de teste
    const convenioResult = await db.insert(convenios).values({
      nome: "Convênio Teste",
      cnpj: "00.000.000/0000-99",
      codigoOperadora: "TEST123",
    });
    convenioId = convenioResult[0].insertId;

    // Criar procedimento na tabela ANS
    const procedimentoResult = await db.insert(tabelaProcedimentos).values({
      codigoANS: "123456",
      descricao: "Procedimento Teste",
      especialidade: "Cardiologia",
      grupoANS: "Grupo Teste",
    });
    tabelaProcedimentoId = procedimentoResult[0].insertId;

    // Associar procedimento ao convênio
    await db.insert(procedimentosPorConvenio).values({
      convenioId,
      tabelaProcedimentoId,
      codigoConvenio: "PROC001",
      descricaoConvenio: "Procedimento Teste Convênio",
      valor: "150.00",
      ativo: 1,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Limpar dados de teste
    const { eq } = await import("drizzle-orm");
    await db.delete(procedimentosPorConvenio).where(eq(procedimentosPorConvenio.convenioId, convenioId));
    await db.delete(convenios).where(eq(convenios.id, convenioId));
    await db.delete(tabelaProcedimentos).where(eq(tabelaProcedimentos.id, tabelaProcedimentoId));
  });

  it("deve retornar procedimentos ativos de um convênio", async () => {
    const procedimentos = await getProcedimentosPorConvenio(convenioId);
    expect(procedimentos.length).toBeGreaterThan(0);
    expect(procedimentos[0].convenioId).toBe(convenioId);
    expect(procedimentos[0].codigoConvenio).toBe("PROC001");
  });

  it("deve retornar procedimentos por especialidade", async () => {
    const procedimentos = await getProcedimentosPorEspecialidade(convenioId, "Cardiologia");
    expect(procedimentos.length).toBeGreaterThan(0);
    expect(procedimentos[0].descricaoANS).toBe("Procedimento Teste");
  });

  it("deve retornar vazio para especialidade inexistente", async () => {
    const procedimentos = await getProcedimentosPorEspecialidade(convenioId, "Especialidade Inexistente");
    expect(procedimentos.length).toBe(0);
  });
});
