/**
 * Router de Assinaturas Digitais SADT
 * Procedimentos públicos (acesso via token) e protegidos (gestão pela clínica)
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";
import {
  criarAssinaturaSadt,
  getAssinaturaPorToken,
  getAssinaturasPorGuia,
  getAssinaturasPorPaciente,
  registarAssinatura,
  listarTodasAssinaturas,
  migrarAssinaturasGuiasParaSadt,
  getDb,
  excluirAssinaturaSadt,
  editarDataSessaoAssinaturaSadt,
} from "../db";
import { criarNotificacaoInApp } from "../db-notificacoes";
import { getDadosPrestador } from "../db";
import { gerarEArmazenarPdfComprovante } from "../pdfAssinatura";
import { assinaturasSadt, assinaturasGuias, guias } from "../../drizzle/schema";

export const assinaturasRouter = router({

  // ─── PÚBLICO: obter dados da assinatura pelo token ────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const assinatura = await getAssinaturaPorToken(input.token);
      if (!assinatura) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de assinatura não encontrado." });
      }
      // Verificar expiração
      if (assinatura.status === "expirado" || new Date() > new Date(assinatura.tokenExpiresAt)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este link de assinatura expirou." });
      }
      if (assinatura.status === "assinado") {
        throw new TRPCError({ code: "CONFLICT", message: "Esta guia já foi assinada." });
      }
      // Buscar logo da clínica
      let clinicaLogoUrl: string | null = null;
      let clinicaNome: string | null = null;
      try {
        const prestador = await getDadosPrestador();
        if (prestador) {
          clinicaLogoUrl = (prestador as any).logoUrl || null;
          clinicaNome = (prestador as any).nomeFantasia || (prestador as any).razaoSocial || null;
        }
      } catch (e) {
        // Não bloquear se não conseguir buscar o prestador
      }
      // Retornar apenas os dados necessários para a página pública (sem dados sensíveis)
      return {
        id: assinatura.id,
        pacienteNome: assinatura.pacienteNome,
        pacienteCpf: assinatura.pacienteCpf ? assinatura.pacienteCpf.replace(/(\d{3})\.\d{3}\.\d{3}-(\d{2})/, "$1.***.***-$2") : null,
        numeroSessao: assinatura.numeroSessao,
        dataSessao: assinatura.dataSessao,
        procedimento: assinatura.procedimento,
        status: assinatura.status,
        tokenExpiresAt: assinatura.tokenExpiresAt,
        clinicaLogoUrl,
        clinicaNome,
      };
    }),

  // ─── PÚBLICO: submeter assinatura (com ou sem desenho + motivo de recusa) ─
  assinar: publicProcedure
    .input(z.object({
      token: z.string(),
      // Se assinaturaDataUrl for vazio, motivoRecusa é obrigatório
      assinaturaDataUrl: z.string().optional().default(""),
      motivoRecusa: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const assinatura = await getAssinaturaPorToken(input.token);
      if (!assinatura) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Link de assinatura não encontrado." });
      }
      if (assinatura.status !== "pendente") {
        throw new TRPCError({ code: "CONFLICT", message: "Esta guia já foi processada." });
      }
      if (new Date() > new Date(assinatura.tokenExpiresAt)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este link de assinatura expirou." });
      }

      const temAssinatura = input.assinaturaDataUrl && input.assinaturaDataUrl.length > 100;
      const temMotivo = input.motivoRecusa && input.motivoRecusa.trim().length > 0;

      // Validação: precisa de assinatura OU motivo de recusa
      if (!temAssinatura && !temMotivo) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "É obrigatório assinar ou informar o motivo da recusa." });
      }

      const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || ctx.req.socket?.remoteAddress || "unknown";
      const userAgent = ctx.req.headers["user-agent"] || "unknown";
      const dataAssinatura = new Date();

      // Calcular hash SHA-256 (da assinatura ou do motivo de recusa)
      const conteudoHash = temAssinatura ? input.assinaturaDataUrl! : `RECUSA:${input.motivoRecusa}`;
      const hash = require("crypto").createHash("sha256").update(conteudoHash).digest("hex");

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Base de dados indisponível." });

      // Actualizar registo de assinatura
      await db.update(assinaturasSadt).set({
        status: "assinado",
        assinaturaDataUrl: temAssinatura ? input.assinaturaDataUrl : null,
        assinaturaHash: hash,
        motivoRecusa: temMotivo ? input.motivoRecusa : null,
        ipAssinatura: ip,
        userAgentAssinatura: userAgent,
        dataAssinatura,
      }).where(eq(assinaturasSadt.token, input.token));

      // A guia deve guardar a imagem de assinatura para o campo 67; o hash já é
      // preservado em assinaturasSadt e no comprovante PDF. Guardar o hash no
      // campo de imagem causava a apresentação de uma imagem quebrada no modal.
      if (assinatura.guiaId) {
        try {
          await db.update(guias).set({
            assinadoPaciente: 1,
            dataAssinaturaPaciente: dataAssinatura,
            assinaturaPacienteUrl: temAssinatura ? input.assinaturaDataUrl : null,
          }).where(eq(guias.id, assinatura.guiaId));

          // O modal administrativo lê o histórico por sessão em assinaturasGuias.
          // Registar a mesma prova aqui impede que uma assinatura pública fique
          // apenas na tabela legada e desapareça do campo 67.
          if (temAssinatura) {
            const dataSessao = assinatura.dataSessao instanceof Date
              ? assinatura.dataSessao.toISOString().slice(0, 10)
              : String(assinatura.dataSessao).slice(0, 10);
            await db.insert(assinaturasGuias).values({
              guiaId: assinatura.guiaId,
              pacienteId: assinatura.pacienteId,
              assinaturaPacienteUrl: input.assinaturaDataUrl,
              hashAssinatura: hash,
              sessaoNumero: assinatura.numeroSessao,
              dataAssinatura,
              datasAtendimento: dataSessao ? JSON.stringify([dataSessao]) : null,
            });
          }
        } catch (e) {
          console.warn("[Assinatura] Não foi possível actualizar a guia:", e);
        }
      }

      // Gerar PDF comprovante e guardar URL
      let pdfUrl: string | null = null;
      try {
        pdfUrl = await gerarEArmazenarPdfComprovante({
          pacienteNome: assinatura.pacienteNome,
          pacienteCpf: assinatura.pacienteCpf,
          numeroSessao: assinatura.numeroSessao,
          dataSessao: assinatura.dataSessao,
          procedimento: assinatura.procedimento,
          hash,
          assinaturaDataUrl: temAssinatura ? input.assinaturaDataUrl : null,
          motivoRecusa: temMotivo ? input.motivoRecusa : null,
          dataAssinatura,
          ipAssinatura: ip,
        }, assinatura.id);

        // Guardar URL do PDF no registo
        await db.update(assinaturasSadt).set({ pdfUrl }).where(eq(assinaturasSadt.token, input.token));
      } catch (e) {
        console.warn("[Assinatura] Não foi possível gerar o PDF:", e);
      }

      // Notificação in-app para a clínica
      const tipoEvento = temAssinatura ? "assinatura" : "recusa";
      await criarNotificacaoInApp({
        tipo: "assinatura",
        titulo: temAssinatura
          ? `Guia assinada — ${assinatura.pacienteNome}`
          : `Recusa de assinatura — ${assinatura.pacienteNome}`,
        conteudo: temAssinatura
          ? `${assinatura.pacienteNome} assinou a guia SADT da ${assinatura.numeroSessao}ª sessão. Hash: ${hash.substring(0, 16)}...`
          : `${assinatura.pacienteNome} recusou assinar. Motivo: ${input.motivoRecusa}`,
        guiaId: assinatura.guiaId ?? undefined,
        pacienteNome: assinatura.pacienteNome,
      });

      return { success: true, hash, pdfUrl, tipo: tipoEvento };
    }),

  // ─── PROTEGIDO: criar pedido de assinatura ────────────────────────────────
  criar: protectedProcedure
    .input(z.object({
      guiaId: z.number(),
      pacienteId: z.number(),
      profissionalId: z.number(),
      atendimentoId: z.number().optional(),
      numeroSessao: z.number().min(1),
      dataSessao: z.string(), // YYYY-MM-DD
      procedimento: z.string(),
      pacienteNome: z.string(),
      pacienteCpf: z.string().optional(),
      pacienteWhatsapp: z.string().optional(),
      expiracaoHoras: z.number().min(1).max(168).default(24),
    }))
    .mutation(async ({ input }) => {
      const token = crypto.randomBytes(48).toString("hex");
      const tokenExpiresAt = new Date(Date.now() + input.expiracaoHoras * 60 * 60 * 1000);

      await criarAssinaturaSadt({
        guiaId: input.guiaId,
        pacienteId: input.pacienteId,
        profissionalId: input.profissionalId,
        atendimentoId: input.atendimentoId,
        numeroSessao: input.numeroSessao,
        dataSessao: input.dataSessao as unknown as Date,
        procedimento: input.procedimento,
        pacienteNome: input.pacienteNome,
        pacienteCpf: input.pacienteCpf,
        pacienteWhatsapp: input.pacienteWhatsapp,
        token,
        tokenExpiresAt,
        status: "pendente",
        whatsappEnviado: 0,
      });

      return { token, tokenExpiresAt };
    }),

  // ─── PROTEGIDO: listar assinaturas de uma guia ───────────────────────────
  listarPorGuia: protectedProcedure
    .input(z.object({ guiaId: z.number() }))
    .query(async ({ input }) => {
      return getAssinaturasPorGuia(input.guiaId);
    }),

  // ─── PROTEGIDO: excluir assinatura SADT de uma guia ─────────────────────
  excluirAssinatura: protectedProcedure
    .input(z.object({ assinaturaId: z.number().positive(), guiaId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const perfil = (ctx.user as any)?.perfil;
      const role = (ctx.user as any)?.role;
      const perfilNormalizado = (perfil ?? '').trim().toLocaleLowerCase('pt-BR');
      const permitido = role === 'admin' || ['administrador', 'master', 'recepção', 'recepcao', 'recepcionista'].includes(perfilNormalizado);
      if (!permitido) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para excluir assinaturas' });
      }

      try {
        console.info('[Assinaturas] exclusão SADT solicitada', {
          assinaturaId: input.assinaturaId,
          guiaId: input.guiaId,
          usuarioId: ctx.user.id,
        });
        const resultado = await excluirAssinaturaSadt(input.assinaturaId, input.guiaId);
        console.info('[Assinaturas] exclusão SADT concluída', {
          assinaturaId: input.assinaturaId,
          guiaId: input.guiaId,
          totalSessoes: resultado.totalSessoes,
        });
        return resultado;
      } catch (erro) {
        const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida ao excluir assinatura SADT';
        console.error('[Assinaturas] exclusão SADT recusada', {
          assinaturaId: input.assinaturaId,
          guiaId: input.guiaId,
          usuarioId: ctx.user.id,
          mensagem,
        });
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Não foi possível excluir esta assinatura: ${mensagem}` });
      }
    }),

  // ─── PROTEGIDO: listar assinaturas de um paciente ────────────────────────
  listarPorPaciente: protectedProcedure
    .input(z.object({ pacienteId: z.number() }))
    .query(async ({ input }) => {
      return getAssinaturasPorPaciente(input.pacienteId);
    }),

  // ─── PROTEGIDO: corrigir somente a data clínica da sessão assinada ────────
  editarDataSessao: protectedProcedure
    .input(z.object({
      assinaturaId: z.number().positive(),
      novaDataSessao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data da sessão inválida'),
    }))
    .mutation(async ({ input, ctx }) => {
      const perfil = (ctx.user as any)?.perfil;
      const role = (ctx.user as any)?.role;
      const perfilNormalizado = (perfil ?? '').trim().toLocaleLowerCase('pt-BR');
      const permitido = role === 'admin' || ['administrador', 'master', 'recepção', 'recepcao', 'recepcionista'].includes(perfilNormalizado);
      if (!permitido) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para editar datas de sessão' });
      }

      return editarDataSessaoAssinaturaSadt(input.assinaturaId, input.novaDataSessao);
    }),

  // ─── PROTEGIDO: listar todas as assinaturas (painel admin) ───────────────
  listarTodas: protectedProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(200).default(50),
      dataInicio: z.date().optional(),
      dataFim: z.date().optional(),
    }))
    .query(async ({ input }) => {
      return listarTodasAssinaturas(input.limit, input.dataInicio, input.dataFim);
    }),

  // ─── PROTEGIDO: migrar assinaturas de assinaturasGuias para assinaturasSadt ─
  migrar: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Admin, master e recepção podem executar migração
      const perfil = (ctx.user as any)?.perfil;
      const perfisPermitidos = ['administrador', 'master', 'recepcao'];
      if (!perfisPermitidos.includes(perfil)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administrador, master ou recepção podem executar migração' });
      }
      return migrarAssinaturasGuiasParaSadt();
    }),
});
