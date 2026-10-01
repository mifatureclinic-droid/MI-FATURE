/**
 * Handler do lembrete automático de atendimento 24h antes.
 * Rota: POST /api/scheduled/lembrete-atendimento
 *
 * Antes era chamado pelo Heartbeat cron do Manus (autenticado via sessão
 * especial "cron_*"). Fora do Manus não existe esse infra, então agora a
 * rota é protegida por um segredo simples (CRON_SECRET) que você configura
 * num agendador externo gratuito (ex: cron-job.org, GitHub Actions
 * schedule) apontando para esta URL com o header:
 *   Authorization: Bearer <CRON_SECRET>
 * diariamente no horário desejado.
 *
 * Para cada atendimento do dia seguinte sem lembrete enviado:
 *   1. Gera (ou reutiliza) o token de confirmação
 *   2. Monta o link de confirmação
 *   3. Regista o lembrete como "enviado" na BD
 *   4. Retorna a lista de atendimentos com os links gerados
 */
import type { Request, Response } from "express";
import { ENV } from "./_core/env";
import * as db from "./db";

export async function lembreteAtendimentoHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization || "";
    const expected = `Bearer ${ENV.cronSecret}`;
    if (!ENV.cronSecret || authHeader !== expected) {
      return res.status(403).json({ error: "cron-only" });
    }

    const atendimentosAmanha = await db.getAtendimentosAmanha();

    if (atendimentosAmanha.length === 0) {
      return res.json({ ok: true, processados: 0, message: "Nenhum atendimento amanhã sem lembrete." });
    }

    const pacientes = await db.getPacientes();
    const baseUrl = req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"] || "https"}://${req.headers["x-forwarded-host"]}`
      : `${req.protocol}://${req.get("host")}`;

    const resultados: Array<{
      atendimentoId: number;
      pacienteNome: string;
      pacienteTelefone: string | null;
      data: unknown;
      hora: string;
      linkConfirmacao: string;
      status: string;
    }> = [];

    for (const atendimento of atendimentosAmanha) {
      const paciente = pacientes.find((p) => p.id === atendimento.pacienteId);
      if (!paciente) continue;

      // Gera token de confirmação se não existir ou se expirou
      let token = atendimento.confirmacaoToken;
      const agora = new Date();
      const expirou =
        !atendimento.confirmacaoTokenExpiresAt ||
        new Date(atendimento.confirmacaoTokenExpiresAt as unknown as string) < agora;

      if (!token || expirou) {
        // gerarTokenConfirmacaoAtendimento gera, persiste e retorna o token
        token = await db.gerarTokenConfirmacaoAtendimento(atendimento.id);
      }

      const linkConfirmacao = `${baseUrl}/confirmar-atendimento/${token}`;

      // Marca lembrete como enviado
      await db.marcarLembreteEnviado(atendimento.id);

      resultados.push({
        atendimentoId: atendimento.id,
        pacienteNome: paciente.nome,
        pacienteTelefone: (paciente as any).celular || (paciente as any).telefone || null,
        data: atendimento.data,
        hora: atendimento.hora,
        linkConfirmacao,
        status: "lembrete_registado",
      });
    }

    return res.json({
      ok: true,
      processados: resultados.length,
      atendimentos: resultados,
    });
  } catch (err: any) {
    console.error("[lembreteAtendimento] erro:", err);
    return res.status(500).json({
      error: err?.message ?? "Erro desconhecido",
      stack: err?.stack,
      context: { url: req.url },
      timestamp: new Date().toISOString(),
    });
  }
}
