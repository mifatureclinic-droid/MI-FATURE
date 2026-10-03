import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { contasPagar, contasReceber, extratoBancario, pagamentosAtendimento } from '../../drizzle/schema';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { contaReceberEntraNoRepasse } from '../../shared/contasReceberElegiveis';

export const financeiroRouter = router({
  // ===================== CONTAS A PAGAR =====================
  criarContaPagar: protectedProcedure
    .input(z.object({
      descricao: z.string().min(1),
      categoriaId: z.number().optional(),
      valor: z.number().positive(),
      dataVencimento: z.string(),
      formaPagamentoId: z.number().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      const [result] = await db.insert(contasPagar).values({
        descricao: input.descricao,
        valor: String(input.valor) as any,
        dataVencimento: input.dataVencimento as any,
        observacoes: input.observacoes,
        criadoPor: ctx.user.id,
      });
      return { id: (result as any).insertId, success: true };
    }),

  listarContasPagar: protectedProcedure
    .input(z.object({
      status: z.enum(['pendente', 'pago', 'atrasado', 'cancelado']).optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      categoriaId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [];
      if (input?.status) conditions.push(eq(contasPagar.status, input.status));
      if (input?.dataInicio) conditions.push(gte(contasPagar.dataVencimento, input.dataInicio as any));
      if (input?.dataFim) conditions.push(lte(contasPagar.dataVencimento, input.dataFim as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select().from(contasPagar).where(where).orderBy(desc(contasPagar.dataVencimento));
      return rows.map(r => ({
        ...r,
        valor: parseFloat(String(r.valor)),
        dataVencimento: String(r.dataVencimento),
        dataPagamento: r.dataPagamento ? String(r.dataPagamento) : null,
      }));
    }),

  atualizarContaPagar: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        descricao: z.string().optional(),
        valor: z.number().optional(),
        dataVencimento: z.string().optional(),
        dataPagamento: z.string().optional(),
        status: z.enum(['pendente', 'pago', 'atrasado', 'cancelado']).optional(),
        observacoes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      const updateData: Record<string, any> = {};
      if (input.data.descricao !== undefined) updateData.descricao = input.data.descricao;
      if (input.data.valor !== undefined) updateData.valor = String(input.data.valor);
      if (input.data.dataVencimento !== undefined) updateData.dataVencimento = input.data.dataVencimento;
      if (input.data.dataPagamento !== undefined) updateData.dataPagamento = input.data.dataPagamento;
      if (input.data.status !== undefined) updateData.status = input.data.status;
      if (input.data.observacoes !== undefined) updateData.observacoes = input.data.observacoes;
      await db.update(contasPagar).set(updateData).where(eq(contasPagar.id, input.id));
      return { success: true };
    }),

  deletarContaPagar: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      await db.delete(contasPagar).where(eq(contasPagar.id, input.id));
      return { success: true };
    }),

  // ===================== CONTAS A RECEBER =====================
  criarContaReceber: protectedProcedure
    .input(z.object({
      descricao: z.string().min(1),
      categoriaId: z.number().optional(),
      pacienteId: z.number().optional(),
      profissionalId: z.number().optional(),
      guiaId: z.number().optional(),
      valor: z.number().positive(),
      dataVencimento: z.string(),
      formaPagamentoId: z.number().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      const [result] = await db.insert(contasReceber).values({
        descricao: input.descricao,
        valor: String(input.valor) as any,
        dataVencimento: input.dataVencimento as any,
        observacoes: input.observacoes,
        criadoPor: ctx.user.id,
      });
      return { id: (result as any).insertId, success: true };
    }),

  listarContasReceber: protectedProcedure
    .input(z.object({
      status: z.enum(['pendente', 'recebido', 'atrasado', 'cancelado']).optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      categoriaId: z.number().optional(),
      pacienteId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions: any[] = [];
      if (input?.status) conditions.push(eq(contasReceber.status, input.status));
      if (input?.dataInicio) conditions.push(gte(contasReceber.dataVencimento, input.dataInicio as any));
      if (input?.dataFim) conditions.push(lte(contasReceber.dataVencimento, input.dataFim as any));
      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const rows = await db.select({
        conta: contasReceber,
        pagamentoId: pagamentosAtendimento.id,
      })
        .from(contasReceber)
        .leftJoin(pagamentosAtendimento, eq(pagamentosAtendimento.contaReceberCriadaId, contasReceber.id))
        .where(where)
        .orderBy(desc(contasReceber.dataVencimento));

      return rows
        .filter(({ conta, pagamentoId }) => contaReceberEntraNoRepasse(conta, pagamentoId))
        .map(({ conta: r }) => ({
          ...r,
          valor: parseFloat(String(r.valor)),
          dataVencimento: String(r.dataVencimento),
          dataRecebimento: r.dataRecebimento ? String(r.dataRecebimento) : null,
        }));
    }),

  atualizarContaReceber: protectedProcedure
    .input(z.object({
      id: z.number(),
      data: z.object({
        descricao: z.string().optional(),
        valor: z.number().optional(),
        dataVencimento: z.string().optional(),
        dataRecebimento: z.string().optional(),
        status: z.enum(['pendente', 'recebido', 'atrasado', 'cancelado']).optional(),
        observacoes: z.string().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      const updateData: Record<string, any> = {};
      if (input.data.descricao !== undefined) updateData.descricao = input.data.descricao;
      if (input.data.valor !== undefined) updateData.valor = String(input.data.valor);
      if (input.data.dataVencimento !== undefined) updateData.dataVencimento = input.data.dataVencimento;
      if (input.data.dataRecebimento !== undefined) updateData.dataRecebimento = input.data.dataRecebimento;
      if (input.data.status !== undefined) updateData.status = input.data.status;
      if (input.data.observacoes !== undefined) updateData.observacoes = input.data.observacoes;
      await db.update(contasReceber).set(updateData).where(eq(contasReceber.id, input.id));
      return { success: true };
    }),

  deletarContaReceber: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });
      await db.delete(contasReceber).where(eq(contasReceber.id, input.id));
      return { success: true };
    }),

  // ===================== CONCILIAÇÃO DO EXTRATO =====================
  conciliarExtrato: protectedProcedure
    .input(z.object({
      extratoIds: z.array(z.number()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'BD não disponível' });

      const conditions: any[] = [eq(extratoBancario.conciliado, 0)];
      if (input.extratoIds && input.extratoIds.length > 0) {
        conditions.push(inArray(extratoBancario.id, input.extratoIds));
      }
      const lancamentos = await db.select().from(extratoBancario).where(and(...conditions));

      let inseridosPagar = 0;
      let inseridosReceber = 0;

      // Helper: converter campo data para string YYYY-MM-DD
      const toDateStr = (d: any): string => {
        if (!d) return new Date().toISOString().split('T')[0];
        if (d instanceof Date) return d.toISOString().split('T')[0];
        const s = String(d);
        // Se já está no formato YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        // Tentar parsear
        const parsed = new Date(s);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
        return s.split('T')[0];
      };

      for (const lanc of lancamentos) {
        const dataStr = toDateStr(lanc.data);

        if (lanc.tipo === 'credito' && lanc.credito) {
          const valorCredito = String(parseFloat(String(lanc.credito)).toFixed(2));
          await db.insert(contasReceber).values({
            descricao: lanc.descricao,
            categoria: lanc.categoria,
            valor: valorCredito as any,
            dataVencimento: dataStr as any,
            dataRecebimento: dataStr as any,
            status: 'recebido',
            observacoes: `Extrato Bradesco. Doc: ${lanc.documento || '-'}`,
            extratoBancarioId: lanc.id,
            origemExtrato: 1,
            criadoPor: ctx.user.id,
          });
          inseridosReceber++;
        } else if (lanc.tipo === 'debito' && lanc.debito) {
          const valorDebito = String(parseFloat(String(lanc.debito)).toFixed(2));
          await db.insert(contasPagar).values({
            descricao: lanc.descricao,
            categoria: lanc.categoria,
            valor: valorDebito as any,
            dataVencimento: dataStr as any,
            dataPagamento: dataStr as any,
            status: 'pago',
            observacoes: `Extrato Bradesco. Doc: ${lanc.documento || '-'}`,
            extratoBancarioId: lanc.id,
            origemExtrato: 1,
            criadoPor: ctx.user.id,
          });
          inseridosPagar++;
        }
        await db.update(extratoBancario).set({ conciliado: 1 }).where(eq(extratoBancario.id, lanc.id));
      }

      return { inseridosReceber, inseridosPagar, total: inseridosReceber + inseridosPagar };
    }),

  // ===================== CATEGORIAS E FORMAS DE PAGAMENTO =====================
  listarCategorias: protectedProcedure
    .input(z.object({ tipo: z.enum(['pagar', 'receber']).optional() }).optional())
    .query(async () => {
      return [
        { id: 1, nome: 'Convênio', tipo: 'receber' },
        { id: 2, nome: 'Particular', tipo: 'receber' },
        { id: 3, nome: 'PIX Recebido', tipo: 'receber' },
        { id: 4, nome: 'TED Recebido', tipo: 'receber' },
        { id: 5, nome: 'Repasse Profissional', tipo: 'pagar' },
        { id: 6, nome: 'Aluguel', tipo: 'pagar' },
        { id: 7, nome: 'Fornecedor', tipo: 'pagar' },
        { id: 8, nome: 'Tributo', tipo: 'pagar' },
        { id: 9, nome: 'Folha de Pagamento', tipo: 'pagar' },
        { id: 10, nome: 'Outros', tipo: 'pagar' },
      ];
    }),

  listarFormasPagamento: protectedProcedure
    .query(async () => {
      return [
        { id: 1, nome: 'PIX' },
        { id: 2, nome: 'TED' },
        { id: 3, nome: 'Boleto' },
        { id: 4, nome: 'Cartão de Crédito' },
        { id: 5, nome: 'Dinheiro' },
      ];
    }),

  // ===================== RESUMO FINANCEIRO =====================
  resumoFinanceiro: protectedProcedure
    .input(z.object({
      dataInicio: z.string(),
      dataFim: z.string(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { totalReceber: 0, totalPagar: 0, totalRecebido: 0, totalPago: 0 };
      const condPagar: any[] = [];
      const condReceber: any[] = [];
      if (input?.dataInicio) {
        condPagar.push(gte(contasPagar.dataVencimento, input.dataInicio as any));
        condReceber.push(gte(contasReceber.dataVencimento, input.dataInicio as any));
      }
      if (input?.dataFim) {
        condPagar.push(lte(contasPagar.dataVencimento, input.dataFim as any));
        condReceber.push(lte(contasReceber.dataVencimento, input.dataFim as any));
      }
      const [pagarRes, receberRes] = await Promise.all([
        db.select({
          totalPendente: sql<string>`COALESCE(SUM(CASE WHEN status='pendente' THEN valor ELSE 0 END), 0)`,
          totalPago: sql<string>`COALESCE(SUM(CASE WHEN status='pago' THEN valor ELSE 0 END), 0)`,
        }).from(contasPagar).where(condPagar.length > 0 ? and(...condPagar) : undefined),
        db.select({
          totalPendente: sql<string>`COALESCE(SUM(CASE WHEN status='pendente' THEN valor ELSE 0 END), 0)`,
          totalRecebido: sql<string>`COALESCE(SUM(CASE WHEN status='recebido' THEN valor ELSE 0 END), 0)`,
        }).from(contasReceber).where(condReceber.length > 0 ? and(...condReceber) : undefined),
      ]);
      return {
        totalPagar: parseFloat(pagarRes[0]?.totalPendente || '0'),
        totalPago: parseFloat(pagarRes[0]?.totalPago || '0'),
        totalReceber: parseFloat(receberRes[0]?.totalPendente || '0'),
        totalRecebido: parseFloat(receberRes[0]?.totalRecebido || '0'),
      };
    }),
});
