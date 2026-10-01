/**
 * Router tRPC para integração com o portal da GEAP.
 * Gere credenciais de acesso, autorizações de guias e execução do robô RPA.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { geapCredenciais, geapAutorizacoes, pacientes } from "../../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { spawn } from "child_process";
import path from "path";
import crypto from "crypto";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encryptPassword(senha: string): string {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET || "geap-key").digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(senha, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptPassword(encrypted: string): string {
  try {
    const [ivHex, encHex] = encrypted.split(":");
    const key = crypto.createHash("sha256").update(process.env.JWT_SECRET || "geap-key").digest();
    const iv = Buffer.from(ivHex, "hex");
    const encData = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(encData), decipher.final()]).toString("utf8");
  } catch {
    return encrypted;
  }
}

interface RobotResult {
  success: boolean;
  numero_autorizacao?: string;
  access_token?: string;
  token_expires_at?: number;
  error?: string;
  log?: string[];
}

function runGeapRobot(args: string[]): Promise<RobotResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), "server", "geapRobot.py");
    const proc = spawn("python3", [scriptPath, ...args], {
      env: { ...process.env },
      timeout: 120000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
    proc.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

    proc.on("close", (code: number | null) => {
      try {
        const result = JSON.parse(stdout.trim());
        resolve(result);
      } catch {
        resolve({
          success: false,
          error: `Erro ao executar robô (código ${code}): ${stderr.slice(0, 500)}`,
          log: [stderr],
        });
      }
    });

    proc.on("error", (err: Error) => {
      resolve({
        success: false,
        error: `Falha ao iniciar robô: ${err.message}`,
      });
    });
  });
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const geapRouter = router({

  // ── Credenciais ─────────────────────────────────────────────────────────────

  getCredenciais: protectedProcedure.query(async () => {
    const drizzle = await getDb();
    if (!drizzle) return [];
    return await drizzle.select({
      id: geapCredenciais.id,
      codigoPrestador: geapCredenciais.codigoPrestador,
      nomePrestador: geapCredenciais.nomePrestador,
      cpfLogin: geapCredenciais.cpfLogin,
      ativo: geapCredenciais.ativo,
      convenioId: geapCredenciais.convenioId,
      tokenExpiresAt: geapCredenciais.tokenExpiresAt,
      updatedAt: geapCredenciais.updatedAt,
    }).from(geapCredenciais).where(eq(geapCredenciais.ativo, 1));
  }),

  salvarCredenciais: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      codigoPrestador: z.string().min(1),
      nomePrestador: z.string().optional(),
      cpfLogin: z.string().min(11),
      senhaLogin: z.string().min(1),
      convenioId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const senhaEncriptada = encryptPassword(input.senhaLogin);

      if (input.id) {
        await drizzle.update(geapCredenciais)
          .set({
            codigoPrestador: input.codigoPrestador,
            nomePrestador: input.nomePrestador,
            cpfLogin: input.cpfLogin,
            senhaLogin: senhaEncriptada,
            convenioId: input.convenioId,
            updatedAt: new Date(),
          })
          .where(eq(geapCredenciais.id, input.id));
        return { success: true, id: input.id };
      } else {
        const [result] = await drizzle.insert(geapCredenciais).values({
          codigoPrestador: input.codigoPrestador,
          nomePrestador: input.nomePrestador,
          cpfLogin: input.cpfLogin,
          senhaLogin: senhaEncriptada,
          convenioId: input.convenioId,
          ativo: 1,
        });
        return { success: true, id: (result as any).insertId };
      }
    }),

  testarCredenciais: protectedProcedure
    .input(z.object({ credencialId: z.number() }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const [cred] = await drizzle.select().from(geapCredenciais)
        .where(eq(geapCredenciais.id, input.credencialId));

      if (!cred) throw new TRPCError({ code: "NOT_FOUND", message: "Credencial não encontrada" });

      const senha = decryptPassword(cred.senhaLogin);
      const resultado = await runGeapRobot([
        "--cpf", cred.cpfLogin,
        "--senha", senha,
        "--headless",
      ]);

      if (resultado.success && resultado.access_token) {
        const expiresAt = resultado.token_expires_at
          ? new Date(resultado.token_expires_at * 1000)
          : null;
        await drizzle.update(geapCredenciais)
          .set({ accessToken: resultado.access_token, tokenExpiresAt: expiresAt, updatedAt: new Date() })
          .where(eq(geapCredenciais.id, input.credencialId));
      }

      return {
        success: resultado.success,
        error: resultado.error,
        tokenCapturado: !!resultado.access_token,
      };
    }),

  // ── Autorizações ────────────────────────────────────────────────────────────

  listarAutorizacoes: protectedProcedure
    .input(z.object({
      status: z.enum(["pendente", "processando", "autorizado", "negado", "erro", "cancelado"]).optional(),
      pacienteId: z.number().optional(),
      convenioId: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];

      const conditions: ReturnType<typeof eq>[] = [];
      if (input.status) conditions.push(eq(geapAutorizacoes.status, input.status));
      if (input.pacienteId) conditions.push(eq(geapAutorizacoes.pacienteId, input.pacienteId));
      if (input.convenioId) conditions.push(eq(geapAutorizacoes.convenioId, input.convenioId));

      return await drizzle
        .select({
          id: geapAutorizacoes.id,
          guiaId: geapAutorizacoes.guiaId,
          pacienteId: geapAutorizacoes.pacienteId,
          convenioId: geapAutorizacoes.convenioId,
          nomePaciente: geapAutorizacoes.nomePaciente,
          numeroCarteira: geapAutorizacoes.numeroCarteira,
          codigoTUSS: geapAutorizacoes.codigoTUSS,
          descricaoProcedimento: geapAutorizacoes.descricaoProcedimento,
          cid10: geapAutorizacoes.cid10,
          quantidadeSessoes: geapAutorizacoes.quantidadeSessoes,
          dataInicio: geapAutorizacoes.dataInicio,
          dataFim: geapAutorizacoes.dataFim,
          tipoAtendimento: geapAutorizacoes.tipoAtendimento,
          nomeMedicoSolicitante: geapAutorizacoes.nomeMedicoSolicitante,
          crmMedicoSolicitante: geapAutorizacoes.crmMedicoSolicitante,
          ufMedicoSolicitante: geapAutorizacoes.ufMedicoSolicitante,
          cbosMedicoSolicitante: geapAutorizacoes.cbosMedicoSolicitante,
          status: geapAutorizacoes.status,
          numeroAutorizacaoGeap: geapAutorizacoes.numeroAutorizacaoGeap,
          dataAutorizacaoGeap: geapAutorizacoes.dataAutorizacaoGeap,
          validadeAutorizacaoGeap: geapAutorizacoes.validadeAutorizacaoGeap,
          motivoNegacao: geapAutorizacoes.motivoNegacao,
          tentativas: geapAutorizacoes.tentativas,
          ultimaTentativa: geapAutorizacoes.ultimaTentativa,
          createdAt: geapAutorizacoes.createdAt,
          updatedAt: geapAutorizacoes.updatedAt,
        })
        .from(geapAutorizacoes)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(geapAutorizacoes.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  criarAutorizacao: protectedProcedure
    .input(z.object({
      pacienteId: z.number(),
      convenioId: z.number(),
      guiaId: z.number().optional(),
      numeroCarteira: z.string().optional(),
      codigoTUSS: z.string().min(1),
      descricaoProcedimento: z.string().optional(),
      cid10: z.string().optional(),
      quantidadeSessoes: z.number().min(1).default(1),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      tipoAtendimento: z.enum(["ambulatorial", "eletivo"]).default("ambulatorial"),
      nomeMedicoSolicitante: z.string().min(1),
      crmMedicoSolicitante: z.string().min(1),
      ufMedicoSolicitante: z.string().length(2),
      cbosMedicoSolicitante: z.string().min(1),
      pedidoMedicoUrl: z.string().optional(),
      relatorioUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const [paciente] = await drizzle.select({ nome: pacientes.nome, numeroCarteira: pacientes.numeroCarteira })
        .from(pacientes).where(eq(pacientes.id, input.pacienteId));

      if (!paciente) throw new TRPCError({ code: "NOT_FOUND", message: "Paciente não encontrado" });

      const [result] = await drizzle.insert(geapAutorizacoes).values({
        pacienteId: input.pacienteId,
        convenioId: input.convenioId,
        guiaId: input.guiaId,
        nomePaciente: paciente.nome,
        numeroCarteira: input.numeroCarteira || paciente.numeroCarteira || "",
        codigoTUSS: input.codigoTUSS,
        descricaoProcedimento: input.descricaoProcedimento,
        cid10: input.cid10,
        quantidadeSessoes: input.quantidadeSessoes,
        dataInicio: input.dataInicio ? new Date(input.dataInicio) : null,
        dataFim: input.dataFim ? new Date(input.dataFim) : null,
        tipoAtendimento: input.tipoAtendimento,
        nomeMedicoSolicitante: input.nomeMedicoSolicitante,
        crmMedicoSolicitante: input.crmMedicoSolicitante,
        ufMedicoSolicitante: input.ufMedicoSolicitante,
        cbosMedicoSolicitante: input.cbosMedicoSolicitante,
        pedidoMedicoUrl: input.pedidoMedicoUrl,
        relatorioUrl: input.relatorioUrl,
        status: "pendente",
        tentativas: 0,
        solicitadoPor: ctx.user.id,
      });

      return { success: true, id: (result as any).insertId };
    }),

  executarRobo: protectedProcedure
    .input(z.object({
      autorizacaoId: z.number(),
      credencialId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const [autorizacao] = await drizzle.select().from(geapAutorizacoes)
        .where(eq(geapAutorizacoes.id, input.autorizacaoId));

      if (!autorizacao) throw new TRPCError({ code: "NOT_FOUND", message: "Autorização não encontrada" });

      if (autorizacao.status === "autorizado") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Esta autorização já foi processada com sucesso" });
      }

      // Buscar credenciais GEAP
      let credencial: typeof geapCredenciais.$inferSelect | undefined;
      if (input.credencialId) {
        const creds = await drizzle.select().from(geapCredenciais)
          .where(and(eq(geapCredenciais.id, input.credencialId), eq(geapCredenciais.ativo, 1)));
        credencial = creds[0];
      } else {
        const creds = await drizzle.select().from(geapCredenciais)
          .where(and(eq(geapCredenciais.ativo, 1), eq(geapCredenciais.convenioId, autorizacao.convenioId)));
        credencial = creds[0];

        if (!credencial) {
          const allCreds = await drizzle.select().from(geapCredenciais).where(eq(geapCredenciais.ativo, 1));
          credencial = allCreds[0];
        }
      }

      if (!credencial) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Nenhuma credencial GEAP configurada. Configure as credenciais primeiro.",
        });
      }

      // Marcar como processando
      await drizzle.update(geapAutorizacoes)
        .set({
          status: "processando",
          tentativas: (autorizacao.tentativas || 0) + 1,
          ultimaTentativa: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(geapAutorizacoes.id, input.autorizacaoId));

      // Preparar argumentos
      const senha = decryptPassword(credencial.senhaLogin);
      const args = [
        "--cpf", credencial.cpfLogin,
        "--senha", senha,
        "--autorizacao-id", String(input.autorizacaoId),
        "--headless",
      ];

      if (autorizacao.numeroCarteira) args.push("--numero-carteira", autorizacao.numeroCarteira);
      if (autorizacao.codigoTUSS) args.push("--codigo-tuss", autorizacao.codigoTUSS);
      if (autorizacao.cid10) args.push("--cid10", autorizacao.cid10);
      if (autorizacao.quantidadeSessoes) args.push("--quantidade-sessoes", String(autorizacao.quantidadeSessoes));
      if (autorizacao.dataInicio) args.push("--data-inicio", autorizacao.dataInicio.toString().split("T")[0]);
      if (autorizacao.dataFim) args.push("--data-fim", autorizacao.dataFim.toString().split("T")[0]);

      const credId = credencial.id;

      // Executar em background
      runGeapRobot(args).then(async (resultado) => {
        const bg = await getDb();
        if (!bg) return;
        const novoStatus = resultado.success && resultado.numero_autorizacao ? "autorizado" : "erro";

        await bg.update(geapAutorizacoes)
          .set({
            status: novoStatus,
            numeroAutorizacaoGeap: resultado.numero_autorizacao || null,
            motivoNegacao: resultado.error || null,
            logExecucao: resultado.log ? resultado.log.join("\n") : null,
            updatedAt: new Date(),
          })
          .where(eq(geapAutorizacoes.id, input.autorizacaoId));

        if (resultado.access_token) {
          const expiresAt = resultado.token_expires_at ? new Date(resultado.token_expires_at * 1000) : null;
          await bg.update(geapCredenciais)
            .set({ accessToken: resultado.access_token, tokenExpiresAt: expiresAt, updatedAt: new Date() })
            .where(eq(geapCredenciais.id, credId));
        }
      }).catch(async (err: Error) => {
        const bg = await getDb();
        if (!bg) return;
        await bg.update(geapAutorizacoes)
          .set({ status: "erro", motivoNegacao: String(err), updatedAt: new Date() })
          .where(eq(geapAutorizacoes.id, input.autorizacaoId));
      });

      return {
        success: true,
        message: "Robô iniciado em background. Acompanhe o status na lista de autorizações.",
        autorizacaoId: input.autorizacaoId,
      };
    }),

  executarRoboLote: protectedProcedure
    .input(z.object({
      credencialId: z.number().optional(),
      convenioId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const conditions: ReturnType<typeof eq | typeof inArray>[] = [
        inArray(geapAutorizacoes.status, ["pendente", "erro"])
      ];
      if (input.convenioId) conditions.push(eq(geapAutorizacoes.convenioId, input.convenioId));

      const pendentes = await drizzle.select({ id: geapAutorizacoes.id })
        .from(geapAutorizacoes)
        .where(and(...conditions));

      if (pendentes.length === 0) {
        return { success: true, message: "Nenhuma autorização pendente encontrada", count: 0 };
      }

      await drizzle.update(geapAutorizacoes)
        .set({ status: "processando", updatedAt: new Date() })
        .where(inArray(geapAutorizacoes.id, pendentes.map((p) => p.id)));

      return {
        success: true,
        message: `${pendentes.length} autorizações enfileiradas para processamento`,
        count: pendentes.length,
        ids: pendentes.map((p) => p.id),
      };
    }),

  cancelarAutorizacao: protectedProcedure
    .input(z.object({ autorizacaoId: z.number() }))
    .mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      await drizzle.update(geapAutorizacoes)
        .set({ status: "cancelado", updatedAt: new Date() })
        .where(and(
          eq(geapAutorizacoes.id, input.autorizacaoId),
          inArray(geapAutorizacoes.status, ["pendente", "erro"])
        ));
      return { success: true };
    }),

  getLog: protectedProcedure
    .input(z.object({ autorizacaoId: z.number() }))
    .query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return null;

      const [row] = await drizzle.select({
        logExecucao: geapAutorizacoes.logExecucao,
        status: geapAutorizacoes.status,
        motivoNegacao: geapAutorizacoes.motivoNegacao,
        tentativas: geapAutorizacoes.tentativas,
        ultimaTentativa: geapAutorizacoes.ultimaTentativa,
      }).from(geapAutorizacoes).where(eq(geapAutorizacoes.id, input.autorizacaoId));

      return row || null;
    }),

  getEstatisticas: protectedProcedure.query(async () => {
    const drizzle = await getDb();
    if (!drizzle) return { total: 0, pendente: 0, processando: 0, autorizado: 0, negado: 0, erro: 0, cancelado: 0 };

    const rows = await drizzle.select({ status: geapAutorizacoes.status }).from(geapAutorizacoes);

    const stats = { total: rows.length, pendente: 0, processando: 0, autorizado: 0, negado: 0, erro: 0, cancelado: 0 };
    for (const row of rows) {
      if (row.status in stats) (stats as Record<string, number>)[row.status]++;
    }
    return stats;
  }),

  uploadAnexos: protectedProcedure
    .input(z.object({
      autorizacaoId: z.number(),
      pedidoMedicoBase64: z.string().optional(),
      pedidoMedicoNomeArquivo: z.string().optional(),
      pedidoMedicoTipo: z.string().optional(),
      relatorioBase64: z.string().optional(),
      relatorioNomeArquivo: z.string().optional(),
      relatorioTipo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const TIPOS_PERMITIDOS = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      const TAMANHO_MAX = 10 * 1024 * 1024;

      const validarAnexo = (base64?: string, tipo?: string) => {
        if (!base64) return null;
        if (!tipo || !TIPOS_PERMITIDOS.includes(tipo)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Tipo não permitido: ${tipo}` });
        }
        const buffer = Buffer.from(base64, "base64");
        if (buffer.length > TAMANHO_MAX) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Arquivo muito grande: ${(buffer.length / 1024 / 1024).toFixed(2)}MB` });
        }
        return { buffer, tamanho: buffer.length };
      };

      const pedidoMedico = validarAnexo(input.pedidoMedicoBase64, input.pedidoMedicoTipo);
      const relatorio = validarAnexo(input.relatorioBase64, input.relatorioTipo);

      if (!pedidoMedico && !relatorio) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhum anexo fornecido" });
      }

      const { storagePut } = await import("../storage");
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "BD não disponível" });

      const updates: any = { anexosUploadadoEm: new Date() };

      if (pedidoMedico) {
        const { url } = await storagePut(
          `geap/autorizacoes/${input.autorizacaoId}/pedido-medico-${Date.now()}`,
          pedidoMedico.buffer,
          input.pedidoMedicoTipo
        );
        updates.pedidoMedicoUrl = url;
        updates.pedidoMedicoNomeArquivo = input.pedidoMedicoNomeArquivo;
        updates.pedidoMedicoTamanho = pedidoMedico.tamanho;
        updates.pedidoMedicoTipo = input.pedidoMedicoTipo;
      }

      if (relatorio) {
        const { url } = await storagePut(
          `geap/autorizacoes/${input.autorizacaoId}/relatorio-${Date.now()}`,
          relatorio.buffer,
          input.relatorioTipo
        );
        updates.relatorioUrl = url;
        updates.relatorioNomeArquivo = input.relatorioNomeArquivo;
        updates.relatorioTamanho = relatorio.tamanho;
        updates.relatorioTipo = input.relatorioTipo;
      }

      await drizzle.update(geapAutorizacoes)
        .set(updates)
        .where(eq(geapAutorizacoes.id, input.autorizacaoId));

      return { success: true, message: "Anexos enviados com sucesso" };
    }),

  getAnexos: protectedProcedure
    .input(z.object({ autorizacaoId: z.number() }))
    .query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return null;
      const [row] = await drizzle.select({
        pedidoMedicoUrl: geapAutorizacoes.pedidoMedicoUrl,
        pedidoMedicoNomeArquivo: geapAutorizacoes.pedidoMedicoNomeArquivo,
        pedidoMedicoTamanho: geapAutorizacoes.pedidoMedicoTamanho,
        pedidoMedicoTipo: geapAutorizacoes.pedidoMedicoTipo,
        relatorioUrl: geapAutorizacoes.relatorioUrl,
        relatorioNomeArquivo: geapAutorizacoes.relatorioNomeArquivo,
        relatorioTamanho: geapAutorizacoes.relatorioTamanho,
        relatorioTipo: geapAutorizacoes.relatorioTipo,
        anexosUploadadoEm: geapAutorizacoes.anexosUploadadoEm,
      }).from(geapAutorizacoes).where(eq(geapAutorizacoes.id, input.autorizacaoId));
      return row || null;
    }),
});
