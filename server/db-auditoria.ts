import { getDb } from "./db";
import { auditoria } from "../drizzle/schema";
import { desc } from "drizzle-orm";

export interface AuditoriaParams {
  usuarioId?: number | null;
  usuarioNome?: string | null;
  usuarioPerfil?: string | null;
  entidade: string;
  entidadeId?: number | null;
  acao: string;
  descricao?: string | null;
  dadosAnteriores?: object | null;
  dadosNovos?: object | null;
  ip?: string | null;
}

/**
 * Registra uma ação de auditoria no banco de dados.
 * Deve ser chamado após cada mutation relevante no sistema.
 */
export async function registrarAuditoria(params: AuditoriaParams): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditoria).values({
      usuarioId: params.usuarioId ?? null,
      usuarioNome: params.usuarioNome ?? null,
      usuarioPerfil: params.usuarioPerfil ?? null,
      entidade: params.entidade,
      entidadeId: params.entidadeId ?? null,
      acao: params.acao,
      descricao: params.descricao ?? null,
      dadosAnteriores: params.dadosAnteriores ? JSON.stringify(params.dadosAnteriores) : null,
      dadosNovos: params.dadosNovos ? JSON.stringify(params.dadosNovos) : null,
      ip: params.ip ?? null,
    });
  } catch (err) {
    // Auditoria nunca deve quebrar a operação principal
    console.error("[Auditoria] Erro ao registrar:", err);
  }
}

/**
 * Busca logs de auditoria com filtros opcionais.
 */
export async function getAuditoria(params: {
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 200, offset = 0 } = params;

  const rows = await db
    .select()
    .from(auditoria)
    .orderBy(desc(auditoria.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}
