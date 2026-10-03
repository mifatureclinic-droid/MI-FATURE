import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure, adminPerfilProcedure, profissionalPerfilProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { verificarRateLimit } from "./db";
import { financeiroRouter } from './routers/financeiro';
import { getDb } from "./db";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { loginManual as dbLoginManual, updateUser } from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { z } from 'zod';
import { normalizarDadosConvenio } from '@shared/dadosConvenio';
import { podeGerenciarDatasAssinatura } from '@shared/permissoesAssinatura';
import { calcularValorBrutoPorSessao, calcularValorPacoteNeuropsicologicoPorAtendimento, calcularValorTotalAutorizadoDaSerie, ehPacoteAvaliacaoNeuropsicologica, obterPercentualEspecialDeRepasse, resolverValorBaseDoPacoteNeuropsicologico } from '../shared/repasseValorSessao';
import { calcularValorComUnidades, normalizarUnidadesRepasse } from '../shared/unidadesRepasse';
import { unidadesRepassePorDuracao } from '../shared/duracaoRepasseProfissional';
import { MAXIMO_DATAS_POR_CONSULTA_AGENDA } from '../shared/filtroDatasAgenda';
import { contarSessoesDoPagamentoParticular, pagamentoParticularConfirmaRecebimento, resolverValorBrutoDoRepasse } from '../shared/repassePagamentoParticular';
import { ehConvenioParticular } from '../shared/repasseParticular';
import { encontrarDuasFaltasConsecutivas } from '../shared/faltasConsecutivas';
import { podeGerirPastaPaciente } from '../shared/permissoesPastaPaciente';
import * as db from "./db";
import { atendimentos, pacientes } from "../drizzle/schema";
import { getPacientesComAgendamentos, getAgendamentosDoPaciente, getPacientesCadastrados, getPacientesDoProfissional, getPacientesDoProfissionalComGuiaAssinada, getAgendamentosDoPacientePorProfissional } from "./db-pacientes-agendamentos";
import { updateGuia, getGuiaById } from "./db-guias-update";
import { createProntuarioCompleto, getHistoricoProntuariosPaciente, getProntuarioById, updateProntuario, getProntuariosPendentes, deleteProntuario } from "./db-prontuarios";
import { generateProntuarioPDF } from "./pdf-export";
import { getProcedimentosPorConvenio, getProcedimentosPorEspecialidade } from "./db-procedimentos";
import { notifyOwner } from "./_core/notification";
import { getAtendimentoByConfirmacaoToken } from "./db";
import { criarNotificacaoInApp, listarNotificacoes, contarNaoLidas, marcarComoLida, marcarTodasComoLidas } from "./db-notificacoes";
import { registrarAuditoria, getAuditoria } from "./db-auditoria";
import { stripeRouter } from "./routers/stripe";
import { assinaturasRouter } from "./routers/assinaturas";
import { whatsappRouter } from "./routers/whatsapp";
import { geapRouter } from './routers/geap';
import { bradescoRouter } from './routers/bradesco';
import { extratoRouter } from './routers/extrato';
import { anexosRouter } from './routers/anexos';
import { coresAtendimentoRouter } from './routers/coresAtendimento';
import { pagamentosRouter } from './routers/pagamentos';
import { pontoRouter } from './routers/ponto';
import { obterAvisoFeriadoProfissional, registrarCienciaAvisoFeriado } from './aviso-feriado-profissionais';
import { storagePut } from './storage';
import { sendTextMessage } from './whatsapp';
import { montarLinkPreenchimentoAnamnese, montarMensagemLinkAnamnese } from '../shared/anamneseWhatsApp';
import {
  mesclarCamposPrefaturamento,
  removerHistoricoAssinaturasDoPrefaturamento,
  serializarCamposPrefaturamento,
} from '../shared/prefaturamentoPersistencia';
import { sincronizarCamposCabecalhoGuiaSadt } from '../shared/camposCabecalhoGuiaSadt';
import { camposAusentesDoSolicitante } from '../shared/solicitantePedidoMedico';
import { extrairSolicitanteDoPedidoMedico } from './solicitantePedidoMedico';
import { extrairIdDaGuiaCriada } from '../shared/vinculoGuiaAtendimento';
import { MENSAGEM_ASSINATURA_EM_GUIA_FISICA, convenioUsaAssinaturaEmGuiaFisica } from '../shared/assinaturaGuiaFisica';
import { procedimentoFoiAlterado } from '../shared/conjuntoGuia';
import { serieDeveIniciarNovoMes } from '../shared/serieMensal';
import { normalizarDataExecucaoCampo36 } from '../shared/dataExecucaoCampo36';
import { normalizarCnpjPrestadorTiss, resolverCodigoClinicaNaOperadoraTiss } from '../shared/identificacaoPrestadorTiss';
import { convenioExigeNumeroLoteTissA12, ehConvenioPostalSaude, normalizarNumeroLoteTiss } from '../shared/numeroLotePostalSaude';
import { ehConvenioLuminar, obterRegistroAnsTiss } from '../shared/registroAnsTiss';
import { resolverCodigoCboProfissionalTiss } from '../shared/identificacaoProfissionalTiss';
import { resolverEquipeSadtTiss } from '../shared/equipeSadtTiss';
import { NOME_FANTASIA_CLINICA } from '../shared/nomeClinica';
import { resolverDadosSolicitanteTiss } from '../shared/solicitanteTiss';
import { obterElegibilidadeAssinaturaProntuario } from './assinaturaProntuario';
import { notaFiscalAceita, obterCompetenciaRepasse } from '../shared/pagamentosRepasse';
import { podeExcluirPaciente } from '../shared/acoesPorPerfil';

function resolverRegistroAnsDoConvenio(convenio: any, registroANSOverride?: unknown): string {
  return obterRegistroAnsTiss({
    nomeConvenio: convenio?.nome,
    registroANS: registroANSOverride ?? convenio?.registroANS,
    codigoOperadora: convenio?.codigoOperadora,
  });
}

function converterDataCalendarioParaBanco(
  valor: string | null | undefined,
  campo: string,
): Date | null | undefined {
  if (valor === undefined) return undefined;
  if (valor === null || !valor.trim()) return null;

  const normalizada = normalizarDataExecucaoCampo36(valor);
  if (!normalizada) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Data inválida em ${campo}. Use DD/MM/AAAA.`,
    });
  }

  // Meio-dia UTC preserva o dia de calendário exibido em Manaus.
  return new Date(`${normalizada}T12:00:00.000Z`);
}




async function garantirProntuarioLiberadoPorAssinatura(input: {
  pacienteId: number;
  profissionalId: number;
  atendimentoId: number;
}, usuario?: { perfil?: string | null; profissionalVinculadoId?: number | null }) {
  const elegibilidade = await obterElegibilidadeAssinaturaProntuario(input.atendimentoId);

  if (
    elegibilidade.atendimento.pacienteId !== input.pacienteId
    || elegibilidade.atendimento.profissionalId !== input.profissionalId
  ) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Os dados do prontuário não correspondem ao atendimento selecionado.',
    });
  }

  if (
    usuario?.perfil === 'profissional'
    && usuario.profissionalVinculadoId != null
    && elegibilidade.atendimento.profissionalId !== usuario.profissionalVinculadoId
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'O profissional só pode registrar prontuários dos seus próprios atendimentos.',
    });
  }

  if (!elegibilidade.assinaturaConfirmada) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Prontuário fechado: aguarde a assinatura do paciente para este atendimento antes de preencher ou concluir o registro.',
    });
  }
}

export const appRouter = router({
  system: systemRouter,
  stripe: stripeRouter,
  financeiro: financeiroRouter,
  assinaturas: assinaturasRouter,
  whatsapp: whatsappRouter,
  geap: geapRouter,
  bradesco: bradescoRouter,
  extrato: extratoRouter,
  anexos: anexosRouter,
  coresAtendimento: coresAtendimentoRouter,
  ponto: pontoRouter,
  avisosProfissionais: router({
    feriadoSetembro: protectedProcedure.query(async ({ ctx }) => {
      return obterAvisoFeriadoProfissional(ctx.user as any);
    }),
    registrarCienciaFeriado: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        return await registrarCienciaAvisoFeriado(ctx.user as any);
      } catch (erro) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: erro instanceof Error ? erro.message : "Não foi possível registrar a ciência.",
        });
      }
    }),
  }),
  pagamentos: pagamentosRouter,
  auditoria: router({
    list: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        entidade: z.string().optional(),
        acao: z.string().optional(),
        usuarioNome: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { auditoria: auditoriaTable } = await import('../drizzle/schema');
        const { desc, like, and, eq } = await import('drizzle-orm');
        const drizzle = await getDb();
        if (!drizzle) return [];
        const { limit = 200, offset = 0 } = input;
        const conditions: any[] = [];
        if (input.entidade) conditions.push(eq(auditoriaTable.entidade, input.entidade));
        if (input.acao) conditions.push(eq(auditoriaTable.acao, input.acao));
        if (input.usuarioNome) conditions.push(like(auditoriaTable.usuarioNome, `%${input.usuarioNome}%`));
        const rows = await drizzle
          .select()
          .from(auditoriaTable)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(auditoriaTable.createdAt))
          .limit(limit)
          .offset(offset);
        return rows;
      }),
  }),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    loginManual: publicProcedure
      .input(z.object({ email: z.string().email(), senha: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await dbLoginManual(input.email, input.senha);
        if (!user) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'E-mail ou senha inválidos.' });
        }
        const sessionToken = await sdk.createSessionToken(
          { openId: user.openId!, name: user.name || '', email: user.email ?? null },
          {}
        );
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true, perfil: user.perfil } as const;
      }),
    updateMyProfile: protectedProcedure
      .input(z.object({
        nome: z.string().min(1).optional(),
        avatarUrl: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updated = await updateUser(ctx.user.id, {
          nome: input.nome,
          avatarUrl: input.avatarUrl,
        });
        return updated;
      }),
    uploadAvatar: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        mimeType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.base64Data, 'base64');
        const key = `avatars/user-${ctx.user.id}-${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const updated = await updateUser(ctx.user.id, { avatarUrl: url });
        return { url, user: updated };
      }),
  }),

  pacientes: router({
    create: protectedProcedure
      .input(
        z.object({
          nome: z.string(),
          cpf: z.string(),
          dataNascimento: z.string(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          whatsapp: z.string().optional(),
          recebeLembretesWhatsapp: z.number().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          cartaoSUS: z.string().optional(),
          convenioId: z.number().optional(),
          numeroCarteira: z.string().optional(),
          validadeCarteira: z.string().optional(),
          pedidoMedicoUrl: z.string().optional(),
          dataVencimentoPedido: z.string().optional(),
          anexoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Helper: converte string de data para formato YYYY-MM-DD aceite pelo MySQL date
        const toDateStr = (s: string): string => {
          if (!s) return s;
          // Se já está em YYYY-MM-DD, retorna directo
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          // Se está em DD/MM/YYYY, converte
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const [d, m, y] = s.split('/');
            return `${y}-${m}-${d}`;
          }
          // Tenta parsear como Date e extrair YYYY-MM-DD
          const dt = new Date(s);
          if (!isNaN(dt.getTime())) {
            return dt.toISOString().slice(0, 10);
          }
          return s;
        };
        const novoPaciente = await db.createPaciente({
          nome: input.nome,
          cpf: input.cpf,
          dataNascimento: toDateStr(input.dataNascimento) as unknown as Date,
          email: input.email,
          telefone: input.telefone,
          whatsapp: input.whatsapp,
          recebeLembretesWhatsapp: input.recebeLembretesWhatsapp,
          endereco: input.endereco,
          cidade: input.cidade,
          estado: input.estado,
          cep: input.cep,
          cartaoSUS: input.cartaoSUS,
          convenioId: input.convenioId,
          numeroCarteira: input.numeroCarteira || null,
          validadeCarteira: input.validadeCarteira ? toDateStr(input.validadeCarteira) as unknown as Date : null,
          pedidoMedicoUrl: input.pedidoMedicoUrl,
          dataVencimentoPedido: input.dataVencimentoPedido ? toDateStr(input.dataVencimentoPedido) as unknown as Date : null,
          anexoUrl: input.anexoUrl,
        });
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'paciente',
          entidadeId: (novoPaciente as any)?.id ?? null,
          acao: 'CRIAR_PACIENTE',
          descricao: `Paciente "${input.nome}" cadastrado`,
          ip: (ctx.req as any)?.ip || null,
        });
        return novoPaciente;
      }),
    list: protectedProcedure.query(() => db.getPacientes()),
    listParaAgenda: protectedProcedure.query(() => db.getPacientesParaAgenda()),
    listParaRecepcao: protectedProcedure.query(() => db.getPacientesParaRecepcao()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getPacienteById(input.id)),
    getByCpf: protectedProcedure
      .input(z.object({ cpf: z.string() }))
      .query(({ input }) => db.getPacienteByCpf(input.cpf)),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any).perfil;
        if (!podeExcluirPaciente({ perfil })) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'A exclusão de pacientes é permitida somente ao usuário master.' });
        }
        // Buscar dados do paciente antes de excluir (para auditoria)
        const paciente = await db.getPacienteById(input.id);
        if (!paciente) throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado.' });
        try {
          await db.deletePaciente(input.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Paciente possui vínculos e não pode ser excluído.';
          await registrarAuditoria({
            usuarioId: ctx.user.id,
            usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
            usuarioPerfil: perfil || null,
            entidade: 'paciente',
            entidadeId: input.id,
            acao: 'TENTATIVA_EXCLUIR_PACIENTE_BLOQUEADA',
            descricao: `Exclusão bloqueada para "${paciente.nome}": ${message}`,
            ip: (ctx.req as any)?.ip || null,
          });
          throw new TRPCError({ code: 'CONFLICT', message });
        }
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: perfil || null,
          entidade: 'paciente',
          entidadeId: input.id,
          acao: 'EXCLUIR_PACIENTE',
          descricao: `Paciente "${paciente.nome}" (ID ${input.id}) excluído`,
          ip: (ctx.req as any)?.ip || null,
        });
        return { success: true };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          cpf: z.string().optional(),
          dataNascimento: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          whatsapp: z.string().optional(),
          recebeLembretesWhatsapp: z.number().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          cartaoSUS: z.string().optional(),
          convenioId: z.number().optional(),
          numeroCarteira: z.string().optional(),
          validadeCarteira: z.string().optional(),
          pedidoMedicoUrl: z.string().optional(),
          dataVencimentoPedido: z.string().optional(),
          anexoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = {};
        // Helper: converte string de data para YYYY-MM-DD aceite pelo MySQL date
        const toDateStr = (s: string): string => {
          if (!s) return s;
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
            const [d, m, y] = s.split('/');
            return `${y}-${m}-${d}`;
          }
          const dt = new Date(s);
          if (!isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
          return s;
        };
        if (data.nome !== undefined) updateData.nome = data.nome;
        if (data.cpf !== undefined) updateData.cpf = data.cpf;
        if (data.dataNascimento !== undefined && data.dataNascimento !== '') {
          updateData.dataNascimento = toDateStr(data.dataNascimento);
        }
        if (data.email !== undefined) updateData.email = data.email;
        if (data.telefone !== undefined) updateData.telefone = data.telefone;
        if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp;
        if (data.recebeLembretesWhatsapp !== undefined) updateData.recebeLembretesWhatsapp = data.recebeLembretesWhatsapp;
        if (data.endereco !== undefined) updateData.endereco = data.endereco;
        if (data.cidade !== undefined) updateData.cidade = data.cidade;
        if (data.estado !== undefined) updateData.estado = data.estado;
        if (data.cep !== undefined) updateData.cep = data.cep;
        if (data.cartaoSUS !== undefined) updateData.cartaoSUS = data.cartaoSUS;
        if (data.convenioId !== undefined) updateData.convenioId = data.convenioId;
        if (data.numeroCarteira !== undefined) updateData.numeroCarteira = data.numeroCarteira;
        if (data.validadeCarteira !== undefined) updateData.validadeCarteira = data.validadeCarteira ? toDateStr(data.validadeCarteira) : null;
        if (data.pedidoMedicoUrl !== undefined) updateData.pedidoMedicoUrl = data.pedidoMedicoUrl;
        if (data.dataVencimentoPedido !== undefined) {
          updateData.dataVencimentoPedido = data.dataVencimentoPedido ? toDateStr(data.dataVencimentoPedido) : null;
        }
        if (data.anexoUrl !== undefined) updateData.anexoUrl = data.anexoUrl;
        
        const resultado = await db.updatePaciente(id, updateData as Partial<typeof pacientes.$inferInsert>);
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'paciente',
          entidadeId: id,
          acao: 'ATUALIZAR_PACIENTE',
          descricao: `Dados do paciente ID ${id} atualizados`,
          ip: (ctx.req as any)?.ip || null,
        });
        return resultado;
      }),
    getComAgendamentos: protectedProcedure.query(({ ctx }) => {
      const perfil = (ctx.user as any)?.perfil;
      const profissionalVinculadoId = (ctx.user as any)?.profissionalVinculadoId;
      if (perfil === 'profissional' && profissionalVinculadoId) {
        return getPacientesComAgendamentos(profissionalVinculadoId);
      }
      return getPacientesComAgendamentos();
    }),
    getCadastrados: protectedProcedure.query(({ ctx }) => {
      const perfil = (ctx.user as any)?.perfil;
      const profissionalVinculadoId = (ctx.user as any)?.profissionalVinculadoId;
      // Profissional logado vê apenas pacientes com guia SADT assinada
      if (perfil === 'profissional' && profissionalVinculadoId) {
        return getPacientesDoProfissionalComGuiaAssinada(profissionalVinculadoId);
      }
      return getPacientesCadastrados();
    }),
    getAgendamentos: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const profissionalVinculadoId = (ctx.user as any)?.profissionalVinculadoId;
        // Profissional logado vê apenas seus próprios atendimentos do paciente
        if (perfil === 'profissional' && profissionalVinculadoId) {
          return getAgendamentosDoPacientePorProfissional(input.pacienteId, profissionalVinculadoId);
        }
        return getAgendamentosDoPaciente(input.pacienteId);
      }),
    updateComPedido: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          pedidoMedicoUrl: z.string(),
          dataVencimentoPedido: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updatePacienteComPedido(
          input.pacienteId,
          input.pedidoMedicoUrl,
          new Date(input.dataVencimentoPedido)
        );
      }),
    importarCSV: protectedProcedure
      .input(z.object({
        csvContent: z.string().min(1, 'CSV não pode estar vazio'),
      }))
      .mutation(async ({ input }) => {
        try {
          // Processar e validar CSV
          const { validos, invalidos, total } = await db.processarCSVPacientes(input.csvContent);

          if (validos.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Nenhum paciente válido encontrado. Total de erros: ${invalidos.length}`,
            });
          }

          // Importar pacientes válidos
          const resultados = await db.importarPacientesMassa(validos);

          return {
            sucesso: true,
            total,
            processados: validos.length,
            importados: resultados.sucesso,
            falhados: resultados.falha,
            erros: resultados.erros,
            validacaoErros: invalidos,
          };
        } catch (erro: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: erro.message || 'Erro ao importar pacientes',
          });
        }
      }),
  }),

  profissionais: router({
    create: adminPerfilProcedure
      .input(
        z.object({
          nome: z.string(),
          cpf: z.string(),
          crm: z.string(),
          especialidade: z.string(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          anexoUrl: z.string().optional(),
          uf: z.string().optional(),
          codigoCBO: z.string().optional(),
          codigoConselho: z.string().max(2).optional(),
          percentualRepasse: z.string().optional(),
          percentualConvenio: z.string().optional(),
          percentualParticular: z.string().optional(),
          percentualTesteAvulso: z.string().optional(),
          percentualAvaliacaoNeuropsicologica: z.string().optional(),
          duracaoPadrao: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createProfissional(input as any);
      }),
    list: protectedProcedure.query(() => db.getProfissionais()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getProfissionalById(input.id)),
    update: adminPerfilProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          cpf: z.string().optional(),
          crm: z.string().optional(),
          especialidade: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          anexoUrl: z.string().optional(),
          uf: z.string().optional(),
          codigoCBO: z.string().optional(),
          codigoConselho: z.string().max(2).optional(),
          percentualRepasse: z.string().optional(),
          percentualConvenio: z.string().optional(),
          percentualParticular: z.string().optional(),
          percentualTesteAvulso: z.string().optional(),
          percentualAvaliacaoNeuropsicologica: z.string().optional(),
          duracaoPadrao: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Verificar duplicidade de CPF antes de actualizar
        if ((data as any).cpf) {
          const existente = await db.getProfissionalByCpf((data as any).cpf);
          if (existente && existente.id !== id) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: `CPF já cadastrado para o profissional "${existente.nome}". Por favor, verifique o CPF informado.`,
            });
          }
        }
        return await db.updateProfissional(id, data as any);
      }),
    delete: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProfissional(input.id);
        return { success: true };
      }),
    toggleAtivo: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleProfissionalAtivo(input.id);
      }),

    // ===== HORÁRIOS DE TRABALHO =====
    getHorarios: protectedProcedure
      .input(z.object({ profissionalId: z.number() }))
      .query(async ({ input }) => {
        const { horariosProfissional } = await import('../drizzle/schema');
        const dbConn = await getDb();
        const { eq } = await import('drizzle-orm');
        return await dbConn!.select().from(horariosProfissional)
          .where(eq(horariosProfissional.profissionalId, input.profissionalId));
      }),

    getAllHorarios: protectedProcedure
      .query(async () => {
        const { horariosProfissional } = await import('../drizzle/schema');
        const dbConn = await getDb();
        return await dbConn!.select().from(horariosProfissional);
      }),

    saveHorarios: adminPerfilProcedure
      .input(z.object({
        profissionalId: z.number(),
        horarios: z.array(z.object({
          diaSemana: z.number().min(0).max(6),
          horaInicio: z.string(),
          horaFim: z.string(),
          ativo: z.number().optional().default(1),
        })),
      }))
      .mutation(async ({ input }) => {
        const { horariosProfissional } = await import('../drizzle/schema');
        const dbConn = await getDb();
        const { eq } = await import('drizzle-orm');
        // Apagar horários existentes e reinserir
        await dbConn!.delete(horariosProfissional)
          .where(eq(horariosProfissional.profissionalId, input.profissionalId));
        if (input.horarios.length > 0) {
          await dbConn!.insert(horariosProfissional).values(
            input.horarios.map(h => ({
              profissionalId: input.profissionalId,
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFim: h.horaFim,
              ativo: h.ativo ?? 1,
            }))
          );
        }
        return { success: true };
      }),
  }),

  convenios: router({
    create: adminPerfilProcedure
      .input(
        z.object({
          nome: z.string(),
          cnpj: z.string(),
          codigoOperadora: z.string().optional(),
          registroANS: z.string().optional(),
          codigoNaOperadora: z.string().optional(),
          logoUrl: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          aniversarioConvenio: z.string().optional(),
          anexoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const convenioData: any = normalizarDadosConvenio(input);
        if (input.aniversarioConvenio) {
          convenioData.aniversarioConvenio = new Date(input.aniversarioConvenio);
        }
        return await db.createConvenio(convenioData);
      }),
    list: protectedProcedure.query(() => db.getConvenios()),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getConvenioById(input.id)),
    update: adminPerfilProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          cnpj: z.string().optional(),
          codigoOperadora: z.string().optional(),
          registroANS: z.string().optional(),
          codigoNaOperadora: z.string().optional(),
          logoUrl: z.string().optional(),
          email: z.string().optional(),
          telefone: z.string().optional(),
          endereco: z.string().optional(),
          cidade: z.string().optional(),
          estado: z.string().optional(),
          cep: z.string().optional(),
          aniversarioConvenio: z.string().optional(),
          anexoUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = normalizarDadosConvenio(data);
        if (data.aniversarioConvenio) {
          updateData.aniversarioConvenio = new Date(data.aniversarioConvenio);
        }
        return await db.updateConvenio(id, updateData);
      }),
    uploadLogo: adminPerfilProcedure
      .input(
        z.object({
          fileName: z.string(),
          mimeType: z.string(),
          base64Data: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { storagePut } = await import('./storage');
        const buffer = Buffer.from(input.base64Data, 'base64');
        const key = `convenios/logos/${Date.now()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
    delete: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteConvenio(input.id);
        return { success: true };
      }),
    toggleAtivo: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.toggleConvenioAtivo(input.id);
      }),
  }),

  autorizacoes: router({
    create: protectedProcedure
      .input(
        z.object({
          numeroAutorizacao: z.string(),
          pacienteId: z.number(),
          convenioId: z.number(),
          procedimento: z.string(),
          dataAutorizacao: z.string(),
          dataValidade: z.string(),
          quantidadeSessoes: z.number().optional(),
          status: z.enum(["ativa", "utilizada", "expirada", "cancelada"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createAutorizacao({
          numeroAutorizacao: input.numeroAutorizacao,
          pacienteId: input.pacienteId,
          convenioId: input.convenioId,
          procedimento: input.procedimento,
          dataAutorizacao: new Date(input.dataAutorizacao),
          dataValidade: new Date(input.dataValidade),
          quantidadeSessoes: input.quantidadeSessoes,
          status: input.status || "ativa",
        });
      }),
    list: protectedProcedure.query(() => db.getAutorizacoes()),
  }),

  atendimentos: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          profissionalId: z.number(),
          convenioId: z.number(),
          data: z.string(),
          hora: z.string(),
          duracao: z.number().optional().nullable(),
          tipo: z.string(),
          descricao: z.string().optional(),
          status: z.enum(["agendado", "realizado", "cancelado", "falta"]).optional(),
          recorrencia: z.string().optional(),
          serieId: z.string().optional().nullable(),
          diasSemana: z.string().optional(),
          procedimentoConvenioId: z.number().optional().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Verificar duplicata: mesmo paciente, profissional, data e hora com status ativo
        const { TRPCError } = await import('@trpc/server');
        const { atendimentos: atendimentosTable, profissionais: profissionaisTable, procedimentosPorConvenio: procedimentosPorConvenioTable, tabelaProcedimentos: tabelaProcedimentosTable } = await import('../drizzle/schema');
        const { and, eq } = await import('drizzle-orm');
        const drizzleDb = await getDb();
        if (drizzleDb) {
          const existente = await drizzleDb
            .select({ id: atendimentosTable.id })
            .from(atendimentosTable)
            .where(
              and(
                eq(atendimentosTable.pacienteId, input.pacienteId),
                eq(atendimentosTable.profissionalId, input.profissionalId),
                eq(atendimentosTable.data, new Date(input.data)),
                eq(atendimentosTable.hora, input.hora),
                eq(atendimentosTable.status, 'agendado')
              )
            )
            .limit(1);
          if (existente.length > 0) {
            // Retornar o existente em vez de criar duplicata
            const [atendExistente] = await drizzleDb
              .select()
              .from(atendimentosTable)
              .where(eq(atendimentosTable.id, existente[0].id))
              .limit(1);
            return atendExistente;
          }
        }

        // Calcular data limite (72 horas após o atendimento)
        const dataAtendimento = new Date(input.data);
        const dataLimite = new Date(dataAtendimento.getTime() + 72 * 60 * 60 * 1000);
        const [profissional] = drizzleDb
          ? await drizzleDb.select({ nome: profissionaisTable.nome }).from(profissionaisTable).where(eq(profissionaisTable.id, input.profissionalId)).limit(1)
          : [null];
        const [procedimento] = drizzleDb && input.procedimentoConvenioId
          ? await drizzleDb.select({ descricaoConvenio: procedimentosPorConvenioTable.descricaoConvenio, descricao: tabelaProcedimentosTable.descricao })
            .from(procedimentosPorConvenioTable)
            .leftJoin(tabelaProcedimentosTable, eq(procedimentosPorConvenioTable.tabelaProcedimentoId, tabelaProcedimentosTable.id))
            .where(eq(procedimentosPorConvenioTable.id, input.procedimentoConvenioId))
            .limit(1)
          : [null];
        const contextoProcedimento = [input.tipo, input.descricao, procedimento?.descricaoConvenio, procedimento?.descricao]
          .filter(Boolean)
          .join(' ');
        const unidadesRepasse = unidadesRepassePorDuracao(profissional?.nome, input.duracao, input.data, contextoProcedimento);
        
        const atendimento = await db.createAtendimento({
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          convenioId: input.convenioId,
          data: new Date(input.data),
          hora: input.hora,
          duracao: input.duracao,
          unidadesRepasse,
          tipo: input.tipo,
          descricao: input.descricao,
          status: input.status || "agendado",
          recorrencia: input.recorrencia,
          serieId: input.serieId ?? null,
          diasSemana: input.diasSemana,
          dataLimiteProntuario: dataLimite,
          procedimentoConvenioId: input.procedimentoConvenioId ?? null,
        });

        // Uma sessão incluída depois em uma série já guiada herda a única guia
        // do conjunto, sem exigir nova criação pelo usuário.
        if (input.serieId && (atendimento as any)?.id) {
          const drizzle = await getDb();
          if (drizzle) {
            const { guias: guiasTable, atendimentos: atendimentosTable } = await import('../drizzle/schema');
            const { and, eq } = await import('drizzle-orm');
            const [guiaDaSerie] = await drizzle
              .select({ id: guiasTable.id })
              .from(guiasTable)
              .where(and(
                eq(guiasTable.serieId, input.serieId),
                eq(guiasTable.pacienteId, input.pacienteId),
                eq(guiasTable.profissionalId, input.profissionalId),
                eq(guiasTable.convenioId, input.convenioId),
              ))
              .limit(1);
            if (guiaDaSerie) {
              await drizzle
                .update(atendimentosTable)
                .set({ guiaId: guiaDaSerie.id } as any)
                .where(eq(atendimentosTable.id, (atendimento as any).id));
              (atendimento as any).guiaId = guiaDaSerie.id;
            }
          }
        }

        // Criar autorizações automáticas para todos os convênios
        try {
          const { pacientes } = await import('../drizzle/schema');
          const { eq, and, gte, lte } = await import('drizzle-orm');
          const drizzle = await getDb();
          if (drizzle) {
            const [paciente] = await drizzle.select().from(pacientes).where(eq(pacientes.id, input.pacienteId));
            
            if (paciente && paciente.nomeMedicoSolicitante && paciente.crmMedicoSolicitante && paciente.ufMedicoSolicitante && paciente.cbosMedicoSolicitante) {
              // Contar quantas vezes o paciente está agendado neste mês
              const agora = new Date();
              const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
              const fimMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
              
              const { atendimentos } = await import('../drizzle/schema');
              const agendamentosNoMes = await drizzle.select().from(atendimentos)
                .where(and(
                  eq(atendimentos.pacienteId, input.pacienteId),
                  gte(atendimentos.data, inicioMes),
                  lte(atendimentos.data, fimMes),
                  eq(atendimentos.status, 'agendado')
                ));
              
              const quantidadeSessoes = agendamentosNoMes.length;
              
              // Buscar anexos (pedido médico e relatório) do cadastro do paciente
              let pedidoMedicoUrl = null;
              let relatorioUrl = null;
              try {
                // Buscar URLs de anexos do cadastro do paciente
                if (paciente.pedidoMedicoUrl) {
                  pedidoMedicoUrl = paciente.pedidoMedicoUrl;
                  console.log(`[Autorização] Pedido médico encontrado: ${pedidoMedicoUrl}`);
                }
                if (paciente.anexoUrl) {
                  relatorioUrl = paciente.anexoUrl;
                  console.log(`[Autorização] Relatório encontrado: ${relatorioUrl}`);
                }
              } catch (e) {
                console.log("Aviso: não foi possível buscar anexos automaticamente", e);
              }
              
              // Criar autorização para cada convênio
              const { geapAutorizacoes } = await import('../drizzle/schema');
              
              // Verificar se já existe autorização pendente para este paciente neste mês
              const existentes = await drizzle.select().from(geapAutorizacoes)
                .where(and(
                  eq(geapAutorizacoes.pacienteId, input.pacienteId),
                  eq(geapAutorizacoes.convenioId, input.convenioId),
                  eq(geapAutorizacoes.status, 'pendente')
                ));
              
              // Se não existe, criar nova autorização
              if (!existentes.length) {
                await drizzle.insert(geapAutorizacoes).values({
                  guiaId: null,
                  pacienteId: input.pacienteId,
                  convenioId: input.convenioId,
                  nomePaciente: paciente.nome,
                  numeroCarteira: paciente.numeroCarteira || "",
                  codigoTUSS: "", // Será preenchido manualmente ou via guia
                  descricaoProcedimento: input.descricao || "",
                  cid10: "", // Será preenchido manualmente
                  quantidadeSessoes: quantidadeSessoes,
                  dataInicio: new Date(input.data),
                  dataFim: null,
                  tipoAtendimento: "ambulatorial",
                  nomeMedicoSolicitante: paciente.nomeMedicoSolicitante,
                  crmMedicoSolicitante: paciente.crmMedicoSolicitante,
                  ufMedicoSolicitante: paciente.ufMedicoSolicitante,
                  cbosMedicoSolicitante: paciente.cbosMedicoSolicitante,
                  pedidoMedicoUrl: pedidoMedicoUrl,
                  relatorioUrl: relatorioUrl,
                  status: "pendente",
                  tentativas: 0,
                  solicitadoPor: ctx.user.id,
                });
              }
            }
          }
                } catch (error) {
          console.error("Erro ao criar autorização automática:", error);
          // Não falhar o agendamento se houver erro na autorização
        }
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'atendimento',
          entidadeId: (atendimento as any)?.id ?? null,
          acao: 'CRIAR_ATENDIMENTO',
          descricao: `Agendamento criado para paciente ID ${input.pacienteId} em ${input.data} às ${input.hora}`,
          ip: (ctx.req as any)?.ip || null,
        });
        return atendimento;
      }),
    list: protectedProcedure.input(z.object({
      datas: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(MAXIMO_DATAS_POR_CONSULTA_AGENDA).optional(),
    }).optional()).query(({ ctx, input }) => {
      const perfil = (ctx.user as any)?.perfil;
      const profissionalVinculadoId = (ctx.user as any)?.profissionalVinculadoId;
      // Profissional logado vê apenas seus próprios agendamentos
      if (perfil === 'profissional' && profissionalVinculadoId) {
        return db.getAtendimentos(profissionalVinculadoId, input?.datas);
      }
      // Recepcionista e admin veem todos os agendamentos
      return db.getAtendimentos(undefined, input?.datas);
    }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const resultado = await db.deleteAtendimento(input.id);
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'atendimento',
          entidadeId: input.id,
          acao: 'EXCLUIR_ATENDIMENTO',
          descricao: `Atendimento ID ${input.id} excluído`,
          ip: (ctx.req as any)?.ip || null,
        });
        return resultado;
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            data: z.string().optional(),
            hora: z.string().optional(),
            profissionalId: z.number().optional(),
            status: z.enum(["agendado", "realizado", "cancelado", "falta"]).optional(),
            reagendadoPara: z.number().optional(),
            atendimentoAnteriorId: z.number().optional(),
            tipo: z.string().optional(),
            descricao: z.string().optional(),
            convenioId: z.number().optional(),
            procedimentoConvenioId: z.number().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const atendimentos = await db.getAtendimentos();
        const atendimentoAtual = atendimentos.find(a => a.id === input.id);

        const updateData: any = {};
        const historicos: any[] = [];

        if (input.data.data && atendimentoAtual) {
          updateData.data = new Date(input.data.data);
          const dataAnterior = atendimentoAtual.data.toISOString().split('T')[0];
          if (dataAnterior !== input.data.data) {
            historicos.push({
              atendimentoId: input.id,
              usuarioId: ctx.user.id,
              tipoAlteracao: 'data',
              valorAnterior: dataAnterior,
              valorNovo: input.data.data,
              descricao: `Data alterada de ${dataAnterior} para ${input.data.data}`,
            });
          }
        }

        if (input.data.hora && atendimentoAtual?.hora) {
          updateData.hora = input.data.hora;
          if (atendimentoAtual.hora !== input.data.hora) {
            historicos.push({
              atendimentoId: input.id,
              usuarioId: ctx.user.id,
              tipoAlteracao: 'hora',
              valorAnterior: atendimentoAtual.hora,
              valorNovo: input.data.hora,
              descricao: `Hora alterada de ${atendimentoAtual.hora} para ${input.data.hora}`,
            });
          }
        }

        if (input.data.profissionalId && atendimentoAtual?.profissionalId) {
          updateData.profissionalId = input.data.profissionalId;
          if (atendimentoAtual.profissionalId !== input.data.profissionalId) {
            historicos.push({
              atendimentoId: input.id,
              usuarioId: ctx.user.id,
              tipoAlteracao: 'profissional',
              valorAnterior: atendimentoAtual.profissionalId.toString(),
              valorNovo: input.data.profissionalId.toString(),
              descricao: 'Profissional alterado',
            });
          }
        }

        if (input.data.status && atendimentoAtual?.status) {
          updateData.status = input.data.status;
          if (atendimentoAtual.status !== input.data.status) {
            historicos.push({
              atendimentoId: input.id,
              usuarioId: ctx.user.id,
              tipoAlteracao: 'status',
              valorAnterior: atendimentoAtual.status,
              valorNovo: input.data.status,
              descricao: `Status alterado de ${atendimentoAtual.status} para ${input.data.status}`,
            });
          }
        }

        if (input.data.tipo !== undefined) updateData.tipo = input.data.tipo;
        if (input.data.descricao !== undefined) updateData.descricao = input.data.descricao;
        if (input.data.convenioId !== undefined) updateData.convenioId = input.data.convenioId;
        if (input.data.procedimentoConvenioId !== undefined) {
          updateData.procedimentoConvenioId = input.data.procedimentoConvenioId;
          if (procedimentoFoiAlterado(
            atendimentoAtual?.procedimentoConvenioId,
            input.data.procedimentoConvenioId,
          )) {
            historicos.push({
              atendimentoId: input.id,
              usuarioId: ctx.user.id,
              tipoAlteracao: 'procedimento',
              valorAnterior: String(atendimentoAtual?.procedimentoConvenioId ?? ''),
              valorNovo: String(input.data.procedimentoConvenioId),
              descricao: 'Procedimento alterado: série, guia e assinaturas existentes foram preservadas',
            });
          }
        }
        if (input.data.reagendadoPara !== undefined) updateData.reagendadoPara = input.data.reagendadoPara;
        if (input.data.atendimentoAnteriorId !== undefined) updateData.atendimentoAnteriorId = input.data.atendimentoAnteriorId;

                for (const historico of historicos) {
          await db.createHistoricoAlteracao(historico);
        }
        const resultadoUpdate = await db.updateAtendimento(input.id, updateData);
        const acaoDesc = input.data.status ? `Status alterado para "${input.data.status}"` : 'Atendimento atualizado';
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'atendimento',
          entidadeId: input.id,
          acao: 'ATUALIZAR_ATENDIMENTO',
          descricao: acaoDesc,
          ip: (ctx.req as any)?.ip || null,
        });
        return resultadoUpdate;
      }),
    updateDuracao: protectedProcedure
      .input(z.object({
        id: z.number(),
        duracao: z.number().int().min(1).max(480),
      }))
      .mutation(async ({ input }) => {
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const { atendimentos: atendimentosTable, profissionais: profissionaisTable, procedimentosPorConvenio: procedimentosPorConvenioTable, tabelaProcedimentos: tabelaProcedimentosTable } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const [atendimento] = await drizzle.select().from(atendimentosTable).where(eq(atendimentosTable.id, input.id)).limit(1);
        if (!atendimento) throw new Error('Atendimento não encontrado');
        const [profissional] = await drizzle.select({ nome: profissionaisTable.nome }).from(profissionaisTable).where(eq(profissionaisTable.id, atendimento.profissionalId)).limit(1);
        const [procedimento] = atendimento.procedimentoConvenioId
          ? await drizzle.select({ descricaoConvenio: procedimentosPorConvenioTable.descricaoConvenio, descricao: tabelaProcedimentosTable.descricao })
            .from(procedimentosPorConvenioTable)
            .leftJoin(tabelaProcedimentosTable, eq(procedimentosPorConvenioTable.tabelaProcedimentoId, tabelaProcedimentosTable.id))
            .where(eq(procedimentosPorConvenioTable.id, atendimento.procedimentoConvenioId))
            .limit(1)
          : [null];
        const contextoProcedimento = [atendimento.tipo, atendimento.descricao, procedimento?.descricaoConvenio, procedimento?.descricao]
          .filter(Boolean)
          .join(' ');
        return await db.updateAtendimento(input.id, {
          duracao: input.duracao,
          unidadesRepasse: unidadesRepassePorDuracao(profissional?.nome, input.duracao, atendimento.data, contextoProcedimento),
        } as any);
      }),
    // Atualiza duração de todos os atendimentos futuros da mesma série
    updateDuracaoSerie: protectedProcedure
      .input(z.object({
        id: z.number(),
        duracao: z.number().int().min(1).max(480),
      }))
      .mutation(async ({ input }) => {
        const { atendimentos: atendimentosTable, profissionais: profissionaisTable, procedimentosPorConvenio: procedimentosPorConvenioTable, tabelaProcedimentos: tabelaProcedimentosTable } = await import('../drizzle/schema');
        const { eq, and, gte, sql } = await import('drizzle-orm');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const ref = await drizzle.select().from(atendimentosTable).where(eq(atendimentosTable.id, input.id)).limit(1);
        if (!ref.length) throw new Error('Atendimento não encontrado');
        const a = ref[0];
        const [profissional] = await drizzle.select({ nome: profissionaisTable.nome }).from(profissionaisTable).where(eq(profissionaisTable.id, a.profissionalId)).limit(1);
        let atualizados = 0;
        const aplicarDuracao = async (futuro: typeof atendimentosTable.$inferSelect) => {
          const [procedimento] = futuro.procedimentoConvenioId
            ? await drizzle.select({ descricaoConvenio: procedimentosPorConvenioTable.descricaoConvenio, descricao: tabelaProcedimentosTable.descricao })
              .from(procedimentosPorConvenioTable)
              .leftJoin(tabelaProcedimentosTable, eq(procedimentosPorConvenioTable.tabelaProcedimentoId, tabelaProcedimentosTable.id))
              .where(eq(procedimentosPorConvenioTable.id, futuro.procedimentoConvenioId))
              .limit(1)
            : [null];
          const contextoProcedimento = [futuro.tipo, futuro.descricao, procedimento?.descricaoConvenio, procedimento?.descricao]
            .filter(Boolean)
            .join(' ');
          await drizzle.update(atendimentosTable).set({
            duracao: input.duracao,
            unidadesRepasse: unidadesRepassePorDuracao(profissional?.nome, input.duracao, futuro.data, contextoProcedimento),
          } as any).where(eq(atendimentosTable.id, futuro.id));
          atualizados++;
        };
        if (a.serieId) {
          const futurosDaSerie = await drizzle.select().from(atendimentosTable)
            .where(and(eq(atendimentosTable.serieId, a.serieId), gte(atendimentosTable.data, a.data)));
          for (const futuro of futurosDaSerie) await aplicarDuracao(futuro);
        } else {
          const futuros = await drizzle.select().from(atendimentosTable).where(
            and(
              eq(atendimentosTable.pacienteId, a.pacienteId),
              eq(atendimentosTable.profissionalId, a.profissionalId),
              eq(atendimentosTable.hora, a.hora),
              gte(atendimentosTable.data, a.data),
              sql`DAYOFWEEK(${atendimentosTable.data}) = DAYOFWEEK(${a.data})`
            )
          );
          for (const fut of futuros) {
            await aplicarDuracao(fut);
          }
        }
        return { atualizados };
      }),
    // Retorna quantos atendimentos futuros existem na mesma série
    countSerie: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const total = await db.countAtendimentosSerie(input.id);
        return { total };
      }),
    // Exclui todos os atendimentos futuros da mesma série
    deleteSerie: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAtendimentosSerie(input.id);
        return { ok: true };
      }),
    // Exclui TODOS os atendimentos da série (passados e futuros)
    deleteSerieCompleta: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { atendimentos: atendimentosTable } = await import('../drizzle/schema');
        const { eq, and, sql } = await import('drizzle-orm');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const [ref] = await drizzle.select().from(atendimentosTable).where(eq(atendimentosTable.id, input.id)).limit(1);
        if (!ref) throw new Error('Atendimento não encontrado');
        if (ref.serieId) {
          await drizzle.delete(atendimentosTable).where(eq(atendimentosTable.serieId, ref.serieId));
        } else {
          // Sem serieId: excluir todos com mesmo paciente+profissional+hora+dia da semana
          await drizzle.delete(atendimentosTable).where(
            and(
              eq(atendimentosTable.pacienteId, ref.pacienteId),
              eq(atendimentosTable.profissionalId, ref.profissionalId),
              eq(atendimentosTable.hora, ref.hora),
              sql`DAYOFWEEK(${atendimentosTable.data}) = DAYOFWEEK(${ref.data})`
            )
          );
        }
        return { ok: true };
      }),
    // Reagenda todos os atendimentos futuros da mesma série
    reagendarSerie: protectedProcedure
      .input(z.object({
        id: z.number(),
        novaHora: z.string(),
        novaData: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.reagendarSerie(input.id, input.novaHora, input.novaData);
      }),
    // Muda o profissional de todos os atendimentos futuros da mesma série
    mudarProfissionalSerie: protectedProcedure
      .input(z.object({
        id: z.number(),
        novoProfissionalId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.mudarProfissionalSerie(input.id, input.novoProfissionalId);
        return { ok: true };
      }),
    cancelarSerie: protectedProcedure
      .input(z.object({
        serieId: z.string(),
        apenasAPartirDe: z.string().optional(), // data ISO, cancela apenas futuros
      }))
      .mutation(async ({ input }) => {
        const { atendimentos: atendimentosTable } = await import('../drizzle/schema');
        const { eq, and, gte } = await import('drizzle-orm');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const where = input.apenasAPartirDe
          ? and(eq(atendimentosTable.serieId, input.serieId), gte(atendimentosTable.data, new Date(input.apenasAPartirDe)))
          : eq(atendimentosTable.serieId, input.serieId);
        const result = await drizzle.update(atendimentosTable)
          .set({ status: 'cancelado' })
          .where(where);
        return { cancelados: (result as any)[0]?.affectedRows ?? 0 };
      }),

    passarEmSerie: protectedProcedure
      .input(z.object({
        atendimentoId: z.number(),
        frequencia: z.enum(['semanal', 'quinzenal', 'mensal']),
        quantidade: z.number().min(1).max(52),
        dataInicio: z.string().optional(), // data ISO yyyy-MM-dd para iniciar a série
      }))
      .mutation(async ({ input, ctx }) => {
        const { atendimentos: atendimentosTable } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const { randomUUID } = await import('crypto');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const [base] = await drizzle.select().from(atendimentosTable).where(eq(atendimentosTable.id, input.atendimentoId)).limit(1);
        if (!base) throw new Error('Atendimento não encontrado');
        // Usar dataInicio se fornecida, caso contrário usar a data do atendimento base.
        const baseDateStr = input.dataInicio || (typeof base.data === 'string' ? base.data : new Date(base.data).toISOString().substring(0, 10));
        const baseDate = new Date(baseDateStr + 'T12:00:00Z');
        let serieId = base.serieId || randomUUID();
        if (base.serieId) {
          const [primeiraSessaoDaSerie] = await drizzle
            .select({ data: atendimentosTable.data })
            .from(atendimentosTable)
            .where(eq(atendimentosTable.serieId, base.serieId))
            .orderBy(asc(atendimentosTable.data))
            .limit(1);
          if (serieDeveIniciarNovoMes(primeiraSessaoDaSerie?.data, baseDate)) {
            serieId = randomUUID();
          }
        }
        // Atualizar o atendimento base com o serieId
        await drizzle.update(atendimentosTable).set({ serieId }).where(eq(atendimentosTable.id, base.id));
        const criados: number[] = [];
        for (let i = 1; i <= input.quantidade; i++) {
          const novaData = new Date(baseDate);
          if (input.frequencia === 'semanal') novaData.setDate(novaData.getDate() + 7 * i);
          else if (input.frequencia === 'quinzenal') novaData.setDate(novaData.getDate() + 14 * i);
          else novaData.setMonth(novaData.getMonth() + i);
          const dataLimite = new Date(novaData.getTime() + 72 * 60 * 60 * 1000);
          const [criado] = await drizzle.insert(atendimentosTable).values({
            pacienteId: base.pacienteId,
            profissionalId: base.profissionalId,
            convenioId: base.convenioId,
            data: novaData,
            hora: base.hora,
            duracao: base.duracao,
            tipo: base.tipo,
            descricao: base.descricao,
            status: 'agendado',
            serieId,
            recorrencia: input.frequencia,
            procedimentoConvenioId: base.procedimentoConvenioId,
            dataLimiteProntuario: dataLimite,
          } as any).$returningId();
                    if (criado?.id) criados.push(criado.id);
        }
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'atendimento',
          entidadeId: input.atendimentoId,
          acao: 'CRIAR_SERIE',
          descricao: `Série ${input.frequencia} criada com ${criados.length} atendimentos (serieId: ${serieId})`,
          ip: (ctx.req as any)?.ip || null,
        });
        return { criados: criados.length, serieId };
      }),
    enviarSmsSerie: protectedProcedure
      .input(z.object({
        atendimentoIds: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        const { atendimentos: atendimentosTable, pacientes: pacientesTable, profissionais: profissionaisTable } = await import('../drizzle/schema');
        const { eq, inArray } = await import('drizzle-orm');
        const { sendTextMessage, buildAgendamentoMsg } = await import('./whatsapp');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const rows = await drizzle.select({
          id: atendimentosTable.id,
          data: atendimentosTable.data,
          hora: atendimentosTable.hora,
          pacienteId: atendimentosTable.pacienteId,
          profissionalId: atendimentosTable.profissionalId,
        }).from(atendimentosTable).where(inArray(atendimentosTable.id, input.atendimentoIds));
        const resultados: { id: number; enviado: boolean; erro?: string }[] = [];
        for (const row of rows) {
          try {
            const [paciente] = await drizzle.select().from(pacientesTable).where(eq(pacientesTable.id, row.pacienteId));
            const [profissional] = await drizzle.select().from(profissionaisTable).where(eq(profissionaisTable.id, row.profissionalId));
            const telefone = paciente?.whatsapp || paciente?.telefone || '';
            if (!telefone) { resultados.push({ id: row.id, enviado: false, erro: 'Sem telefone' }); continue; }
            // Usar toISOString para extrair data sem desvio de fuso (campo DATE do MySQL vem como T00:00:00.000Z)
            const rawDataStr = row.data instanceof Date ? row.data.toISOString().substring(0, 10) : String(row.data).substring(0, 10);
            const [yrF, moF, dyF] = rawDataStr.split('-');
            const dataFormatada = `${dyF}/${moF}/${yrF}`;
            const msg = buildAgendamentoMsg({
              pacienteNome: paciente?.nome || 'Paciente',
              data: dataFormatada,
              hora: row.hora,
              profissionalNome: profissional?.nome || 'Profissional',
            });
            const ok = await sendTextMessage(telefone, msg);
            resultados.push({ id: row.id, enviado: ok });
          } catch (e: any) {
            resultados.push({ id: row.id, enviado: false, erro: e?.message });
          }
        }
                return { resultados };
      }),
    // Busca pacientes com duas faltas consecutivas nos últimos 30 dias.
    getPacientesComFaltas: protectedProcedure
      .input(z.object({ minFaltas: z.number().default(2) }))
      .query(async ({ input }) => {
        const { atendimentos: atendimentosTable, pacientes: pacientesTable } = await import('../drizzle/schema');
        const { eq, and, gte, lte, asc } = await import('drizzle-orm');
        const drizzle = await getDb();
        if (!drizzle) throw new Error('DB indisponível');
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        const agora = new Date();
        
        // O histórico completo permite que um atendimento realizado interrompa
        // a sequência de faltas; consultas futuras não entram na avaliação.
        const historicoAtendimentos = await drizzle
          .select({
            pacienteId: atendimentosTable.pacienteId,
            data: atendimentosTable.data,
            id: atendimentosTable.id,
            status: atendimentosTable.status,
          })
          .from(atendimentosTable)
          .where(and(
            gte(atendimentosTable.data, trintaDiasAtras),
            lte(atendimentosTable.data, agora)
          ))
          .orderBy(atendimentosTable.pacienteId, asc(atendimentosTable.data), asc(atendimentosTable.id));
        
        // Agrupar por paciente e detectar exclusivamente pares consecutivos.
        const pacientesComFaltasConsecutivas = new Map<number, { datas: string[], totalFaltas: number }>();
        const historicoPorPaciente = new Map<number, Array<{ data: Date | string; status: string }>>();
        
        for (const atendimento of historicoAtendimentos) {
          if (!historicoPorPaciente.has(atendimento.pacienteId)) {
            historicoPorPaciente.set(atendimento.pacienteId, []);
          }
          historicoPorPaciente.get(atendimento.pacienteId)!.push({
            data: atendimento.data,
            status: atendimento.status,
          });
        }
        
        for (const [pacienteId, historico] of historicoPorPaciente) {
          const datasConsecutivas = encontrarDuasFaltasConsecutivas(historico, 30);
          if (datasConsecutivas) {
            pacientesComFaltasConsecutivas.set(pacienteId, {
              datas: datasConsecutivas,
              totalFaltas: input.minFaltas,
            });
          }
        }
        
        if (!pacientesComFaltasConsecutivas.size) return [];
        
        const pacienteIds = Array.from(pacientesComFaltasConsecutivas.keys());
        const { inArray } = await import('drizzle-orm');
        const pacientes = await drizzle.select({
          id: pacientesTable.id,
          nome: pacientesTable.nome,
          whatsapp: pacientesTable.whatsapp,
          telefone: pacientesTable.telefone,
        }).from(pacientesTable).where(inArray(pacientesTable.id, pacienteIds));
        
        const pacienteMap = new Map(pacientes.map(p => [p.id, p]));
        return Array.from(pacientesComFaltasConsecutivas.entries()).map(([pacienteId, info]) => ({
          pacienteId,
          pacienteNome: pacienteMap.get(pacienteId)?.nome || 'Desconhecido',
          whatsapp: pacienteMap.get(pacienteId)?.whatsapp || pacienteMap.get(pacienteId)?.telefone || '',
          totalFaltas: info.totalFaltas,
          datasFaltas: info.datas,
          ultimaFalta: info.datas[info.datas.length - 1],
        }));
      }),
    // Envia mensagem de alerta de faltas via WhatsApp
    enviarAlertaFaltas: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        mensagem: z.string(),
        whatsapp: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { sendTextMessage } = await import('./whatsapp');
        const ok = await sendTextMessage(input.whatsapp, input.mensagem);
        return { enviado: ok };
      }),
    extrairSolicitanteDoPedido: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const autorizado = (ctx.user as any)?.role === 'admin'
          || ['administrador', 'master', 'recepcao', 'recepção', 'recepcionista'].includes(perfil);
        if (!autorizado) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas administração ou recepção pode ler pedidos médicos para a Guia SADT.' });
        }

        const paciente = await db.getPacienteById(input.pacienteId);
        if (!paciente) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado.' });
        }

        let pedidoMedicoUrl = paciente.pedidoMedicoUrl;
        if (!pedidoMedicoUrl) {
          const { anexosPaciente } = await import('../drizzle/schema');
          const drizzle = await getDb();
          const anexosPedido = drizzle
            ? await drizzle
              .select({ fileUrl: anexosPaciente.fileUrl })
              .from(anexosPaciente)
              .where(and(
                eq(anexosPaciente.pacienteId, input.pacienteId),
                sql`LOWER(${anexosPaciente.categoria}) = 'pedido_medico'`,
              ))
              .orderBy(desc(anexosPaciente.createdAt))
              .limit(1)
            : [];
          pedidoMedicoUrl = anexosPedido[0]?.fileUrl || null;
        }
        if (!pedidoMedicoUrl) {
          return { encontrou: false, salvoAutomaticamente: false, motivo: 'O paciente não possui pedido médico anexado.', dados: null };
        }

        const resultado = await extrairSolicitanteDoPedidoMedico(pedidoMedicoUrl);
        if (!resultado.dados) return resultado;

        const camposParaSalvar = camposAusentesDoSolicitante(paciente, resultado.dados);
        if (Object.keys(camposParaSalvar).length > 0) {
          await db.updatePaciente(input.pacienteId, camposParaSalvar as any);
          await registrarAuditoria({
            usuarioId: ctx.user.id,
            usuarioNome: (ctx.user as any).name || null,
            usuarioPerfil: perfil || null,
            entidade: 'paciente',
            entidadeId: input.pacienteId,
            acao: 'EXTRAIR_SOLICITANTE_PEDIDO_MEDICO',
            descricao: 'Dados do profissional solicitante preenchidos a partir do pedido médico anexado, sem substituir campos existentes.',
            ip: (ctx.req as any)?.ip || null,
          });
        }

        return { ...resultado, salvoAutomaticamente: Object.keys(camposParaSalvar).length > 0 };
      }),
  }),
  guias: router({
    create: protectedProcedure
      .input(
        z.object({
          numeroGuia: z.string(),
          pacienteId: z.number(),
          profissionalId: z.number(),
          convenioId: z.number(),
          autorizacaoId: z.number().optional(),
          atendimentoId: z.number().optional(),
          serieId: z.string().optional(),
          vincularSerie: z.boolean().optional(),
          serieNumero: z.number().optional(),
          serieSessaoInicio: z.number().optional(),
          serieSessaoFim: z.number().optional(),
          dataEmissao: z.string(),
          procedimento: z.string(),
          valor: z.string(),
          status: z.enum(["rascunho", "emitida", "enviada", "processada", "paga", "glosa"]).optional(),
          numeroCarteira: z.string().optional(),
          validadeCarteira: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro de conexão ao criar a guia' });
        const { guias: guiasTable, atendimentos: atendimentosTable } = await import('../drizzle/schema');

	        // Uma série possui uma única guia. Se já existir, reaproveita-a e liga
	        // todas as sessões do conjunto, sem abrir outra guia nem outro saldo.
        if (input.vincularSerie && input.serieId) {
          const guiaExistente = await drizzleDb
            .select({ id: guiasTable.id })
            .from(guiasTable)
            .where(and(
              eq(guiasTable.serieId, input.serieId),
              eq(guiasTable.pacienteId, input.pacienteId),
              eq(guiasTable.profissionalId, input.profissionalId),
              eq(guiasTable.convenioId, input.convenioId),
            ))
            .limit(1);

	          if (guiaExistente[0]) {
	            await drizzleDb
	              .update(atendimentosTable)
	              .set({ guiaId: guiaExistente[0].id } as any)
	              .where(and(
	                eq(atendimentosTable.serieId, input.serieId),
	                eq(atendimentosTable.pacienteId, input.pacienteId),
	                eq(atendimentosTable.profissionalId, input.profissionalId),
	                eq(atendimentosTable.convenioId, input.convenioId),
	              ));
            return { guiaId: guiaExistente[0].id, reutilizada: true };
          }
        }

        const novaGuia = await db.createGuia({
          numeroGuia: input.numeroGuia,
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          convenioId: input.convenioId,
          autorizacaoId: input.autorizacaoId,
          atendimentoId: input.atendimentoId,
          serieId: input.vincularSerie ? input.serieId || null : null,
          serieNumero: input.vincularSerie ? input.serieNumero || null : null,
          serieSessaoInicio: input.vincularSerie ? input.serieSessaoInicio || null : null,
          serieSessaoFim: input.vincularSerie ? input.serieSessaoFim || null : null,
          dataEmissao: new Date(input.dataEmissao + 'T12:00:00'),
          procedimento: input.procedimento,
          valor: parseFloat(input.valor) as any,
          status: input.status || "rascunho",
          numeroCarteira: input.numeroCarteira || null,
          validadeCarteira: input.validadeCarteira ? new Date(input.validadeCarteira) : null,
        });
        const guiaId = extrairIdDaGuiaCriada(novaGuia);

	        // Guia criada a partir da Agenda deve ficar ligada imediatamente à
	        // sessão de origem ou a toda a série, quando ela for informada.
        if (guiaId != null && input.vincularSerie && input.serieId) {
	          await drizzleDb
	            .update(atendimentosTable)
	            .set({ guiaId } as any)
	            .where(and(
	              eq(atendimentosTable.serieId, input.serieId),
	              eq(atendimentosTable.pacienteId, input.pacienteId),
	              eq(atendimentosTable.profissionalId, input.profissionalId),
	              eq(atendimentosTable.convenioId, input.convenioId),
	            ));
	        } else if (input.atendimentoId && guiaId != null) {
          await drizzleDb
            .update(atendimentosTable)
            .set({ guiaId } as any)
            .where(eq(atendimentosTable.id, input.atendimentoId));
        }

        return { guiaId, reutilizada: false };
      }),
    list: protectedProcedure.query(() => db.getGuias()),
    listByPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        const todas = await db.getGuias();
        return (todas as any[]).filter((g: any) => g.pacienteId === input.pacienteId);
      }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => getGuiaById(input.id)),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          numeroGuia: z.string().optional(),
          pacienteId: z.number().optional(),
          profissionalId: z.number().optional(),
          convenioId: z.number().optional(),
          dataEmissao: z.string().optional(),
          procedimento: z.string().optional(),
          codigoTUSS: z.string().optional(),
          cid: z.string().optional(),
          valor: z.string().optional(),
          status: z.enum(["rascunho", "emitida", "enviada", "processada", "paga", "glosa"]).optional(),
          observacoes: z.string().optional(),
          dataAtendimento: z.string().optional(),
          horaAtendimento: z.string().optional(),
          numeroGuiaInterno: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = {};
        
        if (data.numeroGuia !== undefined) updateData.numeroGuia = data.numeroGuia;
        if (data.pacienteId !== undefined) updateData.pacienteId = data.pacienteId;
        if (data.profissionalId !== undefined) updateData.profissionalId = data.profissionalId;
        if (data.convenioId !== undefined) updateData.convenioId = data.convenioId;
        // Não substituir uma data válida já armazenada por "Invalid Date".
        // A normalização também preserva o dia no fuso de Manaus.
        const dataEmissaoNormalizada = normalizarDataExecucaoCampo36(data.dataEmissao);
        if (dataEmissaoNormalizada) {
          updateData.dataEmissao = new Date(`${dataEmissaoNormalizada}T12:00:00.000Z`);
        }
        if (data.procedimento !== undefined) updateData.procedimento = data.procedimento;
        if (data.codigoTUSS !== undefined) updateData.codigoTUSS = data.codigoTUSS;
        if (data.cid !== undefined) updateData.cid = data.cid;
        if (data.valor !== undefined) updateData.valor = data.valor;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
        if (data.dataAtendimento !== undefined) updateData.dataAtendimento = new Date(data.dataAtendimento + 'T12:00:00');
        if (data.horaAtendimento !== undefined) updateData.horaAtendimento = data.horaAtendimento;
        if (data.numeroGuiaInterno !== undefined) updateData.numeroGuiaInterno = data.numeroGuiaInterno;
        
        return await updateGuia(id, updateData);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteGuia(input.id);
        return { success: true };
      }),

    exportXML: protectedProcedure
      .input(z.object({ guiaIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        const guias = await db.getGuias();
        const selectedGuias = guias.filter(g => input.guiaIds.includes(g.id));
        
        // Buscar dados relacionados
        const pacientes = await db.getPacientes();
        const profissionais = await db.getProfissionais();
        const convenios = await db.getConvenios();
        
        // Gerar XML TISS
        const xml = generateTISSXML(selectedGuias, pacientes, profissionais, convenios);
        
        return {
          xml,
          filename: `guias_tiss_${new Date().toISOString().split('T')[0]}.xml`
        };
      }),

    // ===== TISS SP/SADT: campos, procedimentos e geracao de XML padrao ANS =====
    getProcedimentos: protectedProcedure
      .input(z.object({ guiaId: z.number() }))
      .query(({ input }) => db.getGuiaProcedimentos(input.guiaId)),

    // Busca todos os dados enriquecidos de uma guia existente para preencher o prefaturamento
    getDadosGuiaPrefaturamento: protectedProcedure
      .input(z.object({ guiaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDadosGuiaPrefaturamento(input.guiaId);
      }),

    getHistoricoGuiasPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input }) => {
        const drizzleDb = await getDb();
        if (!drizzleDb) return [];
        const { guias: guiasTable, profissionais: profissionaisTable, convenios: conveniosTable } = await import('../drizzle/schema');
        const { eq: eqOp, desc: descOp } = await import('drizzle-orm');
        const rows = await drizzleDb
          .select({
            id: guiasTable.id,
            numeroGuia: guiasTable.numeroGuia,
            numeroGuiaInterno: guiasTable.numeroGuiaInterno,
            dataEmissao: guiasTable.dataEmissao,
            status: guiasTable.status,
            valor: guiasTable.valor,
            valorTotalGeral: guiasTable.valorTotalGeral,
            procedimento: guiasTable.procedimento,
            senhaAutorizacao: guiasTable.senhaAutorizacao,
            numeroGuiaPrincipal: guiasTable.numeroGuiaPrincipal,
            totalSessoes: guiasTable.totalSessoes,
            profissionalId: guiasTable.profissionalId,
            convenioId: guiasTable.convenioId,
            createdAt: guiasTable.createdAt,
          })
          .from(guiasTable)
          .where(eqOp(guiasTable.pacienteId, input.pacienteId))
          .orderBy(descOp(guiasTable.createdAt));
        const profissionaisAll = await drizzleDb.select({ id: profissionaisTable.id, nome: profissionaisTable.nome }).from(profissionaisTable);
        const conveniosAll = await drizzleDb.select({ id: conveniosTable.id, nome: conveniosTable.nome }).from(conveniosTable);
        return rows.map((g: any) => ({
          ...g,
          serieId: (g as any).serieId ?? null,
          serieNumero: (g as any).serieNumero ?? null,
          serieSessaoInicio: (g as any).serieSessaoInicio ?? null,
          serieSessaoFim: (g as any).serieSessaoFim ?? null,
          nomeProfissional: profissionaisAll.find((p: any) => p.id === g.profissionalId)?.nome || '',
          nomeConvenio: conveniosAll.find((c: any) => c.id === g.convenioId)?.nome || '',
        }));
      }),

    criarGuiasPorSerie: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        profissionalId: z.number(),
        convenioId: z.number(),
        seriesAtendimentos: z.array(z.object({
          serieId: z.string(),
          serieNumero: z.number(),
          atendimentoIds: z.array(z.number()),
          procedimento: z.string(),
          valor: z.string(),
          dataEmissao: z.string(),
          numeroCarteira: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro de conexão com o banco' });
        const { guias: guiasTable, atendimentos: atendimentosTable } = await import('../drizzle/schema');
        const { eq: eqOp, inArray: inArrayOp } = await import('drizzle-orm');
        const guiasCriadas: any[] = [];
        const guiasReutilizadas: any[] = [];
        const erros: string[] = [];
        for (const serie of input.seriesAtendimentos) {
          try {
            // A serieId identifica o conjunto de sessões. Alteração de
            // procedimento cria outra serieId antes de chegar a esta etapa.
            const guiasExistentes = await drizzleDb
              .select({ id: guiasTable.id, numeroGuia: guiasTable.numeroGuia })
              .from(guiasTable)
              .where(and(
                eqOp((guiasTable as any).serieId, serie.serieId),
                eqOp(guiasTable.pacienteId, input.pacienteId),
                eqOp(guiasTable.profissionalId, input.profissionalId),
                eqOp(guiasTable.convenioId, input.convenioId),
              ));
            const criterioDaSerie = and(
              eqOp((atendimentosTable as any).serieId, serie.serieId),
              eqOp(atendimentosTable.pacienteId, input.pacienteId),
              eqOp(atendimentosTable.profissionalId, input.profissionalId),
              eqOp(atendimentosTable.convenioId, input.convenioId),
            );
            if (guiasExistentes.length > 0) {
              const guiaExistente = guiasExistentes[0];
              await drizzleDb
                .update(atendimentosTable)
                .set({ guiaId: guiaExistente.id } as any)
                .where(criterioDaSerie);
              guiasReutilizadas.push({
                serieNumero: serie.serieNumero,
                serieId: serie.serieId,
                guiaId: guiaExistente.id,
                numeroGuia: guiaExistente.numeroGuia,
              });
              continue;
            }
            // Criar nova guia para esta série
            const numGuia = `G${Date.now()}-S${serie.serieNumero}`;
            const totalSessoes = Math.max(serie.atendimentoIds.length, 1);
            const valorTotalAutorizado = calcularValorTotalAutorizadoDaSerie(serie.valor, totalSessoes);
            const novaGuia = await db.createGuia({
              numeroGuia: numGuia,
              pacienteId: input.pacienteId,
              profissionalId: input.profissionalId,
              convenioId: input.convenioId,
              atendimentoId: serie.atendimentoIds[0] || null,
              serieId: serie.serieId,
              serieNumero: serie.serieNumero,
              serieSessaoInicio: 1,
              serieSessaoFim: serie.atendimentoIds.length,
              dataEmissao: new Date(serie.dataEmissao + 'T12:00:00'),
              procedimento: serie.procedimento,
              valor: valorTotalAutorizado as any,
              valorProcedimentos: valorTotalAutorizado as any,
              valorTotalGeral: valorTotalAutorizado as any,
              status: 'rascunho',
              totalSessoes,
              saldoSessoes: totalSessoes,
              numeroCarteira: serie.numeroCarteira || null,
            } as any);
            // Extrair o insertId do resultado MySQL (ResultSetHeader)
            const novaGuiaInsertId = (novaGuia as any)?.[0]?.insertId ?? (novaGuia as any)?.insertId ?? null;
            if (novaGuiaInsertId) {
              // A guia é do conjunto inteiro: vincular todas as sessões já
              // persistidas na série, mesmo que uma não estivesse carregada na tela.
              await drizzleDb
                .update(atendimentosTable)
                .set({ guiaId: novaGuiaInsertId } as any)
                .where(criterioDaSerie);
            }
            guiasCriadas.push({ serieNumero: serie.serieNumero, serieId: serie.serieId, guiaId: novaGuiaInsertId });
          } catch (e: any) {
            erros.push(`Série ${serie.serieNumero}: ${e.message}`);
          }
        }
        return { guiasCriadas, guiasReutilizadas, erros };
      }),

    // Vincula uma guia existente a uma série de atendimentos (migração de guias antigas)
    vincularGuiaASerie: protectedProcedure
      .input(z.object({
        guiaId: z.number(),
        serieId: z.string(),
        serieNumero: z.number().optional(),
        atendimentoIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const drizzleDb = await getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Erro de conexão com o banco' });
        const { guias: guiasTable, atendimentos: atendimentosTable } = await import('../drizzle/schema');
        const { eq: eqOp, inArray: inArrayOp } = await import('drizzle-orm');
        // Atualizar a guia com o serieId
        await drizzleDb
          .update(guiasTable)
          .set({
            serieId: input.serieId,
            serieNumero: input.serieNumero ?? 1,
          } as any)
          .where(eqOp(guiasTable.id, input.guiaId));
        // Vincular atendimentos à guia se fornecidos
        if (input.atendimentoIds && input.atendimentoIds.length > 0) {
          await drizzleDb
            .update(atendimentosTable)
            .set({ guiaId: input.guiaId } as any)
            .where(inArrayOp(atendimentosTable.id, input.atendimentoIds));
        }
        return { ok: true };
      }),

    dadosParaGuia: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .query(async ({ input }) => {
        const dados = await db.getDadosParaGuia(input.atendimentoId);
        if (!dados) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Atendimento não encontrado." });
        }
        return dados;
      }),

    salvarSPSADT: protectedProcedure
      .input(z.object({
        id: z.number(),
        // Campo 2: Nº Guia do Prestador (editável no prefaturamento) → persiste como numeroGuiaInterno
        numeroGuia: z.string().optional(),
        numeroGuiaInterno: z.string().optional(),
        // Autorização
        senhaAutorizacao: z.string().optional(),
        dataAutorizacao: z.string().nullable().optional(),
        dataValidadeSenha: z.string().nullable().optional(),
        numeroGuiaOperadora: z.string().optional(),
        numeroGuiaPrincipal: z.string().optional(),
        // Beneficiário
        numeroCarteira: z.string().optional(),
        validadeCarteira: z.string().nullable().optional(),
        atendimentoRN: z.enum(["S", "N"]).optional(),
        // Atendimento
        caraterAtendimento: z.enum(["1", "2"]).optional(),
        tipoAtendimento: z.string().optional(),
        indicacaoAcidente: z.string().optional(),
        tipoConsulta: z.string().optional(),
        regimeAtendimento: z.string().optional(),
        motivoEncerramento: z.string().optional(),
        saudeOcupacional: z.string().optional(),
        // Diagnóstico
        cid10Principal: z.string().optional(),
        indicacaoClinica: z.string().optional(),
        // Observações
        observacoesTISS: z.string().optional(),
        // Valores totais
        valorTaxasAlugueis: z.number().optional(),
        valorMateriais: z.number().optional(),
        valorOPME: z.number().optional(),
        valorMedicamentos: z.number().optional(),
        valorGasesMedicinais: z.number().optional(),
        dadosPrefaturamento: z.record(z.string(), z.unknown()).optional(),
        // Procedimentos/execuções (tabela 13)
        procedimentos: z.array(z.object({
          sequencial: z.number().optional(),
          codigoTabela: z.string().optional(),
          dataExecucao: z.string().optional(),
          horaInicial: z.string().optional(),
          horaFinal: z.string().optional(),
          codigoProcedimento: z.string(),
          descricaoProcedimento: z.string(),
          quantidadeExecutada: z.number(),
          valorUnitario: z.number(),
          reducaoAcrescimo: z.string().optional(),
          via: z.string().optional(),
          tec: z.string().optional(),
          fatorRedAcresc: z.string().optional(),
          profissionalId: z.number().optional(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, procedimentos, motivoEncerramento, saudeOcupacional, indicacaoClinica, valorOPME, valorGasesMedicinais, ...campos } = input;
        const dadosPrefaturamentoRecebidos = campos.dadosPrefaturamento
          ? removerHistoricoAssinaturasDoPrefaturamento(campos.dadosPrefaturamento as Record<string, unknown>)
          : undefined;
        const guiaAnterior = dadosPrefaturamentoRecebidos ? await getGuiaById(id) : null;
        const dadosPrefaturamentoSincronizados = dadosPrefaturamentoRecebidos
          ? sincronizarCamposCabecalhoGuiaSadt({
              ...mesclarCamposPrefaturamento(
                guiaAnterior?.dadosPrefaturamento,
                dadosPrefaturamentoRecebidos,
              ),
              numeroGuiaPrestador: campos.numeroGuiaInterno ?? campos.numeroGuia ?? (dadosPrefaturamentoRecebidos as any).numeroGuiaPrestador,
            })
          : undefined;
        const numeroGuiaSincronizado = dadosPrefaturamentoSincronizados?.numeroGuiaPrestador
          ?? campos.numeroGuiaInterno
          ?? campos.numeroGuia;
        const dataCampo22 = typeof (dadosPrefaturamentoSincronizados as any)?.dataSolicitacao === 'string'
          ? (dadosPrefaturamentoSincronizados as any).dataSolicitacao
          : undefined;

        // === VALIDAÇÃO: Senha e Número de Guia Principal duplicados ===
        if (campos.senhaAutorizacao || campos.numeroGuiaPrincipal) {
          const { getDb } = await import('./db');
          const drizzleDb = await getDb();
          if (drizzleDb) {
            const { guias: guiasTable, convenios: conveniosTable } = await import('../drizzle/schema');
            const { and: andOp, eq: eqOp, ne: neOp, or: orOp } = await import('drizzle-orm');

            // Buscar a guia atual para obter convenioId
            const guiaAtualRows = await drizzleDb.select().from(guiasTable).where(eqOp(guiasTable.id, id)).limit(1);
            const guiaAtual = guiaAtualRows[0];

            if (guiaAtual) {
              const convenioRows = await drizzleDb
                .select({ nome: conveniosTable.nome })
                .from(conveniosTable)
                .where(eqOp(conveniosTable.id, guiaAtual.convenioId))
                .limit(1);
              const convenioEhPetrobras = /petrobras/i.test(String(convenioRows[0]?.nome ?? ''));

              // Petrobras permite repetir senha e número de guia principal;
              // os demais convênios continuam protegidos contra duplicidade.
              if (!convenioEhPetrobras) {
                const condicoes: any[] = [
                neOp(guiasTable.id, id), // excluir a própria guia
                eqOp(guiasTable.convenioId, guiaAtual.convenioId), // mesmo convênio
              ];

              const camposBusca: any[] = [];
              if (campos.senhaAutorizacao && campos.senhaAutorizacao.trim() !== '') {
                camposBusca.push(eqOp(guiasTable.senhaAutorizacao, campos.senhaAutorizacao.trim()));
              }
              if (campos.numeroGuiaPrincipal && campos.numeroGuiaPrincipal.trim() !== '') {
                camposBusca.push(eqOp(guiasTable.numeroGuiaPrincipal, campos.numeroGuiaPrincipal.trim()));
              }

                if (camposBusca.length > 0) {
                const duplicadas = await drizzleDb
                  .select({ id: guiasTable.id, numeroGuia: guiasTable.numeroGuia, senhaAutorizacao: guiasTable.senhaAutorizacao, numeroGuiaPrincipal: guiasTable.numeroGuiaPrincipal, pacienteId: guiasTable.pacienteId })
                  .from(guiasTable)
                  .where(andOp(...condicoes, orOp(...camposBusca)))
                  .limit(5);

                  if (duplicadas.length > 0) {
                  const detalhes = duplicadas.map(g => {
                    const motivos: string[] = [];
                    if (campos.senhaAutorizacao && g.senhaAutorizacao === campos.senhaAutorizacao.trim()) {
                      motivos.push(`senha "${g.senhaAutorizacao}"`);
                    }
                    if (campos.numeroGuiaPrincipal && g.numeroGuiaPrincipal === campos.numeroGuiaPrincipal.trim()) {
                      motivos.push(`número de guia principal "${g.numeroGuiaPrincipal}"`);
                    }
                    return `Guia #${g.numeroGuia} (${motivos.join(', ')})`;
                  }).join('; ');
                  throw new TRPCError({
                    code: 'CONFLICT',
                    message: `DUPLICADO: ${detalhes}. Verifique antes de salvar.`,
                  });
                  }
                }
              }
            }
          }
        }
        // === FIM DA VALIDAÇÃO ===

        const updateData: any = {};
        // Campo 2: Nº Guia do Prestador. O número do prestador fica no campo
        // interno editável; `guias.numeroGuia` é o identificador técnico único
        // criado pelo sistema e não pode ser substituído por um número já usado
        // em outra guia (caso Petrobras 7860002/4500005).
        if (numeroGuiaSincronizado !== undefined) {
          updateData.numeroGuiaInterno = numeroGuiaSincronizado;
        }
        // Autorização
        if (campos.senhaAutorizacao !== undefined) updateData.senhaAutorizacao = campos.senhaAutorizacao;
        const dataAutorizacaoSincronizada = dataCampo22 ?? campos.dataAutorizacao;
        const dataAutorizacaoParaBanco = converterDataCalendarioParaBanco(
          dataAutorizacaoSincronizada,
          'Data da Autorização',
        );
        const dataValidadeSenhaParaBanco = converterDataCalendarioParaBanco(
          campos.dataValidadeSenha,
          'Data de Validade da Senha',
        );
        const validadeCarteiraParaBanco = converterDataCalendarioParaBanco(
          campos.validadeCarteira,
          'Validade da Carteira',
        );
        if (dataAutorizacaoParaBanco !== undefined) updateData.dataAutorizacao = dataAutorizacaoParaBanco;
        if (dataValidadeSenhaParaBanco !== undefined) updateData.dataValidadeSenha = dataValidadeSenhaParaBanco;
        if (campos.numeroGuiaOperadora !== undefined) updateData.numeroGuiaOperadora = campos.numeroGuiaOperadora;
        if (campos.numeroGuiaPrincipal !== undefined) updateData.numeroGuiaPrincipal = campos.numeroGuiaPrincipal;
        // Beneficiário
        if (campos.numeroCarteira !== undefined) updateData.numeroCarteira = campos.numeroCarteira;
        if (validadeCarteiraParaBanco !== undefined) updateData.validadeCarteira = validadeCarteiraParaBanco;
        if (campos.atendimentoRN !== undefined) updateData.atendimentoRN = campos.atendimentoRN;
        // Atendimento
        if (campos.caraterAtendimento !== undefined) updateData.caraterAtendimento = campos.caraterAtendimento;
        if (campos.tipoAtendimento !== undefined) updateData.tipoAtendimento = campos.tipoAtendimento;
        if (campos.indicacaoAcidente !== undefined) updateData.indicacaoAcidente = campos.indicacaoAcidente;
        if (campos.tipoConsulta !== undefined) updateData.tipoConsulta = campos.tipoConsulta;
        if (campos.regimeAtendimento !== undefined) updateData.regimeAtendimento = campos.regimeAtendimento;
        // Diagnóstico
        if (campos.cid10Principal !== undefined) updateData.cid10Principal = campos.cid10Principal;
        if (indicacaoClinica !== undefined) updateData.indicacaoClinica = indicacaoClinica;
        if (motivoEncerramento !== undefined) updateData.motivoEncerramento = motivoEncerramento;
        if (saudeOcupacional !== undefined) updateData.saudeOcupacional = saudeOcupacional;
        // Observações
        if (campos.observacoesTISS !== undefined) updateData.observacoesTISS = campos.observacoesTISS;
        // Valores totais adicionais
        if (campos.valorTaxasAlugueis !== undefined) updateData.valorTaxasAlugueis = String(campos.valorTaxasAlugueis);
        if (campos.valorMateriais !== undefined) updateData.valorMateriais = String(campos.valorMateriais);
        if (valorOPME !== undefined) updateData.valorOPME = String(valorOPME);
        if (campos.valorMedicamentos !== undefined) updateData.valorMedicamentos = String(campos.valorMedicamentos);
        if (valorGasesMedicinais !== undefined) updateData.valorGasesMedicinais = String(valorGasesMedicinais);
        if (dadosPrefaturamentoSincronizados !== undefined) updateData.dadosPrefaturamento = serializarCamposPrefaturamento(dadosPrefaturamentoSincronizados);

        if (procedimentos) {
          const itens = procedimentos.map((p, idx) => {
            const dataExecucaoNormalizada = normalizarDataExecucaoCampo36(p.dataExecucao);
            return {
            // O sequencial TISS é a posição da execução, não o id visual da linha.
            sequencial: idx + 1,
            codigoTabela: p.codigoTabela,
            // Meio-dia UTC preserva o dia do campo DATE no fuso de Manaus.
            dataExecucao: dataExecucaoNormalizada ? new Date(`${dataExecucaoNormalizada}T12:00:00.000Z`) : null,
            horaInicial: p.horaInicial || null,
            horaFinal: p.horaFinal || null,
            codigoProcedimento: p.codigoProcedimento,
            descricaoProcedimento: p.descricaoProcedimento,
            quantidadeExecutada: String(p.quantidadeExecutada) as any,
            valorUnitario: String(p.valorUnitario) as any,
            valorTotal: String(p.quantidadeExecutada * p.valorUnitario) as any,
            reducaoAcrescimo: p.reducaoAcrescimo ? String(p.reducaoAcrescimo).replace(',', '.') : undefined,
            profissionalId: p.profissionalId ?? null,
            };
          });
          await db.setGuiaProcedimentos(id, itens as any);
          const totalProc = procedimentos.reduce((s, p) => s + p.quantidadeExecutada * p.valorUnitario, 0);
          updateData.valorProcedimentos = String(totalProc) as any;
          // Calcular total geral incluindo todos os valores (campo 65)
          const totalGeral = totalProc
            + (campos.valorTaxasAlugueis || 0)
            + (campos.valorMateriais || 0)
            + (valorOPME || 0)
            + (campos.valorMedicamentos || 0)
            + (valorGasesMedicinais || 0);
          updateData.valorTotalGeral = String(totalGeral) as any;
        } else {
          // Sem procedimentos: recalcular valorTotalGeral apenas com os sub-totais enviados
          // (garante que a tabela principal reflicta o campo 65 mesmo sem execuções)
          const hasSubTotais = campos.valorTaxasAlugueis !== undefined
            || campos.valorMateriais !== undefined
            || valorOPME !== undefined
            || campos.valorMedicamentos !== undefined
            || valorGasesMedicinais !== undefined;
          if (hasSubTotais) {
            const totalGeral =
              (campos.valorTaxasAlugueis || 0)
              + (campos.valorMateriais || 0)
              + (valorOPME || 0)
              + (campos.valorMedicamentos || 0)
              + (valorGasesMedicinais || 0);
            // Somar ao valorProcedimentos já existente (buscar da BD)
            const guiaAtual = await db.getGuiaPorId(id);  // db.* inclui getGuiaPorId via import * as db
            const procExistente = parseFloat(String((guiaAtual as any)?.valorProcedimentos || '0'));
            updateData.valorTotalGeral = String(totalGeral + procExistente) as any;
          }
        }
        return await db.updateGuiaTISS(id, updateData);
      }),

    criarGuiaParaSerie: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        profissionalId: z.number(),
        convenioId: z.number(),
        serieId: z.string(),
        serieNumero: z.number(),
        totalSessoes: z.number(),
        dataEmissao: z.string(),
        procedimento: z.string(),
        valor: z.string(),
        numeroCarteira: z.string().optional(),
        validadeCarteira: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // 1. Verificar se ja existe guia para esta serie
        const { guias: guiasTable } = await import('../drizzle/schema');
        const { eq: eqOp } = await import('drizzle-orm');
        const drizzleDb = await db.getDb();
        if (!drizzleDb) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database connection failed' });
        const guiasExistentes = await drizzleDb
          .select({ id: (guiasTable as any).id })
          .from(guiasTable as any)
          .where(eqOp((guiasTable as any).serieId, input.serieId));
        if (guiasExistentes.length > 0) {
          throw new TRPCError({ code: 'CONFLICT', message: `Serie ${input.serieNumero} ja possui uma guia.` });
        }
        // 2. Gerar numero de guia unico: XXXXXX-0N (ex: 000123-01, 000123-02)
        const guiasDoPackiente = await drizzleDb
          .select({ numeroGuia: (guiasTable as any).numeroGuia })
          .from(guiasTable as any)
          .where(eqOp((guiasTable as any).pacienteId, input.pacienteId))
          .limit(1);
        let guiaPrincipalNum = '000001';
        if (guiasDoPackiente.length > 0) {
          const primeiraGuia = guiasDoPackiente[0].numeroGuia;
          const match = primeiraGuia.match(/^(\d+)-/);
          if (match) {
            guiaPrincipalNum = match[1];
          }
        } else {
          guiaPrincipalNum = String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0');
        }
        const numeroGuiaSerie = `${guiaPrincipalNum}-${String(input.serieNumero).padStart(2, '0')}`;
        // 3. Gerar senha unica
        const senhaAutorizacao = `${guiaPrincipalNum.substring(0, 3)}${String(input.serieNumero).padStart(3, '0')}`;
        // 4. Calcular valor total: valor unitário × quantidade de sessões
        const valorTotal = calcularValorTotalAutorizadoDaSerie(input.valor, input.totalSessoes);
        // 5. Criar guia para a serie
        const novaGuia = await db.createGuia({
          numeroGuia: numeroGuiaSerie,
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          convenioId: input.convenioId,
          serieId: input.serieId,
          serieNumero: input.serieNumero,
          serieSessaoInicio: 1,
          serieSessaoFim: input.totalSessoes,
          dataEmissao: new Date(input.dataEmissao + 'T12:00:00'),
          procedimento: input.procedimento,
          valor: valorTotal as any,
          valorProcedimentos: valorTotal as any,
          valorTotalGeral: valorTotal as any,
          status: 'rascunho',
          totalSessoes: input.totalSessoes,
          saldoSessoes: input.totalSessoes,
          senhaAutorizacao: senhaAutorizacao,
          numeroCarteira: input.numeroCarteira || null,
          validadeCarteira: input.validadeCarteira ? new Date(input.validadeCarteira) : null,
        } as any);
        return {
          numeroGuia: numeroGuiaSerie,
          senhaAutorizacao: senhaAutorizacao,
          saldoSessoes: input.totalSessoes,
          guiaId: (novaGuia as any)?.insertId || (novaGuia as any)?.[0]?.insertId,
        };
      }),
  }),

  faturamentoTISS: router({
    getPrestador: adminPerfilProcedure.query(() => db.getDadosPrestador()),
    // Retorna apenas o nome da clínica (acessível a todos os perfis autenticados)
    getNomeClinica: protectedProcedure.query(async () => {
      const prestador = await db.getDadosPrestador();
      return {
        nome: prestador?.nomeFantasia || prestador?.razaoSocial || 'Clínica',
        logoUrl: (prestador as any)?.logoUrl || null,
      };
    }),
    salvarPrestador: adminPerfilProcedure
      .input(z.object({
        razaoSocial: z.string(),
        nomeFantasia: z.string().optional(),
        cnpj: z.string(),
        cnes: z.string().optional(),
        codigoPrestadorNaOperadora: z.string().optional(),
        cep: z.string().optional(),
        logradouro: z.string().optional(),
        numero: z.string().optional(),
        complemento: z.string().optional(),
        bairro: z.string().optional(),
        cidade: z.string().optional(),
        estado: z.string().optional(),
        telefone: z.string().optional(),
        celular: z.string().optional(),
        email: z.string().optional(),
        site: z.string().optional(),
        banco: z.string().optional(),
        agencia: z.string().optional(),
        conta: z.string().optional(),
        tipoConta: z.string().optional(),
        pix: z.string().optional(),
        nomeResponsavel: z.string().optional(),
        cpfResponsavel: z.string().optional(),
        crmResponsavel: z.string().optional(),
        emailResponsavel: z.string().optional(),
        telefoneResponsavel: z.string().optional(),
        registroANS: z.string().optional(),
        inscricaoEstadual: z.string().optional(),
        inscricaoMunicipal: z.string().optional(),
        logoUrl: z.string().optional(),
      }))
      .mutation(({ input }) => db.salvarDadosPrestador(input as any)),
    listLotes: adminPerfilProcedure.query(() => db.getLotesFaturamento()),
    getLoteComGuias: adminPerfilProcedure
      .input(z.object({ loteId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const resultado = await db.getLoteFaturamentoComGuias(input.loteId);
        if (!resultado) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Lote não encontrado.' });
        }
        return resultado;
      }),
    excluirLote: adminPerfilProcedure
      .input(z.object({ loteId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          return await db.excluirLoteFaturamentoGerado(input.loteId);
        } catch (error: any) {
          throw new TRPCError({
            code: error?.message === "Lote não encontrado." ? "NOT_FOUND" : "BAD_REQUEST",
            message: error?.message || "Não foi possível excluir o lote.",
          });
        }
      }),
    gerarLote: adminPerfilProcedure
      .input(z.object({
        convenioId: z.number(),
        guiaIds: z.array(z.number()).min(1),
        numeroLote: z.string(),
      }))
      .mutation(async ({ input }) => {
        const prestador = await db.getDadosPrestador();
        if (!prestador) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cadastre os dados do prestador antes de gerar o lote." });
        }
        const convenio = (await db.getConvenios()).find((c) => c.id === input.convenioId);
        if (!convenio) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Convenio nao encontrado." });
        }
        const codigoPrestadorTiss = resolverCodigoClinicaNaOperadoraTiss({
          codigoNaOperadora: (convenio as any).codigoNaOperadora,
          codigoPrestadorNaOperadora: prestador.codigoPrestadorNaOperadora,
          cnpj: prestador.cnpj,
        });
        const ehPostalSaude = ehConvenioPostalSaude((convenio as any).nome);
        const ehLuminar = ehConvenioLuminar((convenio as any).nome);
        const exigeLoteTissNormalizado = convenioExigeNumeroLoteTissA12((convenio as any).nome);
        const numeroLoteTiss = exigeLoteTissNormalizado
          ? normalizarNumeroLoteTiss(input.numeroLote)
          : input.numeroLote;
        const todasGuias = await db.getGuias();
        // Filtrar apenas guias com status 'emitida' das seleccionadas
        const selecionadas = todasGuias.filter((g) => input.guiaIds.includes(g.id) && g.status === 'emitida');
        if (selecionadas.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma guia com status \"emitida\" encontrada. Apenas guias emitidas podem ser incluídas num lote." });
        }
        const pacientesAll = await db.getPacientes();
        const profissionaisAll = await db.getProfissionais();

        const { gerarXmlTissSPSADT, validarProfissionalParaXML } = await import("./tissXml");
        const guiasTiss = [] as any[];
        for (const g of selecionadas) {
          const paciente = pacientesAll.find((p) => p.id === g.pacienteId);
          const profissional = profissionaisAll.find((p) => p.id === g.profissionalId);
          if (!paciente || !profissional) continue;
          const solicitanteTiss = resolverDadosSolicitanteTiss({
            dadosPrefaturamento: (g as any).dadosPrefaturamento,
            codigoPrestadorPadrao: codigoPrestadorTiss,
            profissionalPadrao: profissional as any,
          });
          // Validação TISS: Conselho (Tabela 26) × CBO (Tabela 24)
          const codigoConselhoProfissional = (profissional as any).codigoConselho || "11";
          const codigoCBOProfissional = resolverCodigoCboProfissionalTiss(profissional as any);
          try { validarProfissionalParaXML(codigoConselhoProfissional, codigoCBOProfissional); } catch (e: any) { console.warn(`[TISS] Aviso validação profissional ${profissional.nome}: ${e.message}`); }
          let procs = await db.getGuiaProcedimentos(g.id);
          if (procs.length === 0) {
            procs = [{
              sequencial: 1,
              codigoProcedimento: (g as any).codigoTUSS || "00000000",
              descricaoProcedimento: g.procedimento,
              quantidadeExecutada: "1",
              valorUnitario: String(g.valor),
              valorTotal: String(g.valor),
            } as any];
          }
          const valorProcedimentos = procs.reduce((s, p) => s + Number(p.valorTotal), 0);
          const valorTotalGeral = Number((g as any).valorTotalGeral ?? valorProcedimentos);
          guiasTiss.push({
            numeroGuiaPrestador: (g as any).numeroGuiaInterno || g.numeroGuia,
            numeroGuiaOperadora: g.numeroGuiaOperadora,
            registroANS: resolverRegistroAnsDoConvenio(convenio),
            senhaAutorizacao: g.senhaAutorizacao,
            dataAutorizacao: g.dataAutorizacao ? new Date(g.dataAutorizacao as any).toISOString().split("T")[0] : null,
            numeroCarteira: g.numeroCarteira || "",
            atendimentoRN: (g.atendimentoRN as any) || "N",
            nomeBeneficiario: paciente.nome,
            codigoPrestadorNaOperadora: codigoPrestadorTiss,
            codigoPrestadorSolicitante: solicitanteTiss.codigoPrestadorSolicitante,
            nomeContratado: prestador.razaoSocial || prestador.nomeFantasia,
            cnes: prestador.cnes,
            dataSolicitacao: g.dataEmissao ? new Date(g.dataEmissao).toISOString().substring(0, 10) : undefined,
            nomeProfissional: profissional.nome,
            nomeProfissionalSolicitante: solicitanteTiss.nomeProfissionalSolicitante,
            conselhoProfissionalSolicitante: solicitanteTiss.conselhoProfissionalSolicitante,
            numeroConselhoSolicitante: solicitanteTiss.numeroConselhoSolicitante,
            ufSolicitante: solicitanteTiss.ufSolicitante,
            cbosSolicitante: solicitanteTiss.codigoCBOSolicitante,
            conselhoProfissional: (profissional as any).codigoConselho || "11",
            cbos: codigoCBOProfissional || undefined,
            numeroConselhoProfissional: (profissional as any).numeroConselho || (profissional as any).crm || "",
            ufConselho: (profissional as any).uf || "AM",
            caraterAtendimento: (g.caraterAtendimento as any) || "1",
            tipoAtendimento: g.tipoAtendimento || "23",
            indicacaoAcidente: g.indicacaoAcidente || "9",
            // Campos novos TISS 4.02.00
            regimeAtendimento: (g as any).regimeAtendimento || "01",
            saudeOcupacional: (g as any).saudeOcupacional || undefined,
            motivoEncerramento: (g as any).motivoEncerramento || undefined,
            cid10Principal: g.cid10Principal,
            indicacaoClinica: (g as any).indicacaoClinica || undefined,
            procedimentos: procs.map((p) => ({
              sequencial: p.sequencial,
              dataExecucao: p.dataExecucao ? new Date(p.dataExecucao as any).toISOString().split("T")[0] : undefined,
              horaInicio: p.horaInicial || undefined,
              horaFim: p.horaFinal || undefined,
              codigoProcedimento: p.codigoProcedimento,
              descricaoProcedimento: p.descricaoProcedimento,
              quantidadeExecutada: Number(p.quantidadeExecutada),
              valorUnitario: Number(p.valorUnitario),
              valorTotal: Number(p.valorTotal),
              equipeSadt: resolverEquipeSadtTiss({
                dadosPrefaturamento: (g as any).dadosPrefaturamento,
                sequencial: Number(p.sequencial) || 1,
                profissionalDoProcedimento: p.profissionalId ? profissionaisAll.find(item => item.id === p.profissionalId) : undefined,
                profissionalDaGuia: profissional,
                profissionaisExecutantes: profissionaisAll,
              }),
            })),
            valorProcedimentos,
            valorTotalGeral,
          });
        }
        if (guiasTiss.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Nenhuma guia valida para faturar (verifique paciente/profissional)." });
        }
        const valorTotalLote = guiasTiss.reduce((s, g) => s + g.valorTotalGeral, 0);
        const seq = Date.now().toString().slice(-9);
        const cnpjPrestadorTiss = normalizarCnpjPrestadorTiss(prestador.cnpj);
        const { xml, hash } = gerarXmlTissSPSADT({
          sequencialTransacao: seq,
          numeroLote: numeroLoteTiss,
          limitarNumeroLoteA12: exigeLoteTissNormalizado,
          identificarPrestadorPorCnpj: ehPostalSaude || ehLuminar,
          // O download do navegador serializa a string como UTF-8; a declaração
          // precisa usar a mesma codificação para o validador recalcular o MD5.
          encoding: exigeLoteTissNormalizado ? "UTF-8" : undefined,
          registroANS: resolverRegistroAnsDoConvenio(convenio),
          cnpjPrestador: cnpjPrestadorTiss,
          codigoPrestadorNaOperadora: codigoPrestadorTiss,
        }, guiasTiss);

        const lote = await db.createLoteFaturamento({
          numeroLote: numeroLoteTiss,
          convenioId: input.convenioId,
          sequencialTransacao: seq,
          registroANS: resolverRegistroAnsDoConvenio(convenio),
          cnpjPrestador: cnpjPrestadorTiss,
          codigoPrestadorNaOperadora: codigoPrestadorTiss,
          nomePrestador: prestador.razaoSocial,
          cnesPrestador: prestador.cnes,
          quantidadeGuias: guiasTiss.length,
          valorTotalLote: String(valorTotalLote) as any,
          hashXML: hash,
          status: "gerado",
          dataGeracao: new Date(),
        });
        // Vincular apenas as guias efectivamente incluídas no lote (status 'emitida')
        const guiaIdsIncluidas = selecionadas.map((g) => g.id);
        await db.vincularGuiasAoLote(lote.id, guiaIdsIncluidas);
        // Actualizar status das guias para 'enviada'
        const { updateGuia } = await import("./db-guias-update");
        await Promise.all(guiaIdsIncluidas.map((id) => updateGuia(id, { status: 'enviada' })));
        const { validarXmlTiss } = await import("./tissXsdValidacao");
        const validacao = validarXmlTiss(xml);
        return { loteId: lote.id, numeroLote: numeroLoteTiss, xml, hash, quantidadeGuias: guiasTiss.length, valorTotalLote, validacao, guiaIdsAtualizadas: guiaIdsIncluidas };
      }),
    validarXml: adminPerfilProcedure
      .input(z.object({ xml: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { validarXmlTiss } = await import("./tissXsdValidacao");
        return validarXmlTiss(input.xml);
      }),
    validarLote: adminPerfilProcedure
      .input(z.object({ loteId: z.number() }))
      .query(async ({ input }) => {
        const lote = (await db.getLotesFaturamento()).find((l) => l.id === input.loteId);
        if (!lote) throw new TRPCError({ code: "NOT_FOUND", message: "Lote nao encontrado" });
        const convenio = (await db.getConvenios()).find((c) => c.id === lote.convenioId);
        const prestador = await db.getDadosPrestador();
        const codigoPrestadorTiss = resolverCodigoClinicaNaOperadoraTiss({
          codigoNaOperadora: (convenio as any)?.codigoNaOperadora,
          codigoPrestadorNaOperadora: prestador?.codigoPrestadorNaOperadora,
          cnpj: prestador?.cnpj,
        });
        const guiasLote = await db.getGuiasPorLote(input.loteId);
        const pacientesAll = await db.getPacientes();
        const profissionaisAll = await db.getProfissionais();
        const { gerarXmlTissSPSADT, validarProfissionalParaXML } = await import("./tissXml");
        const guiasTiss = [] as any[];
        for (const g of guiasLote) {
          const paciente = pacientesAll.find((p) => p.id === g.pacienteId);
          const profissional = profissionaisAll.find((p) => p.id === g.profissionalId);
          if (!paciente || !profissional) continue;
          // Validação TISS: Conselho (Tabela 26) × CBO (Tabela 24)
          const codigoConselhoProfissional = (profissional as any).codigoConselho || "11";
          const codigoCBOProfissional = resolverCodigoCboProfissionalTiss(profissional as any);
          try { validarProfissionalParaXML(codigoConselhoProfissional, codigoCBOProfissional); } catch (e: any) { console.warn(`[TISS] Aviso validação profissional ${profissional.nome}: ${e.message}`); }
          let procs = await db.getGuiaProcedimentos(g.id);
          if (procs.length === 0) {
            procs = [{ sequencial: 1, codigoProcedimento: "00000000", descricaoProcedimento: g.procedimento, quantidadeExecutada: "1", valorUnitario: String(g.valor), valorTotal: String(g.valor) } as any];
          }
          const valorProcedimentos = procs.reduce((s, p) => s + Number(p.valorTotal), 0);
          guiasTiss.push({
            numeroGuiaPrestador: g.numeroGuia,
            registroANS: resolverRegistroAnsDoConvenio(convenio),
            numeroCarteira: g.numeroCarteira || "",
            atendimentoRN: (g.atendimentoRN as any) || "N",
            nomeBeneficiario: paciente.nome,
            codigoPrestadorNaOperadora: codigoPrestadorTiss,
            codigoPrestadorSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).codigoPrestadorSolicitante,
            nomeContratado: prestador?.razaoSocial || prestador?.nomeFantasia || "",
            nomeProfissional: profissional.nome,
            nomeProfissionalSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).nomeProfissionalSolicitante,
            conselhoProfissionalSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).conselhoProfissionalSolicitante,
            numeroConselhoSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).numeroConselhoSolicitante,
            ufSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).ufSolicitante,
            cbosSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss || lote.codigoPrestadorNaOperadora, profissionalPadrao: profissional as any }).codigoCBOSolicitante,
            conselhoProfissional: (profissional as any).codigoConselho || "11",
            cbos: (profissional as any).codigoCBO || (profissional as any).cbos || undefined,
            numeroConselhoProfissional: (profissional as any).numeroConselho || (profissional as any).crm || "",
            ufConselho: (profissional as any).uf || "AM",
            regimeAtendimento: (g as any).regimeAtendimento || "01",
            cid10Principal: g.cid10Principal,
            procedimentos: procs.map((p) => ({
              sequencial: p.sequencial,
              codigoProcedimento: p.codigoProcedimento,
              descricaoProcedimento: p.descricaoProcedimento,
              quantidadeExecutada: Number(p.quantidadeExecutada),
              valorUnitario: Number(p.valorUnitario),
              valorTotal: Number(p.valorTotal),
              equipeSadt: resolverEquipeSadtTiss({
                dadosPrefaturamento: (g as any).dadosPrefaturamento,
                sequencial: Number(p.sequencial) || 1,
                profissionalDoProcedimento: p.profissionalId ? profissionaisAll.find(item => item.id === p.profissionalId) : undefined,
                profissionalDaGuia: profissional,
                profissionaisExecutantes: profissionaisAll,
              }),
            })),
            valorProcedimentos,
            valorTotalGeral: valorProcedimentos,
          });
        }
        const ehPostalSaude = ehConvenioPostalSaude((convenio as any)?.nome);
        const ehLuminar = ehConvenioLuminar((convenio as any)?.nome);
        const exigeLoteTissNormalizado = convenioExigeNumeroLoteTissA12((convenio as any)?.nome);
        const { xml } = gerarXmlTissSPSADT({
          sequencialTransacao: lote.sequencialTransacao || "1",
          numeroLote: exigeLoteTissNormalizado ? normalizarNumeroLoteTiss(lote.numeroLote) : lote.numeroLote,
          limitarNumeroLoteA12: exigeLoteTissNormalizado,
          identificarPrestadorPorCnpj: ehPostalSaude || ehLuminar,
          encoding: exigeLoteTissNormalizado ? "UTF-8" : undefined,
          registroANS: resolverRegistroAnsDoConvenio(convenio, lote.registroANS),
          cnpjPrestador: lote.cnpjPrestador || "",
          codigoPrestadorNaOperadora: lote.codigoPrestadorNaOperadora || "",
        }, guiasTiss);
        const { validarXmlTiss } = await import("./tissXsdValidacao");
        return validarXmlTiss(xml);
      }),
    getXmlDoLote: adminPerfilProcedure
      .input(z.object({ loteId: z.number() }))
      .query(async ({ input }) => {
        const lote = (await db.getLotesFaturamento()).find((l) => l.id === input.loteId);
        if (!lote) throw new TRPCError({ code: "NOT_FOUND", message: "Lote nao encontrado" });
        const convenio = (await db.getConvenios()).find((c) => c.id === lote.convenioId);
        const prestador = await db.getDadosPrestador();
       const guiasLote = await db.getGuiasPorLote(input.loteId);
       const pacientesAll = await db.getPacientes();
        const profissionaisAll = await db.getProfissionais();
        const codigoPrestadorTiss = resolverCodigoClinicaNaOperadoraTiss({
          codigoNaOperadora: (convenio as any)?.codigoNaOperadora,
          codigoPrestadorNaOperadora: prestador?.codigoPrestadorNaOperadora,
          cnpj: prestador?.cnpj,
        });
       const { gerarXmlTissSPSADT, validarProfissionalParaXML } = await import("./tissXml");
        const guiasTiss = [] as any[];
        for (const g of guiasLote) {
          const paciente = pacientesAll.find((p) => p.id === g.pacienteId);
          const profissional = profissionaisAll.find((p) => p.id === g.profissionalId);
          if (!paciente || !profissional) continue;
          // Validação TISS: Conselho (Tabela 26) × CBO (Tabela 24)
          const codigoConselhoProfissional = (profissional as any).codigoConselho || "11";
          const codigoCBOProfissional = resolverCodigoCboProfissionalTiss(profissional as any);
          try { validarProfissionalParaXML(codigoConselhoProfissional, codigoCBOProfissional); } catch (e: any) { console.warn(`[TISS] Aviso validação profissional ${profissional.nome}: ${e.message}`); }
          let procs = await db.getGuiaProcedimentos(g.id);
          if (procs.length === 0) {
            procs = [{ sequencial: 1, codigoProcedimento: "00000000", descricaoProcedimento: g.procedimento, quantidadeExecutada: "1", valorUnitario: String(g.valor), valorTotal: String(g.valor) } as any];
          }
         const valorProcedimentos = procs.reduce((s, p) => s + Number(p.valorTotal), 0);
         guiasTiss.push({
           numeroGuiaPrestador: g.numeroGuia,
           registroANS: resolverRegistroAnsDoConvenio(convenio),
           numeroCarteira: g.numeroCarteira || "",
           atendimentoRN: (g.atendimentoRN as any) || "N",
           nomeBeneficiario: paciente.nome,
            codigoPrestadorNaOperadora: codigoPrestadorTiss,
            codigoPrestadorSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).codigoPrestadorSolicitante,
            nomeContratado: prestador?.razaoSocial || prestador?.nomeFantasia || "",
            cnes: prestador?.cnes,
            dataSolicitacao: g.dataEmissao ? new Date(g.dataEmissao).toISOString().slice(0, 10) : undefined,
           nomeProfissional: profissional.nome,
            nomeProfissionalSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).nomeProfissionalSolicitante,
            conselhoProfissionalSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).conselhoProfissionalSolicitante,
            numeroConselhoSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).numeroConselhoSolicitante,
            ufSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).ufSolicitante,
            cbosSolicitante: resolverDadosSolicitanteTiss({ dadosPrefaturamento: (g as any).dadosPrefaturamento, codigoPrestadorPadrao: codigoPrestadorTiss, profissionalPadrao: profissional as any }).codigoCBOSolicitante,
            conselhoProfissional: (profissional as any).codigoConselho || "11",
            cbos: (profissional as any).codigoCBO || (profissional as any).cbos || undefined,
           numeroConselhoProfissional: (profissional as any).numeroConselho || (profissional as any).crm || "",
           ufConselho: (profissional as any).uf || "AM",
            regimeAtendimento: (g as any).regimeAtendimento || "01",
           cid10Principal: g.cid10Principal,
            procedimentos: procs.map((p) => ({
              sequencial: p.sequencial,
              dataExecucao: p.dataExecucao ? new Date(p.dataExecucao as any).toISOString().slice(0, 10) : undefined,
              codigoProcedimento: p.codigoProcedimento,
              descricaoProcedimento: p.descricaoProcedimento,
              quantidadeExecutada: Number(p.quantidadeExecutada),
              viaAcesso: (p as any).via || "1",
              tecnicaUtilizada: (p as any).tec || "1",
              reducaoAcrescimo: (p as any).reducaoAcrescimo || "1",
              valorUnitario: Number(p.valorUnitario),
              valorTotal: Number(p.valorTotal),
              equipeSadt: resolverEquipeSadtTiss({
                dadosPrefaturamento: (g as any).dadosPrefaturamento,
                sequencial: Number(p.sequencial) || 1,
                profissionalDoProcedimento: p.profissionalId ? profissionaisAll.find(item => item.id === p.profissionalId) : undefined,
                profissionalDaGuia: profissional,
                profissionaisExecutantes: profissionaisAll,
              }),
            })),
           valorProcedimentos,
           valorTotalGeral: valorProcedimentos,
          });
        }
       const ehPostalSaude = ehConvenioPostalSaude((convenio as any)?.nome);
       const ehLuminar = ehConvenioLuminar((convenio as any)?.nome);
       const exigeLoteTissNormalizado = convenioExigeNumeroLoteTissA12((convenio as any)?.nome);
       const { xml } = gerarXmlTissSPSADT({
         sequencialTransacao: lote.sequencialTransacao || "1",
         numeroLote: exigeLoteTissNormalizado ? normalizarNumeroLoteTiss(lote.numeroLote) : lote.numeroLote,
         limitarNumeroLoteA12: exigeLoteTissNormalizado,
         identificarPrestadorPorCnpj: ehPostalSaude || ehLuminar,
         encoding: exigeLoteTissNormalizado ? "UTF-8" : undefined,
         registroANS: resolverRegistroAnsDoConvenio(convenio, lote.registroANS),
          cnpjPrestador: normalizarCnpjPrestadorTiss(prestador?.cnpj || lote.cnpjPrestador),
          codigoPrestadorNaOperadora: codigoPrestadorTiss,
       }, guiasTiss);
        return { xml, filename: `lote_${lote.numeroLote}_tiss.xml` };
      }),
  }),

  prontuarios: router({
    create: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          profissionalId: z.number(),
          atendimentoId: z.number(),
          tipoRegistro: z.enum(['anamnese', 'continuidade']).default('continuidade'),
          queixa: z.string().optional(),
          diagnostico: z.string().optional(),
          tratamento: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await garantirProntuarioLiberadoPorAssinatura(input, ctx.user as any);
        // Validar se está dentro do prazo de 72h ou se foi liberado
        const atendimentos = await db.getAtendimentos();
        const atendimento = atendimentos.find(a => a.id === input.atendimentoId);
        
        if (!atendimento) {
          throw new Error('Atendimento não encontrado');
        }
        
        const agora = new Date();
        const dataLimite = new Date(atendimento.dataLimiteProntuario || new Date());
        
        if (agora > dataLimite && !atendimento.liberadoPorMaster) {
          throw new Error('Prazo de 72 horas para preenchimento do prontuário expirou. Solicite liberação ao administrador.');
        }
        
        // Criar prontuário
        const result = await db.createProntuario({
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          atendimentoId: input.atendimentoId,
          tipoRegistro: input.tipoRegistro,
          queixa: input.queixa,
          diagnostico: input.diagnostico,
          tratamento: input.tratamento,
          observacoes: input.observacoes,
          statusAtraso: agora > dataLimite ? 'liberado' : 'noTempo',
        });
        
        // Atualizar status do atendimento para "realizado"
        await db.updateAtendimentoStatus(input.atendimentoId, "realizado");
        
        return result;
      }),
    list: protectedProcedure.query(() => db.getProntuarios()),
    getByAtendimento: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .query(({ input }) => db.getProntuarioByAtendimento(input.atendimentoId)),
    
    // Novo: Salvar prontuário completo
    save: protectedProcedure
      .input(
        z.object({
          pacienteId: z.number(),
          profissionalId: z.number(),
          atendimentoId: z.number(),
          tipoRegistro: z.enum(['anamnese', 'continuidade']).default('continuidade'),
          queixa: z.string().optional(),
          diagnostico: z.string().optional(),
          tratamento: z.string().optional(),
          observacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await garantirProntuarioLiberadoPorAssinatura(input, ctx.user as any);
        const result = await createProntuarioCompleto(input);
        // Atualizar status do atendimento para "realizado"
        await db.updateAtendimentoStatus(input.atendimentoId, "realizado");
        // Marcar prontuarioFeito = 1 diretamente via SQL para garantir persistência
        try {
          const drizzleDb = await getDb();
          if (drizzleDb) {
            await drizzleDb.execute(
              sql`UPDATE atendimentos SET prontuarioFeito = 1 WHERE id = ${input.atendimentoId}`
            );
            console.log('[Prontuario] prontuarioFeito=1 atualizado para atendimento', input.atendimentoId);
          }
        } catch (err) {
          console.error('[Prontuario] Erro ao atualizar prontuarioFeito:', err);
        }
        return result;
      }),
    
    // Novo: Obter histórico de prontuários do paciente
    getHistoricoPaciente: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(({ input }) => getHistoricoProntuariosPaciente(input.pacienteId)),
    
    // Novo: Obter prontuário por ID
    getById: protectedProcedure
      .input(z.object({ prontuarioId: z.number() }))
      .query(({ input }) => getProntuarioById(input.prontuarioId)),
    
    // Novo: Atualizar prontuário
    update: protectedProcedure
      .input(
        z.object({
          prontuarioId: z.number(),
          queixa: z.string().optional(),
          diagnostico: z.string().optional(),
          tratamento: z.string().optional(),
          observacoes: z.string().optional(),
          statusAtraso: z.enum(["noTempo", "atrasado", "liberado"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { prontuarioId, ...data } = input;
        const prontuario = await getProntuarioById(prontuarioId);
        if (!prontuario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Prontuário não encontrado.' });
        }
        await garantirProntuarioLiberadoPorAssinatura({
          pacienteId: prontuario.pacienteId,
          profissionalId: prontuario.profissionalId,
          atendimentoId: prontuario.atendimentoId,
        }, ctx.user as any);
        return await updateProntuario(prontuarioId, data);
      }),

    finalizar: protectedProcedure
      .input(z.object({ prontuarioId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const prontuario = await getProntuarioById(input.prontuarioId);
        if (!prontuario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Prontuário não encontrado.' });
        }
        await garantirProntuarioLiberadoPorAssinatura({
          pacienteId: prontuario.pacienteId,
          profissionalId: prontuario.profissionalId,
          atendimentoId: prontuario.atendimentoId,
        }, ctx.user as any);
        await db.updateAtendimentoStatus(prontuario.atendimentoId, 'realizado');
        return { success: true, atendimentoId: prontuario.atendimentoId };
      }),
    
    // Novo: Obter prontuários pendentes
    getPendentes: protectedProcedure
      .query(() => getProntuariosPendentes()),
    
    // Excluir prontuário (somente master/admin)
        delete: adminProcedure
      .input(z.object({ prontuarioId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteProntuario(input.prontuarioId);
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any).name || (ctx.user as any).nome || null,
          usuarioPerfil: (ctx.user as any).perfil || null,
          entidade: 'prontuario',
          entidadeId: input.prontuarioId,
          acao: 'EXCLUIR_PRONTUARIO',
          descricao: `Prontúrio ID ${input.prontuarioId} excluído pelo administrador`,
          ip: (ctx.req as any)?.ip || null,
        });
        return { success: true };
      }),
    // Novo: Exportar histórico em PDF
    exportarPDF: protectedProcedure
      .input(z.object({ 
        pacienteId: z.number(),
        dataInicio: z.date().optional(),
        dataFim: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const pacientes = await db.getPacientes();
        const paciente = pacientes.find(p => p.id === input.pacienteId);
        
        if (!paciente) {
          throw new Error('Paciente nao encontrado');
        }
        
        const historico = await getHistoricoProntuariosPaciente(
          input.pacienteId,
          input.dataInicio,
          input.dataFim
        );
        
        const pdfBuffer = await generateProntuarioPDF(
          {
            nome: paciente.nome,
            cpf: paciente.cpf,
            dataNascimento: new Date(paciente.dataNascimento).toLocaleDateString('pt-BR'),
            email: paciente.email || '',
            telefone: paciente.telefone || '',
          },
          historico,
          input.dataInicio,
          input.dataFim
        );
        
        return {
          pdfBase64: pdfBuffer.toString('base64'),
          fileName: `prontuario_${paciente.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
        };
      }),
  }),

  alertas: router({
    getAtendimentosAtrasados: protectedProcedure
      .input(z.object({
        mesReferencia: z.string().regex(/^\d{4}-\d{2}$/).optional(),
        profissionalIds: z.array(z.number().int()).optional(),
      }).optional())
      .query(({ input }) => db.getAtendimentosComProntuarioAtrasado(input)),
    getPacientesComVencimentoProximo: protectedProcedure.query(() => db.getPacientesComPedidoVencendoEm30Dias()),
    marcarAlertaVencimentoEnviado: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .mutation(({ input }) => db.marcarAlertaVencimentoEnviado(input.pacienteId)),
  }),

  liberacoes: router({
    create: protectedProcedure
      .input(
        z.object({
          atendimentoId: z.number(),
          profissionalId: z.number(),
          motivo: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.createLiberacao({
          atendimentoId: input.atendimentoId,
          profissionalId: input.profissionalId,
          masterId: ctx.user?.id || 0,
          motivo: input.motivo,
          status: 'pendente',
        });
      }),
    list: protectedProcedure.query(() => db.getLiberacoes()),
    getByAtendimento: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .query(({ input }) => db.getLiberacaoByAtendimento(input.atendimentoId)),
    approve: protectedProcedure
      .input(z.object({ liberacaoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Apenas administrador pode aprovar liberações');
        }
        
        const liberacoes = await db.getLiberacoes();
        const liberacao = liberacoes.find(x => x.id === input.liberacaoId);
        if (!liberacao) throw new Error('Liberação não encontrada');
        
        await db.updateLiberacao(input.liberacaoId, 'aprovada');
        await db.liberarAtendimentoPorMaster(liberacao.atendimentoId, liberacao.motivo);
        
        return { success: true };
      }),
    reject: protectedProcedure
      .input(z.object({ liberacaoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error('Apenas administrador pode rejeitar liberações');
        }
        
        return await db.updateLiberacao(input.liberacaoId, 'rejeitada');
      }),
  }),

  procedimentos: router({
    createTabelaProcedimento: protectedProcedure
      .input(
        z.object({
          codigoANS: z.string().regex(/^\d{6}$/, "Código ANS deve ter 6 dígitos"),
          descricao: z.string(),
          especialidade: z.string().optional(),
          grupoANS: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createTabelaProcedimento(input);
      }),

    getTabelaProcedimentos: protectedProcedure.query(async () => {
      return await db.getTabelaProcedimentos();
    }),

    createProcedimentoConvenio: protectedProcedure
      .input(
        z.object({
          convenioId: z.number(),
          tabelaProcedimentoId: z.number().optional(),
          codigoConvenio: z.string().optional(),
          descricaoConvenio: z.string().optional(),
          valor: z.string().regex(/^\d+(\.\d{2})?$/, "Valor inválido"),
          valorMinimo: z.string().optional(),
          valorMaximo: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createProcedimentoConvenio(input);
      }),

    getProcedimentosPorConvenio: protectedProcedure
      .input(z.object({ convenioId: z.number() }))
      .query(async ({ input }) => {
        return await db.getProcedimentosPorConvenio(input.convenioId);
      }),

    updateProcedimentoConvenio: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          codigoConvenio: z.string().optional(),
          descricaoConvenio: z.string().optional(),
          valor: z.string().optional(),
          valorMinimo: z.string().optional(),
          valorMaximo: z.string().optional(),
          ativo: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProcedimentoConvenio(id, data);
      }),

    deleteProcedimentoConvenio: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProcedimentoConvenio(input.id);
      }),

    getByEspecialidade: protectedProcedure
      .input(z.object({ convenioId: z.number(), especialidade: z.string() }))
      .query(async ({ input }) => {
        return await getProcedimentosPorEspecialidade(input.convenioId, input.especialidade);
      }),
  }),

  historicoAlteracoes: router({
    getByAtendimento: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getHistoricoAlteracoes(input.atendimentoId);
      }),
  }),

  usuarios: router({
    create: adminPerfilProcedure
      .input(
        z.object({
          nome: z.string(),
          email: z.string().email(),
          senha: z.string().min(6),
          perfil: z.string(),
          profissionalVinculadoId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.createUser({
          nome: input.nome,
          email: input.email,
          senha: input.senha,
          perfil: input.perfil,
          profissionalVinculadoId: input.profissionalVinculadoId,
        });
      }),
    list: adminPerfilProcedure.query(() => db.getUsers()),
    getById: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getUserById(input.id)),
    update: adminPerfilProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          email: z.string().email().optional(),
          perfil: z.string().optional(),
          profissionalVinculadoId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateUser(id, data);
      }),
    // Actualização completa incluindo senha (admin)
    updateFull: adminPerfilProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().optional(),
          email: z.string().email().optional(),
          perfil: z.string().optional(),
          profissionalVinculadoId: z.number().nullable().optional(),
          senha: z.string().min(6).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        try {
          return await db.updateUserFull(id, data);
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message });
        }
      }),
    // Alteração de senha pelo próprio utilizador (requer senha actual)
    alterarSenha: protectedProcedure
      .input(
        z.object({
          senhaActual: z.string().min(1),
          novaSenha: z.string().min(6),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        const userComSenha = await db.getUserByEmail(user.email || '');
        if (!userComSenha?.senha) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Utilizador sem senha definida. Contacte o administrador.' });
        const crypto = await import('crypto');
        const hashActual = crypto.createHash('sha256').update(input.senhaActual).digest('hex');
        if (hashActual !== userComSenha.senha) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Senha actual incorrecta.' });
        return await db.updateUserSenha(user.id, input.novaSenha);
      }),
    // Redefinir senha pelo admin (sem precisar da senha actual)
    redefinirSenha: adminPerfilProcedure
      .input(z.object({ id: z.number(), novaSenha: z.string().min(6) }))
      .mutation(async ({ input }) => {
        return await db.updateUserSenha(input.id, input.novaSenha);
      }),
    // Eliminar utilizador (admin)
    delete: adminPerfilProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.id === input.id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não pode eliminar o seu próprio utilizador.' });
        const dbConn = await db.getDb();
        if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { users: usersTable } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        await dbConn.delete(usersTable).where(eq(usersTable.id, input.id));
        return { success: true };
      }),
  }),

  whatsappLembretes: router({
    // Solicitar lembrete para um atendimento
    solicitarLembrete: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.solicitarLembreteAtendimento(input.atendimentoId);
      }),

    // Obter atendimentos que precisam de lembrete (24h antes)
    getAtendimentosParaLembrete: protectedProcedure.query(async () => {
      return await db.getAtendimentosParaLembrete();
    }),

    // Marcar lembrete como enviado
    marcarLembreteEnviado: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.marcarLembreteEnviado(input.atendimentoId);
      }),

    // Registrar confirmação de atendimento (pode ser público)
    registrarConfirmacao: publicProcedure
      .input(z.object({ 
        atendimentoId: z.number(),
        confirmado: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return await db.registrarConfirmacaoAtendimento(input.atendimentoId, input.confirmado);
      }),

    // Obter detalhes do atendimento para confirmação (público)
    getAtendimentoPorId: publicProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAtendimentoPorId(input.atendimentoId);
      }),
  }),

  lembretesStats: router({
    getEstatisticas: protectedProcedure.query(async () => {
      return await db.getEstatisticasLembretes();
    }),
    getDetalhes: protectedProcedure
      .input(z.object({ 
        status: z.enum(['pendentes', 'enviados', 'confirmados', 'nao_confirmados'])
      }))
      .query(async ({ input }) => {
        return await db.getDetalhesLembretesPorStatus(input.status);
      }),
    getResumoHoje: protectedProcedure.query(async () => {
      return await db.getResumoLembretesHoje();
    }),
  }),

  whatsappPublico: router({
    obterDadosConsulta: publicProcedure
      .input(z.object({ 
        atendimentoId: z.number(),
        token: z.string()
      }))
      .query(async ({ input, ctx }) => {
        const ipAddress = (ctx as any).ipAddress || 'unknown';
        if (!db.verificarRateLimit(ipAddress, 10, 60000)) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente em 1 minuto.' });
        }
        const tokenValido = await db.validarTokenConfirmacao(input.atendimentoId, input.token);
        if (!tokenValido) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token invalido ou expirado' });
        }
        return await db.obterDadosConfirmacaoPresenca(input.atendimentoId);
      }),

    confirmarPresenca: publicProcedure
      .input(z.object({
        atendimentoId: z.number(),
        token: z.string(),
        confirmado: z.boolean()
      }))
      .mutation(async ({ input, ctx }) => {
        const ipAddress = (ctx as any).ipAddress || 'unknown';
        if (!db.verificarRateLimit(ipAddress, 5, 60000)) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente em 1 minuto.' });
        }
        const tokenValido = await db.validarTokenConfirmacao(input.atendimentoId, input.token);
        if (!tokenValido) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token invalido ou expirado' });
        }
        return await db.registrarConfirmacaoAtendimento(input.atendimentoId, input.confirmado);
      }),
  }),

  profissionalConfirmacoes: router({
    getEstatisticas: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.profissionalVinculadoId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Profissional não vinculado' });
      }
      return await db.getEstatisticasConfirmacoesProfissional(ctx.user.profissionalVinculadoId);
    }),
    
    getPendentes: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.profissionalVinculadoId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Profissional não vinculado' });
      }
      return await db.getConfirmacoesPendentes(ctx.user.profissionalVinculadoId);
    }),
  }),

  alertasProntuario: router({
    // Sincroniza e retorna os alertas de prontuários pendentes do profissional logado
    listar: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.profissionalVinculadoId) {
        // Usuários sem profissional vinculado (ex: administrativo) não recebem alertas
        return [] as Array<any>;
      }
      return await db.sincronizarAlertasProntuarioPendente(ctx.user.profissionalVinculadoId);
    }),

    // Resumo por status (pendentes/reconhecidos/resolvidos)
    resumo: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user?.profissionalVinculadoId) {
        return { pendentes: 0, reconhecidos: 0, resolvidos: 0 };
      }
      return await db.getResumoAlertasProntuario(ctx.user.profissionalVinculadoId);
    }),

    // Registra o reconhecimento ("Ciente") de um alerta, gravando data/hora
    reconhecer: protectedProcedure
      .input(z.object({ alertaId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.profissionalVinculadoId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Profissional não vinculado' });
        }
        const atualizado = await db.reconhecerAlertaProntuario(
          input.alertaId,
          ctx.user.profissionalVinculadoId,
        );
        if (!atualizado) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Alerta não encontrado' });
        }
        return atualizado;
      }),
  }),

  // Router de assinaturas digitais de guias SADT
  assinaturasGuias: router({
    // Listar assinaturas de uma guia (com número de sessão) — aceita guiaId ou pacienteId
    list: protectedProcedure
      .input(z.object({ guiaId: z.number().optional(), pacienteId: z.number().optional() }))
      .query(async ({ input }) => {
        if (input.guiaId && input.guiaId > 0) {
          return await db.getAssinaturasGuia(input.guiaId);
        }
        if (input.pacienteId && input.pacienteId > 0) {
          return await db.getAssinaturasGuiaPorPaciente(input.pacienteId);
        }
        return [];
      }),

    historicoCompleto: protectedProcedure
      .input(z.object({ guiaId: z.number().positive() }))
      .query(async ({ input }) => {
        return await db.getHistoricoCompletoAssinaturasGuia(input.guiaId);
      }),

    // Registrar nova assinatura do paciente
    create: protectedProcedure
      .input(z.object({
        guiaId: z.number(),
        pacienteId: z.number(),
        assinaturaPacienteUrl: z.string(), // base64 da imagem da assinatura
        sessaoNumero: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Gerar hash SHA-256 da assinatura para validação de autenticidade
        const { createHash } = await import('crypto');
        const hash = createHash('sha256').update(input.assinaturaPacienteUrl).digest('hex');
        return await db.createAssinaturaGuia({
          guiaId: input.guiaId,
          pacienteId: input.pacienteId,
          assinaturaPacienteUrl: input.assinaturaPacienteUrl,
          hashAssinatura: hash,
          sessaoNumero: input.sessaoNumero,
        });
      }),

    // Contar total de sessões de uma guia
    totalSessoes: protectedProcedure
      .input(z.object({ guiaId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTotalSessoesGuia(input.guiaId);
      }),

    // Retorna o conjunto de pacienteIds que já possuem ao menos uma guia SADT assinada
    // Usado pela Agenda para exibir o indicador visual de assinatura
    // Usa mutation (POST) para evitar HTTP 414 com listas grandes de IDs
    pacientesComAssinatura: protectedProcedure
      .input(z.object({ pacienteIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const set = await db.getGuiasAssinadasPorPacientes(input.pacienteIds);
        return Array.from(set); // retorna array de pacienteIds com guia assinada
      }),

    // Buscar pacientes com link de assinatura enviado mas ainda pendente (token gerado, sem assinatura)
    // Usado pela Agenda para exibir o indicador visual de link pendente (laranja)
    // Usa mutation (POST) para evitar HTTP 414 com listas grandes de IDs
    pacientesComLinkPendente: protectedProcedure
      .input(z.object({ pacienteIds: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        const set = await db.getPacientesComLinkPendente(input.pacienteIds);
        return Array.from(set);
      }),

    // Buscar exclusivamente a guia assinada clicada na Agenda. Nunca escolher
    // uma guia “mais recente” do paciente, pois ela pode ser de outro profissional.
    getGuiaAssinada: protectedProcedure
      .input(z.object({ pacienteId: z.number(), guiaId: z.number().positive(), profissionalId: z.number().positive() }))
      .query(async ({ input }) => {
        return await db.getGuiaAssinadaComAssinaturas(input);
      }),
    // Buscar a guia SADT do atendimento com histórico de sessões (para modal de assinatura na Agenda)
    getGuiaPorPaciente: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        guiaId: z.number().positive(),
        atendimentoId: z.number().optional(),
        profissionalId: z.number().optional(),
        atendimentoData: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getGuiaComSessoesPorPaciente(input.pacienteId, {
          guiaId: input.guiaId,
          atendimentoId: input.atendimentoId,
          profissionalId: input.profissionalId,
          atendimentoData: input.atendimentoData,
        });
      }),
    // Registar assinatura sequencial do paciente na guia SADT
    assinarSessao: protectedProcedure
      .input(z.object({
        guiaId: z.number(),
        pacienteId: z.number(),
        assinaturaPacienteUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.registrarAssinaturaGuiaSessao({
          guiaId: input.guiaId,
          pacienteId: input.pacienteId,
          assinaturaPacienteUrl: input.assinaturaPacienteUrl,
        });
      }),
    // Excluir assinatura de sessão da guia SADT
    excluirAssinatura: protectedProcedure
      .input(z.object({
        assinaturaId: z.number(),
        guiaId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para excluir assinaturas' });
        }
        try {
          console.info('[Assinaturas] exclusão legada solicitada', {
            assinaturaId: input.assinaturaId,
            guiaId: input.guiaId,
            usuarioId: ctx.user.id,
            perfil: perfil || role || null,
          });
          const resultado = await db.excluirAssinaturaGuia(input.assinaturaId, input.guiaId);
          console.info('[Assinaturas] exclusão legada concluída', {
            assinaturaId: input.assinaturaId,
            guiaId: input.guiaId,
            totalSessoes: resultado.totalSessoes,
          });
          return resultado;
        } catch (erro) {
          const mensagem = erro instanceof Error ? erro.message : 'Falha desconhecida ao excluir assinatura';
          console.error('[Assinaturas] exclusão legada recusada', {
            assinaturaId: input.assinaturaId,
            guiaId: input.guiaId,
            usuarioId: ctx.user.id,
            mensagem,
          });
          throw new TRPCError({ code: 'BAD_REQUEST', message: `Não foi possível excluir esta assinatura: ${mensagem}` });
        }
      }),
    duplicarAssinatura: protectedProcedure
      .input(z.object({
        assinaturaId: z.number().positive(),
        guiaId: z.number().positive(),
        origem: z.enum(['legada', 'sadt']),
        novaDataSessao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data da sessão inválida'),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para duplicar assinaturas' });
        }
        const resultado = await db.duplicarAssinaturaGuiaParaData(input);
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: (ctx.user as any)?.name || (ctx.user as any)?.nome || null,
          usuarioPerfil: perfil || role || null,
          entidade: 'assinatura_guia',
          entidadeId: input.assinaturaId,
          acao: 'DUPLICAR_ASSINATURA_GUIA',
          descricao: `Assinatura ${input.origem} duplicada administrativamente para ${input.novaDataSessao} na mesma guia/série`,
          dadosNovos: resultado,
          ip: (ctx.req as any)?.ip || null,
        });
        return resultado;
      }),
    // Editar data de assinatura de sessão
    editarData: protectedProcedure
      .input(z.object({
        assinaturaId: z.number(),
        novaData: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para editar assinaturas' });
        }
        return await db.editarDataAssinaturaGuia(input.assinaturaId, input.novaData);
      }),
    // Editar exclusivamente a data clínica da sessão, sem alterar a evidência da assinatura.
    editarDataSessao: protectedProcedure
      .input(z.object({
        assinaturaId: z.number(),
        novaDataSessao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data da sessão inválida'),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para editar datas de sessão' });
        }
        return await db.editarDataSessaoAssinaturaGuia(input.assinaturaId, input.novaDataSessao);
      }),
    editarDataHistorica: protectedProcedure
      .input(z.object({ guiaId: z.number(), novaData: z.date() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para editar assinaturas' });
        }
        return await db.editarDataAssinaturaHistoricaGuia(input.guiaId, input.novaData);
      }),
    excluirAssinaturaHistorica: protectedProcedure
      .input(z.object({ guiaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const role = (ctx.user as any)?.role;
        if (!podeGerenciarDatasAssinatura(perfil, role)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Sem permissão para excluir assinaturas' });
        }
        return await db.excluirAssinaturaHistoricaGuia(input.guiaId);
      }),
  }),

  // ─── Dashboard ────────────────────────────────────────────────────────────
  dashboard: router({
    getStats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
  }),

  anamnese: router({
    get: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        return await db.getAnamnesePorPaciente(input.pacienteId);
      }),
    save: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        queixaPrincipal: z.string().optional(),
        historiaDoenca: z.string().optional(),
        historiaFamiliar: z.string().optional(),
        historiaSocial: z.string().optional(),
        antecedentesPatologicos: z.string().optional(),
        medicamentosEmUso: z.string().optional(),
        alergias: z.string().optional(),
        cirurgiasAnteriores: z.string().optional(),
        habitos: z.string().optional(),
        observacoes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const { pacienteId, ...data } = input;
        return await db.upsertAnamnese(pacienteId, {
          ...data,
          profissionalId: (ctx.user as any).profissionalVinculadoId ?? undefined,
        });
      }),
    enviarLinkWhatsapp: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const paciente = await db.getPacienteById(input.pacienteId);
        if (!paciente) throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        const telefone = paciente.whatsapp || paciente.telefone;
        if (!telefone) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Paciente não possui WhatsApp ou telefone cadastrado' });

        const { token, expiresAt } = await db.gerarTokenPreenchimentoAnamnese(
          paciente.id,
          (ctx.user as any).profissionalVinculadoId ?? null,
        );
        const link = montarLinkPreenchimentoAnamnese(token);
        const success = await sendTextMessage(telefone, montarMensagemLinkAnamnese(paciente.nome, link));
        if (success) await db.registrarEnvioWhatsappAnamnese(paciente.id);
        return { success, expiresAt };
      }),
    previsualizarEnvioLoteWhatsapp: protectedProcedure
      .input(z.object({ profissionalId: z.number(), convenioId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const usuario = ctx.user as any;
        if (usuario.perfil === 'profissional' && usuario.profissionalVinculadoId !== input.profissionalId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Profissional só pode enviar links aos próprios pacientes' });
        }
        const pacientesElegiveis = await db.listarPacientesElegiveisParaEnvioAnamnese(input.profissionalId, input.convenioId);
        return {
          total: pacientesElegiveis.length,
          pacientes: pacientesElegiveis.map(({ pacienteId, nome }) => ({ pacienteId, nome })),
        };
      }),
    enviarLoteWhatsapp: protectedProcedure
      .input(z.object({ profissionalId: z.number(), convenioId: z.number(), confirmar: z.literal(true) }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const usuario = ctx.user as any;
        if (usuario.perfil === 'profissional' && usuario.profissionalVinculadoId !== input.profissionalId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Profissional só pode enviar links aos próprios pacientes' });
        }
        const pacientesElegiveis = await db.listarPacientesElegiveisParaEnvioAnamnese(input.profissionalId, input.convenioId);
        const resultados: Array<{ pacienteId: number; nome: string; enviado: boolean }> = [];
        for (const paciente of pacientesElegiveis) {
          try {
            const { token } = await db.gerarTokenPreenchimentoAnamnese(paciente.pacienteId, input.profissionalId);
            const link = montarLinkPreenchimentoAnamnese(token);
            const enviado = await sendTextMessage(paciente.telefone, montarMensagemLinkAnamnese(paciente.nome, link));
            if (enviado) await db.registrarEnvioWhatsappAnamnese(paciente.pacienteId);
            resultados.push({ pacienteId: paciente.pacienteId, nome: paciente.nome, enviado });
          } catch {
            resultados.push({ pacienteId: paciente.pacienteId, nome: paciente.nome, enviado: false });
          }
        }
        return {
          total: resultados.length,
          enviados: resultados.filter((resultado) => resultado.enviado).length,
          falhas: resultados.filter((resultado) => !resultado.enviado).map(({ pacienteId, nome }) => ({ pacienteId, nome })),
        };
      }),
    getByToken: publicProcedure
      .input(z.object({ token: z.string().min(32).max(128) }))
      .query(async ({ input }) => {
        const anamnese = await db.getAnamnesePublicaPorToken(input.token);
        if (!anamnese) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link inválido, expirado ou já utilizado' });
        return { pacienteNome: anamnese.pacienteNome.split(/\s+/)[0] || 'Paciente' };
      }),
    preencherPorToken: publicProcedure
      .input(z.object({
        token: z.string().min(32).max(128),
        queixaPrincipal: z.string().trim().min(1, 'Informe a queixa principal').max(6000),
        historiaDoenca: z.string().trim().max(6000).optional(),
        historiaFamiliar: z.string().trim().max(6000).optional(),
        historiaSocial: z.string().trim().max(6000).optional(),
        antecedentesPatologicos: z.string().trim().max(6000).optional(),
        medicamentosEmUso: z.string().trim().max(6000).optional(),
        alergias: z.string().trim().max(6000).optional(),
        cirurgiasAnteriores: z.string().trim().max(6000).optional(),
        habitos: z.string().trim().max(6000).optional(),
        observacoes: z.string().trim().max(6000).optional(),
      }))
      .mutation(async ({ input }) => {
        const { token, ...dados } = input;
        try {
          return await db.preencherAnamnesePorToken(token, dados);
        } catch (error: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: error.message || 'Não foi possível enviar a anamnese' });
        }
      }),
    gerarPDF: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const [paciente, anamnese] = await Promise.all([
          db.getPacienteById(input.pacienteId),
          db.getAnamnesePorPaciente(input.pacienteId),
        ]);
        if (!paciente) throw new TRPCError({ code: 'NOT_FOUND', message: 'Paciente não encontrado' });
        if (!anamnese) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Preencha a anamnese antes de enviá-la' });

        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const largura = 595;
        const altura = 842;
        const margem = 48;
        const larguraTexto = largura - margem * 2;
        const tamanhoFonte = 10;
        let page = pdfDoc.addPage([largura, altura]);
        let y = altura - margem;
        const novaPagina = (espaco = 16) => {
          if (y < margem + espaco) {
            page = pdfDoc.addPage([largura, altura]);
            y = altura - margem;
          }
        };
        const escrever = (texto: string, negrito = false, tamanho = tamanhoFonte) => {
          novaPagina(tamanho + 6);
          page.drawText(texto, { x: margem, y, size: tamanho, font: negrito ? fontBold : font, color: rgb(0.1, 0.1, 0.1) });
          y -= tamanho + 5;
        };
        const escreverQuebrado = (texto: string) => {
          const palavras = (texto || 'Não informado').split(/\s+/);
          let linha = '';
          for (const palavra of palavras) {
            const tentativa = linha ? `${linha} ${palavra}` : palavra;
            if (font.widthOfTextAtSize(tentativa, tamanhoFonte) <= larguraTexto) linha = tentativa;
            else {
              escrever(linha);
              linha = palavra;
            }
          }
          if (linha) escrever(linha);
        };

        escrever('CLINICA CLIPSI', true, 15);
        escrever('ANAMNESE DO PACIENTE', true, 12);
        y -= 4;
        escrever(`Paciente: ${paciente.nome}`, true);
        escrever(`Data de geração: ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' })}`);
        y -= 6;
        const campos = [
          ['Queixa Principal', anamnese.queixaPrincipal],
          ['História da Doença Atual', anamnese.historiaDoenca],
          ['História Familiar', anamnese.historiaFamiliar],
          ['História Social', anamnese.historiaSocial],
          ['Antecedentes Patológicos', anamnese.antecedentesPatologicos],
          ['Medicamentos em Uso', anamnese.medicamentosEmUso],
          ['Alergias', anamnese.alergias],
          ['Cirurgias Anteriores', anamnese.cirurgiasAnteriores],
          ['Hábitos de Vida', anamnese.habitos],
          ['Observações', anamnese.observacoes],
        ] as const;
        for (const [titulo, conteudo] of campos) {
          novaPagina(44);
          escrever(titulo, true);
          escreverQuebrado(conteudo || 'Não informado');
          y -= 5;
        }

        const pdfBytes = await pdfDoc.save();
        const nomeSeguro = paciente.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
        const arquivo = `anamnese-${nomeSeguro || paciente.id}.pdf`;
        const { url } = await storagePut(`documentos/anamneses/${arquivo}`, Buffer.from(pdfBytes), 'application/pdf');
        return { documentUrl: `https://mifature.click${url}`, fileName: arquivo };
      }),
  }),

  contratos: router({
    list: protectedProcedure
      .input(z.object({ pacienteId: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        return await db.getContratosTerapeuticosPorPaciente(input.pacienteId);
      }),
    exportarPDF: protectedProcedure
      .input(z.object({ contratoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
        const contrato = await db.getContratoTerapeuticoById(input.contratoId);
        if (!contrato) throw new TRPCError({ code: 'NOT_FOUND', message: 'Contrato não encontrado' });
        const paciente = await db.getPacienteById(contrato.pacienteId);
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const pageWidth = 595;
        const pageHeight = 842;
        const margin = 50;
        const lineHeight = 16;
        let page = pdfDoc.addPage([pageWidth, pageHeight]);
        let y = pageHeight - margin;
        const addText = (text: string, bold = false, size = 10, color = rgb(0, 0, 0)) => {
          if (y < margin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(text, { x: margin, y, size, font: bold ? fontBold : font, color });
          y -= lineHeight;
        };
        const addLine = () => {
          if (y < margin + 20) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
          y -= 8;
        };
        // Cabeçalho
        addText('SISTEMA MIFATURE', true, 14, rgb(0.1, 0.5, 0.2));
        addText('Contrato Terapêutico Digital', false, 11, rgb(0.3, 0.3, 0.3));
        y -= 8;
        addLine();
        y -= 4;
        // Informações
        addText(`Paciente: ${paciente?.nome || 'N/A'}`, true, 10);
        addText(`CPF: ${paciente?.cpf || 'N/A'}`, false, 10);
        addText(`Data de Geração: ${new Date(contrato.createdAt).toLocaleDateString('pt-BR')}`, false, 10);
        if (contrato.assinado) {
          addText(`Assinado em: ${contrato.dataAssinatura ? new Date(contrato.dataAssinatura).toLocaleDateString('pt-BR') : 'N/A'}`, false, 10, rgb(0.1, 0.5, 0.1));
        }
        y -= 8;
        addLine();
        y -= 4;
        // Conteúdo do contrato (quebrar linhas longas)
        const linhas = (contrato.conteudo || '').split('\n');
        for (const linha of linhas) {
          const maxChars = 90;
          if (linha.length <= maxChars) {
            addText(linha, linha.startsWith('CONTRATO') || /^\d+\./.test(linha.trim()), 9);
          } else {
            const words = linha.split(' ');
            let currentLine = '';
            for (const word of words) {
              if ((currentLine + ' ' + word).trim().length <= maxChars) {
                currentLine = (currentLine + ' ' + word).trim();
              } else {
                addText(currentLine, false, 9);
                currentLine = word;
              }
            }
            if (currentLine) addText(currentLine, false, 9);
          }
        }
        // ─── Secção de Assinatura Digital ───
        y -= 16;
        addLine();
        y -= 8;
        addText('ASSINATURA DIGITAL', true, 11, rgb(0.1, 0.4, 0.1));
        y -= 4;

        if (contrato.assinado && contrato.assinaturaPacienteUrl) {
          // Incorporar imagem da assinatura
          try {
            const sigDataUrl = contrato.assinaturaPacienteUrl as string;
            const base64Data = sigDataUrl.replace(/^data:image\/\w+;base64,/, '');
            const sigBytes = Buffer.from(base64Data, 'base64');
            const sigImage = await pdfDoc.embedPng(sigBytes);
            const sigDims = sigImage.scale(0.4);
            if (y < margin + sigDims.height + 20) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              y = pageHeight - margin;
            }
            // Caixa de assinatura
            page.drawRectangle({
              x: margin,
              y: y - sigDims.height - 8,
              width: sigDims.width + 16,
              height: sigDims.height + 16,
              borderColor: rgb(0.1, 0.5, 0.2),
              borderWidth: 1,
              color: rgb(0.97, 1, 0.97),
            });
            page.drawImage(sigImage, {
              x: margin + 8,
              y: y - sigDims.height,
              width: sigDims.width,
              height: sigDims.height,
            });
            y -= sigDims.height + 24;
          } catch {
            addText('[Imagem de assinatura não disponível]', false, 9, rgb(0.5, 0.5, 0.5));
          }

          // Linha de assinatura
          page.drawLine({
            start: { x: margin, y },
            end: { x: margin + 250, y },
            thickness: 1,
            color: rgb(0, 0, 0),
          });
          y -= 14;
          addText(`Assinado por: ${paciente?.nome || 'Paciente'}`, false, 9);
          addText(`Data e hora: ${contrato.dataAssinatura ? new Date(contrato.dataAssinatura).toLocaleString('pt-BR') : 'N/A'}`, false, 9);
          addText(`CPF: ${paciente?.cpf || 'N/A'}`, false, 9);
        } else {
          addText('[ Contrato ainda não assinado ]', false, 10, rgb(0.6, 0.3, 0));
        }

        // ─── Secção de Autenticidade / Hash ───
        y -= 16;
        addLine();
        y -= 8;
        addText('CERTIFICADO DE AUTENTICIDADE', true, 10, rgb(0.1, 0.1, 0.5));
        y -= 4;

        if (contrato.hashAssinatura) {
          addText('Este documento possui validade jurídica conforme a Lei nº 14.063/2020.', false, 8, rgb(0.3, 0.3, 0.3));
          addText('Hash SHA-256 de verificação:', false, 8, rgb(0.3, 0.3, 0.3));
          y -= 4;
          // Quebrar o hash em duas linhas
          const hash = contrato.hashAssinatura as string;
          const half = Math.ceil(hash.length / 2);
          page.drawRectangle({
            x: margin,
            y: y - 28,
            width: pageWidth - margin * 2,
            height: 32,
            color: rgb(0.95, 0.95, 1),
            borderColor: rgb(0.7, 0.7, 0.9),
            borderWidth: 0.5,
          });
          page.drawText(hash.slice(0, half), { x: margin + 6, y: y - 12, size: 7, font, color: rgb(0.2, 0.2, 0.6) });
          page.drawText(hash.slice(half), { x: margin + 6, y: y - 22, size: 7, font, color: rgb(0.2, 0.2, 0.6) });
          y -= 36;
          addText(`Gerado em: ${new Date().toLocaleString('pt-BR')} | Sistema MIFATURE`, false, 7, rgb(0.5, 0.5, 0.5));
        } else {
          addText('Documento sem hash — contrato ainda não assinado digitalmente.', false, 8, rgb(0.5, 0.5, 0.5));
        }

        // ─── Rodapé ───
        const lastPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
        lastPage.drawText('MIFATURE — Sistema de Faturamento Médico | mifature.click', {
          x: margin,
          y: 20,
          size: 7,
          font,
          color: rgb(0.6, 0.6, 0.6),
        });

        const pdfBytes = await pdfDoc.save();
        const base64 = Buffer.from(pdfBytes).toString('base64');
        return { base64, filename: `contrato-${paciente?.nome?.replace(/\s+/g, '-') || contrato.pacienteId}-${new Date().toISOString().split('T')[0]}.pdf` };
      }),
    create: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        conteudo: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        // Usa profissionalVinculadoId se existir; caso contrário usa o id do utilizador (administrador)
        const profissionalId = (ctx.user as any).profissionalVinculadoId ?? ctx.user.id;
        return await db.createContratoTerapeutico({
          pacienteId: input.pacienteId,
          profissionalId,
          conteudo: input.conteudo,
        });
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        conteudo: z.string().optional(),
        assinado: z.number().optional(),
        dataAssinatura: z.date().optional(),
        assinaturaPacienteUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const { id, ...data } = input;
        return await db.updateContratoTerapeuticoStatus(id, data);
      }),
    gerarLink: protectedProcedure
      .input(z.object({ contratoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!podeGerirPastaPaciente(ctx.user)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador, recepção e profissional' });
        }
        const token = await db.gerarTokenAssinatura(input.contratoId);
        return { token };
      }),
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const contrato = await db.getContratoByToken(input.token);
        if (!contrato) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link inválido ou expirado' });
        const expiresAt = (contrato as any).tokenExpiresAt;
        if (expiresAt && new Date(expiresAt) < new Date()) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Link de assinatura expirado' });
        }
        // Retorna apenas os campos necessários (sem dados sensíveis internos)
        return {
          id: contrato.id,
          conteudo: contrato.conteudo,
          assinado: contrato.assinado,
          dataAssinatura: contrato.dataAssinatura,
          assinaturaPacienteUrl: contrato.assinaturaPacienteUrl,
          tokenExpiresAt: (contrato as any).tokenExpiresAt,
        };
      }),
    assinarPorToken: publicProcedure
      .input(z.object({
        token: z.string(),
        assinaturaPacienteUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          return await db.assinarContratoByToken(input.token, input.assinaturaPacienteUrl);
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message || 'Erro ao assinar contrato' });
        }
      }),
  }),
  // ─── Confirmação de Atendimento via WhatsApp ─────────────────────────────────
  confirmacaoAtendimento: router({
    // Gera token e retorna URL de confirmação (protegido — apenas recepção/master)
    gerarLink: protectedProcedure
      .input(z.object({ atendimentoId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        if (perfil !== 'administrador' && perfil !== 'recepcao') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas recepção ou administrador pode gerar links de confirmação' });
        }
        const token = await db.gerarTokenConfirmacaoAtendimento(input.atendimentoId);
        const origin = 'https://mifature.click';
        return { token, url: `${origin}/confirmar-atendimento/${token}` };
      }),
    // Busca dados do atendimento pelo token (público — sem autenticação)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const atendimento = await db.getAtendimentoByConfirmacaoToken(input.token);
        if (!atendimento) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link inválido ou expirado' });
        // Buscar logo da clínica
        let clinicaLogoUrl: string | null = null;
        let clinicaNome: string | null = null;
        try {
          const prestador = await db.getDadosPrestador();
          if (prestador) {
            clinicaLogoUrl = (prestador as any).logoUrl || null;
            clinicaNome = (prestador as any).nomeFantasia || (prestador as any).razaoSocial || null;
          }
        } catch (e) { /* não bloquear */ }
        return { ...atendimento, clinicaLogoUrl, clinicaNome };
      }),
    // Confirma ou cancela o atendimento pelo token (público — sem autenticação)
    confirmarPorToken: publicProcedure
      .input(z.object({
        token: z.string(),
        acao: z.enum(['confirmado', 'cancelado']),
      }))
      .mutation(async ({ input }) => {
        try {
          // Buscar dados do atendimento antes de confirmar para incluir na notificação
          const atendimento = await getAtendimentoByConfirmacaoToken(input.token);
          const result = await db.confirmarAtendimentoPorToken(input.token, input.acao);

          // Notificar a recepção/dono da clínica sobre a resposta do paciente
          if (atendimento) {
            // Usar toISOString para extrair data sem desvio de fuso (campo DATE do MySQL vem como T00:00:00.000Z)
            const rawAtendData = (atendimento.data instanceof Date) ? atendimento.data.toISOString().substring(0, 10) : String(atendimento.data).substring(0, 10);
            const [yrA, moA, dyA] = rawAtendData.split('-');
            const dataFormatada = `${dyA}/${moA}/${yrA}`;
            const emoji = input.acao === 'confirmado' ? '✅' : '❌';
            const acaoLabel = input.acao === 'confirmado' ? 'CONFIRMOU' : 'CANCELOU';
            const tipoNotif = input.acao === 'confirmado' ? 'confirmacao' : 'cancelamento';
            const conteudo = [
              `Paciente: ${atendimento.pacienteNome}`,
              `Data: ${dataFormatada} às ${atendimento.hora}`,
              `Profissional: ${atendimento.profissionalNome}`,
              `Convênio: ${atendimento.convenioNome}`,
              `Ação: ${acaoLabel} via link de confirmação`,
            ].join('\n');
            // Registar na BD (notificação in-app com filtros)
            await criarNotificacaoInApp({
              tipo: tipoNotif,
              titulo: `${emoji} Paciente ${acaoLabel} a consulta`,
              conteudo,
              guiaId: undefined,
              pacienteNome: atendimento.pacienteNome,
              profissionalNome: atendimento.profissionalNome,
              convenioNome: atendimento.convenioNome,
            }).catch(() => {});
            // Enviar também notificação push ao dono
            await notifyOwner({
              title: `${emoji} Paciente ${acaoLabel} a consulta`,
              content: conteudo,
            }).catch(() => { /* notificação não crítica — ignora falha */ });
          }

          return result;
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message || 'Erro ao confirmar atendimento' });
        }
      }),
  }),
  // ─── Assinatura de Guia SADT via WhatsApp ────────────────────────────────────
  assinaturaGuiaWhatsApp: router({
    // Gera token para o paciente assinar a sessão via WhatsApp (protegido)
    gerarLink: protectedProcedure
      .input(z.object({
        guiaId: z.number(),
        pacienteId: z.number(),
        atendimentoId: z.number(),
        // Datas de atendimento a incluir no link (array de strings "YYYY-MM-DD")
        datasAtendimento: z.array(z.string()).optional(),
        // Mensagem personalizada editada pela recepção (opcional)
        mensagemPersonalizada: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        if (perfil !== 'administrador' && perfil !== 'recepcao') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas recepção ou administrador pode gerar links de assinatura' });
        }
        const guia = await db.getGuiaPorId(input.guiaId);
        if (!guia) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Guia SADT não encontrada' });
        }
        const banco = await getDb();
        const [atendimento] = banco
          ? await banco.select().from(atendimentos).where(eq(atendimentos.id, input.atendimentoId)).limit(1)
          : [];
        if (!atendimento || atendimento.pacienteId !== input.pacienteId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'O atendimento informado não pertence ao paciente do link.' });
        }
        const guiaCompativel = guia.pacienteId === atendimento.pacienteId
          && guia.profissionalId === atendimento.profissionalId
          && guia.convenioId === atendimento.convenioId;
        if (!guiaCompativel) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A guia deve pertencer ao mesmo paciente, profissional e convênio do atendimento.' });
        }
        const convenio = await db.getConvenioById(guia.convenioId);
        if (convenioUsaAssinaturaEmGuiaFisica((convenio as any)?.nome)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: MENSAGEM_ASSINATURA_EM_GUIA_FISICA });
        }
        const { token } = await db.gerarTokenAssinaturaGuia(
          input.guiaId,
          input.pacienteId,
          input.datasAtendimento,
        );
        const origin = 'https://mifature.click';
        const prestador = await db.getDadosPrestador();
        const nomeClinica = prestador?.nomeFantasia || prestador?.razaoSocial || NOME_FANTASIA_CLINICA;
        return { token, url: `${origin}/assinar-sessao/${token}`, nomeClinica };
      }),
    // Busca dados da sessão pelo token (público — sem autenticação)
    getByToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const sessao = await db.getAssinaturaGuiaByToken(input.token);
        if (!sessao) throw new TRPCError({ code: 'NOT_FOUND', message: 'Link inválido ou expirado' });
        return sessao;
      }),
    // Paciente assina a sessão pelo token (público — sem autenticação)
    assinarPorToken: publicProcedure
      .input(z.object({
        token: z.string(),
        assinaturaPacienteUrl: z.string(),
        // Array opcional de assinaturas por sessão (índice 0 = sessão 1, etc.)
        assinaturasPorSessao: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Buscar dados da sessão antes de assinar para incluir na notificação
          const sessao = await db.getAssinaturaGuiaByToken(input.token);
          const result = await db.assinarGuiaPorToken(
            input.token,
            input.assinaturaPacienteUrl,
            input.assinaturasPorSessao,
          );

          // Notificar a recepção/dono da clínica sobre a assinatura
          if (sessao) {
            // Calcular quantas sessões foram criadas
            let datasAtend: string[] = [];
            if ((sessao as any).datasAtendimento) {
              try { datasAtend = JSON.parse((sessao as any).datasAtendimento); } catch {}
            }
            const numSessoes = datasAtend.length > 1 ? datasAtend.length : 1;
            const linhasSessoes = numSessoes > 1
              ? `\nSessões criadas: ${numSessoes} (${datasAtend.map(d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR')).join(', ')})`
              : `\nSessão nº: ${result.sessaoNumero ?? 'N/A'}`;
            const conteudoAssina = [
              `Paciente: ${sessao.pacienteNome}`,
              `Profissional: ${sessao.profissionalNome}`,
              `Convênio: ${sessao.convenioNome}`,
              linhasSessoes,
              `Guia ID: ${sessao.guiaId}`,
              `Assinado via link WhatsApp`,
            ].join('\n');
            const tituloNotif = numSessoes > 1
              ? `✍️ Paciente assinou ${numSessoes} sessões da guia SADT`
              : `✍️ Paciente assinou a guia SADT`;
            // Registar na BD (notificação in-app com filtros)
            await criarNotificacaoInApp({
              tipo: 'assinatura',
              titulo: tituloNotif,
              conteudo: conteudoAssina,
              guiaId: sessao.guiaId,
              pacienteNome: sessao.pacienteNome ?? undefined,
              profissionalNome: sessao.profissionalNome ?? undefined,
              convenioNome: sessao.convenioNome ?? undefined,
            }).catch(() => {});
            // Enviar também notificação push ao dono
            await notifyOwner({
              title: tituloNotif,
              content: conteudoAssina,
            }).catch(() => { /* notificação não crítica — ignora falha */ });
          }

          return result;
        } catch (e: any) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: e.message || 'Erro ao assinar sessão' });
        }
      }),
  }),

  // ─── Repasse Detalhado por Paciente ──────────────────────────────────────
  repasse: router({
    /**
     * Lista atendimentos realizados com prontuário feito, enriquecidos com dados de guia.
     * Regras:
     *  - Só entra se prontuarioFeito = 1
     *  - statusRecebimento: 'recebido' (guia paga), 'glosa' (guia glosada), 'pendente' (sem guia ou outro status)
     *  - Filtros: profissionalId, convenioId, mes (YYYY-MM)
     */
        listarPorPaciente: protectedProcedure
      .input(z.object({
        convenioId: z.number().optional(),
        profissionalId: z.number().optional(),
        dataInicio: z.string().optional(), // YYYY-MM-DD
        dataFim: z.string().optional(),    // YYYY-MM-DD
      }))
      .query(async ({ input, ctx }) => {
        const perfil = ctx.user.perfil;
        const isMaster = perfil === 'administrador' || perfil === 'master';
        // Profissional só vê os seus próprios; master, administrador e recepção vêem todos
        const isProfissional = perfil === 'profissional';
        if (!isMaster && perfil !== 'recepcao' && !isProfissional) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso não autorizado' });
        }
        const { and, inArray, eq: eqFn, sql } = await import('drizzle-orm');
        const database = await db.getDb();
        if (!database) return [];
        const { atendimentos: atendimentosTable, guias: guiasTable, pacientes: pacientesTable, profissionais: profissionaisTable, convenios: conveniosTable, assinaturasSadt: assinaturasSadtTable, pagamentosAtendimento: pagamentosAtendimentoTable, pagamentosRepasse: pagamentosRepasseTable, notasFiscaisRepasse: notasFiscaisRepasseTable, procedimentosPorConvenio: procedimentosPorConvenioTable, tabelaProcedimentos: tabelaProcedimentosTable } = await import('../drizzle/schema');
        const condicoes: any[] = [
          eqFn(atendimentosTable.status, 'realizado'),
          eqFn(atendimentosTable.prontuarioFeito, 1),
        ];
        // Profissional só vê os seus próprios atendimentos
        if (isProfissional && ctx.user.profissionalVinculadoId) {
          condicoes.push(eqFn(atendimentosTable.profissionalId, ctx.user.profissionalVinculadoId));
        }
        if (input.profissionalId) {
          if (!isMaster) {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Filtro por profissional restrito ao usuário master.' });
          }
          condicoes.push(eqFn(atendimentosTable.profissionalId, input.profissionalId));
        }
        if (input.convenioId) condicoes.push(eqFn(atendimentosTable.convenioId, input.convenioId));
        // Filtro por intervalo de datas (campo date comparado como string YYYY-MM-DD)
        if (input.dataInicio) condicoes.push(sql`${atendimentosTable.data} >= ${input.dataInicio}`);
        if (input.dataFim) condicoes.push(sql`${atendimentosTable.data} <= ${input.dataFim}`);

        const rows = await database
          .select({
            atendimentoId: atendimentosTable.id,
            pacienteId: atendimentosTable.pacienteId,
            profissionalId: atendimentosTable.profissionalId,
            convenioId: atendimentosTable.convenioId,
            data: atendimentosTable.data,
            hora: atendimentosTable.hora,
            serieId: atendimentosTable.serieId,
            duracao: atendimentosTable.duracao,
            unidadesRepasse: atendimentosTable.unidadesRepasse,
            tipo: atendimentosTable.tipo,
            prontuarioFeito: atendimentosTable.prontuarioFeito,
            guiaId: atendimentosTable.guiaId,
            procedimentoConvenioId: atendimentosTable.procedimentoConvenioId,
            pagamentoParticularId: atendimentosTable.pagamentoParticularId,
          })
          .from(atendimentosTable)
          .where(and(...condicoes));

        if (rows.length === 0) return [];

        const pacienteIds = Array.from(new Set(rows.map(r => r.pacienteId)));
        const profissionalIds = Array.from(new Set(rows.map(r => r.profissionalId)));
        const convenioIds = Array.from(new Set(rows.map(r => r.convenioId)));
        const pagamentoIds = Array.from(new Set(rows.map(r => r.pagamentoParticularId).filter((id): id is number => id != null)));
        const procedimentoConvenioIds = Array.from(new Set(rows.map(r => r.procedimentoConvenioId).filter((id): id is number => id != null)));
        // Coletar guiaIds diretamente dos atendimentos (mais preciso que buscar por paciente+profissional)
        const guiaIds = Array.from(new Set(rows.map(r => r.guiaId).filter((id): id is number => id != null)));
        const serieIds = Array.from(new Set(rows.map(r => r.serieId).filter((id): id is string => typeof id === 'string' && id.length > 0)));

        const pagamentosPromise = pagamentoIds.length > 0
          ? database.select({
            id: pagamentosAtendimentoTable.id,
            valor: pagamentosAtendimentoTable.valor,
            atendimentoId: pagamentosAtendimentoTable.atendimentoId,
            atendimentosVinculados: pagamentosAtendimentoTable.atendimentosVinculados,
          }).from(pagamentosAtendimentoTable).where(inArray(pagamentosAtendimentoTable.id, pagamentoIds))
          : Promise.resolve([]);
        const procedimentosPromise = procedimentoConvenioIds.length > 0
          ? database.select({
            id: procedimentosPorConvenioTable.id,
            codigoANS: tabelaProcedimentosTable.codigoANS,
            valor: procedimentosPorConvenioTable.valor,
          }).from(procedimentosPorConvenioTable)
            .innerJoin(tabelaProcedimentosTable, eqFn(procedimentosPorConvenioTable.tabelaProcedimentoId, tabelaProcedimentosTable.id))
            .where(inArray(procedimentosPorConvenioTable.id, procedimentoConvenioIds))
          : Promise.resolve([]);
        const totaisSeriesPromise = serieIds.length > 0
          ? database.select({
            serieId: atendimentosTable.serieId,
            pacienteId: atendimentosTable.pacienteId,
            profissionalId: atendimentosTable.profissionalId,
            convenioId: atendimentosTable.convenioId,
            totalAtendimentos: sql<number>`COUNT(*)`,
          }).from(atendimentosTable)
            .where(and(
              inArray(atendimentosTable.serieId, serieIds),
              sql`${atendimentosTable.status} <> 'cancelado'`,
            ))
            .groupBy(atendimentosTable.serieId, atendimentosTable.pacienteId, atendimentosTable.profissionalId, atendimentosTable.convenioId)
          : Promise.resolve([]);
        const pagamentosRepassePromise = rows.length > 0
          ? database.select().from(pagamentosRepasseTable).where(inArray(pagamentosRepasseTable.atendimentoId, rows.map(row => row.atendimentoId)))
          : Promise.resolve([]);
        const notasFiscaisRepassePromise = profissionalIds.length > 0
          ? database.select().from(notasFiscaisRepasseTable).where(inArray(notasFiscaisRepasseTable.profissionalId, profissionalIds))
          : Promise.resolve([]);

        const [pacientesList, profissionaisList, conveniosList, guiasList, assinaturasList, pagamentosList, procedimentosList, totaisSeries, pagamentosRepasseList, notasFiscaisRepasseList] = await Promise.all([
          database.select().from(pacientesTable).where(inArray(pacientesTable.id, pacienteIds)),
          database.select().from(profissionaisTable).where(inArray(profissionaisTable.id, profissionalIds)),
          database.select().from(conveniosTable).where(inArray(conveniosTable.id, convenioIds)),
          // Buscar guias: sempre busca por pacienteId+profissionalId para garantir fallback
          // quando guiaId do atendimento aponta para guia inexistente ou deletada
          database.select().from(guiasTable).where(
            and(
              inArray(guiasTable.pacienteId, pacienteIds),
              inArray(guiasTable.profissionalId, profissionalIds)
            )
          ),
          // Buscar assinaturas SADT dos pacientes para indicar se a guia foi assinada
          database.select({
            pacienteId: assinaturasSadtTable.pacienteId,
            guiaId: assinaturasSadtTable.guiaId,
            status: assinaturasSadtTable.status,
            dataAssinatura: assinaturasSadtTable.dataAssinatura,
            pdfUrl: assinaturasSadtTable.pdfUrl,
          }).from(assinaturasSadtTable).where(inArray(assinaturasSadtTable.pacienteId, pacienteIds)),
          pagamentosPromise,
          procedimentosPromise,
          totaisSeriesPromise,
          pagamentosRepassePromise,
          notasFiscaisRepassePromise,
        ]);

        const pacienteMap = Object.fromEntries(pacientesList.map(p => [p.id, p]));
        const profissionalMap = Object.fromEntries(profissionaisList.map(p => [p.id, p]));
        const convenioMap = Object.fromEntries(conveniosList.map(c => [c.id, c]));
        const procedimentoMap = Object.fromEntries(procedimentosList.map(p => [p.id, p]));
        const totalAtendimentosPorSerie = new Map(
          totaisSeries.map((serie: any) => [
            `${serie.serieId}|${serie.pacienteId}|${serie.profissionalId}|${serie.convenioId}`,
            Number(serie.totalAtendimentos),
          ]),
        );
        const pagamentoRepassePorAtendimento = new Map(pagamentosRepasseList.map((pagamento: any) => [pagamento.atendimentoId, pagamento]));
        const notaFiscalPorProfissionalCompetencia = new Map(notasFiscaisRepasseList.map((nota: any) => [`${nota.profissionalId}|${nota.competencia}`, nota]));

        return rows.map(row => {
          const paciente = pacienteMap[row.pacienteId];
          const profissional = profissionalMap[row.profissionalId];
          const convenio = convenioMap[row.convenioId];
          const codigoProcedimento = row.procedimentoConvenioId
            ? procedimentoMap[row.procedimentoConvenioId]?.codigoANS
            : null;
          const valorProcedimentoAtual = row.procedimentoConvenioId
            ? procedimentoMap[row.procedimentoConvenioId]?.valor
            : null;

          // Guia: primeiro tenta pelo guiaId direto do atendimento
          // Se guiaId não encontrar resultado (guia deletada/inválida), usa fallback por paciente+profissional
          const guiaPorId = row.guiaId ? guiasList.find(g => g.id === row.guiaId) : null;
          const guia = guiaPorId
            ?? guiasList.find(g =>
              g.pacienteId === row.pacienteId
              && g.profissionalId === row.profissionalId
              && (row.serieId ? g.serieId === row.serieId : !g.serieId),
            );

          const pagamentoParticular = row.pagamentoParticularId
            ? pagamentosList.find(pagamento => pagamento.id === row.pagamentoParticularId)
            : null;
          const quantidadeSessoesDoPagamentoParticular = pagamentoParticular
            ? contarSessoesDoPagamentoParticular(
              (pagamentoParticular as any).atendimentoId,
              (pagamentoParticular as any).atendimentosVinculados,
            )
            : 1;

          const tipoAtendimento = (row.tipo || '').toLowerCase();
          const isAvaliacaoNeuro = tipoAtendimento.includes('avalia') && tipoAtendimento.includes('neuro');
          const isPacoteNeuro = ehPacoteAvaliacaoNeuropsicologica((convenio as any)?.nome, row.tipo);
          const aplicaRateioPacoteNeuro = isPacoteNeuro
            && guia?.status !== 'paga'
            && !(guia as any)?.repasseFinalizado;
          const chaveDaSerie = `${row.serieId || ''}|${row.pacienteId}|${row.profissionalId}|${row.convenioId}`;
          const totalAtendimentosDaSerie = row.serieId
            ? (totalAtendimentosPorSerie.get(chaveDaSerie) ?? 1)
            : 1;

          // Guias de série guardam o valor autorizado do conjunto de sessões.
          // O repasse deve usar apenas a quota correspondente à sessão realizada.
          const valorDaGuia = calcularValorBrutoPorSessao(guia ? {
            valor: guia.valor,
            valorTotalGeral: (guia as any).valorTotalGeral,
            valorProcedimentos: (guia as any).valorProcedimentos,
            totalSessoes: (guia as any).totalSessoes,
          } : null, (convenio as any)?.nome, codigoProcedimento, valorProcedimentoAtual);

          // Em pacotes neuropsicológicos autorizados, a referência é o valor
          // global do pacote dividido por todas as sessões da mesma série.
          const convenioNomeAtual = ((convenio as any)?.nome || '').toLowerCase();
          const isParticular = ehConvenioParticular((convenio as any)?.nome) || row.convenioId === 0;
          const valorBasePacote = resolverValorBaseDoPacoteNeuropsicologico(
            guia ? {
              valor: guia.valor,
              valorTotalGeral: (guia as any).valorTotalGeral,
              valorProcedimentos: (guia as any).valorProcedimentos,
              totalSessoes: (guia as any).totalSessoes,
            } : null,
            valorProcedimentoAtual,
          );
          const valorBrutoUnitario = resolverValorBrutoDoRepasse({
            valorDaGuia: aplicaRateioPacoteNeuro
              ? calcularValorPacoteNeuropsicologicoPorAtendimento(valorBasePacote, totalAtendimentosDaSerie)
              : valorDaGuia,
            valorDoPagamento: pagamentoParticular ? Number(pagamentoParticular.valor) : null,
            ehParticular: isParticular,
            quantidadeSessoesVinculadas: quantidadeSessoesDoPagamentoParticular,
          });
          const unidadesRepasse = normalizarUnidadesRepasse(row.unidadesRepasse);
          const valorBruto = calcularValorComUnidades(valorBrutoUnitario, unidadesRepasse);
          const isTesteAvulso = tipoAtendimento.includes('teste') || tipoAtendimento.includes('avulso');

          let percField = 'percentualRepasse'; // fallback
          if (isAvaliacaoNeuro) percField = 'percentualAvaliacaoNeuropsicologica';
          else if (isTesteAvulso) percField = 'percentualTesteAvulso';
          else if (isParticular) percField = 'percentualParticular';
          else percField = 'percentualConvenio';

          const percentualEspecial = obterPercentualEspecialDeRepasse((convenio as any)?.nome, codigoProcedimento);
          const percValue = (profissional as any)?.[percField] ?? (profissional as any)?.percentualRepasse;
          const percentualRepasse = percentualEspecial ?? (percValue ? parseFloat(percValue.toString()) / 100 : 0);
          const valorRepasse = valorBruto * percentualRepasse;

          let statusRecebimento: 'recebido' | 'glosa' | 'pendente' = 'pendente';
          let valorGlosa = 0;
          const guiaGlosada = guia?.status === 'glosa';
          if (guiaGlosada) {
            statusRecebimento = 'glosa';
            valorGlosa = valorBruto;
          } else if (pagamentoParticularConfirmaRecebimento({
            ehParticular: isParticular,
            pagamentoId: pagamentoParticular?.id,
            guiaGlosada,
          }) || guia?.status === 'paga') {
            statusRecebimento = 'recebido';
          }

         // Verificar se há assinatura SADT confirmada para este paciente/guia
         const assinaturaGuia = assinaturasList.find(
           (a: any) => a.pacienteId === row.pacienteId &&
             (guia ? a.guiaId === guia.id : true) &&
             a.status === 'assinado'
         );
          // Convênios isentos de assinatura digital: Mediservice/MEDSERVICE e Proasa.
          const CONVENIOS_SEM_ASSINATURA = ['mediservice', 'medservice', 'proasa'];
          const isConvenioIsentoAssinatura = CONVENIOS_SEM_ASSINATURA.some(c =>
            convenioNomeAtual.includes(c)
          );
          const guiaAssinada = !!assinaturaGuia || isConvenioIsentoAssinatura;
          const guiaAssinadaData = (assinaturaGuia as any)?.dataAssinatura ?? null;
          const guiaAssinadaPdfUrl = (assinaturaGuia as any)?.pdfUrl ?? null;
          const isConvenioIsentoAssinaturaFlag = isConvenioIsentoAssinatura;
          const competenciaRepasse = obterCompetenciaRepasse(row.data as any);
          const pagamentoRepasse = pagamentoRepassePorAtendimento.get(row.atendimentoId) as any;
          const notaFiscalRepasse = notaFiscalPorProfissionalCompetencia.get(`${row.profissionalId}|${competenciaRepasse}`) as any;

          return {
            atendimentoId: row.atendimentoId,
            data: row.data,
            hora: row.hora,
            duracao: row.duracao,
            serieId: row.serieId,
            totalAtendimentosDaSerie,
            isPacoteNeuro: aplicaRateioPacoteNeuro,
            unidadesRepasse,
            valorBrutoUnitario,
            tipo: row.tipo,
            prontuarioFeito: row.prontuarioFeito,
            pacienteId: row.pacienteId,
            pacienteNome: (paciente as any)?.nome ?? 'N/A',
            profissionalId: row.profissionalId,
            profissionalNome: (profissional as any)?.nome ?? 'N/A',
            convenioId: row.convenioId,
            convenioNome: (convenio as any)?.nome ?? 'Particular',
            guiaId: guia?.id ?? null,
            guiaNumero: guia?.numeroGuia ?? null,
            guiaStatus: guia?.status ?? null,
            pagamentoParticularId: pagamentoParticular?.id ?? null,
          guiaAssinada,
          guiaAssinadaData,
          guiaAssinadaPdfUrl,
          valorBruto,
          valorRepasse,
          valorGlosa,
          statusRecebimento,
          competenciaRepasse,
          statusRepasse: pagamentoRepasse?.status ?? 'pendente',
          dataPagamentoRepasse: pagamentoRepasse?.dataPagamento ?? null,
          notaFiscalRepasseUrl: notaFiscalRepasse?.arquivoUrl ?? null,
          notaFiscalRepasseNome: notaFiscalRepasse?.nomeArquivo ?? null,
            isConvenioIsentoAssinatura: isConvenioIsentoAssinaturaFlag,
          };
        });
      }),

    marcarRecebido: protectedProcedure
      .input(z.object({ guiaId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = ctx.user.perfil;
        if (perfil !== 'administrador' && perfil !== 'recepcao') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador e recepção' });
        }
                const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { guias: guiasTable } = await import('../drizzle/schema');
        const { eq: eqMut } = await import('drizzle-orm');
        await database.update(guiasTable).set({ status: 'paga' }).where(eqMut(guiasTable.id, input.guiaId));
        return { ok: true };
      }),
    registarGlosa: protectedProcedure
      .input(z.object({ guiaId: z.number(), motivo: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const perfil = ctx.user.perfil;
        if (perfil !== 'administrador' && perfil !== 'recepcao') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso restrito a administrador e recepção' });
        }
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { guias: guiasTable } = await import('../drizzle/schema');
        const { eq: eqGlosa } = await import('drizzle-orm');
        await database.update(guiasTable).set({ status: 'glosa' }).where(eqGlosa(guiasTable.id, input.guiaId));
        return { ok: true };
      }),
    definirStatusPagamento: protectedProcedure
      .input(z.object({
        atendimentoIds: z.array(z.number().int().positive()).min(1).max(500),
        status: z.enum(['pendente', 'pago']),
        competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
      }))
      .mutation(async ({ input, ctx }) => {
        const podeDarBaixa = ctx.user.perfil === 'administrador' || ctx.user.perfil === 'master';
        if (!podeDarBaixa) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Somente o usuário master pode alterar o status de pagamento de repasse.' });
        }
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível.' });
        const { atendimentos: atendimentosTable, pagamentosRepasse: pagamentosRepasseTable } = await import('../drizzle/schema');
        const ids = Array.from(new Set(input.atendimentoIds));
        const registros = await database.select({
          id: atendimentosTable.id,
          profissionalId: atendimentosTable.profissionalId,
          data: atendimentosTable.data,
          status: atendimentosTable.status,
          prontuarioFeito: atendimentosTable.prontuarioFeito,
        }).from(atendimentosTable).where(inArray(atendimentosTable.id, ids));
        if (registros.length !== ids.length) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Um ou mais atendimentos selecionados não foram encontrados.' });
        }
        const invalidos = registros.filter(registro =>
          registro.status !== 'realizado'
          || registro.prontuarioFeito !== 1
          || obterCompetenciaRepasse(registro.data as any) !== input.competencia,
        );
        if (invalidos.length > 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'A baixa só pode ser aplicada a atendimentos realizados, com prontuário preenchido e da competência selecionada.' });
        }
        const agora = new Date();
        await database.transaction(async (tx) => {
          for (const registro of registros) {
            await tx.insert(pagamentosRepasseTable).values({
              atendimentoId: registro.id,
              profissionalId: registro.profissionalId,
              competencia: input.competencia,
              status: input.status,
              dataPagamento: input.status === 'pago' ? agora : null,
              marcadoPor: ctx.user.id,
            }).onDuplicateKeyUpdate({
              set: {
                profissionalId: registro.profissionalId,
                competencia: input.competencia,
                status: input.status,
                dataPagamento: input.status === 'pago' ? agora : null,
                marcadoPor: ctx.user.id,
              },
            });
          }
        });
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: ctx.user.name,
          usuarioPerfil: ctx.user.perfil,
          entidade: 'pagamentos_repasse',
          acao: input.status === 'pago' ? 'baixa_repasse_paga' : 'baixa_repasse_pendente',
          descricao: `${ids.length} atendimento(s) de repasse marcado(s) como ${input.status} na competência ${input.competencia}.`,
          dadosNovos: { atendimentoIds: ids, competencia: input.competencia, status: input.status },
        });
        return { ok: true, atualizados: ids.length };
      }),
    listarNotasFiscais: protectedProcedure
      .input(z.object({
        competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
        profissionalId: z.number().int().positive().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const perfil = ctx.user.perfil;
        const profissionalId = perfil === 'profissional' ? ctx.user.profissionalVinculadoId : input.profissionalId;
        if (perfil === 'profissional' && !profissionalId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Seu usuário não está vinculado a um profissional.' });
        }
        if (perfil !== 'profissional' && perfil !== 'administrador' && perfil !== 'master') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso não autorizado.' });
        }
        const database = await db.getDb();
        if (!database) return [];
        const { notasFiscaisRepasse: notasFiscaisRepasseTable } = await import('../drizzle/schema');
        const condicoes = [eq(notasFiscaisRepasseTable.competencia, input.competencia)];
        if (profissionalId) condicoes.push(eq(notasFiscaisRepasseTable.profissionalId, profissionalId));
        return database.select().from(notasFiscaisRepasseTable).where(and(...condicoes)).orderBy(desc(notasFiscaisRepasseTable.updatedAt));
      }),
    importarNotaFiscal: protectedProcedure
      .input(z.object({
        competencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
        profissionalId: z.number().int().positive().optional(),
        nomeArquivo: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(100),
        base64Data: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const perfil = ctx.user.perfil;
        const profissionalId = perfil === 'profissional' ? ctx.user.profissionalVinculadoId : input.profissionalId;
        if (perfil !== 'profissional' && perfil !== 'administrador' && perfil !== 'master') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso não autorizado.' });
        }
        if (!profissionalId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selecione o profissional para associar a nota fiscal.' });
        }
        const buffer = Buffer.from(input.base64Data, 'base64');
        if (!notaFiscalAceita(input.mimeType, buffer.length)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Envie uma nota fiscal em PDF, JPG ou PNG de até 10 MB.' });
        }
        const arquivoSeguro = input.nomeArquivo.replace(/[^a-zA-Z0-9._-]/g, '_');
        const { key, url } = await storagePut(`documentos/repasses/${profissionalId}/${input.competencia}/${arquivoSeguro}`, buffer, input.mimeType);
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível.' });
        const { notasFiscaisRepasse: notasFiscaisRepasseTable } = await import('../drizzle/schema');
        await database.insert(notasFiscaisRepasseTable).values({
          profissionalId,
          competencia: input.competencia,
          arquivoKey: key,
          arquivoUrl: url,
          nomeArquivo: input.nomeArquivo,
          mimeType: input.mimeType,
          enviadoPor: ctx.user.id,
        }).onDuplicateKeyUpdate({
          set: { arquivoKey: key, arquivoUrl: url, nomeArquivo: input.nomeArquivo, mimeType: input.mimeType, enviadoPor: ctx.user.id },
        });
        await registrarAuditoria({
          usuarioId: ctx.user.id,
          usuarioNome: ctx.user.name,
          usuarioPerfil: ctx.user.perfil,
          entidade: 'notas_fiscais_repasse',
          entidadeId: profissionalId,
          acao: 'importar_nota_fiscal_repasse',
          descricao: `Nota fiscal ${input.nomeArquivo} importada para a competência ${input.competencia}.`,
          dadosNovos: { profissionalId, competencia: input.competencia, nomeArquivo: input.nomeArquivo },
        });
        return { ok: true, url, nomeArquivo: input.nomeArquivo };
      }),
  }),

  // ─── Relatório Diário da Agenda ───────────────────────────────────────────
  // ─── Notificações In-App ─────────────────────────────────────────────────────────────────────────────────────
  notificacoes: router({
    /** Lista notificações com filtro opcional por tipo */
    list: protectedProcedure
      .input(z.object({
        tipo: z.enum(['confirmacao', 'cancelamento', 'assinatura', 'sistema', 'todos']).optional(),
        apenasNaoLidas: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        return listarNotificacoes({
          tipo: input?.tipo && input.tipo !== 'todos' ? input.tipo as any : undefined,
          apenasNaoLidas: input?.apenasNaoLidas,
          limit: 200,
        });
      }),
    /** Conta notificações não lidas (para badge no sino) */
    contarNaoLidas: protectedProcedure
      .query(async () => {
        return contarNaoLidas();
      }),
    /** Marca uma notificação como lida */
    marcarLida: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await marcarComoLida(input.id);
        return { ok: true };
      }),
    /** Marca todas as notificações como lidas */
    marcarTodasLidas: protectedProcedure
      .mutation(async () => {
        await marcarTodasComoLidas();
        return { ok: true };
      }),
  }),

  relatorios: router({
    agendaDiaria: protectedProcedure
      .input(
        z.object({
          data: z.string(), // yyyy-MM-dd
          profissionalId: z.number().optional(),
          convenioId: z.number().optional(),
          status: z.enum(['todos', 'agendado', 'realizado', 'cancelado', 'falta']).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        const perfil = (ctx.user as any)?.perfil;
        const profissionalVinculadoId = (ctx.user as any)?.profissionalVinculadoId;
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

        const {
          atendimentos: atendimentosTable,
          pacientes: pacientesTable,
          profissionais: profissionaisTable,
          convenios: conveniosTable,
        } = await import('../drizzle/schema');
        const { and: andFn, eq: eqFn, sql: sqlFn } = await import('drizzle-orm');

        const condicoes: any[] = [
          sqlFn`DATE(${atendimentosTable.data}) = ${input.data}`,
        ];

        // Profissional só vê os seus próprios atendimentos
        if (perfil === 'profissional' && profissionalVinculadoId) {
          condicoes.push(eqFn(atendimentosTable.profissionalId, profissionalVinculadoId));
        } else if (input.profissionalId) {
          condicoes.push(eqFn(atendimentosTable.profissionalId, input.profissionalId));
        }

        if (input.convenioId) {
          condicoes.push(eqFn(atendimentosTable.convenioId, input.convenioId));
        }

        if (input.status && input.status !== 'todos') {
          condicoes.push(eqFn(atendimentosTable.status, input.status));
        }

        const rows = await database
          .select({
            id: atendimentosTable.id,
            data: atendimentosTable.data,
            hora: atendimentosTable.hora,
            tipo: atendimentosTable.tipo,
            descricao: atendimentosTable.descricao,
            status: atendimentosTable.status,
            prontuarioFeito: atendimentosTable.prontuarioFeito,
            confirmacaoStatus: atendimentosTable.confirmacaoStatus,
            reagendadoPara: atendimentosTable.reagendadoPara,
            guiaId: atendimentosTable.guiaId,
            pacienteId: atendimentosTable.pacienteId,
            pacienteNome: pacientesTable.nome,
            pacienteCarteirinha: pacientesTable.numeroCarteira,
            pacienteTelefone: pacientesTable.telefone,
            pacienteWhatsapp: pacientesTable.whatsapp,
            profissionalId: atendimentosTable.profissionalId,
            profissionalNome: profissionaisTable.nome,
            profissionalEspecialidade: profissionaisTable.especialidade,
            convenioId: atendimentosTable.convenioId,
            convenioNome: conveniosTable.nome,
          })
          .from(atendimentosTable)
          .leftJoin(pacientesTable, eqFn(atendimentosTable.pacienteId, pacientesTable.id))
          .leftJoin(profissionaisTable, eqFn(atendimentosTable.profissionalId, profissionaisTable.id))
          .leftJoin(conveniosTable, eqFn(atendimentosTable.convenioId, conveniosTable.id))
          .where(andFn(...condicoes))
          .orderBy(atendimentosTable.hora);

        // Totais por status
        const totais = {
          total: rows.length,
          agendado: rows.filter(r => r.status === 'agendado').length,
          realizado: rows.filter(r => r.status === 'realizado').length,
          cancelado: rows.filter(r => r.status === 'cancelado' && !r.reagendadoPara).length,
          reagendado: rows.filter(r => r.status === 'cancelado' && r.reagendadoPara).length,
          falta: rows.filter(r => r.status === 'falta').length,
          prontuariosPendentes: rows.filter(r => r.status === 'realizado' && !r.prontuarioFeito).length,
        };

        return { atendimentos: rows, totais, data: input.data };
      }),
  }),
});

function generateTISSXML(guias: any[], pacientes: any[], profissionais: any[], convenios: any[]) {
  const dataAtual = new Date().toISOString().split('T')[0];
  
  // Cabeçalho XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<lote xmlns="http://www.ans.gov.br/padroes/tiss">';
  xml += `<cabecalhoLote versaoLote="3.05.00" dataGeracaoLote="${dataAtual}">`;
  xml += '<CNPJ>00000000000000</CNPJ>';
  xml += `<nomeContratante>${NOME_FANTASIA_CLINICA}</nomeContratante>`;
  xml += '</cabecalhoLote>';
  
  // Guias
  xml += '<guias>';
  
  guias.forEach(guia => {
    const paciente = pacientes.find(p => p.id === guia.pacienteId);
    const profissional = profissionais.find(p => p.id === guia.profissionalId);
    const convenio = convenios.find(c => c.id === guia.convenioId);
    
    if (!paciente || !profissional || !convenio) return;
    
    xml += '<guia>';
    xml += `<numeroGuia>${escapeXML(guia.numeroGuia)}</numeroGuia>`;
    xml += `<dataEmissao>${guia.dataEmissao instanceof Date ? guia.dataEmissao.toISOString().split('T')[0] : guia.dataEmissao}</dataEmissao>`;
    
    // Dados do paciente
    xml += '<paciente>';
    xml += `<nome>${escapeXML(paciente.nome)}</nome>`;
    xml += `<cpf>${paciente.cpf.replace(/\D/g, '')}</cpf>`;
    xml += `<dataNascimento>${paciente.dataNascimento instanceof Date ? paciente.dataNascimento.toISOString().split('T')[0] : paciente.dataNascimento}</dataNascimento>`;
    xml += '</paciente>';
    
    // Dados do profissional
    xml += '<profissional>';
    xml += `<nome>${escapeXML(profissional.nome)}</nome>`;
    xml += `<conselho>${profissional.crm}</conselho>`;
    xml += `<especialidade>${escapeXML(profissional.especialidade)}</especialidade>`;
    xml += '</profissional>';
    
    // Dados do convênio
    xml += '<convenio>';
    xml += `<nome>${escapeXML(convenio.nome)}</nome>`;
    xml += `<cnpj>${convenio.cnpj.replace(/\D/g, '')}</cnpj>`;
    xml += '</convenio>';
    
    // Dados do procedimento
    xml += '<procedimento>';
    xml += `<descricao>${escapeXML(guia.procedimento)}</descricao>`;
    xml += `<valor>${(guia.valor || 0).toFixed(2).replace('.', ',')}</valor>`;
    xml += `<status>${guia.status}</status>`;
    xml += '</procedimento>';
    
    xml += '</guia>';
  });
  
  xml += '</guias>';
  xml += '</lote>';
  
  return xml;
}

function escapeXML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export type AppRouter = typeof appRouter;
