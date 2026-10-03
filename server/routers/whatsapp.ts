import { router, protectedProcedure, adminPerfilProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createInstance,
  getInstanceStatus,
  getQRCode,
  disconnectInstance,
  fetchInstances,
  sendTextMessage,
  sendDocumentMessage,
  buildAgendamentoMsg,
  buildAssinaturaMsg,
  buildConfirmacaoMsg,
  formatPhone,
} from "../whatsapp";
import * as db from "../db";

export const whatsappRouter = router({
  // ─── Estado da instância ─────────────────────────────────────────────────
  getStatus: protectedProcedure.query(async () => {
    try {
      const instances = await fetchInstances();
      const instance = instances.find(
        (i: any) => i.instance?.instanceName === "mifatureclinic"
      );
      if (!instance) {
        return { connected: false, status: "not_created", qrcode: null };
      }
      const status = await getInstanceStatus();
      const state = status?.instance?.state || "close";
      return {
        connected: state === "open",
        status: state,
        qrcode: status?.qrcode || null,
      };
    } catch (e: any) {
      return { connected: false, status: "error", qrcode: null, error: e.message };
    }
  }),

  // ─── Criar instância ─────────────────────────────────────────────────────
  createInstance: adminPerfilProcedure.mutation(async () => {
    try {
      const result = await createInstance();
      return { success: true, data: result };
    } catch (e: any) {
      // Se a instância já existe (403), considerar sucesso e ir ao QR Code
      if (e.message && e.message.includes('already in use')) {
        return { success: true, data: { alreadyExists: true } };
      }
      return { success: false, error: e.message };
    }
  }),

  // ─── Obter QR Code ───────────────────────────────────────────────────────
  getQRCode: protectedProcedure.query(async () => {
    try {
      const result = await getQRCode();
      // A Evolution API v2 retorna { base64, code, pairingCode, count } directamente
      const base64 = result?.base64 || result?.qrcode?.base64 || null;
      const code = result?.code || result?.qrcode?.code || null;
      return { success: true, qrcode: base64 ? { base64, code } : null };
    } catch (e: any) {
      return { success: false, error: e.message, qrcode: null };
    }
  }),

  // ─── Desconectar ─────────────────────────────────────────────────────────
  disconnect: adminPerfilProcedure.mutation(async () => {
    try {
      await disconnectInstance();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }),

  // ─── Enviar mensagem de texto ─────────────────────────────────────────────
  sendText: protectedProcedure
    .input(z.object({ phone: z.string(), text: z.string() }))
    .mutation(async ({ input }) => {
      const ok = await sendTextMessage(input.phone, input.text);
      return { success: ok };
    }),

  // ─── Enviar confirmação de agendamento ────────────────────────────────────
  sendAgendamentoConfirmacao: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        pacienteNome: z.string(),
        data: z.string(),
        hora: z.string(),
        profissionalNome: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const text = buildAgendamentoMsg(input);
      const ok = await sendTextMessage(input.phone, text);
      return { success: ok };
    }),

  // ─── Enviar link de assinatura ────────────────────────────────────────────
  sendAssinaturaLink: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        pacienteNome: z.string(),
        sessao: z.string(),
        data: z.string(),
        linkAssinatura: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const text = buildAssinaturaMsg(input);
      const ok = await sendTextMessage(input.phone, text);
      return { success: ok };
    }),

  // ─── Enviar lembrete de confirmação de presença ───────────────────────────
  sendConfirmacaoPresenca: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        pacienteNome: z.string(),
        data: z.string(),
        hora: z.string(),
        linkConfirmacao: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const text = buildConfirmacaoMsg(input);
      const ok = await sendTextMessage(input.phone, text);
      return { success: ok };
    }),

  // ─── Enviar documento/PDF ─────────────────────────────────────────────────
  sendDocument: protectedProcedure
    .input(
      z.object({
        phone: z.string(),
        documentUrl: z.string(),
        fileName: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const ok = await sendDocumentMessage(
        input.phone,
        input.documentUrl,
        input.fileName,
        input.caption
      );
      return { success: ok };
    }),

  // ─── Ler configurações WhatsApp ───────────────────────────────────────────
  getConfig: protectedProcedure.query(async () => {
    const numero = await db.getSystemConfig('whatsapp_numero');
    const instancia = await db.getSystemConfig('whatsapp_instancia');
    return {
      numero: numero || '5592996016639',
      instancia: instancia || 'mifatureclinic',
    };
  }),

  // ─── Actualizar número WhatsApp ───────────────────────────────────────────
  updateNumero: adminPerfilProcedure
    .input(z.object({ numero: z.string().min(10).max(20) }))
    .mutation(async ({ input }) => {
      // Formatar: remover tudo que não seja dígito e garantir DDI 55
      const digits = input.numero.replace(/\D/g, '');
      const formatted = digits.startsWith('55') && digits.length >= 12 ? digits : `55${digits}`;
      await db.setSystemConfig('whatsapp_numero', formatted, 'Número WhatsApp activo para envio de mensagens');
      return { success: true, numero: formatted };
    }),
});
