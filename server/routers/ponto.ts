import { TRPCError } from '@trpc/server';
import { and, asc, between, desc, eq, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { pontoAjustes, pontoBiometrias, pontoConsentimentos, pontoFechamentos, pontoJornadas, pontoLocalidades, pontoOcorrencias, pontoRegistros, users } from '../../drizzle/schema';
import { JORNADA_PADRAO_RECEPCAO, calcularResumoMensalPonto, calcularResumoPonto, type JornadaPonto } from '../../shared/pontoEletronico';
import { distanciaDescritor, distanciaEmMetros } from '../../shared/pontoSeguranca';
import { getDb } from '../db';
import { protectedProcedure, router } from '../_core/trpc';

const PERFIS_RECEPCAO = ['recepcao', 'recepção', 'recepcionista'];
const PERFIS_MASTER = ['administrador', 'master'];
const TIPOS_MARCACAO = ['entrada', 'inicioIntervalo', 'fimIntervalo', 'saida'] as const;
const VERSAO_CONSENTIMENTO = '1.0';
const TEXTO_CONSENTIMENTO = 'Autorizo o uso do meu descritor facial e da minha geolocalização exclusivamente para autenticar a batida de ponto, com armazenamento mínimo, trilha de auditoria e possibilidade de solicitar revisão pelo master.';

function perfilNormalizado(user: any) {
  return String(user?.perfil ?? '').toLocaleLowerCase('pt-BR');
}

function ehRecepcao(user: any) {
  return PERFIS_RECEPCAO.includes(perfilNormalizado(user));
}

function ehMaster(user: any) {
  return !ehRecepcao(user) && (user?.role === 'admin' || PERFIS_MASTER.includes(perfilNormalizado(user)));
}

function exigirRecepcaoOuMaster(user: any) {
  if (!ehRecepcao(user) && !ehMaster(user)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'O ponto eletrônico é exclusivo para recepção.' });
  }
}

function exigirRecepcao(user: any) {
  if (!ehRecepcao(user)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'A marcação de ponto é exclusiva para recepção.' });
  }
}

function exigirMaster(user: any) {
  if (!ehMaster(user)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Apenas o perfil master pode gerir o painel de ponto.' });
  }
}

function dataManausAgora() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}

function horaManausAgora() {
  const partes = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Manaus', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${obter('hour')}:${obter('minute')}`;
}

function competenciaDaData(data: string) {
  return data.slice(0, 7);
}

function dataISO(data: unknown) {
  if (data instanceof Date) {
    const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(data);
    const obter = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
    return `${obter('year')}-${obter('month')}-${obter('day')}`;
  }
  return String(data).slice(0, 10);
}

function limitesCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();
  return { inicio: `${competencia}-01`, fim: `${competencia}-${String(ultimoDia).padStart(2, '0')}` };
}

function jornadaDaLinha(linha?: any): JornadaPonto {
  if (!linha) return { ...JORNADA_PADRAO_RECEPCAO };
  return {
    horaEntrada: linha.horaEntrada,
    inicioIntervalo: linha.inicioIntervalo,
    fimIntervalo: linha.fimIntervalo,
    horaSaida: linha.horaSaida,
    toleranciaMarcacaoMinutos: Number(linha.toleranciaMarcacaoMinutos),
    toleranciaDiariaMinutos: Number(linha.toleranciaDiariaMinutos),
    adicionalHoraExtra: Number(linha.adicionalHoraExtra),
    valorHora: Number(linha.valorHora),
  };
}

async function competenciaFechada(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, competencia: string) {
  const [fechamento] = await db.select().from(pontoFechamentos).where(eq(pontoFechamentos.competencia, competencia)).limit(1);
  return fechamento ?? null;
}

async function gravarMarcacaoValidada(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, usuarioId: number, tipo: typeof TIPOS_MARCACAO[number], evidencia: Record<string, unknown>) {
  const data = dataManausAgora();
  if (await competenciaFechada(db, competenciaDaData(data))) throw new TRPCError({ code: 'BAD_REQUEST', message: 'A competência está fechada pelo master.' });
  const [existente] = await db.select().from(pontoRegistros).where(and(eq(pontoRegistros.usuarioId, usuarioId), eq(pontoRegistros.data, data as any))).limit(1);
  const indice = TIPOS_MARCACAO.indexOf(tipo);
  if (existente) {
    if (existente[tipo]) throw new TRPCError({ code: 'CONFLICT', message: 'Esta marcação já foi registrada.' });
    const anterior = TIPOS_MARCACAO[indice - 1];
    if (anterior && !existente[anterior]) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Registre as marcações na ordem da jornada.' });
    await db.update(pontoRegistros).set({ [tipo]: horaManausAgora(), status: tipo === 'saida' ? 'completo' : 'aberto', ...evidencia } as any).where(eq(pontoRegistros.id, existente.id));
  } else {
    if (tipo !== 'entrada') throw new TRPCError({ code: 'BAD_REQUEST', message: 'A primeira marcação do dia deve ser a entrada.' });
    await db.insert(pontoRegistros).values({ usuarioId, data: data as any, entrada: horaManausAgora(), status: 'aberto', ...evidencia } as any);
  }
  return { success: true, data, horario: horaManausAgora() };
}

export const pontoRouter = router({
  hoje: protectedProcedure.query(async ({ ctx }) => {
    exigirRecepcao(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
    const data = dataManausAgora();
    const [registro] = await db.select().from(pontoRegistros).where(and(eq(pontoRegistros.usuarioId, ctx.user.id), eq(pontoRegistros.data, data as any))).limit(1);
    const [jornada] = await db.select().from(pontoJornadas).where(eq(pontoJornadas.usuarioId, ctx.user.id)).limit(1);
    const fechamento = await competenciaFechada(db, competenciaDaData(data));
    const [biometria] = await db.select({ id: pontoBiometrias.id }).from(pontoBiometrias).where(and(eq(pontoBiometrias.usuarioId, ctx.user.id), eq(pontoBiometrias.revogadoEm, null as any))).limit(1);
    const [localidade] = await db.select({ id: pontoLocalidades.id, nome: pontoLocalidades.nome, raioMetros: pontoLocalidades.raioMetros }).from(pontoLocalidades).where(eq(pontoLocalidades.ativo, 1)).orderBy(desc(pontoLocalidades.id)).limit(1);
    return { data, horarioAtual: horaManausAgora(), jornada: jornadaDaLinha(jornada), registro: registro ?? null, resumo: calcularResumoPonto(registro ?? {}, jornadaDaLinha(jornada)), fechado: Boolean(fechamento), biometriaCadastrada: Boolean(biometria), localidade: localidade ?? null, funcionarioAtivo: Number(jornada?.ativo ?? 1) === 1 };
  }),

  cadastrarBiometria: protectedProcedure
    .input(z.object({ descritor: z.array(z.number().finite()).length(128), consentimento: z.literal(true) }))
    .mutation(async ({ input, ctx }) => {
      exigirRecepcao(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const valores = { descritorFacial: JSON.stringify(input.descritor), consentimentoVersao: VERSAO_CONSENTIMENTO, consentidoEm: new Date(), revogadoEm: null };
      const [existente] = await db.select({ id: pontoBiometrias.id }).from(pontoBiometrias).where(eq(pontoBiometrias.usuarioId, ctx.user.id)).limit(1);
      if (existente) await db.update(pontoBiometrias).set(valores).where(eq(pontoBiometrias.id, existente.id));
      else await db.insert(pontoBiometrias).values({ usuarioId: ctx.user.id, ...valores });
      await db.insert(pontoConsentimentos).values({ usuarioId: ctx.user.id, versao: VERSAO_CONSENTIMENTO, aceito: 1, texto: TEXTO_CONSENTIMENTO });
      return { success: true };
    }),

  salvarLocalidade: protectedProcedure
    .input(z.object({ nome: z.string().trim().min(2).max(120), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), raioMetros: z.number().int().min(30).max(1000) }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [atual] = await db.select({ id: pontoLocalidades.id }).from(pontoLocalidades).where(eq(pontoLocalidades.ativo, 1)).orderBy(desc(pontoLocalidades.id)).limit(1);
      const dados = { ...input, latitude: String(input.latitude), longitude: String(input.longitude), atualizadoPorUsuarioId: ctx.user.id };
      if (atual) await db.update(pontoLocalidades).set(dados as any).where(eq(pontoLocalidades.id, atual.id));
      else await db.insert(pontoLocalidades).values(dados as any);
      return { success: true };
    }),

  marcarValidado: protectedProcedure
    .input(z.object({ tipo: z.enum(TIPOS_MARCACAO), descritor: z.array(z.number().finite()).length(128), latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), precisaoMetros: z.number().min(0).max(10_000) }))
    .mutation(async ({ input, ctx }) => {
      exigirRecepcao(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [jornada] = await db.select({ ativo: pontoJornadas.ativo }).from(pontoJornadas).where(eq(pontoJornadas.usuarioId, ctx.user.id)).limit(1);
      if (jornada && Number(jornada.ativo) !== 1) throw new TRPCError({ code: 'FORBIDDEN', message: 'Seu cadastro de ponto está desativado. Procure o master.' });
      const [biometria] = await db.select().from(pontoBiometrias).where(and(eq(pontoBiometrias.usuarioId, ctx.user.id), eq(pontoBiometrias.revogadoEm, null as any))).limit(1);
      if (!biometria) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cadastre sua biometria facial e aceite o aviso de privacidade antes de marcar o ponto.' });
      const [localidade] = await db.select().from(pontoLocalidades).where(eq(pontoLocalidades.ativo, 1)).orderBy(desc(pontoLocalidades.id)).limit(1);
      if (!localidade) throw new TRPCError({ code: 'BAD_REQUEST', message: 'O master ainda não configurou o perímetro da clínica.' });
      const distanciaFace = distanciaDescritor(JSON.parse(biometria.descritorFacial), input.descritor);
      if (!Number.isFinite(distanciaFace) || distanciaFace > 0.6) throw new TRPCError({ code: 'FORBIDDEN', message: 'A verificação facial não foi confirmada. Solicite revisão ao master se o problema persistir.' });
      const distancia = distanciaEmMetros(input.latitude, input.longitude, Number(localidade.latitude), Number(localidade.longitude));
      if (distancia > localidade.raioMetros) throw new TRPCError({ code: 'FORBIDDEN', message: `Você está fora do perímetro autorizado (${distancia} m; limite ${localidade.raioMetros} m). Solicite uma exceção auditada ao master.` });
      return gravarMarcacaoValidada(db, ctx.user.id, input.tipo, { metodoValidacao: 'facial_geolocalizacao', latitude: String(input.latitude), longitude: String(input.longitude), precisaoMetros: Math.round(input.precisaoMetros), distanciaMetros: distancia, confiancaFacial: String(Math.max(0, 1 - distanciaFace / 0.6)) });
    }),

  registrarExcecao: protectedProcedure
    .input(z.object({ usuarioId: z.number(), data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), tipo: z.enum(TIPOS_MARCACAO), horario: z.string().regex(/^\d{2}:\d{2}$/), justificativa: z.string().trim().min(5) }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      if (await competenciaFechada(db, competenciaDaData(input.data))) throw new TRPCError({ code: 'BAD_REQUEST', message: 'A competência está fechada.' });
      const [usuario] = await db.select({ id: users.id, perfil: users.perfil }).from(users).where(eq(users.id, input.usuarioId)).limit(1);
      if (!usuario || !ehRecepcao(usuario)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selecione uma recepcionista válida.' });
      const [existente] = await db.select().from(pontoRegistros).where(and(eq(pontoRegistros.usuarioId, input.usuarioId), eq(pontoRegistros.data, input.data as any))).limit(1);
      const dados = { [input.tipo]: input.horario, status: input.tipo === 'saida' ? 'completo' : 'ajustado', metodoValidacao: 'excecao_master', justificativa: input.justificativa, ajustadoPorUsuarioId: ctx.user.id };
      if (existente) {
        if (existente[input.tipo]) throw new TRPCError({ code: 'CONFLICT', message: 'Essa marcação já existe.' });
        await db.update(pontoRegistros).set(dados as any).where(eq(pontoRegistros.id, existente.id));
        await db.insert(pontoAjustes).values({ registroId: existente.id, ajustadoPorUsuarioId: ctx.user.id, valoresAnteriores: JSON.stringify({ [input.tipo]: null }), valoresNovos: JSON.stringify({ [input.tipo]: input.horario }), justificativa: input.justificativa });
      } else {
        if (input.tipo !== 'entrada') throw new TRPCError({ code: 'BAD_REQUEST', message: 'A primeira exceção do dia deve ser a entrada.' });
        await db.insert(pontoRegistros).values({ usuarioId: input.usuarioId, data: input.data as any, entrada: input.horario, ...dados } as any);
      }
      return { success: true };
    }),

  marcar: protectedProcedure
    .input(z.object({ tipo: z.enum(TIPOS_MARCACAO) }))
    .mutation(async ({ ctx }) => {
      exigirRecepcao(ctx.user);
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Use a validação facial e de localização para registrar o ponto.' });
    }),

  listarRecepcionistas: protectedProcedure.query(async ({ ctx }) => {
    exigirMaster(ctx.user);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
    const [lista, jornadas] = await Promise.all([
      db.select({ id: users.id, name: users.name, perfil: users.perfil }).from(users),
      db.select({ usuarioId: pontoJornadas.usuarioId, ativo: pontoJornadas.ativo }).from(pontoJornadas),
    ]);
    return lista.filter((usuario) => ehRecepcao(usuario)).map((usuario) => ({ ...usuario, ativo: Number(jornadas.find((jornada) => jornada.usuarioId === usuario.id)?.ativo ?? 1) === 1 }));
  }),

  salvarSituacaoFuncionario: protectedProcedure
    .input(z.object({ usuarioId: z.number(), ativo: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [usuario] = await db.select({ id: users.id, perfil: users.perfil }).from(users).where(eq(users.id, input.usuarioId)).limit(1);
      if (!usuario || !ehRecepcao(usuario)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selecione uma recepcionista válida.' });
      const [jornada] = await db.select({ id: pontoJornadas.id }).from(pontoJornadas).where(eq(pontoJornadas.usuarioId, input.usuarioId)).limit(1);
      if (jornada) await db.update(pontoJornadas).set({ ativo: input.ativo ? 1 : 0 }).where(eq(pontoJornadas.id, jornada.id));
      else await db.insert(pontoJornadas).values({ usuarioId: input.usuarioId, ...JORNADA_PADRAO_RECEPCAO, adicionalHoraExtra: String(JORNADA_PADRAO_RECEPCAO.adicionalHoraExtra), valorHora: String(JORNADA_PADRAO_RECEPCAO.valorHora), ativo: input.ativo ? 1 : 0, criadoPorUsuarioId: ctx.user.id } as any);
      return { success: true };
    }),

  registrarOcorrencia: protectedProcedure
    .input(z.object({ usuarioId: z.number(), tipo: z.enum(['folga', 'ferias', 'atestado']), dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), observacao: z.string().trim().max(1000).optional() }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      if (input.dataFim < input.dataInicio) throw new TRPCError({ code: 'BAD_REQUEST', message: 'A data final não pode ser anterior à data inicial.' });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [usuario] = await db.select({ id: users.id, perfil: users.perfil }).from(users).where(eq(users.id, input.usuarioId)).limit(1);
      if (!usuario || !ehRecepcao(usuario)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selecione uma recepcionista válida.' });
      if (await competenciaFechada(db, competenciaDaData(input.dataInicio)) || await competenciaFechada(db, competenciaDaData(input.dataFim))) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não é possível registrar ocorrência em competência fechada.' });
      await db.insert(pontoOcorrencias).values({ ...input, observacao: input.observacao || null, registradoPorUsuarioId: ctx.user.id } as any);
      return { success: true };
    }),

  salvarJornada: protectedProcedure
    .input(z.object({
      usuarioId: z.number(),
      horaEntrada: z.string().regex(/^\d{2}:\d{2}$/),
      inicioIntervalo: z.string().regex(/^\d{2}:\d{2}$/),
      fimIntervalo: z.string().regex(/^\d{2}:\d{2}$/),
      horaSaida: z.string().regex(/^\d{2}:\d{2}$/),
      toleranciaMarcacaoMinutos: z.number().int().min(0).max(5).default(5),
      toleranciaDiariaMinutos: z.number().int().min(0).max(10).default(10),
      adicionalHoraExtra: z.number().min(0).default(50),
      valorHora: z.number().min(0).default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [usuario] = await db.select({ id: users.id, perfil: users.perfil }).from(users).where(eq(users.id, input.usuarioId)).limit(1);
      if (!usuario || !ehRecepcao(usuario)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selecione um utilizador de recepção.' });
      const dados = { ...input, adicionalHoraExtra: String(input.adicionalHoraExtra), valorHora: String(input.valorHora), criadoPorUsuarioId: ctx.user.id };
      const [existente] = await db.select({ id: pontoJornadas.id }).from(pontoJornadas).where(eq(pontoJornadas.usuarioId, input.usuarioId)).limit(1);
      if (existente) await db.update(pontoJornadas).set(dados as any).where(eq(pontoJornadas.id, existente.id));
      else await db.insert(pontoJornadas).values(dados as any);
      return { success: true };
    }),

  resumoMensal: protectedProcedure
    .input(z.object({ competencia: z.string().regex(/^\d{4}-\d{2}$/) }))
    .query(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const { inicio, fim } = limitesCompetencia(input.competencia);
      const [usuariosTodos, jornadas, registros, ocorrencias, fechamento] = await Promise.all([
        db.select({ id: users.id, name: users.name, perfil: users.perfil }).from(users),
        db.select().from(pontoJornadas),
        db.select().from(pontoRegistros).where(between(pontoRegistros.data, inicio as any, fim as any)).orderBy(asc(pontoRegistros.data)),
        db.select().from(pontoOcorrencias).where(and(lte(pontoOcorrencias.dataInicio, fim as any), gte(pontoOcorrencias.dataFim, inicio as any))).orderBy(asc(pontoOcorrencias.dataInicio)),
        competenciaFechada(db, input.competencia),
      ]);
      const recepcionistas = usuariosTodos.filter((usuario) => ehRecepcao(usuario));
      return {
        competencia: input.competencia,
        fechado: Boolean(fechamento),
        fechamento: fechamento ?? null,
        linhas: recepcionistas.map((usuario) => {
          const jornada = jornadaDaLinha(jornadas.find((item) => item.usuarioId === usuario.id));
          const registrosDoUsuario = registros.filter((registro) => registro.usuarioId === usuario.id).map((registro) => ({
            ...registro,
            resumo: calcularResumoPonto(registro, jornada),
          }));
          const ocorrenciasDoUsuario = ocorrencias.filter((ocorrencia) => ocorrencia.usuarioId === usuario.id);
          const totais = calcularResumoMensalPonto({
            competencia: input.competencia,
            dataLimite: input.competencia === dataManausAgora().slice(0, 7) ? dataManausAgora() : fim,
            registros: registrosDoUsuario.map((registro) => ({ ...registro, data: dataISO(registro.data) })),
            ocorrencias: ocorrenciasDoUsuario.map((ocorrencia) => ({ tipo: ocorrencia.tipo as any, dataInicio: dataISO(ocorrencia.dataInicio), dataFim: dataISO(ocorrencia.dataFim) })),
            jornada,
          });
          return {
            usuario: { ...usuario, ativo: Number(jornadas.find((item) => item.usuarioId === usuario.id)?.ativo ?? 1) === 1 },
            jornada,
            registros: registrosDoUsuario,
            ocorrencias: ocorrenciasDoUsuario,
            totais,
          };
        }),
      };
    }),

  ajustar: protectedProcedure
    .input(z.object({
      registroId: z.number(),
      entrada: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
      inicioIntervalo: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
      fimIntervalo: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
      saida: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
      justificativa: z.string().trim().min(5),
    }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      const [registro] = await db.select().from(pontoRegistros).where(eq(pontoRegistros.id, input.registroId)).limit(1);
      if (!registro) throw new TRPCError({ code: 'NOT_FOUND', message: 'Registro de ponto não encontrado.' });
      if (registro.fechado || await competenciaFechada(db, competenciaDaData(dataISO(registro.data)))) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Não é possível ajustar uma competência fechada.' });
      }
      const valoresNovos = { entrada: input.entrada, inicioIntervalo: input.inicioIntervalo, fimIntervalo: input.fimIntervalo, saida: input.saida };
      const valoresAnteriores = { entrada: registro.entrada, inicioIntervalo: registro.inicioIntervalo, fimIntervalo: registro.fimIntervalo, saida: registro.saida };
      await db.update(pontoRegistros).set({ ...valoresNovos, status: 'ajustado', justificativa: input.justificativa, ajustadoPorUsuarioId: ctx.user.id } as any).where(eq(pontoRegistros.id, registro.id));
      await db.insert(pontoAjustes).values({ registroId: registro.id, ajustadoPorUsuarioId: ctx.user.id, valoresAnteriores: JSON.stringify(valoresAnteriores), valoresNovos: JSON.stringify(valoresNovos), justificativa: input.justificativa });
      return { success: true };
    }),

  fecharCompetencia: protectedProcedure
    .input(z.object({ competencia: z.string().regex(/^\d{4}-\d{2}$/), observacao: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      exigirMaster(ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Base de dados indisponível' });
      if (await competenciaFechada(db, input.competencia)) throw new TRPCError({ code: 'CONFLICT', message: 'Esta competência já está fechada.' });
      const { inicio, fim } = limitesCompetencia(input.competencia);
      await db.insert(pontoFechamentos).values({ competencia: input.competencia, fechadoPorUsuarioId: ctx.user.id, observacao: input.observacao || null });
      await db.update(pontoRegistros).set({ fechado: 1 }).where(between(pontoRegistros.data, inicio as any, fim as any));
      return { success: true };
    }),
});
