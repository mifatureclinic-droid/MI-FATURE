import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { extratoBancario } from '../../drizzle/schema';
import { eq, desc, and, gte, lte, like, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { TRPCError } from '@trpc/server';

function detectarCategoria(descricao: string): string {
  const d = descricao.toUpperCase();
  if (d.includes('SALDO INVEST')) return 'Saldo Investimento';
  if (d.includes('PGTO.SINISTRO') || d.includes('SINISTRO')) return 'Conv\u00eanio';
  if (d.includes('PIX RECEBIDO')) return 'PIX Recebido';
  if (d.includes('PIX ENVIADO') || d.includes('PIX ENVIO')) return 'PIX Enviado';
  if (d.includes('TED-TRANSF') || d.includes('TED ')) return 'TED';
  if (d.includes('TRIBUTO') || d.includes('SIMPLES') || d.includes('IMPOSTO')) return 'Tributo';
  if (d.includes('RENTAB') || d.includes('INVEST')) return 'Rendimento';
  if (d.includes('PAGTO ELETRON') || d.includes('PAGUE FACIL')) return 'Pagamento';
  if (d.includes('RECEB POR FORNECIMENTO')) return 'Recebimento';
  if (d.includes('STONE') || d.includes('MAQUINETA')) return 'Maquineta';
  if (d.includes('SALARIO') || d.includes('FOLHA')) return 'Folha de Pagamento';
  if (d.includes('ENERGIA') || d.includes('AGUA') || d.includes('TELEFONE') || d.includes('INTERNET')) return 'Utilidades';
  return 'Outros';
}

interface LancamentoParsed {
  data: string;
  descricao: string;
  documento: string;
  credito: string | null;
  debito: string | null;
  tipo: 'credito' | 'debito' | 'saldo';
  categoria: string;
}

function parseBradescoXLS(buffer: Buffer): { agencia: string; conta: string; lancamentos: LancamentoParsed[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];

  let agencia = '';
  let conta = '';
  const lancamentos: LancamentoParsed[] = [];

  for (const row of rows) {
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();

    if (col0.includes('Ag\u00eancia:')) {
      const match = col0.match(/Ag\u00eancia:\s*(\d+)\s+Conta:\s*([\d\-]+)/);
      if (match) { agencia = match[1]; conta = match[2]; }
      continue;
    }

    const dataMatch = col0.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dataMatch) continue;

    const dataISO = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
    const descricao = col1;
    const documento = col2;

    let tipo: 'credito' | 'debito' | 'saldo' = 'saldo';
    let credito: string | null = null;
    let debito: string | null = null;

    if (descricao.toUpperCase().includes('SALDO INVEST')) {
      tipo = 'saldo';
      credito = col2.replace(/\./g, '').replace(',', '.') || null;
    } else if (col3 && col3 !== '') {
      tipo = 'credito';
      credito = col3.replace(/\./g, '').replace(',', '.') || null;
    } else if (col4 && col4 !== '') {
      tipo = 'debito';
      debito = col4.replace(/\./g, '').replace(',', '.').replace('-', '') || null;
    } else {
      continue;
    }

    lancamentos.push({
      data: dataISO,
      descricao,
      documento: tipo === 'saldo' ? '' : documento,
      credito,
      debito,
      tipo,
      categoria: detectarCategoria(descricao),
    });
  }

  return { agencia, conta, lancamentos };
}

export const extratoRouter = router({
  importar: protectedProcedure
    .input(z.object({
      arquivoBase64: z.string(),
      nomeArquivo: z.string(),
      banco: z.string().default('Bradesco'),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
      const buffer = Buffer.from(input.arquivoBase64, 'base64');

      let parsed: ReturnType<typeof parseBradescoXLS>;
      try {
        parsed = parseBradescoXLS(buffer);
      } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Erro ao processar arquivo XLS. Verifique se \u00e9 um extrato Bradesco v\u00e1lido.' });
      }

      if (parsed.lancamentos.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nenhum lan\u00e7amento encontrado no arquivo.' });
      }

      let inseridos = 0;
      let duplicados = 0;

      for (const lanc of parsed.lancamentos) {
        const existe = await db.select({ id: extratoBancario.id })
          .from(extratoBancario)
          .where(and(
            eq(extratoBancario.data, lanc.data as any),
            eq(extratoBancario.descricao, lanc.descricao),
            eq(extratoBancario.documento, lanc.documento || ''),
          ))
          .limit(1);

        if (existe.length > 0) { duplicados++; continue; }

        await db.insert(extratoBancario).values({
          banco: input.banco,
          agencia: parsed.agencia || null,
          conta: parsed.conta || null,
          data: lanc.data as any,
          descricao: lanc.descricao,
          documento: lanc.documento || null,
          credito: lanc.credito as any,
          debito: lanc.debito as any,
          tipo: lanc.tipo,
          categoria: lanc.categoria,
          arquivoOrigem: input.nomeArquivo,
          importadoPor: ctx.user.id,
        });
        inseridos++;
      }

      return { inseridos, duplicados, total: parsed.lancamentos.length };
    }),

  listar: protectedProcedure
    .input(z.object({
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      tipo: z.enum(['credito', 'debito', 'saldo', 'todos']).default('todos'),
      categoria: z.string().optional(),
      busca: z.string().optional(),
      pagina: z.number().default(1),
      porPagina: z.number().default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
      const conditions = [];

      if (input.dataInicio) conditions.push(gte(extratoBancario.data, input.dataInicio as any));
      if (input.dataFim) conditions.push(lte(extratoBancario.data, input.dataFim as any));
      if (input.tipo && input.tipo !== 'todos') conditions.push(eq(extratoBancario.tipo, input.tipo));
      if (input.categoria) conditions.push(eq(extratoBancario.categoria, input.categoria));
      if (input.busca) conditions.push(like(extratoBancario.descricao, `%${input.busca}%`));

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [lancamentos, totalResult, totaisResult] = await Promise.all([
        db.select()
          .from(extratoBancario)
          .where(where)
          .orderBy(desc(extratoBancario.data), desc(extratoBancario.id))
          .limit(input.porPagina)
          .offset((input.pagina - 1) * input.porPagina),
        db.select({ count: sql<number>`count(*)` })
          .from(extratoBancario)
          .where(where),
        db.select({
          totalCredito: sql<string>`COALESCE(SUM(CASE WHEN tipo = 'credito' THEN credito ELSE 0 END), 0)`,
          totalDebito: sql<string>`COALESCE(SUM(CASE WHEN tipo = 'debito' THEN debito ELSE 0 END), 0)`,
        }).from(extratoBancario).where(where),
      ]);

      return {
        lancamentos,
        total: Number(totalResult[0]?.count || 0),
        totalCredito: parseFloat(totaisResult[0]?.totalCredito || '0'),
        totalDebito: parseFloat(totaisResult[0]?.totalDebito || '0'),
      };
    }),

  categorias: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
    const result = await db.selectDistinct({ categoria: extratoBancario.categoria })
      .from(extratoBancario)
      .orderBy(extratoBancario.categoria);
    return result.map((r: { categoria: string | null }) => r.categoria).filter(Boolean);
  }),

  excluir: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
      await db.delete(extratoBancario).where(eq(extratoBancario.id, input.id));
      return { ok: true };
    }),

  excluirPorArquivo: protectedProcedure
    .input(z.object({ arquivoOrigem: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
      await db.delete(extratoBancario).where(eq(extratoBancario.arquivoOrigem, input.arquivoOrigem));
      return { ok: true };
    }),

  resumo: protectedProcedure
    .input(z.object({
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD n\u00e3o dispon\u00edvel' });
      const conditions = [];
      if (input.dataInicio) conditions.push(gte(extratoBancario.data, input.dataInicio as any));
      if (input.dataFim) conditions.push(lte(extratoBancario.data, input.dataFim as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const result = await db.select({
        totalCredito: sql<string>`COALESCE(SUM(CASE WHEN tipo = 'credito' THEN credito ELSE 0 END), 0)`,
        totalDebito: sql<string>`COALESCE(SUM(CASE WHEN tipo = 'debito' THEN debito ELSE 0 END), 0)`,
        qtdCredito: sql<number>`SUM(CASE WHEN tipo = 'credito' THEN 1 ELSE 0 END)`,
        qtdDebito: sql<number>`SUM(CASE WHEN tipo = 'debito' THEN 1 ELSE 0 END)`,
        qtdTotal: sql<number>`count(*)`,
      }).from(extratoBancario).where(where);

      const r = result[0] as any;
      const credito = parseFloat(r?.totalCredito || '0');
      const debito = parseFloat(r?.totalDebito || '0');
      return {
        totalCredito: credito,
        totalDebito: debito,
        saldo: credito - debito,
        qtdCredito: Number(r?.qtdCredito || 0),
        qtdDebito: Number(r?.qtdDebito || 0),
        qtdTotal: Number(r?.qtdTotal || 0),
      };
    }),
});
