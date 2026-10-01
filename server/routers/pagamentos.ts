import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createPagamentoAtendimento, getPagamentosAtendimento, deletePagamentoAtendimento } from "../db";
import { storagePut, storageGetSignedUrl } from "../storage";
import { registrarAuditoria } from "../db-auditoria";
import { ehConvenioOab, podeRegistrarRecebimentoOabNoBalcao } from "../../shared/pagamentoBalcao";
import { exigeComprovanteDePagamento } from "../../shared/repasseParticular";
import { validarFormasPagamentoDividido } from "../../shared/formasPagamento";

export const pagamentosRouter = router({
  // Criar pagamento com comprovante (base64 opcional) e sessões vinculadas
  criar: protectedProcedure
    .input(z.object({
      atendimentoId: z.number(),
      pacienteId: z.number(),
      profissionalId: z.number(),
      valor: z.number().positive(),
      dataPagamento: z.date(),
      referenciaDatas: z.string().min(1, "Referência de datas é obrigatória"),
      metodoPagamento: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro']),
      formasPagamento: z.array(z.object({
        metodoPagamento: z.enum(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'transferencia', 'outro']),
        valor: z.number().positive(),
      })).length(2).optional(),
      observacoes: z.string().optional(),
      // Comprovante em base64 (opcional para compatibilidade)
      comprovanteBase64: z.string().optional(),
      comprovanteNome: z.string().default("comprovante.jpg"),
      comprovanteMime: z.string().default("image/jpeg"),
      // IDs dos atendimentos vinculados a este pagamento
      atendimentosVinculados: z.array(z.number()).default([]),
      // Nome do convênio para categorizar em Contas a Receber
      convenioNome: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const validacaoFormas = validarFormasPagamentoDividido(input.valor, input.formasPagamento);
        if (!validacaoFormas.valido) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: validacaoFormas.mensagem });
        }
        const metodoPagamentoPrincipal = validacaoFormas.formas[0]?.metodoPagamento ?? input.metodoPagamento;
        const idsParaValidar = Array.from(new Set([input.atendimentoId, ...input.atendimentosVinculados]));
        const dbConn = await (await import("../db")).getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível.' });

        const { atendimentos, convenios } = await import("../../drizzle/schema");
        const { eq, inArray } = await import("drizzle-orm");
        const atendimentosPagamento = await dbConn
          .select({
            id: atendimentos.id,
            pacienteId: atendimentos.pacienteId,
            profissionalId: atendimentos.profissionalId,
            convenioId: atendimentos.convenioId,
            pagamentoId: (atendimentos as any).pagamentoParticularId,
          })
          .from(atendimentos)
          .where(inArray(atendimentos.id, idsParaValidar));

        if (atendimentosPagamento.length !== idsParaValidar.length || atendimentosPagamento.some(a => a.pacienteId !== input.pacienteId || a.profissionalId !== input.profissionalId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'As sessões selecionadas não pertencem ao mesmo paciente e profissional.' });
        }
        if (atendimentosPagamento.some(a => a.convenioId !== atendimentosPagamento[0].convenioId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não é permitido vincular sessões de convênios diferentes no mesmo pagamento.' });
        }

        const [convenio] = await dbConn.select({ nome: convenios.nome })
          .from(convenios)
          .where(eq(convenios.id, atendimentosPagamento[0].convenioId))
          .limit(1);
        const pagamentoOab = ehConvenioOab(convenio?.nome);
        if (exigeComprovanteDePagamento(convenio?.nome) && !input.comprovanteBase64) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Anexe o comprovante de pagamento para registrar atendimento do convênio Mente Aberta.' });
        }

        if (pagamentoOab) {
          const perfil = String((ctx.user as any)?.perfil || (ctx.user as any)?.role || '');
          if (!podeRegistrarRecebimentoOabNoBalcao(perfil)) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Somente master, administração ou recepção pode registrar o recebimento OAB no balcão.' });
          }
          if (atendimentosPagamento.some(a => a.pagamentoId != null)) {
            throw new TRPCError({ code: 'CONFLICT', message: 'Já existe pagamento registrado para uma das sessões OAB selecionadas.' });
          }
        }

        let comprovanteUrl: string | undefined;
        let comprovanteKey: string | undefined;

        // Upload do comprovante para S3 se fornecido
        if (input.comprovanteBase64) {
          const buffer = Buffer.from(input.comprovanteBase64, 'base64');
          // Sanitize filename: replace spaces and special chars with hyphens
          const safeName = (input.comprovanteNome || 'comprovante')
            .replace(/\s+/g, '-')
            .replace(/[^a-zA-Z0-9._-]/g, '-')
            .replace(/-+/g, '-');
          const key = `pagamentos/${input.pacienteId}/${Date.now()}-${safeName}`;
          const result = await storagePut(key, buffer, input.comprovanteMime);
          comprovanteUrl = result.url;
          comprovanteKey = result.key;
        }

        // Criar pagamento
        const pagamentoId = await createPagamentoAtendimento({
          atendimentoId: input.atendimentoId,
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          valor: input.valor,
          dataPagamento: input.dataPagamento,
          referenciaDatas: input.referenciaDatas,
          metodoPagamento: metodoPagamentoPrincipal,
          formasPagamento: validacaoFormas.formas.length > 0 ? validacaoFormas.formas : undefined,
          observacoes: input.observacoes,
          comprovanteUrl,
          comprovanteKey,
          atendimentosVinculados: input.atendimentosVinculados,
          convenioNome: convenio?.nome || input.convenioNome,
          criadoPor: ctx.user?.id,
        });

        if (pagamentoOab) {
          await registrarAuditoria({
            usuarioId: ctx.user?.id,
            usuarioNome: (ctx.user as any)?.name || null,
            usuarioPerfil: (ctx.user as any)?.perfil || (ctx.user as any)?.role || null,
            entidade: 'pagamento_atendimento',
            entidadeId: pagamentoId,
            acao: 'recebimento_oab_balcao',
            descricao: `Recebimento OAB registrado no balcão para ${idsParaValidar.length} atendimento(s).`,
            dadosNovos: { atendimentoIds: idsParaValidar, valor: input.valor, dataPagamento: input.dataPagamento, metodoPagamento: metodoPagamentoPrincipal, formasPagamento: validacaoFormas.formas },
          });
        }

        // Marcar atendimentos vinculados como pagos
        const todosVinculados = [input.atendimentoId, ...input.atendimentosVinculados.filter(id => id !== input.atendimentoId)];
        if (todosVinculados.length > 0) {
          const drizzleDb = await (await import("../db")).getDb();
          if (drizzleDb) {
            const { atendimentos } = await import("../../drizzle/schema");
            const { inArray } = await import("drizzle-orm");
            await drizzleDb.update(atendimentos)
              .set({ pagamentoParticularId: pagamentoId } as any)
              .where(inArray(atendimentos.id, todosVinculados));
          }
        }

        return { success: true, pagamentoId, comprovanteUrl };
      } catch (error: any) {
        console.error("Erro ao criar pagamento:", error);
        throw error;
      }
    }),

  // Listar pagamentos
  listar: protectedProcedure
    .input(z.object({
      atendimentoId: z.number().optional(),
      pacienteId: z.number().optional(),
      profissionalId: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      try {
        return await getPagamentosAtendimento(input);
      } catch (error) {
        console.error("Erro ao listar pagamentos:", error);
        return [];
      }
    }),

  // Buscar sessões do mês para vincular ao pagamento
  buscarSessoesMes: protectedProcedure
    .input(z.object({
      pacienteId: z.number(),
      profissionalId: z.number(),
      mes: z.number().min(1).max(12),
      ano: z.number().min(2020).max(2100),
    }))
    .query(async ({ input }) => {
      try {
        const drizzleDb = await (await import("../db")).getDb();
        if (!drizzleDb) return [];
        const { atendimentos, pacientes, profissionais } = await import("../../drizzle/schema");
        const { and, eq, gte, lte, isNull } = await import("drizzle-orm");

        const inicioMes = new Date(input.ano, input.mes - 1, 1);
        const fimMes = new Date(input.ano, input.mes, 0, 23, 59, 59);

        const sessoes = await drizzleDb
          .select({
            id: atendimentos.id,
            data: atendimentos.data,
            status: atendimentos.status,
            tipo: atendimentos.tipo,
            pagamentoParticularId: (atendimentos as any).pagamentoParticularId,
          })
          .from(atendimentos)
          .where(
            and(
              eq(atendimentos.pacienteId, input.pacienteId),
              eq(atendimentos.profissionalId, input.profissionalId),
              gte(atendimentos.data, inicioMes),
              lte(atendimentos.data, fimMes)
            )
          )
          .orderBy(atendimentos.data);

        return sessoes;
      } catch (error) {
        console.error("Erro ao buscar sessões do mês:", error);
        return [];
      }
    }),

  // Deletar pagamento
  deletar: protectedProcedure
    .input(z.object({
      pagamentoId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Desmarcar atendimentos vinculados
        const drizzleDb = await (await import("../db")).getDb();
        if (drizzleDb) {
          const { atendimentos } = await import("../../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await drizzleDb.update(atendimentos)
            .set({ pagamentoParticularId: null } as any)
            .where(eq((atendimentos as any).pagamentoParticularId, input.pagamentoId));
        }
        await deletePagamentoAtendimento(input.pagamentoId);
        return { success: true };
      } catch (error) {
        console.error("Erro ao deletar pagamento:", error);
        throw error;
      }
    }),

  // Gerar URL assinada para visualizar o comprovante
  getComprovanteUrl: protectedProcedure
    .input(z.object({
      comprovanteKey: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const url = await storageGetSignedUrl(input.comprovanteKey);
        return { url };
      } catch (error: any) {
        console.error("Erro ao gerar URL do comprovante:", error);
        throw new Error(`Não foi possível gerar o link do comprovante: ${error.message}`);
      }
    }),
});
