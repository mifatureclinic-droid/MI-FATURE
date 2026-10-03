import { eq, and } from "drizzle-orm";
import { procedimentosPorConvenio, tabelaProcedimentos } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Obter procedimentos ativos de um convênio
 */
export async function getProcedimentosPorConvenio(convenioId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: procedimentosPorConvenio.id,
        convenioId: procedimentosPorConvenio.convenioId,
        codigoConvenio: procedimentosPorConvenio.codigoConvenio,
        descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
        valor: procedimentosPorConvenio.valor,
        valorMinimo: procedimentosPorConvenio.valorMinimo,
        valorMaximo: procedimentosPorConvenio.valorMaximo,
        codigoANS: tabelaProcedimentos.codigoANS,
        descricaoANS: tabelaProcedimentos.descricao,
        especialidade: tabelaProcedimentos.especialidade,
      })
      .from(procedimentosPorConvenio)
      .innerJoin(
        tabelaProcedimentos,
        eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id)
      )
      .where(
        and(
          eq(procedimentosPorConvenio.convenioId, convenioId),
          eq(procedimentosPorConvenio.ativo, 1)
        )
      );

    return result;
  } catch (error) {
    console.error("Erro ao buscar procedimentos por convênio:", error);
    return [];
  }
}

/**
 * Obter procedimentos por especialidade e convênio
 */
export async function getProcedimentosPorEspecialidade(
  convenioId: number,
  especialidade: string
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: procedimentosPorConvenio.id,
        convenioId: procedimentosPorConvenio.convenioId,
        codigoConvenio: procedimentosPorConvenio.codigoConvenio,
        descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
        valor: procedimentosPorConvenio.valor,
        codigoANS: tabelaProcedimentos.codigoANS,
        descricaoANS: tabelaProcedimentos.descricao,
      })
      .from(procedimentosPorConvenio)
      .innerJoin(
        tabelaProcedimentos,
        eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id)
      )
      .where(
        and(
          eq(procedimentosPorConvenio.convenioId, convenioId),
          eq(tabelaProcedimentos.especialidade, especialidade),
          eq(procedimentosPorConvenio.ativo, 1)
        )
      );

    return result;
  } catch (error) {
    console.error("Erro ao buscar procedimentos por especialidade:", error);
    return [];
  }
}
