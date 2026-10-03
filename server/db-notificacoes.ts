import { getDb } from "./db";
import { notificacoesInApp } from "../drizzle/schema";
import { desc, eq, and, isNull, or } from "drizzle-orm";

export type TipoNotificacao = "confirmacao" | "cancelamento" | "assinatura" | "sistema";

export interface CriarNotificacaoInput {
  tipo: TipoNotificacao;
  titulo: string;
  conteudo?: string;
  atendimentoId?: number;
  guiaId?: number;
  pacienteNome?: string;
  profissionalNome?: string;
  convenioNome?: string;
}

/** Cria uma notificação in-app na BD */
export async function criarNotificacaoInApp(input: CriarNotificacaoInput): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notificacoesInApp).values({
    tipo: input.tipo,
    titulo: input.titulo,
    conteudo: input.conteudo ?? null,
    lida: 0,
    atendimentoId: input.atendimentoId ?? null,
    guiaId: input.guiaId ?? null,
    pacienteNome: input.pacienteNome ?? null,
    profissionalNome: input.profissionalNome ?? null,
    convenioNome: input.convenioNome ?? null,
  });
}

/** Lista notificações com filtro opcional por tipo e lida */
export async function listarNotificacoes(opts?: {
  tipo?: TipoNotificacao;
  apenasNaoLidas?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (opts?.tipo) conditions.push(eq(notificacoesInApp.tipo, opts.tipo));
  if (opts?.apenasNaoLidas) conditions.push(eq(notificacoesInApp.lida, 0));

  const rows = await db
    .select()
    .from(notificacoesInApp)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notificacoesInApp.createdAt))
    .limit(opts?.limit ?? 200);

  return rows;
}

/** Conta notificações não lidas (para badge no sino) */
export async function contarNaoLidas(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ id: notificacoesInApp.id })
    .from(notificacoesInApp)
    .where(eq(notificacoesInApp.lida, 0));
  return rows.length;
}

/** Marca uma notificação como lida */
export async function marcarComoLida(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoesInApp).set({ lida: 1 }).where(eq(notificacoesInApp.id, id));
}

/** Marca todas as notificações como lidas */
export async function marcarTodasComoLidas(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notificacoesInApp).set({ lida: 1 }).where(eq(notificacoesInApp.lida, 0));
}
