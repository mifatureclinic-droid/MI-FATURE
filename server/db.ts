import { drizzle } from "drizzle-orm/mysql2";
import crypto from 'crypto';
import { and, desc, eq, inArray, sql, gte, lt, or } from "drizzle-orm";
import { InsertUser, users, pacientes, InsertPaciente, profissionais, InsertProfissional, convenios, InsertConvenio, autorizacoes, InsertAutorizacao, atendimentos, InsertAtendimento, guias, InsertGuia, prontuarios, InsertProntuario, liberacoesProntuario, InsertLiberacaoProntuario, tabelaProcedimentos, InsertTabelaProcedimento, procedimentosPorConvenio, InsertProcedimentoPorConvenio, historicoAlteracoes, InsertHistoricoAlteracao, contratosTerapêuticos, InsertContratoTerapeutico, assinaturasGuias, InsertAssinaturaGuia, guiaProcedimentos, InsertGuiaProcedimento, lotesFaturamento, InsertLoteFaturamento, dadosPrestador, InsertDadosPrestador, alertasProntuarioPendente, InsertAlertaProntuarioPendente, assinaturasSadt, InsertAssinaturaSadt, systemConfig } from "../drizzle/schema";
import { ENV } from './_core/env';
import { temComprovanteAssinatura } from '../shared/assinaturaSessao';
import { calcularRepasseParticular, ehConvenioParticular } from '../shared/repasseParticular';
import { montarContaReceberPagamento } from '../shared/contaReceberPagamento';
import { convenioIsentoDeAssinaturaDigital } from '../shared/elegibilidadeProntuario';
import { loteTissPodeSerExcluido, mensagemLoteTissNaoExcluivel } from '../shared/exclusaoLoteTiss';
import { atualizarPrimeiraDataAtendimentoDaAssinatura } from '../shared/datasAtendimentoAssinatura';
import { assinaturaPertenceCompetenciaDaGuia } from '../shared/competenciaAssinaturaGuia';
import { deveUsarRetornoSeguroDaAgenda, normalizarDatasParaConsultaAgenda } from '../shared/filtroDatasAgenda';
import { consolidarPacientesElegiveisAnamnese, type PacienteElegivelEnvioAnamnese } from '../shared/envioLoteAnamnese';
import { resolverSerieDaGuiaPrefaturamento } from '../shared/serieGuiaPrefaturamento';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Pacientes
export async function createPaciente(data: InsertPaciente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(pacientes).values(data);
  const rawResult = result as any;
  const insertId = Number(rawResult?.insertId ?? rawResult?.[0]?.insertId);

  // O INSERT do MySQL devolve metadados, não a linha criada. Recuperamos o
  // paciente para que o frontend receba sempre o id usado no agendamento.
  const created = Number.isInteger(insertId) && insertId > 0
    ? await db.select().from(pacientes).where(eq(pacientes.id, insertId)).limit(1)
    : await db.select().from(pacientes).where(eq(pacientes.cpf, String(data.cpf))).limit(1);

  if (created[0]) {
    return { ...created[0], insertId: insertId || created[0].id };
  }

  throw new Error("Paciente criado, mas não foi possível recuperar o registro salvo.");
}

export async function getPacientes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(pacientes);
}

/**
 * Dados mínimos para a Agenda. O cadastro completo inclui anexos e demais
 * informações administrativas que não são necessários para montar a grade.
 */
export async function getPacientesParaAgenda() {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: pacientes.id,
    nome: pacientes.nome,
    cpf: pacientes.cpf,
    telefone: pacientes.telefone,
    whatsapp: pacientes.whatsapp,
  }).from(pacientes);
}

/**
 * Campos exibidos na recepção. Dados clínicos, anexos e documentos seguem
 * disponíveis somente quando a pessoa abre a pasta ou a edição do paciente.
 */
export async function getPacientesParaRecepcao() {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: pacientes.id,
    nome: pacientes.nome,
    cpf: pacientes.cpf,
    dataNascimento: pacientes.dataNascimento,
    telefone: pacientes.telefone,
    whatsapp: pacientes.whatsapp,
    dataVencimentoPedido: pacientes.dataVencimentoPedido,
  }).from(pacientes);
}

export async function getPacienteById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(pacientes).where(eq(pacientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updatePaciente(id: number, data: Partial<InsertPaciente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(pacientes).set(data).where(eq(pacientes.id, id));
  return result;
}

export async function getPacienteByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return null;
  const cpfDigitos = cpf.replace(/\D/g, '');
  const result = await db.select().from(pacientes).where(eq(pacientes.cpf, cpfDigitos)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getPacienteDependencias(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const referencias = [
    ['atendimentos', 'pacienteId'],
    ['guias', 'pacienteId'],
    ['prontuarios', 'pacienteId'],
    ['autorizacoes', 'pacienteId'],
    ['contratosTerapeuticos', 'pacienteId'],
    ['contratosTerapêuticos', 'pacienteId'],
    ['assinaturasGuias', 'pacienteId'],
    ['assinaturasSadt', 'pacienteId'],
    ['anamneses', 'pacienteId'],
    ['geapAutorizacoes', 'pacienteId'],
    ['bradescoAutorizacoes', 'pacienteId'],
    ['pagamentos_atendimento', 'pacienteId'],
    ['anexos_paciente', 'paciente_id'],
  ] as const;

  const resultados = await Promise.all(referencias.map(async ([tabela, coluna]) => {
    const [rows] = await db.execute(
      sql.raw(`SELECT COUNT(*) AS total FROM \`${tabela}\` WHERE \`${coluna}\` = ${Number(id)}`),
    );
    const total = Number(((rows as unknown) as any[])[0]?.total ?? 0);
    return { tabela, total };
  }));

  return resultados.filter((item) => item.total > 0);
}

export async function deletePaciente(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const dependencias = await getPacienteDependencias(id);
  if (dependencias.length > 0) {
    const resumo = dependencias.map((item) => `${item.tabela}: ${item.total}`).join(', ');
    throw new Error(`Paciente possui vínculos e não pode ser excluído: ${resumo}.`);
  }
  await db.delete(pacientes).where(eq(pacientes.id, id));
  return { success: true };
}

// Profissionais
export async function createProfissional(data: InsertProfissional) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(profissionais).values(data);
  return result;
}

export async function getProfissionais() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(profissionais);
}

export async function getProfissionalById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(profissionais).where(eq(profissionais.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getProfissionalByCpf(cpf: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(profissionais).where(eq(profissionais.cpf, cpf)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateProfissional(id: number, data: Partial<InsertProfissional>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: Record<string, any> = {};
  
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.cpf !== undefined) updateData.cpf = data.cpf;
  if (data.crm !== undefined) updateData.crm = data.crm;
  if (data.especialidade !== undefined) updateData.especialidade = data.especialidade;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.endereco !== undefined) updateData.endereco = data.endereco;
  if (data.cidade !== undefined) updateData.cidade = data.cidade;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.cep !== undefined) updateData.cep = data.cep;
  if ((data as any).uf !== undefined) updateData.uf = (data as any).uf;
  if ((data as any).codigoCBO !== undefined) updateData.codigoCBO = (data as any).codigoCBO;
  if (data.percentualRepasse !== undefined) updateData.percentualRepasse = data.percentualRepasse;
  if ((data as any).percentualConvenio !== undefined) updateData.percentualConvenio = (data as any).percentualConvenio;
  if ((data as any).percentualParticular !== undefined) updateData.percentualParticular = (data as any).percentualParticular;
  if ((data as any).percentualTesteAvulso !== undefined) updateData.percentualTesteAvulso = (data as any).percentualTesteAvulso;
  if ((data as any).percentualAvaliacaoNeuropsicologica !== undefined) updateData.percentualAvaliacaoNeuropsicologica = (data as any).percentualAvaliacaoNeuropsicologica;
  if ((data as any).duracaoPadrao !== undefined) updateData.duracaoPadrao = (data as any).duracaoPadrao;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No values to update');
  }
  
  await db.update(profissionais).set(updateData).where(eq(profissionais.id, id));
  return await getProfissionalById(id);
}

export async function deleteProfissional(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(profissionais).where(eq(profissionais.id, id));
}

export async function toggleProfissionalAtivo(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const prof = await getProfissionalById(id);
  if (!prof) throw new Error('Profissional não encontrado');
  const novoAtivo = (prof as any).ativo === 0 ? 1 : 0;
  await db.update(profissionais).set({ ativo: novoAtivo } as any).where(eq(profissionais.id, id));
  return await getProfissionalById(id);
}

// Convênios
export async function createConvenio(data: InsertConvenio) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(convenios).values(data);
  return result;
}

export async function getConvenios() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(convenios);
}

export async function getConvenioById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(convenios).where(eq(convenios.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateConvenio(id: number, data: Partial<InsertConvenio>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, any> = {};
  
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.cnpj !== undefined) updateData.cnpj = data.cnpj;
  if (data.codigoOperadora !== undefined) updateData.codigoOperadora = data.codigoOperadora;
  if (data.registroANS !== undefined) updateData.registroANS = data.registroANS;
  if (data.codigoNaOperadora !== undefined) updateData.codigoNaOperadora = data.codigoNaOperadora;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.telefone !== undefined) updateData.telefone = data.telefone;
  if (data.endereco !== undefined) updateData.endereco = data.endereco;
  if (data.cidade !== undefined) updateData.cidade = data.cidade;
  if (data.estado !== undefined) updateData.estado = data.estado;
  if (data.cep !== undefined) updateData.cep = data.cep;
  if (data.aniversarioConvenio !== undefined) updateData.aniversarioConvenio = data.aniversarioConvenio;
  if (data.anexoUrl !== undefined) updateData.anexoUrl = data.anexoUrl;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No values to update');
  }
  
  await db.update(convenios).set(updateData).where(eq(convenios.id, id));
  return await getConvenioById(id);
}

export async function deleteConvenio(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(convenios).where(eq(convenios.id, id));
}

export async function toggleConvenioAtivo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const convenio = await getConvenioById(id);
  if (!convenio) throw new Error("Convênio não encontrado");
  const novoAtivo = (convenio as any).ativo === 0 ? 1 : 0;
  await db.update(convenios).set({ ativo: novoAtivo } as any).where(eq(convenios.id, id));
  return await getConvenioById(id);
}

// Autorizações
export async function createAutorizacao(data: InsertAutorizacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(autorizacoes).values(data);
  return result;
}

export async function getAutorizacoes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(autorizacoes);
}

// Atendimentos
export async function createAtendimento(data: InsertAtendimento) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(atendimentos).values(data);
  // Usar o insertId retornado pelo MySQL para buscar o registo criado de forma fiável
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    const created = await db.select().from(atendimentos).where(eq(atendimentos.id, insertId)).limit(1);
    return created[0] || null;
  }
  // Fallback: buscar pelo mais recente
  const created = await db.select().from(atendimentos).orderBy(desc(atendimentos.id)).limit(1);
  return created[0] || null;
}

export async function getAtendimentos(profissionalId?: number, datas?: string[]) {
  const db = await getDb();
  if (!db) return [];

  const datasSelecionadas = normalizarDatasParaConsultaAgenda(datas);
  const filtroProfissional = profissionalId !== undefined
    ? eq(atendimentos.profissionalId, profissionalId)
    : undefined;
  const filtroDatas = datasSelecionadas.length > 0
    ? sql`DATE(${atendimentos.data}) IN (${sql.join(datasSelecionadas.map((data) => sql`${data}`), sql`, `)})`
    : undefined;
  const filtro = filtroProfissional && filtroDatas
    ? and(filtroProfissional, filtroDatas)
    : filtroProfissional ?? filtroDatas;
  let atendimentosRows = filtro
    ? await db.select().from(atendimentos).where(filtro)
    : await db.select().from(atendimentos);

  // A Agenda aplica novamente o dia selecionado no cliente. Se uma consulta
  // mensal voltar vazia por problema de serialização de data, retorna os dados
  // do profissional para que a grade não desapareça por completo.
  if (deveUsarRetornoSeguroDaAgenda(datasSelecionadas, atendimentosRows.length)) {
    atendimentosRows = filtroProfissional
      ? await db.select().from(atendimentos).where(filtroProfissional)
      : await db.select().from(atendimentos);
  }

  if (atendimentosRows.length === 0) return [];

  const pacienteIds = Array.from(new Set(atendimentosRows.map(atendimento => atendimento.pacienteId)));
  const pacientesRows = pacienteIds.length > 0
    ? await db.select({ id: pacientes.id, nome: pacientes.nome }).from(pacientes).where(inArray(pacientes.id, pacienteIds))
    : [];
  const pacienteNomePorId = new Map(pacientesRows.map(paciente => [paciente.id, paciente.nome]));
  const convenioIds = Array.from(new Set(
    atendimentosRows.map(atendimento => atendimento.convenioId).filter((id): id is number => id != null),
  ));
  const conveniosRows = convenioIds.length > 0
    ? await db.select({ id: convenios.id, nome: convenios.nome }).from(convenios).where(inArray(convenios.id, convenioIds))
    : [];
  const convenioNomePorId = new Map(conveniosRows.map(convenio => [convenio.id, convenio.nome]));
  const atendimentosComRegraAssinatura = atendimentosRows.map(atendimento => ({
    ...atendimento,
    assinaturaDigitalObrigatoria: !convenioIsentoDeAssinaturaDigital(
      atendimento.convenioId != null ? convenioNomePorId.get(atendimento.convenioId) : null,
    ),
  }));

  // Inclui assinaturas históricas sem atendimentoId. A associação com a sessão
  // ocorre de forma segura no resolvedor compartilhado por guia/data/contexto.
  const assinaturasSadtRows = await db
    .select({
      atendimentoId: assinaturasSadt.atendimentoId,
      guiaId: assinaturasSadt.guiaId,
      profissionalId: assinaturasSadt.profissionalId,
      dataSessao: assinaturasSadt.dataSessao,
      status: assinaturasSadt.status,
      assinaturaDataUrl: assinaturasSadt.assinaturaDataUrl,
    })
    .from(assinaturasSadt)
    .where(inArray(assinaturasSadt.pacienteId, pacienteIds));

  // Carrega todas as guias dos pacientes da lista, inclusive as históricas que
  // ainda não têm atendimentoId ou guiaId gravados no atendimento.
  const guiaRows = await db
    .select({
      id: guias.id,
      atendimentoId: guias.atendimentoId,
      pacienteId: guias.pacienteId,
      profissionalId: guias.profissionalId,
      convenioId: guias.convenioId,
      // A série é necessária para reconhecer, por sessão, a guia vinculada a
      // outro atendimento do mesmo contexto na Agenda.
      serieId: guias.serieId,
      assinadoPaciente: guias.assinadoPaciente,
      dataAssinaturaPaciente: guias.dataAssinaturaPaciente,
      assinaturaPacienteUrl: guias.assinaturaPacienteUrl,
    })
    .from(guias)
    .where(inArray(guias.pacienteId, pacienteIds));
  const guiaIdsParaAssinaturas = guiaRows.map(guia => guia.id);
  const assinaturasGuiaRows = guiaIdsParaAssinaturas.length > 0
    ? await db
      .select({
        guiaId: assinaturasGuias.guiaId,
        pacienteId: assinaturasGuias.pacienteId,
        sessaoNumero: assinaturasGuias.sessaoNumero,
        datasAtendimento: assinaturasGuias.datasAtendimento,
        assinaturaPacienteUrl: assinaturasGuias.assinaturaPacienteUrl,
        token: assinaturasGuias.token,
      })
      .from(assinaturasGuias)
      .where(inArray(assinaturasGuias.pacienteId, pacienteIds))
    : [];

  const { getAtendimentosComStatusAssinatura } = await import('../shared/assinaturasAgenda');
  const statusAssinaturas = getAtendimentosComStatusAssinatura(
    atendimentosComRegraAssinatura,
    guiaRows,
    assinaturasSadtRows,
    assinaturasGuiaRows,
  );

  return atendimentosRows.map(atendimento => ({
    ...atendimento,
    // O nome acompanha o atendimento para a Agenda não depender de uma segunda
    // consulta de pacientes que pode terminar depois da montagem dos cartões.
    pacienteNome: pacienteNomePorId.get(atendimento.pacienteId) ?? null,
    // Campos calculados para a Agenda. São específicos desta sessão, nunca
    // apenas do paciente ou da guia inteira.
    assinadoPaciente: statusAssinaturas.assinados.has(atendimento.id) ? 1 : 0,
    assinaturaPendente: statusAssinaturas.pendentes.has(atendimento.id),
  }));
}

// Guias
export async function createGuia(data: InsertGuia) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Garantir que guiaPrincipalId seja null se não fornecido
  const dataWithDefaults = {
    ...data,
    guiaPrincipalId: data.guiaPrincipalId || null,
  };
  
  const result = await db.insert(guias).values(dataWithDefaults);
  return result;
}

export async function getGuias() {
  const db = await getDb();
  if (!db) return [];
  const todasGuias = await db.select().from(guias);
  // 1) Soma dos procedimentos salvos em guiaProcedimentos (pós-prefaturamento)
  const somaProcs = await db
    .select({
      guiaId: guiaProcedimentos.guiaId,
      total: sql<number>`SUM(CAST(${guiaProcedimentos.valorTotal} AS DECIMAL(10,2)))`,
    })
    .from(guiaProcedimentos)
    .groupBy(guiaProcedimentos.guiaId);
  const somaPorGuia = new Map(somaProcs.map(r => [r.guiaId, Number(r.total || 0)]));
  // 2) Valor do procedimento do convênio via atendimento (fallback para guias sem prefaturamento)
  //    atendimentos.guiaId → atendimentos.procedimentoConvenioId → procedimentosPorConvenio.valor
  const valorPorAtendimento = await db
    .select({
      guiaId: atendimentos.guiaId,
      valorProc: procedimentosPorConvenio.valor,
    })
    .from(atendimentos)
    .innerJoin(procedimentosPorConvenio, eq(atendimentos.procedimentoConvenioId, procedimentosPorConvenio.id))
    .where(sql`${atendimentos.guiaId} IS NOT NULL AND ${atendimentos.procedimentoConvenioId} IS NOT NULL`);
  // Agrupar por guiaId: somar todos os atendimentos da mesma guia
  const valorAtendPorGuia = new Map<number, number>();
  for (const r of valorPorAtendimento) {
    if (r.guiaId == null) continue;
    const prev = valorAtendPorGuia.get(r.guiaId) || 0;
    valorAtendPorGuia.set(r.guiaId, prev + parseFloat(String(r.valorProc || '0')));
  }
  return todasGuias.map(guia => {
    const valorTotalGeralNum = parseFloat(String((guia as any).valorTotalGeral || '0'));
    const somaProcedimentos = somaPorGuia.get(guia.id) || 0;
    const valorProcConvenio = valorAtendPorGuia.get(guia.id) || 0;
    const valorBaseNum = parseFloat(String(guia.valor || '0'));
    // Prioridade: campo 65 (valorTotalGeral) > guiaProcedimentos > procedimentosPorConvenio > valor base
    const valorCalculado = valorTotalGeralNum > 0
      ? valorTotalGeralNum
      : somaProcedimentos > 0
        ? somaProcedimentos
        : valorProcConvenio > 0
          ? valorProcConvenio
          : valorBaseNum;
    return { ...guia, valorCalculado };
  });
}

// Prontuários
export async function createProntuario(data: InsertProntuario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(prontuarios).values(data);
  return result;
}

export async function getProntuarios() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(prontuarios);
}

export async function getProntuarioByAtendimento(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(prontuarios).where(eq(prontuarios.atendimentoId, atendimentoId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAtendimentoStatus(atendimentoId: number, status: "agendado" | "realizado" | "cancelado" | "falta") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(atendimentos).set({ status }).where(eq(atendimentos.id, atendimentoId));
  return result;
}

// Liberações de Prontuário
export async function createLiberacao(data: InsertLiberacaoProntuario) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(liberacoesProntuario).values(data);
  return result;
}

export async function getLiberacoes() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(liberacoesProntuario);
}

export async function getLiberacaoByAtendimento(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(liberacoesProntuario).where(eq(liberacoesProntuario.atendimentoId, atendimentoId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateLiberacao(liberacaoId: number, status: "pendente" | "aprovada" | "rejeitada") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(liberacoesProntuario).set({ status }).where(eq(liberacoesProntuario.id, liberacaoId));
  return result;
}

export async function updateAtendimentoComLimite(atendimentoId: number, dataLimiteProntuario: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(atendimentos).set({ dataLimiteProntuario }).where(eq(atendimentos.id, atendimentoId));
  return result;
}

export async function liberarAtendimentoPorMaster(atendimentoId: number, motivo: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(atendimentos).set({ 
    liberadoPorMaster: 1 as any,
    motLiberacao: motivo 
  }).where(eq(atendimentos.id, atendimentoId));
  return result;
}

export async function updatePacienteComPedido(pacienteId: number, pedidoMedicoUrl: string, dataVencimentoPedido: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(pacientes).set({ 
    pedidoMedicoUrl,
    dataVencimentoPedido 
  }).where(eq(pacientes.id, pacienteId));
  return result;
}


// Alertas de Prontuários Atrasados
export async function getAtendimentosComProntuarioAtrasado(filtros?: {
  mesReferencia?: string;
  profissionalIds?: number[];
}) {
  const db = await getDb();
  if (!db) return [];

  const agora = new Date();
  const mesReferencia = filtros?.mesReferencia?.match(/^\d{4}-\d{2}$/)
    ? filtros.mesReferencia
    : undefined;
  const profissionalIds = filtros?.profissionalIds?.filter(Number.isInteger);
  const atendimentosList = await db.select().from(atendimentos);

  return atendimentosList.filter(a => {
    if (!a.dataLimiteProntuario) return false;
    if (mesReferencia && String(a.data).slice(0, 7) !== mesReferencia) return false;
    if (profissionalIds && profissionalIds.length > 0 && !profissionalIds.includes(a.profissionalId)) return false;
    const dataLimite = new Date(a.dataLimiteProntuario);
    return agora > dataLimite && !a.liberadoPorMaster && a.status === 'agendado';
  });
}

// Alertas de Vencimento de Pedido Médico
export async function getPacientesComPedidoVencendoEm30Dias() {
  const db = await getDb();
  if (!db) return [];
  
  const agora = new Date();
  const data30DiasAtrás = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
  const data30DiasAdiante = new Date(agora.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const pacientesList = await db.select().from(pacientes);
  
  return pacientesList.filter(p => {
    if (!p.dataVencimentoPedido) return false;
    const dataVencimento = new Date(p.dataVencimentoPedido);
    return dataVencimento >= data30DiasAtrás && dataVencimento <= data30DiasAdiante && !p.alertaVencimentoEnviado;
  });
}

// Marcar alerta de vencimento como enviado
export async function marcarAlertaVencimentoEnviado(pacienteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(pacientes).set({ 
    alertaVencimentoEnviado: 1 as any
  }).where(eq(pacientes.id, pacienteId));
  return result;
}


// Procedimentos por Convênio
export async function createProcedimentoConvenio(data: {
  convenioId: number;
  tabelaProcedimentoId?: number;
  codigoConvenio?: string;
  descricaoConvenio?: string;
  valor: string;
  valorMinimo?: string;
  valorMaximo?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let tabelaProcedimentoId = data.tabelaProcedimentoId;
  if (!tabelaProcedimentoId) {
    const codigoConvenio = data.codigoConvenio?.trim();
    const descricaoConvenio = data.descricaoConvenio?.trim();
    if (!codigoConvenio || !descricaoConvenio) {
      throw new Error('Código e descrição do procedimento são obrigatórios');
    }

    const tabelaExistente = await db
      .select({ id: tabelaProcedimentos.id })
      .from(tabelaProcedimentos)
      .where(eq(tabelaProcedimentos.codigoANS, codigoConvenio))
      .limit(1);

    if (tabelaExistente[0]?.id) {
      tabelaProcedimentoId = tabelaExistente[0].id;
    } else {
      const novoProcedimento = await db.insert(tabelaProcedimentos).values({
        codigoANS: codigoConvenio,
        descricao: descricaoConvenio,
      }).$returningId();
      tabelaProcedimentoId = novoProcedimento[0]?.id;
    }
  }

  if (!tabelaProcedimentoId) {
    throw new Error('Não foi possível vincular o procedimento à tabela de procedimentos');
  }
  
  const insertData: any = {
    convenioId: data.convenioId,
    tabelaProcedimentoId,
    codigoConvenio: data.codigoConvenio || '',
    valor: data.valor,
  };
  
  if (data.descricaoConvenio !== undefined) insertData.descricaoConvenio = data.descricaoConvenio;
  if (data.valorMinimo !== undefined) insertData.valorMinimo = data.valorMinimo;
  if (data.valorMaximo !== undefined) insertData.valorMaximo = data.valorMaximo;
  
  const result = await db.insert(procedimentosPorConvenio).values(insertData);
  return result;
}

export async function getProcedimentosPorConvenio(convenioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: procedimentosPorConvenio.id,
      convenioId: procedimentosPorConvenio.convenioId,
      codigoConvenio: procedimentosPorConvenio.codigoConvenio,
      descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
      valor: procedimentosPorConvenio.valor,
      valorMinimo: procedimentosPorConvenio.valorMinimo,
      valorMaximo: procedimentosPorConvenio.valorMaximo,
      ativo: procedimentosPorConvenio.ativo,
      codigoANS: tabelaProcedimentos.codigoANS,
      descricaoANS: tabelaProcedimentos.descricao,
      especialidade: tabelaProcedimentos.especialidade,
    })
    .from(procedimentosPorConvenio)
    .leftJoin(
      tabelaProcedimentos,
      eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id)
    )
    .where(
      and(
        eq(procedimentosPorConvenio.convenioId, convenioId),
        eq(procedimentosPorConvenio.ativo, 1)
      )
    );
}

export async function updateProcedimentoConvenio(id: number, data: {
  codigoConvenio?: string;
  descricaoConvenio?: string;
  valor?: string;
  valorMinimo?: string;
  valorMaximo?: string;
  ativo?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(procedimentosPorConvenio).set(data).where(eq(procedimentosPorConvenio.id, id));
  return result;
}

export async function deleteProcedimentoConvenio(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(procedimentosPorConvenio).where(eq(procedimentosPorConvenio.id, id));
  return result;
}

// Tabela de Procedimentos (Tabela ANS)
export async function createTabelaProcedimento(data: {
  codigoANS: string;
  descricao: string;
  especialidade?: string;
  grupoANS?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tabelaProcedimentos).values({
    codigoANS: data.codigoANS,
    descricao: data.descricao,
    especialidade: data.especialidade,
    grupoANS: data.grupoANS,
  });
  return result;
}

export async function getTabelaProcedimentos() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(tabelaProcedimentos);
}

export async function getTabelaProcedimentoByCodigoANS(codigoANS: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(tabelaProcedimentos).where(eq(tabelaProcedimentos.codigoANS, codigoANS));
  return result[0] || null;
}


// Delete atendimento
export async function deleteAtendimento(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(atendimentos).where(eq(atendimentos.id, id));
}
// Sem serieId, o agendamento é avulso: nunca inferir um conjunto por horário ou dia.
export async function countAtendimentosSerie(id: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ref = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  if (!ref.length) return 0;
  const a = ref[0];
  // Se tiver serieId, contar todos da série a partir desta data
  if (a.serieId) {
    const result = await db.select({ total: sql<number>`COUNT(*)` }).from(atendimentos).where(
      and(eq(atendimentos.serieId, a.serieId), gte(atendimentos.data, a.data))
    );
    return Number(result[0]?.total ?? 0);
  }
  return 1;
}
// Deletar atendimentos futuros da mesma série
export async function deleteAtendimentosSerie(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ref = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  if (!ref.length) throw new Error("Atendimento não encontrado");
  const a = ref[0];
  if (a.serieId) {
    return await db.delete(atendimentos).where(
      and(eq(atendimentos.serieId, a.serieId), gte(atendimentos.data, a.data))
    );
  }
  return await db.delete(atendimentos).where(eq(atendimentos.id, id));
}
// Update atendimento
export async function updateAtendimento(id: number, data: Partial<InsertAtendimento>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(atendimentos).set(data).where(eq(atendimentos.id, id));
}
// Reagendar todos os atendimentos futuros da mesma série com novo horário/dia
// novaHora: 'HH:MM', diasOffset: deslocamento em dias da semana (ex: +1 = um dia depois)
export async function reagendarSerie(id: number, novaHora: string, novaData?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ref = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  if (!ref.length) throw new Error("Atendimento não encontrado");
  const a = ref[0];
  // Calcular deslocamento de dias se novaData foi fornecida
  let diasOffset = 0;
  if (novaData) {
    const dataRef = new Date(a.data as unknown as string);
    const dataNova = new Date(novaData);
    diasOffset = Math.round((dataNova.getTime() - dataRef.getTime()) / (1000 * 60 * 60 * 24));
  }
  // Buscar todos os atendimentos futuros da série
  let futuros: typeof atendimentos.$inferSelect[];
  if (a.serieId) {
    futuros = await db.select().from(atendimentos).where(
      and(eq(atendimentos.serieId, a.serieId), gte(atendimentos.data, a.data))
    );
  } else {
    futuros = [a];
  }
  // Atualizar cada um com nova hora e nova data (deslocada)
  let atualizados = 0;
  for (const fut of futuros) {
    const updateData: Partial<InsertAtendimento> = { hora: novaHora };
    if (diasOffset !== 0) {
      const dataAtual = new Date(fut.data as unknown as string);
      dataAtual.setDate(dataAtual.getDate() + diasOffset);
      (updateData as any).data = dataAtual.toISOString().slice(0, 10);
    }
    await db.update(atendimentos).set(updateData as any).where(eq(atendimentos.id, fut.id));
    atualizados++;
  }
  return { atualizados };
}
// Mudar profissional de todos os atendimentos futuros da mesma série
export async function mudarProfissionalSerie(id: number, novoProfissionalId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const ref = await db.select().from(atendimentos).where(eq(atendimentos.id, id)).limit(1);
  if (!ref.length) throw new Error("Atendimento não encontrado");
  const a = ref[0];
  if (a.serieId) {
    return await db.update(atendimentos)
      .set({ profissionalId: novoProfissionalId } as any)
      .where(and(eq(atendimentos.serieId, a.serieId), gte(atendimentos.data, a.data)));
  }
  return await db.update(atendimentos)
    .set({ profissionalId: novoProfissionalId } as any)
    .where(eq(atendimentos.id, id));
}


// Create histórico alteração
export async function createHistoricoAlteracao(data: InsertHistoricoAlteracao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.insert(historicoAlteracoes).values(data);
}

// Get histórico alterações por atendimento
export async function getHistoricoAlteracoes(atendimentoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db
    .select({
      id: historicoAlteracoes.id,
      atendimentoId: historicoAlteracoes.atendimentoId,
      usuarioId: historicoAlteracoes.usuarioId,
      usuarioNome: users.name,
      tipoAlteracao: historicoAlteracoes.tipoAlteracao,
      valorAnterior: historicoAlteracoes.valorAnterior,
      valorNovo: historicoAlteracoes.valorNovo,
      descricao: historicoAlteracoes.descricao,
      dataHora: historicoAlteracoes.dataHora,
    })
    .from(historicoAlteracoes)
    .leftJoin(users, eq(historicoAlteracoes.usuarioId, users.id))
    .where(eq(historicoAlteracoes.atendimentoId, atendimentoId))
    .orderBy(desc(historicoAlteracoes.dataHora));
}


// Usuários (criação manual)
export async function createUser(data: {
  nome: string;
  email: string;
  senha: string;
  perfil: string;
  profissionalVinculadoId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Verificar se o e-mail já está em uso
  const existente = await getUserByEmail(data.email);
  if (existente) throw new Error('E-mail já está em uso por outro utilizador.');
  // Hash SHA-256 da senha
  const hashedPassword = await hashPassword(data.senha);
  const openId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const result = await db.insert(users).values({
    name: data.nome,
    email: data.email,
    senha: hashedPassword,
    perfil: data.perfil,
    profissionalVinculadoId: data.profissionalVinculadoId,
    openId,
    loginMethod: 'manual',
    role: 'user',
  });
  const insertId = (result as any)[0]?.insertId;
  if (insertId) {
    return await db.select().from(users).where(eq(users.id, insertId)).limit(1).then(r => r[0]);
  }
  return await getUserByEmail(data.email);
}

/**
 * Altera a senha de um utilizador (admin ou próprio utilizador).
 */
export async function updateUserSenha(id: number, novaSenha: string) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const hashedPassword = await hashPassword(novaSenha);
  await db.update(users).set({ senha: hashedPassword } as any).where(eq(users.id, id));
  return { success: true };
}

/**
 * Actualiza dados do utilizador incluindo senha (quando fornecida).
 */
export async function updateUserFull(id: number, data: {
  nome?: string;
  email?: string;
  perfil?: string;
  profissionalVinculadoId?: number | null;
  senha?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const updateData: Record<string, any> = {};
  if (data.nome !== undefined) updateData.name = data.nome;
  if (data.email !== undefined) {
    // Verificar se o e-mail já está em uso por outro utilizador
    const existente = await getUserByEmail(data.email);
    if (existente && existente.id !== id) throw new Error('E-mail já está em uso por outro utilizador.');
    updateData.email = data.email;
  }
  if (data.perfil !== undefined) updateData.perfil = data.perfil;
  if (data.profissionalVinculadoId !== undefined) updateData.profissionalVinculadoId = data.profissionalVinculadoId;
  if (data.senha !== undefined && data.senha.length > 0) {
    updateData.senha = await hashPassword(data.senha);
  }
  if (Object.keys(updateData).length === 0) throw new Error('Nenhum campo para actualizar');
  await db.update(users).set(updateData).where(eq(users.id, id));
  return await getUserById(id);
}

export async function getUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateUser(id: number, data: Partial<{
  nome: string;
  email: string;
  perfil: string;
  profissionalVinculadoId: number;
  avatarUrl: string | null;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, any> = {};
  
  if (data.nome !== undefined) updateData.name = data.nome;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.perfil !== undefined) updateData.perfil = data.perfil;
  if (data.profissionalVinculadoId !== undefined) updateData.profissionalVinculadoId = data.profissionalVinculadoId;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  
  if (Object.keys(updateData).length === 0) {
    throw new Error('No values to update');
  }
  
  await db.update(users).set(updateData).where(eq(users.id, id));
  return await getUserById(id);
}

// Função auxiliar para hash de senha (SHA-256)
async function hashPassword(password: string): Promise<string> {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function loginManual(email: string, senha: string) {
  const user = await getUserByEmail(email);
  if (!user) return null;
  if (!user.senha) return null;
  const hash = crypto.createHash('sha256').update(senha).digest('hex');
  if (hash !== user.senha) return null;
  return user;
}


// Repasse Condicional - Apenas se prontuário foi feito
export async function getAtendimentosComProntuario(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { and } = await import('drizzle-orm');
  
  return await db
    .select()
    .from(atendimentos)
    .where(
      and(
        eq(atendimentos.prontuarioFeito, 1),
        eq(atendimentos.profissionalId, profissionalId)
      )
    );
}

// Marcar prontuário como feito
export async function marcarProntuarioFeito(atendimentoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(atendimentos).set({ 
    prontuarioFeito: 1 as any
  }).where(eq(atendimentos.id, atendimentoId));
}

// Compartilhar atendimento com outro profissional
export async function compartilharAtendimento(atendimentoId: number, profissionalIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const compartilhadoCom = JSON.stringify(profissionalIds);
  return await db.update(atendimentos).set({ 
    compartilhadoCom: compartilhadoCom as any
  }).where(eq(atendimentos.id, atendimentoId));
}

// Obter atendimentos visíveis para um profissional
export async function getAtendimentosVisiveis(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { eq: eqOp } = await import('drizzle-orm');
  
  const atendimentosProfissional = await db
    .select()
    .from(atendimentos)
    .where(eqOp(atendimentos.profissionalId, profissionalId));
  
  return atendimentosProfissional;
}

// Finalizar repasse (marcar que foi repassado)
export async function finalizarRepasse(guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(guias).set({ 
    repasseFinalizado: 1 as any
  }).where(eq(guias.id, guiaId));
}

// Obter guias para repasse (apenas as com prontuário feito)
export async function getGuiasParaRepasse(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { and } = await import('drizzle-orm');
  
  return await db
    .select()
    .from(guias)
    .where(
      and(
        eq(guias.profissionalId, profissionalId),
        eq(guias.repasseFinalizado, 0)
      )
    );
}


// Contratos Terapêuticos
export async function createContratoTerapeutico(data: {
  pacienteId: number;
  profissionalId: number;
  conteudo: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contratosTerapêuticos).values({
    pacienteId: data.pacienteId,
    profissionalId: data.profissionalId,
    conteudo: data.conteudo,
    assinado: 0,
    ativo: 1,
  });
  // Buscar o contrato recém-criado pelo insertId para retornar o objecto completo com id
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  if (insertId) {
    const criado = await db.select().from(contratosTerapêuticos).where(eq(contratosTerapêuticos.id, insertId)).limit(1);
    return criado[0] ?? null;
  }
  return null;
}

export async function getContratoTerapeutico(pacienteId: number, profissionalId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const { and } = await import('drizzle-orm');
  
  const result = await db
    .select()
    .from(contratosTerapêuticos)
    .where(
      and(
        eq(contratosTerapêuticos.pacienteId, pacienteId),
        eq(contratosTerapêuticos.profissionalId, profissionalId),
        eq(contratosTerapêuticos.ativo, 1)
      )
    )
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function assinarContratoTerapeutico(id: number, assinaturaPacienteUrl: string, hashAssinatura: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.update(contratosTerapêuticos).set({
    assinado: 1 as any,
    dataAssinatura: new Date(),
    assinaturaPacienteUrl,
    hashAssinatura,
  }).where(eq(contratosTerapêuticos.id, id));
}

// Assinaturas de Guias
export async function createAssinaturaGuia(data: {
  guiaId: number;
  pacienteId: number;
  assinaturaPacienteUrl: string;
  hashAssinatura: string;
  sessaoNumero: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(assinaturasGuias).values({
    guiaId: data.guiaId,
    pacienteId: data.pacienteId,
    assinaturaPacienteUrl: data.assinaturaPacienteUrl,
    hashAssinatura: data.hashAssinatura,
    sessaoNumero: data.sessaoNumero,
  });
  
  // Atualizar totalSessoes na guia e marcar como emitida (pronta para pré-faturamento)
  await db.update(guias).set({
    totalSessoes: data.sessaoNumero,
    assinadoPaciente: 1 as any,
    dataAssinaturaPaciente: new Date(),
    status: 'emitida' as any,
  }).where(eq(guias.id, data.guiaId));
  
  return result;
}

export async function getAssinaturasGuia(guiaId: number) {
  const db = await getDb();
  if (!db) return [];

  const [guia] = await db
    .select({ dataEmissao: guias.dataEmissao })
    .from(guias)
    .where(eq(guias.id, guiaId));
  if (!guia) return [];

  const assinaturas = await db
    .select()
    .from(assinaturasGuias)
    .where(
      and(
        eq(assinaturasGuias.guiaId, guiaId),
        // Apenas assinaturas com imagem real (excluir tokens pendentes)
        sql`${assinaturasGuias.assinaturaPacienteUrl} IS NOT NULL AND ${assinaturasGuias.assinaturaPacienteUrl} != ''`,
      )
    )
    .orderBy(assinaturasGuias.sessaoNumero);

  return assinaturas.filter((assinatura) => (
    temComprovanteAssinatura(assinatura.assinaturaPacienteUrl)
    && assinaturaPertenceCompetenciaDaGuia(assinatura.datasAtendimento, guia.dataEmissao)
  ));
}

export async function getHistoricoCompletoAssinaturasGuia(guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [guiaDetalhada, assinaturasDaGuia, registrosSadt] = await Promise.all([
    db
      .select({ guia: guias, paciente: pacientes, profissional: profissionais, convenio: convenios })
      .from(guias)
      .leftJoin(pacientes, eq(guias.pacienteId, pacientes.id))
      .leftJoin(profissionais, eq(guias.profissionalId, profissionais.id))
      .leftJoin(convenios, eq(guias.convenioId, convenios.id))
      .where(eq(guias.id, guiaId))
      .limit(1),
    getAssinaturasGuia(guiaId),
    db
      .select()
      .from(assinaturasSadt)
      .where(eq(assinaturasSadt.guiaId, guiaId))
      .orderBy(assinaturasSadt.numeroSessao, assinaturasSadt.createdAt),
  ]);

  const detalhe = guiaDetalhada[0];
  if (!detalhe) return null;

  return {
    guia: detalhe.guia,
    paciente: detalhe.paciente,
    profissional: detalhe.profissional,
    convenio: detalhe.convenio,
    assinaturasGuias: assinaturasDaGuia,
    assinaturasSadt: registrosSadt,
  };
}

export async function getAssinaturasGuiaPorPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];
  const assinaturas = await db
    .select()
    .from(assinaturasGuias)
    .where(
      and(
        eq(assinaturasGuias.pacienteId, pacienteId),
        // Apenas assinaturas com imagem real (excluir tokens pendentes)
        sql`${assinaturasGuias.assinaturaPacienteUrl} IS NOT NULL AND ${assinaturasGuias.assinaturaPacienteUrl} != ''`,
      )
    )
    .orderBy(assinaturasGuias.sessaoNumero);
  return assinaturas.filter(assinatura => temComprovanteAssinatura(assinatura.assinaturaPacienteUrl));
}
export async function getTotalSessoesGuia(guiaId: number) {
  return (await getAssinaturasGuia(guiaId)).length;
}

// Busca somente a guia clicada na Agenda, no contexto do mesmo profissional.
export async function getGuiaAssinadaComAssinaturas(contexto: { pacienteId: number; guiaId: number; profissionalId: number }) {
  const db = await getDb();
  if (!db) return null;

  // A pré-visualização deve ser documentalmente determinística: mesma guia,
  // mesmo paciente e mesmo profissional do atendimento que abriu o modal.
  const guiaRows = await db
    .select({
      guia: guias,
      profissional: profissionais,
      convenio: convenios,
    })
    .from(guias)
    .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(guias.convenioId, convenios.id))
    .where(
      and(
        eq(guias.id, contexto.guiaId),
        eq(guias.pacienteId, contexto.pacienteId),
        eq(guias.profissionalId, contexto.profissionalId),
        eq(guias.assinadoPaciente, 1),
      )
    )
    .limit(1);

  if (!guiaRows[0]) return null;

  const { guia, profissional, convenio } = guiaRows[0];

  const assinaturas = await getAssinaturasGuia(guia.id);

  return { guia, profissional, convenio, assinaturas };
}

// Verificar quais pacientes têm guia SADT assinada (para indicador na Agenda)
export async function getGuiasAssinadasPorPacientes(pacienteIds: number[]): Promise<Set<number>> {
  if (pacienteIds.length === 0) return new Set();
  const db = await getDb();
  if (!db) return new Set();

  // Busca guias com assinadoPaciente=1 para os pacientes informados
  const rows = await db
    .select({ pacienteId: guias.pacienteId })
    .from(guias)
    .where(
      and(
        inArray(guias.pacienteId, pacienteIds),
        eq(guias.assinadoPaciente, 1),
      )
    );

  return new Set(rows.map(r => r.pacienteId));
}

// Lembrete WhatsApp
export async function criarLembreteWhatsApp(data: {
  pacienteId: number;
  atendimentoId: number;
  dataAtendimento: Date;
  horaAtendimento: string;
  profissionalNome: string;
  telefone: string;
  enviado: boolean;
}) {
  // Implementar integração com API WhatsApp (Twilio, WhatsApp Business API, etc.)
  // Por enquanto, apenas registrar a intenção
  console.log(`[WhatsApp Reminder] Enviando lembrete para ${data.telefone} sobre atendimento em ${data.dataAtendimento} às ${data.horaAtendimento}`);
  
  return {
    pacienteId: data.pacienteId,
    atendimentoId: data.atendimentoId,
    enviado: true,
    mensagem: `Olá! Você tem uma consulta com ${data.profissionalNome} em ${data.dataAtendimento} às ${data.horaAtendimento}. Confirme sua presença.`,
  };
}


// Obter atendimentos que precisam de lembrete (24h antes)
export async function getAtendimentosParaLembrete() {
  const db = await getDb();
  if (!db) return [];
  
  // Calcular data/hora para 24h a partir de agora
  const agora = new Date();
  const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
  
  // Buscar atendimentos agendados que não tiveram lembrete enviado
  const result = await db
    .select({
      atendimento: atendimentos,
      paciente: pacientes,
      profissional: profissionais,
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .where(
      sql`
        ${atendimentos.status} = 'agendado'
        AND ${atendimentos.lembreteEnviado} = 0
        AND ${atendimentos.lembreteSolicitado} = 1
        AND DATE(${atendimentos.data}) = DATE(${em24h})
        AND ${pacientes.recebeLembretesWhatsapp} = 1
        AND ${pacientes.whatsapp} IS NOT NULL
      `
    );
  
  return result;
}

// Marcar lembrete como enviado
export async function marcarLembreteEnviado(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .update(atendimentos)
    .set({
      lembreteEnviado: 1,
      dataEnvioLembrete: new Date(),
    })
    .where(eq(atendimentos.id, atendimentoId));
  
  return result;
}

// Registrar confirmação de atendimento
export async function registrarConfirmacaoAtendimento(atendimentoId: number, confirmado: boolean) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .update(atendimentos)
    .set({
      confirmacaoAtendimento: confirmado ? 1 : 0,
      dataConfirmacao: new Date(),
    })
    .where(eq(atendimentos.id, atendimentoId));
  
  return result;
}

// Obter atendimento por token de confirmação (será usado na URL pública)
export async function getAtendimentoPorId(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      atendimento: atendimentos,
      paciente: pacientes,
      profissional: profissionais,
      convenio: convenios,
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(atendimentos.convenioId, convenios.id))
    .where(eq(atendimentos.id, atendimentoId));
  
  return result[0] || null;
}

// Solicitar lembrete para um atendimento
export async function solicitarLembreteAtendimento(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .update(atendimentos)
    .set({
      lembreteSolicitado: 1,
    })
    .where(eq(atendimentos.id, atendimentoId));
  
  return result;
}


// Obter estatísticas de lembretes
export async function getEstatisticasLembretes() {
  const db = await getDb();
  if (!db) return {
    totalPendentes: 0,
    totalEnviados: 0,
    totalConfirmados: 0,
    totalNaoConfirmados: 0,
    taxaConfirmacao: 0,
  };

  // Contar lembretes pendentes (solicitados mas não enviados)
  const pendentes = await db
    .select()
    .from(atendimentos)
    .where(
      sql`
        ${atendimentos.lembreteSolicitado} = 1
        AND ${atendimentos.lembreteEnviado} = 0
      `
    );

  // Contar lembretes enviados
  const enviados = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.lembreteEnviado, 1));

  // Contar confirmações positivas
  const confirmados = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.confirmacaoAtendimento, 1));

  // Contar confirmações negativas
  const naoConfirmados = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.confirmacaoAtendimento, 0));

  // Calcular taxa de confirmação
  const totalComResposta = confirmados.length + naoConfirmados.length;
  const taxaConfirmacao = totalComResposta > 0 
    ? Math.round((confirmados.length / totalComResposta) * 100)
    : 0;

  return {
    totalPendentes: pendentes.length,
    totalEnviados: enviados.length,
    totalConfirmados: confirmados.length,
    totalNaoConfirmados: naoConfirmados.length,
    taxaConfirmacao,
  };
}

// Obter detalhes dos lembretes por status
export async function getDetalhesLembretesPorStatus(status: 'pendentes' | 'enviados' | 'confirmados' | 'nao_confirmados') {
  const db = await getDb();
  if (!db) return [];

  let whereCondition: any;

  if (status === 'pendentes') {
    whereCondition = sql`
      ${atendimentos.lembreteSolicitado} = 1
      AND ${atendimentos.lembreteEnviado} = 0
    `;
  } else if (status === 'enviados') {
    whereCondition = eq(atendimentos.lembreteEnviado, 1);
  } else if (status === 'confirmados') {
    whereCondition = eq(atendimentos.confirmacaoAtendimento, 1);
  } else if (status === 'nao_confirmados') {
    whereCondition = eq(atendimentos.confirmacaoAtendimento, 0);
  }

  const result = await db
    .select({
      atendimento: atendimentos,
      paciente: pacientes,
      profissional: profissionais,
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .where(whereCondition)
    .orderBy(desc(atendimentos.data));

  return result;
}

// Obter resumo de lembretes para hoje
export async function getResumoLembretesHoje() {
  const db = await getDb();
  if (!db) return {
    agendadosHoje: 0,
    comLembretePendente: 0,
    comLembreteEnviado: 0,
    confirmados: 0,
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);

  // Atendimentos agendados para hoje
  const agendadosHoje = await db
    .select()
    .from(atendimentos)
    .where(
      sql`
        DATE(${atendimentos.data}) = DATE(${hoje})
        AND ${atendimentos.status} = 'agendado'
      `
    );

  // Lembretes pendentes para hoje
  const comLembretePendente = await db
    .select()
    .from(atendimentos)
    .where(
      sql`
        DATE(${atendimentos.data}) = DATE(${hoje})
        AND ${atendimentos.lembreteSolicitado} = 1
        AND ${atendimentos.lembreteEnviado} = 0
      `
    );

  // Lembretes enviados hoje
  const comLembreteEnviado = await db
    .select()
    .from(atendimentos)
    .where(
      sql`
        DATE(${atendimentos.data}) = DATE(${hoje})
        AND ${atendimentos.lembreteEnviado} = 1
      `
    );

  // Confirmações para hoje
  const confirmados = await db
    .select()
    .from(atendimentos)
    .where(
      sql`
        DATE(${atendimentos.data}) = DATE(${hoje})
        AND ${atendimentos.confirmacaoAtendimento} = 1
      `
    );

  return {
    agendadosHoje: agendadosHoje.length,
    comLembretePendente: comLembretePendente.length,
    comLembreteEnviado: comLembreteEnviado.length,
    confirmados: confirmados.length,
  };
}


/**
 * Gerar token seguro para link de confirmação de presença
 * Token = hash(atendimentoId + timestamp + secret)
 */
export async function gerarTokenConfirmacao(atendimentoId: number): Promise<string> {
  const crypto = await import('crypto');
  const timestamp = Math.floor(Date.now() / 1000); // segundos
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  const data = `${atendimentoId}-${timestamp}-${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validar token de confirmação (válido por 24 horas)
 */
export async function validarTokenConfirmacao(atendimentoId: number, token: string): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    
    // Tentar com timestamps dos últimos 86400 segundos (24h)
    const agora = Math.floor(Date.now() / 1000);
    for (let i = 0; i <= 86400; i += 1) {
      const timestamp = agora - i;
      const data = `${atendimentoId}-${timestamp}-${secret}`;
      const tokenEsperado = crypto.createHash('sha256').update(data).digest('hex');
      if (tokenEsperado === token) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Obter dados da consulta para confirmação (sem autenticação)
 */
export async function obterDadosConfirmacaoPresenca(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const resultado = await db
    .select({
      atendimento: {
        id: atendimentos.id,
        data: atendimentos.data,
        hora: atendimentos.hora,
        tipo: atendimentos.tipo,
        status: atendimentos.status,
        confirmacaoAtendimento: atendimentos.confirmacaoAtendimento,
      },
      paciente: {
        id: pacientes.id,
        nome: pacientes.nome,
        email: pacientes.email,
        whatsapp: pacientes.whatsapp,
      },
      profissional: {
        id: profissionais.id,
        nome: profissionais.nome,
        especialidade: profissionais.especialidade,
      },
      convenio: {
        id: convenios.id,
        nome: convenios.nome,
      },
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(atendimentos.convenioId, convenios.id))
    .where(eq(atendimentos.id, atendimentoId));

  return resultado[0] || null;
}


/**
 * Gerar link de confirmação de presença para enviar via WhatsApp
 * Formato: https://dominio.com/confirmar-presenca?atendimentoId=123&token=abc...
 */
export async function gerarLinkConfirmacao(atendimentoId: number, baseUrl: string = 'https://mifature.manus.space'): Promise<string> {
  const token = await gerarTokenConfirmacao(atendimentoId);
  return `${baseUrl}/confirmar-presenca?atendimentoId=${atendimentoId}&token=${token}`;
}


/**
 * Rate limiting simples em memória para confirmação de presença
 * Limita a 10 tentativas por IP por minuto
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function verificarRateLimit(ipAddress: string, limite: number = 10, janela: number = 60000): boolean {
  const agora = Date.now();
  const entrada = rateLimitStore.get(ipAddress);

  if (!entrada || agora > entrada.resetTime) {
    // Nova janela
    rateLimitStore.set(ipAddress, { count: 1, resetTime: agora + janela });
    return true;
  }

  if (entrada.count < limite) {
    entrada.count++;
    return true;
  }

  return false;
}

/**
 * Limpar rate limit expirado (executar periodicamente)
 */
export function limparRateLimitExpirado() {
  const agora = Date.now();
  const ipsParaRemover: string[] = [];
  rateLimitStore.forEach((entrada, ip) => {
    if (agora > entrada.resetTime) {
      ipsParaRemover.push(ip);
    }
  });
  ipsParaRemover.forEach(ip => rateLimitStore.delete(ip));
}


/**
 * Obter confirmações pendentes de atendimentos do profissional
 */
export async function getConfirmacoesPendentes(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];

  const { and, eq, isNotNull, desc } = await import("drizzle-orm");
  
  return await db
    .select({
      id: atendimentos.id,
      pacienteName: pacientes.nome,
      pacienteWhatsapp: pacientes.whatsapp,
      data: atendimentos.data,
      hora: atendimentos.hora,
      tipo: atendimentos.tipo,
      confirmacaoAtendimento: atendimentos.confirmacaoAtendimento,
      dataConfirmacao: atendimentos.dataConfirmacao,
      lembreteEnviado: atendimentos.lembreteEnviado,
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .where(
      and(
        eq(atendimentos.profissionalId, profissionalId),
        eq(atendimentos.status, "agendado"),
        isNotNull(atendimentos.confirmacaoAtendimento)
      )
    )
    .orderBy(desc(atendimentos.dataConfirmacao));
}

/**
 * Obter estatísticas de confirmações para o profissional
 */
export async function getEstatisticasConfirmacoesProfissional(profissionalId: number) {
  const db = await getDb();
  if (!db) return { confirmados: 0, naoConfirmados: 0, pendentes: 0 };

  const { and, eq, isNull } = await import("drizzle-orm");

  const confirmados = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(atendimentos)
    .where(
      and(
        eq(atendimentos.profissionalId, profissionalId),
        eq(atendimentos.status, "agendado"),
        eq(atendimentos.confirmacaoAtendimento, 1)
      )
    );

  const naoConfirmados = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(atendimentos)
    .where(
      and(
        eq(atendimentos.profissionalId, profissionalId),
        eq(atendimentos.status, "agendado"),
        eq(atendimentos.confirmacaoAtendimento, 0)
      )
    );

  const pendentes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(atendimentos)
    .where(
      and(
        eq(atendimentos.profissionalId, profissionalId),
        eq(atendimentos.status, "agendado"),
        isNull(atendimentos.confirmacaoAtendimento)
      )
    );

  return {
    confirmados: confirmados[0]?.count || 0,
    naoConfirmados: naoConfirmados[0]?.count || 0,
    pendentes: pendentes[0]?.count || 0,
  };
}


/**
 * Processa arquivo CSV de pacientes e retorna lista de pacientes validados
 * Formato esperado: nome, cpf, dataNascimento, email, telefone, whatsapp, recebeLembretesWhatsapp, endereco, cidade, estado, cep, cartaoSUS, pedidoMedicoUrl, dataVencimentoPedido, anexoUrl
 */
export async function processarCSVPacientes(csvContent: string): Promise<{
  validos: any[];
  invalidos: { linha: number; erro: string }[];
  total: number;
}> {
  const linhas = csvContent.trim().split('\n');
  const validos: any[] = [];
  const invalidos: { linha: number; erro: string }[] = [];

  // Pular cabeçalho
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    if (!linha) continue;

    try {
      const campos = linha.split(',').map(c => c.trim());
      
      // Validar campos obrigatórios
      if (!campos[0]) throw new Error('Nome obrigatório');
      if (!campos[1]) throw new Error('CPF obrigatório');
      if (!campos[2]) throw new Error('Data de nascimento obrigatória');

      // Validar CPF (formato básico)
      const cpf = campos[1].replace(/\D/g, '');
      if (cpf.length !== 11) throw new Error('CPF inválido');

      // Validar email se fornecido
      if (campos[3] && !campos[3].includes('@')) throw new Error('Email inválido');

      // Validar telefone se fornecido
      if (campos[4] && campos[4].replace(/\D/g, '').length < 10) throw new Error('Telefone inválido');

      const paciente = {
        nome: campos[0],
        cpf: campos[1],
        dataNascimento: campos[2],
        email: campos[3] || undefined,
        telefone: campos[4] || undefined,
        whatsapp: campos[5] || undefined,
        recebeLembretesWhatsapp: campos[6] ? campos[6].toLowerCase() === 'sim' : true,
        endereco: campos[7] || undefined,
        cidade: campos[8] || undefined,
        estado: campos[9] || undefined,
        cep: campos[10] || undefined,
        cartaoSUS: campos[11] || undefined,
        pedidoMedicoUrl: campos[12] || undefined,
        dataVencimentoPedido: campos[13] || undefined,
        anexoUrl: campos[14] || undefined,
      };

      validos.push(paciente);
    } catch (erro: any) {
      invalidos.push({
        linha: i + 1,
        erro: erro.message,
      });
    }
  }

  return {
    validos,
    invalidos,
    total: linhas.length - 1, // Excluir cabeçalho
  };
}

/**
 * Importa pacientes em massa no banco de dados
 */
export async function importarPacientesMassa(pacientesData: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const resultados = {
    sucesso: 0,
    falha: 0,
    erros: [] as { nome: string; erro: string }[],
  };

  for (const paciente of pacientesData) {
    try {
      // Verificar se CPF já existe
      const existente = await db
        .select()
        .from(pacientes)
        .where(eq(pacientes.cpf, paciente.cpf))
        .limit(1);

      if (existente.length > 0) {
        resultados.falha++;
        resultados.erros.push({
          nome: paciente.nome,
          erro: 'CPF já cadastrado',
        });
        continue;
      }

      // Inserir paciente
      await db.insert(pacientes).values({
        nome: paciente.nome,
        cpf: paciente.cpf,
        dataNascimento: paciente.dataNascimento,
        email: paciente.email,
        telefone: paciente.telefone,
        whatsapp: paciente.whatsapp,
        recebeLembretesWhatsapp: paciente.recebeLembretesWhatsapp ? 1 : 0,
        endereco: paciente.endereco,
        cidade: paciente.cidade,
        estado: paciente.estado,
        cep: paciente.cep,
        cartaoSUS: paciente.cartaoSUS,
        pedidoMedicoUrl: paciente.pedidoMedicoUrl,
        dataVencimentoPedido: paciente.dataVencimentoPedido,
        anexoUrl: paciente.anexoUrl,
      } as InsertPaciente);

      resultados.sucesso++;
    } catch (erro: any) {
      resultados.falha++;
      resultados.erros.push({
        nome: paciente.nome,
        erro: erro.message,
      });
    }
  }

  return resultados;
}


// ============================================================
// TISS / Guia SP-SADT — Procedimentos, Lotes e Dados do Prestador
// ============================================================

/** Lista os itens de procedimento de uma guia */
export async function getGuiaProcedimentos(guiaId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(guiaProcedimentos).where(eq(guiaProcedimentos.guiaId, guiaId)).orderBy(guiaProcedimentos.sequencial);
}

/** Substitui todos os procedimentos de uma guia pelos informados */
export async function setGuiaProcedimentos(guiaId: number, itens: Omit<InsertGuiaProcedimento, "guiaId">[]) {
  const db = await getDb();
  if (!db) {
    console.error('[setGuiaProcedimentos] ERRO: db eh null');
    return;
  }
  console.log(`[setGuiaProcedimentos] Iniciando para guiaId=${guiaId}, itens.length=${itens.length}`);
  
  // Verificar quantos procedimentos existem antes do delete
  const antes = await db.select().from(guiaProcedimentos).where(eq(guiaProcedimentos.guiaId, guiaId));
  console.log(`[setGuiaProcedimentos] ANTES delete: ${antes.length} procedimentos`);
  antes.forEach((p, i) => console.log(`  ${i+1}. ${p.codigoProcedimento} - ${p.descricaoProcedimento}`));
  
  // Deletar
  const deleteResult = await db.delete(guiaProcedimentos).where(eq(guiaProcedimentos.guiaId, guiaId));
  console.log(`[setGuiaProcedimentos] Delete executado para guiaId=${guiaId}`);
  
  // Verificar quantos ficaram após o delete
  const depois = await db.select().from(guiaProcedimentos).where(eq(guiaProcedimentos.guiaId, guiaId));
  console.log(`[setGuiaProcedimentos] DEPOIS delete: ${depois.length} procedimentos`);
  depois.forEach((p, i) => console.log(`  ${i+1}. ${p.codigoProcedimento} - ${p.descricaoProcedimento}`));
  
  console.log(`[setGuiaProcedimentos] Inserindo ${itens.length} procedimentos para guia ${guiaId}`);
  if (itens.length === 0) {
    console.log(`[setGuiaProcedimentos] Lista vazia - retornando sem inserir`);
    return;
  }
  const rows: InsertGuiaProcedimento[] = itens.map((it, idx) => ({
    ...it,
    guiaId,
    sequencial: it.sequencial ?? idx + 1,
  }));
  await db.insert(guiaProcedimentos).values(rows);
}

/** Exclui uma guia e seus procedimentos vinculados, e desvincula o atendimento */
export async function deleteGuia(guiaId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  // Remover procedimentos vinculados
  await db.delete(guiaProcedimentos).where(eq(guiaProcedimentos.guiaId, guiaId));
  // Desvincular atendimentos que apontam para esta guia
  await db.update(atendimentos).set({ guiaId: null } as any).where(eq((atendimentos as any).guiaId, guiaId));
  // Excluir a guia
  await db.delete(guias).where(eq(guias.id, guiaId));
}

/** Atualiza os campos TISS de uma guia */
export async function updateGuiaTISS(id: number, data: Partial<InsertGuia>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(guias).set(data).where(eq(guias.id, id));
  const [row] = await db.select().from(guias).where(eq(guias.id, id));
  return row ?? null;
}

/** Obtém uma guia por ID */
export async function getGuiaPorId(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(guias).where(eq(guias.id, id));
  return row ?? null;
}

/** Cria um lote de faturamento */
export async function createLoteFaturamento(data: InsertLoteFaturamento) {
  const db = await getDb();
  if (!db) throw new Error("Database indisponível");
  const result = await db.insert(lotesFaturamento).values(data);
  const insertId = (result as any)[0]?.insertId ?? (result as any).insertId;
  const [row] = await db.select().from(lotesFaturamento).where(eq(lotesFaturamento.id, insertId));
  return row;
}

/** Lista lotes de faturamento (mais recentes primeiro), incluindo o nome do convênio. */
export async function getLotesFaturamento() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ lote: lotesFaturamento, convenioNome: convenios.nome })
    .from(lotesFaturamento)
    .leftJoin(convenios, eq(lotesFaturamento.convenioId, convenios.id))
    .orderBy(desc(lotesFaturamento.createdAt));
  return rows.map(({ lote, convenioNome }) => ({ ...lote, convenioNome: convenioNome ?? null }));
}

/** Retorna um lote e todas as guias enviadas nele, com dados de exibição. */
export async function getLoteFaturamentoComGuias(loteId: number) {
  const db = await getDb();
  if (!db) return null;
  const [loteRow] = await db
    .select({ lote: lotesFaturamento, convenioNome: convenios.nome })
    .from(lotesFaturamento)
    .leftJoin(convenios, eq(lotesFaturamento.convenioId, convenios.id))
    .where(eq(lotesFaturamento.id, loteId));
  if (!loteRow) return null;

  const guiasRows = await db
    .select({ guia: guias, pacienteNome: pacientes.nome })
    .from(guias)
    .leftJoin(pacientes, eq(guias.pacienteId, pacientes.id))
    .where(eq(guias.loteId, loteId))
    .orderBy(guias.dataEmissao, guias.numeroGuia);

  return {
    lote: { ...loteRow.lote, convenioNome: loteRow.convenioNome ?? null },
    guias: guiasRows.map(({ guia, pacienteNome }) => ({ ...guia, pacienteNome: pacienteNome ?? null })),
  };
}

/** Atualiza um lote (ex.: gravar XML gerado, status, hash) */
export async function updateLoteFaturamento(id: number, data: Partial<InsertLoteFaturamento>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(lotesFaturamento).set(data).where(eq(lotesFaturamento.id, id));
  const [row] = await db.select().from(lotesFaturamento).where(eq(lotesFaturamento.id, id));
  return row ?? null;
}

/** Obtém as guias de um lote */
export async function getGuiasPorLote(loteId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(guias).where(eq(guias.loteId, loteId));
}

/** Vincula guias a um lote */
export async function vincularGuiasAoLote(loteId: number, guiaIds: number[]) {
  const db = await getDb();
  if (!db) return;
  for (const gid of guiaIds) {
    await db.update(guias).set({ loteId }).where(eq(guias.id, gid));
  }
}

/**
 * Exclui somente lotes que ainda não foram enviados ou processados.
 * As guias são preservadas e retornam ao estado emitida para um novo lote.
 */
export async function excluirLoteFaturamentoGerado(loteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database indisponível");

  const [lote] = await db.select().from(lotesFaturamento).where(eq(lotesFaturamento.id, loteId));
  if (!lote) throw new Error("Lote não encontrado.");
  if (!loteTissPodeSerExcluido(lote.status)) {
    throw new Error(mensagemLoteTissNaoExcluivel(lote.status));
  }

  const guiasVinculadas = await db.select({ id: guias.id }).from(guias).where(eq(guias.loteId, loteId));

  await db.transaction(async (tx) => {
    await tx.update(guias)
      .set({ loteId: null, status: "emitida" })
      .where(eq(guias.loteId, loteId));
    await tx.delete(lotesFaturamento).where(eq(lotesFaturamento.id, loteId));
  });

  return {
    numeroLote: lote.numeroLote,
    quantidadeGuiasLiberadas: guiasVinculadas.length,
  };
}

/** Obtém os dados do prestador (configuração única) */
export async function getDadosPrestador() {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(dadosPrestador).limit(1);
  return row ?? null;
}

/** Salva/atualiza os dados do prestador (upsert do registro único) */
export async function salvarDadosPrestador(data: InsertDadosPrestador) {
  const db = await getDb();
  if (!db) throw new Error("Database indisponível");
  const existing = await getDadosPrestador();
  if (existing) {
    await db.update(dadosPrestador).set(data).where(eq(dadosPrestador.id, existing.id));
    return await getDadosPrestador();
  }
  await db.insert(dadosPrestador).values(data);
  return await getDadosPrestador();
}


// ===================== Alertas de Prontuários Pendentes =====================

/**
 * Sincroniza os alertas de prontuários pendentes de um profissional.
 * Um atendimento é considerado pendente quando está com status "realizado"
 * (a consulta ocorreu) mas ainda não possui prontuário preenchido.
 * Cria registros de alerta que ainda não existem e retorna a lista completa
 * de alertas pendentes (status = 'pendente') com dados do paciente/atendimento.
 */
export async function sincronizarAlertasProntuarioPendente(profissionalId: number) {
  const db = await getDb();
  if (!db) return [] as Array<any>;

  const { and, eq, notInArray } = await import("drizzle-orm");

  // Atendimentos realizados do profissional que NÃO têm prontuário
  const prontuariosDoProfissional = await db
    .select({ atendimentoId: prontuarios.atendimentoId })
    .from(prontuarios)
    .where(eq(prontuarios.profissionalId, profissionalId));

  const atendimentosComProntuario = prontuariosDoProfissional
    .map((p) => p.atendimentoId)
    .filter((id): id is number => typeof id === "number");

  const baseCond = and(
    eq(atendimentos.profissionalId, profissionalId),
    eq(atendimentos.status, "realizado"),
  );

  const pendentes = await db
    .select({
      id: atendimentos.id,
      pacienteId: atendimentos.pacienteId,
      data: atendimentos.data,
      hora: atendimentos.hora,
      tipo: atendimentos.tipo,
    })
    .from(atendimentos)
    .where(
      atendimentosComProntuario.length > 0
        ? and(baseCond, notInArray(atendimentos.id, atendimentosComProntuario))
        : baseCond,
    );

  // Garante que exista um registro de alerta para cada atendimento pendente
  for (const at of pendentes) {
    const existente = await db
      .select({ id: alertasProntuarioPendente.id })
      .from(alertasProntuarioPendente)
      .where(eq(alertasProntuarioPendente.atendimentoId, at.id))
      .limit(1);

    if (existente.length === 0) {
      await db.insert(alertasProntuarioPendente).values({
        atendimentoId: at.id,
        profissionalId,
        status: "pendente",
      } as InsertAlertaProntuarioPendente);
    }
  }

  // Marca como resolvidos os alertas cujo atendimento já tem prontuário
  if (atendimentosComProntuario.length > 0) {
    for (const atId of atendimentosComProntuario) {
      await db
        .update(alertasProntuarioPendente)
        .set({ status: "resolvido" })
        .where(
          and(
            eq(alertasProntuarioPendente.atendimentoId, atId),
            eq(alertasProntuarioPendente.profissionalId, profissionalId),
          ),
        );
    }
  }

  return await getAlertasProntuarioPendentesPorProfissional(profissionalId);
}

/**
 * Retorna os alertas de prontuário ainda pendentes de reconhecimento
 * de um profissional, com dados do paciente e do atendimento.
 */
export async function getAlertasProntuarioPendentesPorProfissional(profissionalId: number) {
  const db = await getDb();
  if (!db) return [] as Array<any>;

  const { and, eq, ne, desc } = await import("drizzle-orm");

  return await db
    .select({
      id: alertasProntuarioPendente.id,
      atendimentoId: alertasProntuarioPendente.atendimentoId,
      profissionalId: alertasProntuarioPendente.profissionalId,
      status: alertasProntuarioPendente.status,
      dataAlerta: alertasProntuarioPendente.dataAlerta,
      pacienteNome: pacientes.nome,
      atendimentoData: atendimentos.data,
      atendimentoHora: atendimentos.hora,
      atendimentoTipo: atendimentos.tipo,
    })
    .from(alertasProntuarioPendente)
    .innerJoin(atendimentos, eq(alertasProntuarioPendente.atendimentoId, atendimentos.id))
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .where(
      and(
        eq(alertasProntuarioPendente.profissionalId, profissionalId),
        ne(alertasProntuarioPendente.status, "resolvido"),
      ),
    )
    .orderBy(desc(alertasProntuarioPendente.dataAlerta));
}

/**
 * Registra o reconhecimento ("Ciente") de um alerta pelo profissional,
 * gravando data e hora do reconhecimento. Retorna o alerta atualizado.
 */
export async function reconhecerAlertaProntuario(alertaId: number, profissionalId: number) {
  const db = await getDb();
  if (!db) return null;

  const { and, eq } = await import("drizzle-orm");

  const agora = new Date();
  const hora = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;

  await db
    .update(alertasProntuarioPendente)
    .set({
      status: "reconhecido",
      dataReconhecimento: agora,
      horaReconhecimento: hora,
    })
    .where(
      and(
        eq(alertasProntuarioPendente.id, alertaId),
        eq(alertasProntuarioPendente.profissionalId, profissionalId),
      ),
    );

  const atualizado = await db
    .select()
    .from(alertasProntuarioPendente)
    .where(eq(alertasProntuarioPendente.id, alertaId))
    .limit(1);

  return atualizado[0] ?? null;
}

/**
 * Conta alertas por status para um profissional (para badges/resumos).
 */
export async function getResumoAlertasProntuario(profissionalId: number) {
  const db = await getDb();
  if (!db) return { pendentes: 0, reconhecidos: 0, resolvidos: 0 };

  const { and, eq } = await import("drizzle-orm");

  async function contar(status: "pendente" | "reconhecido" | "resolvido") {
    const r = await db!
      .select({ count: sql<number>`COUNT(*)` })
      .from(alertasProntuarioPendente)
      .where(
        and(
          eq(alertasProntuarioPendente.profissionalId, profissionalId),
          eq(alertasProntuarioPendente.status, status),
        ),
      );
    return Number(r[0]?.count || 0);
  }

  return {
    pendentes: await contar("pendente"),
    reconhecidos: await contar("reconhecido"),
    resolvidos: await contar("resolvido"),
  };
}

// ===== Pré-preenchimento automático da Guia SP/SADT =====

/**
 * Busca todos os dados necessários para pré-preencher a guia SP/SADT
 * a partir de um atendimento registado.
 * Retorna: atendimento, paciente, profissional, convênio, autorização ativa,
 * procedimentos do convênio e dados do prestador.
 */
export async function getDadosParaGuia(atendimentoId: number) {
  const db = await getDb();
  if (!db) return null;

  // 1. Atendimento com joins básicos
  const base = await getAtendimentoPorId(atendimentoId);
  if (!base) return null;

  const { atendimento, paciente, profissional, convenio } = base;

  // 2. Autorização ativa para este paciente/convênio
  const autorizacaoRows = await db
    .select()
    .from(autorizacoes)
    .where(
      and(
        eq(autorizacoes.pacienteId, paciente.id),
        eq(autorizacoes.convenioId, convenio.id),
        eq(autorizacoes.status, "ativa"),
      ),
    )
    .orderBy(desc(autorizacoes.dataValidade))
    .limit(1);
  const autorizacao = autorizacaoRows[0] || null;

  // 3. Procedimentos do convênio (para sugestão de código TUSS)
  const procedimentosConvenio = await getProcedimentosPorConvenioId(convenio.id);

  // 3b. Procedimento específico vinculado ao atendimento (se houver)
  let procedimentoVinculado: (typeof procedimentosConvenio)[0] | null = null;
  if (atendimento.procedimentoConvenioId) {
    const vinculado = procedimentosConvenio.find(p => p.id === atendimento.procedimentoConvenioId);
    if (vinculado) {
      procedimentoVinculado = vinculado;
    } else {
      // Buscar diretamente caso não esteja na lista (ex: procedimento inativo)
      const rows = await db
        .select({
          id: procedimentosPorConvenio.id,
          codigoConvenio: procedimentosPorConvenio.codigoConvenio,
          descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
          valor: procedimentosPorConvenio.valor,
          codigoANS: tabelaProcedimentos.codigoANS,
          descricao: tabelaProcedimentos.descricao,
        })
        .from(procedimentosPorConvenio)
        .innerJoin(
          tabelaProcedimentos,
          eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id),
        )
        .where(eq(procedimentosPorConvenio.id, atendimento.procedimentoConvenioId))
        .limit(1);
      procedimentoVinculado = rows[0] || null;
    }
  }

  // 4. Dados do prestador
  const prestador = await getDadosPrestador();

  // 5. Número da sessão (quantas guias já existem para este paciente/profissional/convênio)
  const guiasExistentes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(guias)
    .where(
      and(
        eq(guias.pacienteId, paciente.id),
        eq(guias.profissionalId, profissional.id),
        eq(guias.convenioId, convenio.id),
      ),
    );
  const numeroSessao = Number(guiasExistentes[0]?.count || 0) + 1;

  return {
    atendimento,
    paciente,
    profissional,
    convenio,
    autorizacao,
    procedimentosConvenio,
    procedimentoVinculado,
    prestador,
    numeroSessao,
  };
}

// Helper interno: busca procedimentos de um convênio com join na tabela de procedimentos
async function getProcedimentosPorConvenioId(convenioId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: procedimentosPorConvenio.id,
      codigoConvenio: procedimentosPorConvenio.codigoConvenio,
      descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
      valor: procedimentosPorConvenio.valor,
      codigoANS: tabelaProcedimentos.codigoANS,
      descricao: tabelaProcedimentos.descricao,
    })
    .from(procedimentosPorConvenio)
    .innerJoin(
      tabelaProcedimentos,
      eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id),
    )
    .where(
      and(
        eq(procedimentosPorConvenio.convenioId, convenioId),
        eq(procedimentosPorConvenio.ativo, 1),
      ),
    );
}

/**
 * Busca todos os dados enriquecidos de uma guia existente para preencher o prefaturamento.
 * Retorna paciente, convênio, profissional, autorização, procedimentos e prestador.
 */
export async function getDadosGuiaPrefaturamento(guiaId: number) {
  const db = await getDb();
  if (!db) return null;

  // 1. Buscar a guia com joins de paciente, profissional e convênio
  // NOTA: usamos select explícito para evitar conflito de nomes entre guias e pacientes
  // (ambas as tabelas têm numeroCarteira e validadeCarteira)
  const rows = await db
    .select({
      guia: guias,
      // Campos do paciente com aliases explícitos para os campos conflituantes
      paciente: {
        id: pacientes.id,
        nome: pacientes.nome,
        cpf: pacientes.cpf,
        dataNascimento: pacientes.dataNascimento,
        email: pacientes.email,
        telefone: pacientes.telefone,
        whatsapp: pacientes.whatsapp,
        recebeLembretesWhatsapp: pacientes.recebeLembretesWhatsapp,
        endereco: pacientes.endereco,
        cidade: pacientes.cidade,
        estado: pacientes.estado,
        cep: pacientes.cep,
        cartaoSUS: pacientes.cartaoSUS,
        convenioId: pacientes.convenioId,
        // Aliases para evitar conflito com guias.numeroCarteira e guias.validadeCarteira
        numeroCarteira: pacientes.numeroCarteira,
        validadeCarteira: pacientes.validadeCarteira,
        pedidoMedicoUrl: pacientes.pedidoMedicoUrl,
        dataVencimentoPedido: pacientes.dataVencimentoPedido,
        alertaVencimentoEnviado: pacientes.alertaVencimentoEnviado,
        anexoUrl: pacientes.anexoUrl,
        nomeMedicoSolicitante: pacientes.nomeMedicoSolicitante,
        crmMedicoSolicitante: pacientes.crmMedicoSolicitante,
        ufMedicoSolicitante: pacientes.ufMedicoSolicitante,
        cbosMedicoSolicitante: pacientes.cbosMedicoSolicitante,
        createdAt: pacientes.createdAt,
        updatedAt: pacientes.updatedAt,
      },
      profissional: profissionais,
      convenio: convenios,
    })
    .from(guias)
    .innerJoin(pacientes, eq(guias.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(guias.convenioId, convenios.id))
    .where(eq(guias.id, guiaId))
    .limit(1);

  if (!rows.length) return null;
  const { guia, paciente, profissional, convenio } = rows[0];

  // 2. Autorização ativa para este paciente/convênio
  const autorizacaoRows = await db
    .select()
    .from(autorizacoes)
    .where(
      and(
        eq(autorizacoes.pacienteId, paciente.id),
        eq(autorizacoes.convenioId, convenio.id),
        eq(autorizacoes.status, 'ativa'),
      ),
    )
    .orderBy(desc(autorizacoes.dataValidade))
    .limit(1);
  const autorizacao = autorizacaoRows[0] || null;

  // 3. Procedimentos já salvos nesta guia
  const procedimentosSalvos = await db
    .select()
    .from(guiaProcedimentos)
    .where(eq(guiaProcedimentos.guiaId, guiaId))
    .orderBy(guiaProcedimentos.sequencial);

  // 3b. Se a guia tem atendimentoId, buscar o procedimento vinculado ao atendimento e a data do agendamento
  let procedimentoDoAtendimento: {
    id: number;
    codigoConvenio: string;
    descricaoConvenio: string | null;
    valor: string;
    codigoANS: string;
    descricao: string;
    dataAgendamento?: string | null;
    horaAgendamento?: string | null;
  } | null = null;
  let serieDoAtendimentoVinculado: string | null = null;
  if ((guia as any).atendimentoId) {
    const atendRows = await db
      .select()
      .from(atendimentos)
      .where(eq(atendimentos.id, (guia as any).atendimentoId))
      .limit(1);
    const atend = atendRows[0];
    serieDoAtendimentoVinculado = (atend as any)?.serieId ?? null;
    if (atend?.procedimentoConvenioId) {
      const procRows = await db
        .select({
          id: procedimentosPorConvenio.id,
          codigoConvenio: procedimentosPorConvenio.codigoConvenio,
          descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
          valor: procedimentosPorConvenio.valor,
          codigoANS: tabelaProcedimentos.codigoANS,
          descricao: tabelaProcedimentos.descricao,
        })
        .from(procedimentosPorConvenio)
        .innerJoin(
          tabelaProcedimentos,
          eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id),
        )
        .where(eq(procedimentosPorConvenio.id, atend.procedimentoConvenioId))
        .limit(1);
      if (procRows[0]) {
        procedimentoDoAtendimento = {
          ...procRows[0],
          // Incluir data e hora do agendamento para preencher campo 36 e 41
          dataAgendamento: atend.data ? String(atend.data) : null,
          horaAgendamento: atend.hora || null,
        };
      }
    } else if (atend) {
      // Mesmo sem procedimento vinculado, retornar a data do agendamento
      procedimentoDoAtendimento = {
        id: 0,
        codigoConvenio: '',
        descricaoConvenio: null,
        valor: '0',
        codigoANS: '',
        descricao: '',
        dataAgendamento: atend.data ? String(atend.data) : null,
        horaAgendamento: atend.hora || null,
      };
    }
  }

  // 4. Procedimentos do convênio (para sugestão se não houver salvos)
  const procedimentosConvenio = await getProcedimentosPorConvenioId(convenio.id);

  // 5. Dados do prestador
  const prestador = await getDadosPrestador();

  // 6. Número da sessão (quantas guias existem para este paciente/profissional/convênio)
  const guiasExistentes = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(guias)
    .where(
      and(
        eq(guias.pacienteId, paciente.id),
        eq(guias.profissionalId, profissional.id),
        eq(guias.convenioId, convenio.id),
      ),
    );
  const numeroSessao = Number(guiasExistentes[0]?.count || 0);

  // 7. Sessões (atendimentos) do paciente com o mesmo profissional e convênio
  // FILTRO: apenas atendimentos do mesmo mês/ano da guia (dataEmissao)
  const guiaDataEmissao = guia.dataEmissao ? new Date(guia.dataEmissao) : new Date();
  const mesFiltro = guiaDataEmissao.getMonth(); // 0-11
  const anoFiltro = guiaDataEmissao.getFullYear();
  // Calcular primeiro e último dia do mês da guia
  const inicioPeriodo = new Date(anoFiltro, mesFiltro, 1);
  const fimPeriodo = new Date(anoFiltro, mesFiltro + 1, 0); // último dia do mês
  const inicioPeriodoStr = inicioPeriodo.toISOString().split('T')[0];
  const fimPeriodoStr = fimPeriodo.toISOString().split('T')[0];

  // A guia pode ter sido criada a partir de um atendimento em série antes de
  // receber o serieId. Nessa situação, a série do próprio atendimento é a
  // referência segura: evita que uma guia de avaliação receba sessões de
  // psicoterapia apenas por pertencer ao mesmo paciente e mês.
  const guiaSerieId = resolverSerieDaGuiaPrefaturamento(
    (guia as any).serieId,
    serieDoAtendimentoVinculado,
  );

  const sessoesRows = await db
    .select({
      id: atendimentos.id,
      data: atendimentos.data,
      hora: atendimentos.hora,
      duracao: atendimentos.duracao,
      status: atendimentos.status,
      procedimentoConvenioId: atendimentos.procedimentoConvenioId,
      profissionalId: atendimentos.profissionalId,
      profissionalNome: profissionais.nome,
      profissionalCpf: profissionais.cpf,
      profissionalConselho: profissionais.conselhoProfissional,
      profissionalNumeroConselho: profissionais.crm,
      profissionalUf: profissionais.uf,
      profissionalCbo: profissionais.codigoCBO,
    })
    .from(atendimentos)
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .where(
      guiaSerieId
        ? // Guia vinculada a uma série: mostrar apenas atendimentos dessa série
          and(
            eq(atendimentos.pacienteId, paciente.id),
            eq((atendimentos as any).serieId, guiaSerieId),
          )
        : // Guia avulsa: mostrar atendimentos do mês da guia
          and(
            eq(atendimentos.pacienteId, paciente.id),
            eq(atendimentos.convenioId, convenio.id),
            sql`${atendimentos.data} >= ${inicioPeriodoStr}`,
            sql`${atendimentos.data} <= ${fimPeriodoStr}`,
          ),
    )
    .orderBy(atendimentos.data, atendimentos.hora)
    .limit(50); // limitar a 50 sessões máximo

  // Para cada sessão, buscar o procedimento vinculado (se houver)
  const sessoesComProcedimento = await Promise.all(
    sessoesRows.map(async (s) => {
      if (!s.procedimentoConvenioId) {
      return {
        id: s.id,
        data: s.data ? String(s.data) : null,
        hora: s.hora || null,
        status: s.status,
        codigoTUSS: null as string | null,
        descricaoProcedimento: null as string | null,
        valor: null as string | null,
        codigoTabela: '22',
        profissionalId: s.profissionalId,
        profissionalNome: s.profissionalNome || null,
        profissionalCpf: s.profissionalCpf || null,
        profissionalConselho: s.profissionalConselho || null,
        profissionalNumeroConselho: s.profissionalNumeroConselho || null,
        profissionalUf: s.profissionalUf || null,
        profissionalCbo: s.profissionalCbo || null,
      };
      }
      const procRows = await db
        .select({
          codigoConvenio: procedimentosPorConvenio.codigoConvenio,
          descricaoConvenio: procedimentosPorConvenio.descricaoConvenio,
          valor: procedimentosPorConvenio.valor,
          codigoANS: tabelaProcedimentos.codigoANS,
          descricao: tabelaProcedimentos.descricao,
        })
        .from(procedimentosPorConvenio)
        .innerJoin(
          tabelaProcedimentos,
          eq(procedimentosPorConvenio.tabelaProcedimentoId, tabelaProcedimentos.id),
        )
        .where(eq(procedimentosPorConvenio.id, s.procedimentoConvenioId))
        .limit(1);
      const proc = procRows[0];
      return {
        id: s.id,
        data: s.data ? String(s.data) : null,
        hora: s.hora || null,
        status: s.status,
        codigoTUSS: proc?.codigoConvenio || proc?.codigoANS || null,
        descricaoProcedimento: proc?.descricaoConvenio || proc?.descricao || null,
        valor: proc?.valor || null,
        codigoTabela: '22',
        profissionalId: s.profissionalId,
        profissionalNome: s.profissionalNome || null,
        profissionalCpf: s.profissionalCpf || null,
        profissionalConselho: s.profissionalConselho || null,
        profissionalNumeroConselho: s.profissionalNumeroConselho || null,
        profissionalUf: s.profissionalUf || null,
        profissionalCbo: s.profissionalCbo || null,
      };
    }),
  );

  // A Pasta do Paciente guarda pedidos enviados como anexos categorizados.
  // O campo dedicado continua prioritário, mas o anexo também é elegível para
  // leitura assistida no pré-faturamento.
  let pedidoMedicoDaPasta: string | null = null;
  if (!paciente.pedidoMedicoUrl) {
    const { anexosPaciente } = await import('../drizzle/schema');
    const anexosPedido = await db
      .select({ fileUrl: anexosPaciente.fileUrl })
      .from(anexosPaciente)
      .where(and(
        eq(anexosPaciente.pacienteId, paciente.id),
        sql`LOWER(${anexosPaciente.categoria}) = 'pedido_medico'`,
      ))
      .orderBy(desc(anexosPaciente.createdAt))
      .limit(1);
    pedidoMedicoDaPasta = anexosPedido[0]?.fileUrl || null;
  }

  return {
    guia,
    paciente: {
      ...paciente,
      pedidoMedicoUrl: paciente.pedidoMedicoUrl || pedidoMedicoDaPasta,
    },
    profissional,
    convenio,
    autorizacao,
    procedimentosSalvos,
    procedimentosConvenio,
    procedimentoDoAtendimento,
    prestador,
    numeroSessao,
    sessoes: sessoesComProcedimento,
  };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) {
    return {
      totalAtendimentos: 0,
      atendimentosHoje: 0,
      atendimentosMes: 0,
      atendimentosPorStatus: [] as { status: string; total: number }[],
      guiasPorStatus: [] as { status: string; total: number }[],
      totalPacientes: 0,
      atendimentosRecentes: [] as {
        id: number;
        paciente: string;
        convenio: string;
        tipo: string;
        data: string;
        status: string;
      }[],
    };
  }

  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  const mesStr = hojeStr.substring(0, 7);

  const [totalAtendimentosRows] = await db.execute(
    sql`SELECT COUNT(*) as total FROM atendimentos`,
  );
  const totalAtendimentos = Number((totalAtendimentosRows as any)[0]?.total ?? 0);

  const [hojeRows] = await db.execute(
    sql`SELECT COUNT(*) as total FROM atendimentos WHERE DATE(data) = ${hojeStr}`,
  );
  const atendimentosHoje = Number((hojeRows as any)[0]?.total ?? 0);

  const [mesRows] = await db.execute(
    sql`SELECT COUNT(*) as total FROM atendimentos WHERE DATE_FORMAT(data, '%Y-%m') = ${mesStr}`,
  );
  const atendimentosMes = Number((mesRows as any)[0]?.total ?? 0);

  const atendimentosPorStatusRows = await db
    .select({ status: atendimentos.status, total: sql<number>`COUNT(*)` })
    .from(atendimentos)
    .groupBy(atendimentos.status);

  const guiasPorStatusRows = await db
    .select({ status: guias.status, total: sql<number>`COUNT(*)` })
    .from(guias)
    .groupBy(guias.status);

  const [totalPacientesRows] = await db.execute(
    sql`SELECT COUNT(*) as total FROM pacientes`,
  );
  const totalPacientes = Number((totalPacientesRows as any)[0]?.total ?? 0);

  const recentesRows = await db.execute(
    sql`SELECT a.id, p.nome as paciente, c.nome as convenio, a.tipo, DATE_FORMAT(a.data, '%d/%m/%Y') as data, a.status
        FROM atendimentos a
        JOIN pacientes p ON a.pacienteId = p.id
        JOIN convenios c ON a.convenioId = c.id
        ORDER BY a.data DESC
        LIMIT 10`,
  );

  return {
    totalAtendimentos,
    atendimentosHoje,
    atendimentosMes,
    atendimentosPorStatus: atendimentosPorStatusRows.map(r => ({
      status: r.status,
      total: Number(r.total),
    })),
    guiasPorStatus: guiasPorStatusRows.map(r => ({
      status: r.status,
      total: Number(r.total),
    })),
    totalPacientes,
    atendimentosRecentes: ((recentesRows as any)[0] as any[]).map((r: any) => ({
      id: r.id,
      paciente: r.paciente,
      convenio: r.convenio,
      tipo: r.tipo ?? '-',
      data: r.data,
      status: r.status,
    })),
  };
}

// ─── Guia SADT por Atendimento ────────────────────────────────────────────────

/**
 * Busca a guia SADT mais recente de um paciente (para uso na Agenda).
 * Retorna a guia com todas as assinaturas já registadas (histórico de sessões).
 */
export async function getGuiaComSessoesPorPaciente(
  pacienteId: number,
  opcoes: { guiaId?: number; atendimentoId?: number; profissionalId?: number; atendimentoData?: string } = {},
) {
  const db = await getDb();
  if (!db) return null;

  const dataBruta = String(opcoes.atendimentoData ?? '');
  const partesBr = dataBruta.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dataAtendimento = partesBr
    ? `${partesBr[3]}-${partesBr[2]}-${partesBr[1]}`
    : dataBruta.slice(0, 10);
  const profissionalDoAtendimento = opcoes.profissionalId ?? (opcoes.atendimentoId
    ? (await db.select({ profissionalId: atendimentos.profissionalId })
      .from(atendimentos)
      .where(eq(atendimentos.id, opcoes.atendimentoId))
      .limit(1))[0]?.profissionalId
    : undefined);

  // Quando a Agenda fornece uma guia, ela é o vínculo documental obrigatório.
  // Nunca substituir por outra guia ou série do mesmo paciente, ainda que exista
  // uma assinatura para a mesma data clínica.
  let guiaRows: Array<{ guia: typeof guias.$inferSelect; profissional: typeof profissionais.$inferSelect; convenio: typeof convenios.$inferSelect }> = [];
  if (opcoes.guiaId) {
    guiaRows = await db
      .select({ guia: guias, profissional: profissionais, convenio: convenios })
      .from(guias)
      .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
      .innerJoin(convenios, eq(guias.convenioId, convenios.id))
      .where(and(eq(guias.id, opcoes.guiaId), eq(guias.pacienteId, pacienteId)))
      .limit(1);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataAtendimento)) {
    const condicoesAssinatura = [
      eq(assinaturasGuias.pacienteId, pacienteId),
      sql`${assinaturasGuias.assinaturaPacienteUrl} IS NOT NULL AND TRIM(${assinaturasGuias.assinaturaPacienteUrl}) != ''`,
      sql`JSON_CONTAINS(${assinaturasGuias.datasAtendimento}, JSON_ARRAY(${dataAtendimento}))`,
    ];
    if (profissionalDoAtendimento != null) condicoesAssinatura.push(eq(guias.profissionalId, profissionalDoAtendimento));
    guiaRows = await db
      .select({ guia: guias, profissional: profissionais, convenio: convenios })
      .from(assinaturasGuias)
      .innerJoin(guias, eq(assinaturasGuias.guiaId, guias.id))
      .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
      .innerJoin(convenios, eq(guias.convenioId, convenios.id))
      .where(and(...condicoesAssinatura))
      .orderBy(desc(assinaturasGuias.dataAssinatura))
      .limit(1);
  }

  if (guiaRows.length === 0) {
    // Sem assinatura para a data, abre a guia do próprio atendimento. A tela
    // permanece pendente e não reutiliza uma assinatura de outra sessão.
    const condicoesGuia = [eq(guias.pacienteId, pacienteId)];
    if (opcoes.guiaId) condicoesGuia.push(eq(guias.id, opcoes.guiaId));
    if (!opcoes.guiaId && opcoes.atendimentoId) condicoesGuia.push(eq(guias.atendimentoId, opcoes.atendimentoId));
    if (!opcoes.guiaId && profissionalDoAtendimento != null) condicoesGuia.push(eq(guias.profissionalId, profissionalDoAtendimento));
    guiaRows = await db
      .select({ guia: guias, profissional: profissionais, convenio: convenios })
      .from(guias)
      .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
      .innerJoin(convenios, eq(guias.convenioId, convenios.id))
      .where(and(...condicoesGuia))
      .orderBy(desc(guias.createdAt))
      .limit(1);
  }

  if (!guiaRows[0]) return null;

  const { guia, profissional, convenio } = guiaRows[0];

  // A listagem já considera imagem válida e a competência da própria guia.
  const assinaturas = await getAssinaturasGuia(guia.id);
  const proximaSessao = assinaturas.length + 1;

  return { guia, profissional, convenio, assinaturas, assinaturasHistoricas: [], proximaSessao };
}

/**
 * Registar assinatura de uma sessão na guia SADT.
 * Calcula automaticamente o número da próxima sessão.
 */
export async function registrarAssinaturaGuiaSessao(data: {
  guiaId: number;
  pacienteId: number;
  assinaturaPacienteUrl: string; // base64 da imagem da assinatura
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Contar sessões já existentes para determinar o número da próxima
  const sessoesExistentes = await db
    .select({ sessaoNumero: assinaturasGuias.sessaoNumero })
    .from(assinaturasGuias)
    .where(eq(assinaturasGuias.guiaId, data.guiaId));

  const guiasAssinadasAnteriores = await db
    .select({ id: guias.id })
    .from(guias)
    .where(and(eq(guias.pacienteId, data.pacienteId), eq(guias.assinadoPaciente, 1)));
  const quantidadeHistorica = guiasAssinadasAnteriores.filter(guia => guia.id !== data.guiaId).length;
  const proximaSessao = sessoesExistentes.length + quantidadeHistorica + 1;

  // Gerar hash SHA-256 para validação de autenticidade
  const { createHash } = await import('crypto');
  const hash = createHash('sha256').update(data.assinaturaPacienteUrl + data.guiaId + proximaSessao).digest('hex');

  // Inserir assinatura
  await db.insert(assinaturasGuias).values({
    guiaId: data.guiaId,
    pacienteId: data.pacienteId,
    assinaturaPacienteUrl: data.assinaturaPacienteUrl,
    hashAssinatura: hash,
    sessaoNumero: proximaSessao,
  });

    // Atualizar totalSessoes, marcar como assinado e promover para 'emitida' (pronta para pré-faturamento)
  await db.update(guias).set({
    totalSessoes: proximaSessao,
    assinadoPaciente: 1 as any,
    dataAssinaturaPaciente: new Date(),
    assinaturaPacienteUrl: data.assinaturaPacienteUrl,
    status: 'emitida' as any,
  }).where(eq(guias.id, data.guiaId));
  return { sessaoNumero: proximaSessao, hashAssinatura: hash };
}

/**
 * Exclui uma assinatura de sessão da guia SADT.
 * Após excluir, preserva os números originais para que cada assinatura continue
 * refletindo a posição real do atendimento na série.
 */
export async function excluirAssinaturaGuia(assinaturaId: number, guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // A operação é intencionalmente sequencial: em produção, a transação aberta
  // durante a atualização da tela podia manter a requisição pendente. Cada etapa
  // é idempotente e limitada à guia/assinatura confirmadas pelo usuário.
  const tx = db;
    const [assinatura] = await tx
      .select({
        id: assinaturasGuias.id,
        guiaId: assinaturasGuias.guiaId,
        pacienteId: assinaturasGuias.pacienteId,
        hashAssinatura: assinaturasGuias.hashAssinatura,
        datasAtendimento: assinaturasGuias.datasAtendimento,
      })
      .from(assinaturasGuias)
      .where(and(eq(assinaturasGuias.id, assinaturaId), eq(assinaturasGuias.guiaId, guiaId)))
      .limit(1);

    if (!assinatura) throw new Error("Assinatura não encontrada nesta guia");

    // A assinatura SADT assinada cria uma cópia legada para o histórico da guia.
    // Remover somente a cópia deixava a mesma evidência reaparecer na tela após o refetch.
    const dataLegada = (() => {
      try {
        const datas = JSON.parse(assinatura.datasAtendimento || '[]');
        return Array.isArray(datas) ? String(datas[0] || '').slice(0, 10) : '';
      } catch {
        return '';
      }
    })();
    if (assinatura.hashAssinatura) {
      const candidatasSadt = await tx
        .select({ id: assinaturasSadt.id, dataSessao: assinaturasSadt.dataSessao })
        .from(assinaturasSadt)
        .where(and(
          eq(assinaturasSadt.guiaId, guiaId),
          eq(assinaturasSadt.pacienteId, assinatura.pacienteId),
          eq(assinaturasSadt.assinaturaHash, assinatura.hashAssinatura),
        ));
      const idsSadtDaMesmaData = candidatasSadt
        .filter(item => {
          const dataSadt = item.dataSessao instanceof Date
            ? item.dataSessao.toISOString().slice(0, 10)
            : String(item.dataSessao).slice(0, 10);
          return !dataLegada || dataSadt === dataLegada;
        })
        .map(item => item.id);
      if (idsSadtDaMesmaData.length > 0) {
        await tx.delete(assinaturasSadt).where(inArray(assinaturasSadt.id, idsSadtDaMesmaData));
      }
    }

    await tx.delete(assinaturasGuias).where(and(eq(assinaturasGuias.id, assinaturaId), eq(assinaturasGuias.guiaId, guiaId)));

    // Buscar assinaturas restantes ordenadas por sessaoNumero
    const restantes = await tx
      .select()
      .from(assinaturasGuias)
      .where(eq(assinaturasGuias.guiaId, guiaId))
      .orderBy(assinaturasGuias.sessaoNumero);

    // Links ainda pendentes não compõem o histórico nem o saldo de sessões assinadas.
    const comprovantesRestantes = restantes.filter(item => temComprovanteAssinatura(item.assinaturaPacienteUrl));

    // Atualizar totalSessoes na guia e, se não houver mais assinaturas, limpar campos e voltar para rascunho
    if (comprovantesRestantes.length === 0) {
      await tx.update(guias).set({
        totalSessoes: 0,
        assinadoPaciente: 0 as any,
        dataAssinaturaPaciente: null,
        assinaturaPacienteUrl: null,
        status: 'rascunho' as any,
      }).where(eq(guias.id, guiaId));
    } else {
      const ultima = comprovantesRestantes[comprovantesRestantes.length - 1];
      await tx.update(guias).set({
        totalSessoes: comprovantesRestantes.length,
        assinadoPaciente: 1 as any,
        dataAssinaturaPaciente: ultima.dataAssinatura,
        assinaturaPacienteUrl: ultima.assinaturaPacienteUrl,
      }).where(eq(guias.id, guiaId));
    }

  return { ok: true, totalSessoes: comprovantesRestantes.length };
}

/**
 * Cria uma cópia administrativa de uma assinatura para outra data da mesma guia/série.
 * A cópia exige confirmação no cliente, preserva a evidência original e é auditada pelo router.
 */
export async function duplicarAssinaturaGuiaParaData(input: {
  assinaturaId: number;
  guiaId: number;
  origem: 'legada' | 'sadt';
  novaDataSessao: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.novaDataSessao)) {
    throw new Error("Data de destino inválida");
  }

  return db.transaction(async (tx) => {
    const [guia] = await tx
      .select({
        id: guias.id,
        pacienteId: guias.pacienteId,
        profissionalId: guias.profissionalId,
        convenioId: guias.convenioId,
        serieId: guias.serieId,
        atendimentoId: guias.atendimentoId,
        procedimento: guias.procedimento,
        totalSessoes: guias.totalSessoes,
      })
      .from(guias)
      .where(eq(guias.id, input.guiaId))
      .limit(1);
    if (!guia) throw new Error("Guia não encontrada");

    const [atendimentoBase] = guia.atendimentoId
      ? await tx.select({ serieId: atendimentos.serieId, data: atendimentos.data }).from(atendimentos).where(eq(atendimentos.id, guia.atendimentoId)).limit(1)
      : [];
    const serieId = guia.serieId || atendimentoBase?.serieId;
    const sessoesDaSerie = serieId
      ? await tx.select({ id: atendimentos.id, data: atendimentos.data }).from(atendimentos).where(and(
          eq(atendimentos.pacienteId, guia.pacienteId),
          eq(atendimentos.profissionalId, guia.profissionalId),
          eq(atendimentos.convenioId, guia.convenioId),
          eq(atendimentos.serieId, serieId),
        ))
      : atendimentoBase
        ? [{ id: guia.atendimentoId!, data: atendimentoBase.data }]
        : [];
    const sessaoDestino = sessoesDaSerie.find(sessao => {
      const data = sessao.data instanceof Date ? sessao.data.toISOString().slice(0, 10) : String(sessao.data).slice(0, 10);
      return data === input.novaDataSessao;
    });
    if (!sessaoDestino) throw new Error("A data escolhida não pertence à mesma série desta guia");

    const assinaturasLegadas = await tx.select().from(assinaturasGuias).where(eq(assinaturasGuias.guiaId, input.guiaId));
    const assinaturasSadtDaGuia = await tx.select().from(assinaturasSadt).where(eq(assinaturasSadt.guiaId, input.guiaId));
    const dataJaAssinada = [
      ...assinaturasLegadas.filter(item => temComprovanteAssinatura(item.assinaturaPacienteUrl)).flatMap(item => {
        try { return JSON.parse(item.datasAtendimento || '[]') as string[]; } catch { return []; }
      }),
      ...assinaturasSadtDaGuia
        .filter(item => item.status === 'assinado' && temComprovanteAssinatura(item.assinaturaDataUrl))
        .map(item => item.dataSessao instanceof Date ? item.dataSessao.toISOString().slice(0, 10) : String(item.dataSessao).slice(0, 10)),
    ].some(data => String(data).slice(0, 10) === input.novaDataSessao);
    if (dataJaAssinada) throw new Error("Já existe uma assinatura nesta data para esta guia");

    const fonteLegada = input.origem === 'legada'
      ? assinaturasLegadas.find(item => item.id === input.assinaturaId)
      : undefined;
    const fonteSadt = input.origem === 'sadt'
      ? assinaturasSadtDaGuia.find(item => item.id === input.assinaturaId && item.status === 'assinado')
      : undefined;
    const assinaturaPacienteUrl = fonteLegada?.assinaturaPacienteUrl || fonteSadt?.assinaturaDataUrl;
    if (!temComprovanteAssinatura(assinaturaPacienteUrl)) throw new Error("A assinatura de origem não possui comprovante válido");

    const maiorSessao = Math.max(0, ...assinaturasLegadas.map(item => item.sessaoNumero || 0), ...assinaturasSadtDaGuia.map(item => item.numeroSessao || 0));
    const numeroSessao = maiorSessao + 1;
    const hashAssinatura = crypto.createHash('sha256')
      .update(`${assinaturaPacienteUrl}|duplicada|${input.assinaturaId}|${input.novaDataSessao}|${Date.now()}`)
      .digest('hex');
    const dataAssinatura = fonteLegada?.dataAssinatura || fonteSadt?.dataAssinatura || new Date();

    if (fonteSadt) {
      const [paciente] = await tx.select({ nome: pacientes.nome, cpf: pacientes.cpf, whatsapp: pacientes.whatsapp }).from(pacientes).where(eq(pacientes.id, guia.pacienteId)).limit(1);
      await tx.insert(assinaturasSadt).values({
        guiaId: input.guiaId,
        pacienteId: guia.pacienteId,
        profissionalId: guia.profissionalId,
        atendimentoId: sessaoDestino.id,
        numeroSessao,
        dataSessao: input.novaDataSessao as any,
        procedimento: fonteSadt.procedimento || guia.procedimento,
        pacienteNome: paciente?.nome || fonteSadt.pacienteNome,
        pacienteCpf: paciente?.cpf || fonteSadt.pacienteCpf,
        pacienteWhatsapp: paciente?.whatsapp || fonteSadt.pacienteWhatsapp,
        token: crypto.randomBytes(48).toString('hex'),
        tokenExpiresAt: new Date(),
        status: 'assinado',
        assinaturaDataUrl: assinaturaPacienteUrl,
        assinaturaHash: hashAssinatura,
        dataAssinatura,
        whatsappEnviado: 0,
      });
    }

    await tx.insert(assinaturasGuias).values({
      guiaId: input.guiaId,
      pacienteId: guia.pacienteId,
      assinaturaPacienteUrl,
      hashAssinatura,
      dataAssinatura,
      sessaoNumero: numeroSessao,
      datasAtendimento: JSON.stringify([input.novaDataSessao]),
    });
    await tx.update(guias).set({
      totalSessoes: Math.max(Number(guia.totalSessoes || 0), numeroSessao),
      assinadoPaciente: 1 as any,
      dataAssinaturaPaciente: dataAssinatura,
      assinaturaPacienteUrl,
      status: 'emitida' as any,
    }).where(eq(guias.id, input.guiaId));

    return { ok: true, guiaId: input.guiaId, numeroSessao, novaDataSessao: input.novaDataSessao, origem: input.origem };
  });
}

/**
 * Exclui uma assinatura SADT pela sua própria origem e remove apenas a
 * representação legada que possui o mesmo hash. A guia é recalculada com base
 * na fonte SADT restante; a operação é protegida pelo guiaId recebido.
 */
export async function excluirAssinaturaSadt(assinaturaId: number, guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Evita manter uma transação aberta enquanto remove a fonte SADT e seu espelho
  // legada. A guia é recalculada somente com as provas restantes desta própria guia.
  const tx = db;
    const [assinatura] = await tx
      .select({
        guiaId: assinaturasSadt.guiaId,
        pacienteId: assinaturasSadt.pacienteId,
        assinaturaHash: assinaturasSadt.assinaturaHash,
      })
      .from(assinaturasSadt)
      .where(and(eq(assinaturasSadt.id, assinaturaId), eq(assinaturasSadt.guiaId, guiaId)))
      .limit(1);

    if (!assinatura) throw new Error("Assinatura SADT não encontrada nesta guia");

    await tx
      .delete(assinaturasSadt)
      .where(and(eq(assinaturasSadt.id, assinaturaId), eq(assinaturasSadt.guiaId, guiaId)));

    if (assinatura.assinaturaHash) {
      await tx
        .delete(assinaturasGuias)
        .where(and(
          eq(assinaturasGuias.guiaId, guiaId),
          eq(assinaturasGuias.pacienteId, assinatura.pacienteId),
          eq(assinaturasGuias.hashAssinatura, assinatura.assinaturaHash),
        ));
    }

    const sadtRestantes = (await tx
      .select({ dataAssinatura: assinaturasSadt.dataAssinatura, assinaturaDataUrl: assinaturasSadt.assinaturaDataUrl })
      .from(assinaturasSadt)
      .where(and(eq(assinaturasSadt.guiaId, guiaId), eq(assinaturasSadt.status, 'assinado'))))
      .filter(item => temComprovanteAssinatura(item.assinaturaDataUrl));

    const legadasRestantes = (await tx
      .select({ dataAssinatura: assinaturasGuias.dataAssinatura, assinaturaPacienteUrl: assinaturasGuias.assinaturaPacienteUrl })
      .from(assinaturasGuias)
      .where(eq(assinaturasGuias.guiaId, guiaId)))
      .filter(item => temComprovanteAssinatura(item.assinaturaPacienteUrl));

    const restantes = sadtRestantes.length > 0 ? sadtRestantes : legadasRestantes;
    const ultima = [...restantes].sort((a, b) => {
      const dataA = a.dataAssinatura ? new Date(a.dataAssinatura).getTime() : 0;
      const dataB = b.dataAssinatura ? new Date(b.dataAssinatura).getTime() : 0;
      return dataB - dataA;
    })[0];

    if (!ultima) {
      await tx.update(guias).set({
        totalSessoes: 0,
        assinadoPaciente: 0 as any,
        dataAssinaturaPaciente: null,
        assinaturaPacienteUrl: null,
        status: 'rascunho' as any,
      }).where(eq(guias.id, guiaId));
    } else {
      await tx.update(guias).set({
        totalSessoes: restantes.length,
        assinadoPaciente: 1 as any,
        dataAssinaturaPaciente: ultima.dataAssinatura,
        assinaturaPacienteUrl: (ultima as any).assinaturaDataUrl ?? (ultima as any).assinaturaPacienteUrl,
      }).where(eq(guias.id, guiaId));
    }

  return { ok: true, totalSessoes: restantes.length };
}

export async function editarDataAssinaturaGuia(assinaturaId: number, novaData: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assinaturasGuias)
    .set({ dataAssinatura: novaData })
    .where(eq(assinaturasGuias.id, assinaturaId));
  return { success: true };
}

/**
 * Corrige a data clínica do procedimento em série, sem modificar a data/hora,
 * imagem ou hash que comprovam quando o paciente assinou.
 */
export async function editarDataSessaoAssinaturaGuia(assinaturaId: number, novaDataSessao: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [assinatura] = await db
    .select({ datasAtendimento: assinaturasGuias.datasAtendimento })
    .from(assinaturasGuias)
    .where(eq(assinaturasGuias.id, assinaturaId))
    .limit(1);

  if (!assinatura) throw new Error("Assinatura não encontrada");

  await db.update(assinaturasGuias)
    .set({ datasAtendimento: atualizarPrimeiraDataAtendimentoDaAssinatura(assinatura.datasAtendimento, novaDataSessao) })
    .where(eq(assinaturasGuias.id, assinaturaId));

  return { success: true };
}

/**
 * Corrige a data clínica da assinatura SADT sem alterar desenho, hash, IP ou
 * data/hora em que o paciente assinou. Quando existir a cópia de apresentação
 * em assinaturasGuias, ela é mantida na mesma data clínica.
 */
export async function editarDataSessaoAssinaturaSadt(assinaturaId: number, novaDataSessao: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.transaction(async (tx) => {
    const [assinatura] = await tx
      .select({
        guiaId: assinaturasSadt.guiaId,
        pacienteId: assinaturasSadt.pacienteId,
        numeroSessao: assinaturasSadt.numeroSessao,
        assinaturaHash: assinaturasSadt.assinaturaHash,
        status: assinaturasSadt.status,
      })
      .from(assinaturasSadt)
      .where(eq(assinaturasSadt.id, assinaturaId))
      .limit(1);

    if (!assinatura) throw new Error("Assinatura não encontrada");
    if (assinatura.status !== 'assinado') throw new Error("Somente assinaturas concluídas podem ter a data clínica corrigida");

    await tx
      .update(assinaturasSadt)
      .set({ dataSessao: novaDataSessao as unknown as Date })
      .where(eq(assinaturasSadt.id, assinaturaId));

    // A cópia em assinaturasGuias é apenas a representação administrativa da
    // mesma prova. O hash garante que nenhuma assinatura de outra sessão seja
    // deslocada junto com esta correção de data.
    if (assinatura.guiaId != null && assinatura.assinaturaHash) {
      await tx
        .update(assinaturasGuias)
        .set({ datasAtendimento: JSON.stringify([novaDataSessao]) })
        .where(and(
          eq(assinaturasGuias.guiaId, assinatura.guiaId),
          eq(assinaturasGuias.pacienteId, assinatura.pacienteId),
          eq(assinaturasGuias.sessaoNumero, assinatura.numeroSessao),
          eq(assinaturasGuias.hashAssinatura, assinatura.assinaturaHash),
        ));
    }
  });

  return { success: true };
}

/**
 * Assinaturas antigas foram persistidas diretamente na guia. Mantemos a mesma
 * capacidade de correção administrativa sem apagar dados de faturamento da guia.
 */
export async function editarDataAssinaturaHistoricaGuia(guiaId: number, novaData: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(guias)
    .set({ dataAssinaturaPaciente: novaData })
    .where(eq(guias.id, guiaId));
  return { success: true };
}

export async function excluirAssinaturaHistoricaGuia(guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(guias)
    .set({
      assinadoPaciente: 0 as any,
      dataAssinaturaPaciente: null,
      assinaturaPacienteUrl: null,
    })
    .where(eq(guias.id, guiaId));
  return { ok: true };
}

// ─── Anamnese ────────────────────────────────────────────────────────────────
export async function getAnamnesePorPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return null;
  const { anamneses } = await import('../drizzle/schema');
  const result = await db.select().from(anamneses).where(eq(anamneses.pacienteId, pacienteId)).limit(1);
  return result[0] || null;
}

export async function upsertAnamnese(pacienteId: number, data: {
  profissionalId?: number;
  queixaPrincipal?: string;
  historiaDoenca?: string;
  historiaFamiliar?: string;
  historiaSocial?: string;
  antecedentesPatologicos?: string;
  medicamentosEmUso?: string;
  alergias?: string;
  cirurgiasAnteriores?: string;
  habitos?: string;
  observacoes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { anamneses } = await import('../drizzle/schema');
  const existing = await getAnamnesePorPaciente(pacienteId);
  if (existing) {
    await db.update(anamneses).set({ ...data }).where(eq(anamneses.pacienteId, pacienteId));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(anamneses).values({ pacienteId, ...data });
    return { id: (result as any).insertId, pacienteId, ...data };
  }
}

export async function gerarTokenPreenchimentoAnamnese(pacienteId: number, profissionalId?: number | null) {
  const banco = await getDb();
  if (!banco) throw new Error("Database not available");
  const { anamneses } = await import('../drizzle/schema');
  const { randomUUID } = await import('crypto');
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const existente = await getAnamnesePorPaciente(pacienteId);

  if (existente) {
    await banco.update(anamneses)
      .set({ tokenPreenchimento: token, tokenPreenchimentoExpiresAt: expiresAt, preenchidaPeloPaciente: 0 } as any)
      .where(eq(anamneses.id, existente.id));
  } else {
    await banco.insert(anamneses).values({
      pacienteId,
      profissionalId: profissionalId ?? null,
      tokenPreenchimento: token,
      tokenPreenchimentoExpiresAt: expiresAt,
      preenchidaPeloPaciente: 0,
    } as any);
  }
  return { token, expiresAt };
}

export async function getAnamnesePublicaPorToken(token: string) {
  const banco = await getDb();
  if (!banco) return null;
  const { anamneses, pacientes } = await import('../drizzle/schema');
  const resultado = await banco.select({
    id: anamneses.id,
    pacienteNome: pacientes.nome,
    tokenPreenchimentoExpiresAt: (anamneses as any).tokenPreenchimentoExpiresAt,
    preenchidaPeloPaciente: (anamneses as any).preenchidaPeloPaciente,
  })
    .from(anamneses)
    .innerJoin(pacientes, eq(anamneses.pacienteId, pacientes.id))
    .where(eq((anamneses as any).tokenPreenchimento, token))
    .limit(1);
  const anamnese = resultado[0];
  if (!anamnese) return null;
  if (anamnese.tokenPreenchimentoExpiresAt && new Date(anamnese.tokenPreenchimentoExpiresAt) < new Date()) return null;
  if (Number(anamnese.preenchidaPeloPaciente) === 1) return null;
  return anamnese;
}

export async function preencherAnamnesePorToken(token: string, data: {
  queixaPrincipal: string;
  historiaDoenca?: string;
  historiaFamiliar?: string;
  historiaSocial?: string;
  antecedentesPatologicos?: string;
  medicamentosEmUso?: string;
  alergias?: string;
  cirurgiasAnteriores?: string;
  habitos?: string;
  observacoes?: string;
}) {
  const banco = await getDb();
  if (!banco) throw new Error("Database not available");
  const anamnese = await getAnamnesePublicaPorToken(token);
  if (!anamnese) throw new Error('Link inválido, expirado ou já utilizado');
  const { anamneses } = await import('../drizzle/schema');
  await banco.update(anamneses).set({
    ...data,
    preenchidaPeloPaciente: 1,
    dataPreenchimentoPaciente: new Date(),
    tokenPreenchimento: null,
    tokenPreenchimentoExpiresAt: null,
  } as any).where(eq(anamneses.id, anamnese.id));
  return { success: true, pacienteNome: anamnese.pacienteNome };
}

export async function registrarEnvioWhatsappAnamnese(pacienteId: number) {
  const banco = await getDb();
  if (!banco) throw new Error("Database not available");
  const { anamneses } = await import('../drizzle/schema');
  await banco.update(anamneses).set({ dataEnvioWhatsapp: new Date() } as any)
    .where(eq(anamneses.pacienteId, pacienteId));
}

export async function listarPacientesElegiveisParaEnvioAnamnese(profissionalId: number, convenioId: number): Promise<PacienteElegivelEnvioAnamnese[]> {
  const banco = await getDb();
  if (!banco) return [];
  const linhas = await banco.select({
    pacienteId: pacientes.id,
    nome: pacientes.nome,
    whatsapp: pacientes.whatsapp,
    telefone: pacientes.telefone,
  })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .where(and(
      eq(atendimentos.profissionalId, profissionalId),
      eq(atendimentos.convenioId, convenioId),
    ));

  return consolidarPacientesElegiveisAnamnese(linhas);
}

// ─── Contrato Terapêutico ─────────────────────────────────────────────────────
export async function getContratosTerapeuticosPorPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(contratosTerapêuticos)
    .where(eq(contratosTerapêuticos.pacienteId, pacienteId))
    .orderBy(contratosTerapêuticos.createdAt);
}

export async function updateContratoTerapeuticoStatus(id: number, data: {
  conteudo?: string;
  assinado?: number;
  dataAssinatura?: Date;
  assinaturaPacienteUrl?: string;
  hashAssinatura?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contratosTerapêuticos).set(data as any).where(eq(contratosTerapêuticos.id, id));
  return { success: true };
}

export async function getContratoTerapeuticoById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contratosTerapêuticos).where(eq(contratosTerapêuticos.id, id)).limit(1);
  return rows[0] || null;
}

export async function gerarTokenAssinatura(contratoId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { randomUUID } = await import('crypto');
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  // Token válido por 7 dias
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.update(contratosTerapêuticos)
    .set({ tokenAssinatura: token, tokenExpiresAt: expiresAt } as any)
    .where(eq(contratosTerapêuticos.id, contratoId));
  return token;
}

export async function getContratoByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(contratosTerapêuticos)
    .where(eq(contratosTerapêuticos.tokenAssinatura as any, token))
    .limit(1);
  return rows[0] || null;
}

export async function assinarContratoByToken(token: string, assinaturaPacienteUrl: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const contrato = await getContratoByToken(token);
  if (!contrato) throw new Error("Contrato não encontrado");
  if ((contrato as any).assinado) throw new Error("Contrato já assinado");
  const expiresAt = (contrato as any).tokenExpiresAt;
  if (expiresAt && new Date(expiresAt) < new Date()) throw new Error("Link de assinatura expirado");
  const { createHash } = await import('crypto');
  const hash = createHash('sha256').update(assinaturaPacienteUrl + token + Date.now()).digest('hex');
  await db.update(contratosTerapêuticos)
    .set({
      assinado: 1,
      dataAssinatura: new Date(),
      assinaturaPacienteUrl,
      hashAssinatura: hash,
    } as any)
    .where(eq(contratosTerapêuticos.id, contrato.id));
  return { success: true, contratoId: contrato.id };
}

// ─── Token de Confirmação de Atendimento (via WhatsApp) ──────────────────────
/**
 * Gera um token UUID persistido na BD para confirmação de atendimento via WhatsApp.
 * Válido por 48 horas.
 */
export async function gerarTokenConfirmacaoAtendimento(atendimentoId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { randomUUID } = await import('crypto');
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  // Token válido por 24 horas
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.update(atendimentos)
    .set({ confirmacaoToken: token, confirmacaoTokenExpiresAt: expiresAt, confirmacaoStatus: 'pendente' } as any)
    .where(eq(atendimentos.id, atendimentoId));
  return token;
}
/**
 * Busca atendimento pelo token de confirmação (para página pública).
 * Retorna null se o token não existir ou estiver expirado (> 24h).
 */
export async function getAtendimentoByConfirmacaoToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: atendimentos.id,
      data: atendimentos.data,
      hora: atendimentos.hora,
      tipo: atendimentos.tipo,
      status: atendimentos.status,
      confirmacaoStatus: (atendimentos as any).confirmacaoStatus,
      confirmacaoTokenExpiresAt: (atendimentos as any).confirmacaoTokenExpiresAt,
      pacienteNome: pacientes.nome,
      pacienteWhatsapp: pacientes.whatsapp,
      profissionalNome: profissionais.nome,
      profissionalEspecialidade: profissionais.especialidade,
      convenioNome: convenios.nome,
    })
    .from(atendimentos)
    .innerJoin(pacientes, eq(atendimentos.pacienteId, pacientes.id))
    .innerJoin(profissionais, eq(atendimentos.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(atendimentos.convenioId, convenios.id))
    .where(eq((atendimentos as any).confirmacaoToken, token))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  // Verificar expiração: se expiresAt existir e já tiver passado, retornar null
  if (row.confirmacaoTokenExpiresAt && new Date(row.confirmacaoTokenExpiresAt) < new Date()) {
    return null; // Link expirado
  }
  return row;
}

/**
 * Confirma ou cancela o atendimento pelo token de confirmação.
 */
export async function confirmarAtendimentoPorToken(token: string, acao: 'confirmado' | 'cancelado') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const atendimento = await getAtendimentoByConfirmacaoToken(token);
  if (!atendimento) throw new Error("Atendimento não encontrado");
  await db.update(atendimentos)
    .set({ confirmacaoStatus: acao } as any)
    .where(eq((atendimentos as any).confirmacaoToken, token));
  return { success: true, acao };
}

// ─── Token de Assinatura de Guia SADT (via WhatsApp) ─────────────────────────
/**
 * Gera um token UUID para o paciente assinar a sessão da guia SADT via WhatsApp.
 * Cria um registo em assinaturasGuias com o token.
 * Válido por 48 horas.
 */
export async function gerarTokenAssinaturaGuia(
  guiaId: number,
  pacienteId: number,
  datasAtendimento?: string[],
): Promise<{ token: string; assinaturaId: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { randomUUID } = await import('crypto');
  const token = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const [guia] = await db.select({ serieId: guias.serieId, serieSessaoInicio: guias.serieSessaoInicio })
    .from(guias)
    .where(eq(guias.id, guiaId))
    .limit(1);
  const primeiraData = datasAtendimento?.slice().sort()[0];
  let proximaSessao = 1;
  if (guia?.serieId && primeiraData) {
    const dataReferencia = new Date(`${primeiraData}T12:00:00`);
    const anteriores = await db.select({ total: sql<number>`count(*)` })
      .from(atendimentos)
      .where(and(
        eq(atendimentos.serieId, guia.serieId),
        sql`${atendimentos.status} <> 'cancelado'`,
        lt(atendimentos.data, dataReferencia),
      ));
    proximaSessao = (Number(guia.serieSessaoInicio) || 1) + Number(anteriores[0]?.total || 0);
  }

  // Inserir registo com token (sem assinatura ainda)
  const [result] = await db.insert(assinaturasGuias).values({
    guiaId,
    pacienteId,
    assinaturaPacienteUrl: '',
    sessaoNumero: proximaSessao,
    token: token,
    tokenExpiresAt: expiresAt,
    datasAtendimento: datasAtendimento && datasAtendimento.length > 0
      ? JSON.stringify(datasAtendimento)
      : null,
  } as any);
  const assinaturaId = (result as any).insertId;
  return { token, assinaturaId };
}

/**
 * Busca assinatura de guia pelo token (para página pública).
 */
export async function getAssinaturaGuiaByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select({
      id: assinaturasGuias.id,
      guiaId: assinaturasGuias.guiaId,
      pacienteId: assinaturasGuias.pacienteId,
      sessaoNumero: assinaturasGuias.sessaoNumero,
      assinaturaPacienteUrl: assinaturasGuias.assinaturaPacienteUrl,
      dataAssinatura: assinaturasGuias.dataAssinatura,
      tokenExpiresAt: (assinaturasGuias as any).tokenExpiresAt,
      datasAtendimento: (assinaturasGuias as any).datasAtendimento,
      pacienteNome: pacientes.nome,
      profissionalNome: profissionais.nome,
      profissionalEspecialidade: profissionais.especialidade,
      convenioNome: convenios.nome,
      guiaNumero: guias.numeroGuia,
      guiaProcedimento: guias.procedimento,
      dataAtendimento: atendimentos.data,
      horaAtendimento: atendimentos.hora,
    })
    .from(assinaturasGuias)
    .innerJoin(pacientes, eq(assinaturasGuias.pacienteId, pacientes.id))
    .innerJoin(guias, eq(assinaturasGuias.guiaId, guias.id))
    .innerJoin(profissionais, eq(guias.profissionalId, profissionais.id))
    .innerJoin(convenios, eq(guias.convenioId, convenios.id))
    .leftJoin(atendimentos, eq(guias.atendimentoId, atendimentos.id))
    .where(eq(assinaturasGuias.token, token))
    .limit(1);
  if (!rows[0]) return null;
  // Buscar nome da clínica (dadosPrestador) separadamente
  const prestador = await getDadosPrestador();
  return {
    ...rows[0],
    nomeClinica: prestador?.nomeFantasia || prestador?.razaoSocial || null,
  };
}

/**
 * Paciente assina a sessão da guia SADT pelo token (página pública).
 * Se o link contiver múltiplas datas (datasAtendimento), cria uma assinatura por data.
 */
export async function assinarGuiaPorToken(token: string, assinaturaPacienteUrl: string, assinaturasPorSessao?: string[]) {
  const conn = await getDb();
  if (!conn) throw new Error("Database not available");
  const assinatura = await getAssinaturaGuiaByToken(token);
  if (!assinatura) throw new Error("Sessão não encontrada");
  if (assinatura.assinaturaPacienteUrl && assinatura.assinaturaPacienteUrl.length > 10) {
    throw new Error("Esta sessão já foi assinada");
  }
  const expiresAt = (assinatura as any).tokenExpiresAt;
  if (expiresAt && new Date(expiresAt) < new Date()) throw new Error("Link de assinatura expirado");

  const { createHash } = await import('crypto');
  const agora = new Date();
  const agoraStr = agora.toISOString().slice(0, 19).replace('T', ' ');

  // Parsear datas de atendimento incluídas no link
  let datasAtend: string[] = [];
  if ((assinatura as any).datasAtendimento) {
    try { datasAtend = JSON.parse((assinatura as any).datasAtendimento); } catch {}
  }

  // Usar mysql2 directamente para evitar problemas com o ORM
  const { createConnection } = await import('mysql2/promise');
  const rawConn = await createConnection(process.env.DATABASE_URL!);

  try {
    // O token já recebe o número real da sessão quando é criado. Nunca renumerar pela
    // quantidade de assinaturas, pois isso faria a 2ª/3ª sessão voltar a aparecer como 1ª.
    const baseNumeroSessao = Math.max(1, Number(assinatura.sessaoNumero) || 1);

    if (datasAtend.length <= 1) {
      // Caso simples: 0 ou 1 data — actualizar o registo existente
      const hash = createHash('sha256').update(assinaturaPacienteUrl + token + agora.getTime()).digest('hex');
      const datasJson = datasAtend.length === 1 ? JSON.stringify(datasAtend) : null;
      await rawConn.execute(
        `UPDATE assinaturasGuias SET assinaturaPacienteUrl=?, hashAssinatura=?, dataAssinatura=?, sessaoNumero=?, datasAtendimento=? WHERE id=?`,
        [assinaturaPacienteUrl, hash, agoraStr, baseNumeroSessao, datasJson, assinatura.id]
      );
      await rawConn.execute(
        `UPDATE guias SET totalSessoes=?, assinadoPaciente=1, dataAssinaturaPaciente=?, assinaturaPacienteUrl=?, status='emitida' WHERE id=?`,
        [baseNumeroSessao, agoraStr, assinaturaPacienteUrl, assinatura.guiaId]
      );
      return { success: true, sessaoNumero: baseNumeroSessao, sessoesCreadas: 1, hashAssinatura: hash };
    }

    // Múltiplas datas: actualizar o registo original com a 1ª data e inserir registos adicionais
    // Se assinaturasPorSessao for fornecido, usar a assinatura individual de cada sessão
    for (let i = 0; i < datasAtend.length; i++) {
      const numeroSessao = baseNumeroSessao + i;
      // Usar assinatura individual se disponível, senão usar a assinatura principal
      const assinaturaDestaSessao = (assinaturasPorSessao && assinaturasPorSessao[i])
        ? assinaturasPorSessao[i]
        : assinaturaPacienteUrl;
      const hash = createHash('sha256').update(assinaturaDestaSessao + token + datasAtend[i] + i).digest('hex');
      const datasJson = JSON.stringify([datasAtend[i]]);

      if (i === 0) {
        // Actualizar o registo original (criado ao gerar o token)
        await rawConn.execute(
          `UPDATE assinaturasGuias SET assinaturaPacienteUrl=?, hashAssinatura=?, dataAssinatura=?, sessaoNumero=?, datasAtendimento=? WHERE id=?`,
          [assinaturaDestaSessao, hash, agoraStr, numeroSessao, datasJson, assinatura.id]
        );
      } else {
        // Inserir registo adicional para cada data extra
        await rawConn.execute(
          `INSERT INTO assinaturasGuias (guiaId, pacienteId, assinaturaPacienteUrl, hashAssinatura, dataAssinatura, sessaoNumero, datasAtendimento, token, tokenExpiresAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [assinatura.guiaId, assinatura.pacienteId, assinaturaDestaSessao, hash, agoraStr, numeroSessao, datasJson, agoraStr]
        );
      }
    }

    const ultimaSessao = baseNumeroSessao + datasAtend.length - 1;
    // Para a guia, guardar a assinatura da última sessão (ou a principal)
    const assinaturaParaGuia = (assinaturasPorSessao && assinaturasPorSessao[datasAtend.length - 1])
      ? assinaturasPorSessao[datasAtend.length - 1]
      : assinaturaPacienteUrl;
    await rawConn.execute(
      `UPDATE guias SET totalSessoes=?, assinadoPaciente=1, dataAssinaturaPaciente=?, assinaturaPacienteUrl=?, status='emitida' WHERE id=?`,
      [ultimaSessao, agoraStr, assinaturaParaGuia, assinatura.guiaId]
    );

    return { success: true, sessaoNumero: ultimaSessao, sessoesCreadas: datasAtend.length };
  } finally {
    await rawConn.end();
  }
}

// Buscar atendimentos do dia seguinte para lembrete automático
export async function getAtendimentosAmanha() {
  const db = await getDb();
  if (!db) return [];
  const { sql: sqlFn } = await import("drizzle-orm");
  const rows = await db
    .select({
      id: atendimentos.id,
      pacienteId: atendimentos.pacienteId,
      profissionalId: atendimentos.profissionalId,
      data: atendimentos.data,
      hora: atendimentos.hora,
      tipo: atendimentos.tipo,
      confirmacaoToken: atendimentos.confirmacaoToken,
      confirmacaoTokenExpiresAt: atendimentos.confirmacaoTokenExpiresAt,
      confirmacaoStatus: atendimentos.confirmacaoStatus,
      lembreteEnviado: atendimentos.lembreteEnviado,
    })
    .from(atendimentos)
    .where(
      sqlFn`DATE(${atendimentos.data}) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
        AND ${atendimentos.status} = 'agendado'
        AND ${atendimentos.lembreteEnviado} = 0`
    );
  return rows;
}

// ─── Assinaturas SADT ────────────────────────────────────────────────────────

export async function criarAssinaturaSadt(data: InsertAssinaturaSadt) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  const [result] = await db.insert(assinaturasSadt).values(data);
  return result;
}

export async function getAssinaturaPorToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  const [row] = await db.select().from(assinaturasSadt).where(eq(assinaturasSadt.token, token)).limit(1);
  return row ?? null;
}

export async function getAssinaturasPorGuia(guiaId: number) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  return db.select().from(assinaturasSadt).where(eq(assinaturasSadt.guiaId, guiaId)).orderBy(desc(assinaturasSadt.createdAt));
}

export async function getAssinaturasPorPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  return db.select().from(assinaturasSadt).where(eq(assinaturasSadt.pacienteId, pacienteId)).orderBy(desc(assinaturasSadt.createdAt));
}

export async function registarAssinatura(token: string, assinaturaDataUrl: string, ip: string, userAgent: string) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  // Calcular hash SHA-256 da assinatura
  const hash = crypto.createHash('sha256').update(assinaturaDataUrl).digest('hex');
  await db.update(assinaturasSadt).set({
    status: 'assinado',
    assinaturaDataUrl,
    assinaturaHash: hash,
    ipAssinatura: ip,
    userAgentAssinatura: userAgent,
    dataAssinatura: new Date(),
  }).where(eq(assinaturasSadt.token, token));
  return hash;
}

export async function listarTodasAssinaturas(limit = 50, dataInicio?: Date, dataFim?: Date) {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  
  const conditions: any[] = [];
  
  // Aplicar filtros de data se fornecidos
  if (dataInicio) {
    conditions.push(sql`${assinaturasSadt.dataAssinatura} >= ${dataInicio}`);
  }
  if (dataFim) {
    // Adicionar 1 dia para incluir todo o dia final
    const proximoDia = new Date(dataFim);
    proximoDia.setDate(proximoDia.getDate() + 1);
    conditions.push(sql`${assinaturasSadt.dataAssinatura} < ${proximoDia}`);
  }
  
  let query = db
    .select({
      id: assinaturasSadt.id,
      guiaId: assinaturasSadt.guiaId,
      pacienteId: assinaturasSadt.pacienteId,
      profissionalId: assinaturasSadt.profissionalId,
      atendimentoId: assinaturasSadt.atendimentoId,
      numeroSessao: assinaturasSadt.numeroSessao,
      dataSessao: assinaturasSadt.dataSessao,
      procedimento: assinaturasSadt.procedimento,
      pacienteNome: assinaturasSadt.pacienteNome,
      pacienteCpf: assinaturasSadt.pacienteCpf,
      pacienteWhatsapp: assinaturasSadt.pacienteWhatsapp,
      token: assinaturasSadt.token,
      tokenExpiresAt: assinaturasSadt.tokenExpiresAt,
      status: assinaturasSadt.status,
      assinaturaDataUrl: assinaturasSadt.assinaturaDataUrl,
      assinaturaHash: assinaturasSadt.assinaturaHash,
      ipAssinatura: assinaturasSadt.ipAssinatura,
      userAgentAssinatura: assinaturasSadt.userAgentAssinatura,
      dataAssinatura: assinaturasSadt.dataAssinatura,
      motivoRecusa: assinaturasSadt.motivoRecusa,
      pdfUrl: assinaturasSadt.pdfUrl,
      whatsappEnviado: assinaturasSadt.whatsappEnviado,
      dataEnvioWhatsapp: assinaturasSadt.dataEnvioWhatsapp,
      createdAt: assinaturasSadt.createdAt,
      updatedAt: assinaturasSadt.updatedAt,
      // Convênio via JOIN com guias
      convenioId: guias.convenioId,
      convenio: convenios.nome,
      // Profissional via JOIN
      profissionalNome: profissionais.nome,
    })
    .from(assinaturasSadt)
    .leftJoin(guias, eq(assinaturasSadt.guiaId, guias.id))
    .leftJoin(convenios, eq(guias.convenioId, convenios.id))
    .leftJoin(profissionais, eq(assinaturasSadt.profissionalId, profissionais.id));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(assinaturasSadt.createdAt)).limit(limit);
}

/**
 * Migra assinaturas já realizadas de assinaturasGuias para assinaturasSadt
 * Sincroniza dados de assinaturas que foram feitas via link WhatsApp
 */
export async function migrarAssinaturasGuiasParaSadt() {
  const db = await getDb();
  if (!db) throw new Error('DB unavailable');
  
  try {
    // Buscar todas as assinaturas de guias que foram realmente assinadas
    const assinaturasGuiasRealizado = await db
      .select({
        id: assinaturasGuias.id,
        guiaId: assinaturasGuias.guiaId,
        pacienteId: assinaturasGuias.pacienteId,
        assinaturaPacienteUrl: assinaturasGuias.assinaturaPacienteUrl,
        dataAssinatura: assinaturasGuias.dataAssinatura,
        hashAssinatura: assinaturasGuias.hashAssinatura,
        sessaoNumero: assinaturasGuias.sessaoNumero,
        createdAt: assinaturasGuias.createdAt,
      })
      .from(assinaturasGuias)
      .where(
        and(
          sql`${assinaturasGuias.assinaturaPacienteUrl} IS NOT NULL AND ${assinaturasGuias.assinaturaPacienteUrl} != ''`,
        )
      );
    
    let migrados = 0;
    let ignorados = 0;
    
    for (const assinatura of assinaturasGuiasRealizado) {
      try {
        // Verificar se já existe em assinaturasSadt por hash de assinatura (mais confiável)
        let existente: any[] = [];
        
        if (assinatura.hashAssinatura) {
          existente = await db
            .select({ id: assinaturasSadt.id })
            .from(assinaturasSadt)
            .where(eq(assinaturasSadt.assinaturaHash, assinatura.hashAssinatura))
            .limit(1);
        }
        
        // Fallback: verificar por guiaId + pacienteId + sessaoNumero
        if (existente.length === 0 && assinatura.guiaId && assinatura.sessaoNumero) {
          existente = await db
            .select({ id: assinaturasSadt.id })
            .from(assinaturasSadt)
            .where(
              and(
                eq(assinaturasSadt.guiaId, assinatura.guiaId),
                eq(assinaturasSadt.pacienteId, assinatura.pacienteId),
                eq(assinaturasSadt.numeroSessao, assinatura.sessaoNumero),
              )
            )
            .limit(1);
        }
        
        if (existente.length === 0) {
          // Buscar dados da guia para obter profissionalId
          let profissionalId = null;
          let dataSessao = new Date();
          let procedimento = 'Procedimento';
          let atendimentoId = null;
          
          if (assinatura.guiaId) {
            const guia = await db
              .select()
              .from(guias)
              .where(eq(guias.id, assinatura.guiaId))
              .limit(1);
            
            if (guia.length > 0) {
              profissionalId = guia[0].profissionalId;
              dataSessao = new Date(guia[0].dataEmissao || new Date());
              procedimento = guia[0].procedimento || 'Procedimento';
              atendimentoId = (guia[0] as any).atendimentoId || null;
            }
          }
          
          const paciente = await db
            .select()
            .from(pacientes)
            .where(eq(pacientes.id, assinatura.pacienteId))
            .limit(1);
          
          // Gerar token único para migração (garantir unicidade com timestamp)
          const tokenMigracao = crypto.randomBytes(32).toString('hex') + Date.now().toString(36);
          
          await db.insert(assinaturasSadt).values({
            guiaId: assinatura.guiaId ?? undefined,
            pacienteId: assinatura.pacienteId,
            profissionalId: profissionalId ?? undefined,
            atendimentoId: atendimentoId ?? undefined,
            numeroSessao: assinatura.sessaoNumero || 1,
            dataSessao: dataSessao,
            procedimento: procedimento,
            pacienteNome: paciente[0]?.nome || 'Paciente',
            pacienteCpf: paciente[0]?.cpf || null,
            pacienteWhatsapp: paciente[0]?.whatsapp || null,
            token: tokenMigracao,
            tokenExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
            status: 'assinado',
            assinaturaDataUrl: assinatura.assinaturaPacienteUrl,
            assinaturaHash: assinatura.hashAssinatura,
            dataAssinatura: assinatura.dataAssinatura,
            whatsappEnviado: 1,
          });
          
          migrados++;
        } else {
          ignorados++;
        }
      } catch (erroLinha) {
        // Ignorar erros por linha (ex: token duplicado) e continuar
        console.warn('[Migração] Ignorando assinatura com erro:', assinatura.id, String(erroLinha).substring(0, 100));
        ignorados++;
      }
    }
    
    return { sucesso: true, migrados, ignorados };
  } catch (erro) {
    console.error('[Migração] Erro ao migrar assinaturas:', erro);
    return { sucesso: false, migrados: 0, erro: String(erro) };
  }
}

// ─── SystemConfig helpers ─────────────────────────────────────────────────────

export async function getSystemConfig(chave: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(systemConfig).where(eq(systemConfig.chave, chave)).limit(1);
  return rows[0]?.valor ?? null;
}

export async function setSystemConfig(chave: string, valor: string, descricao?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemConfig).values({ chave, valor, descricao }).onDuplicateKeyUpdate({ set: { valor } });
}

export async function getAllSystemConfigs(): Promise<Array<{ chave: string; valor: string | null; descricao: string | null; updatedAt: Date }>> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemConfig).orderBy(systemConfig.chave);
}


// ===================== PAGAMENTOS DE ATENDIMENTOS =====================
export async function createPagamentoAtendimento(data: {
  atendimentoId: number;
  pacienteId: number;
  profissionalId: number;
  valor: number | string;
  dataPagamento: Date;
  referenciaDatas: string;
  metodoPagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'outro';
  formasPagamento?: Array<{
    metodoPagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'outro';
    valor: number;
  }>;
  observacoes?: string;
  comprovanteUrl?: string;
  comprovanteKey?: string;
  atendimentosVinculados?: number[];
  convenioNome?: string;
  criadoPor?: number;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pagamentosAtendimento, contasReceber, contasPagar } = await import("../drizzle/schema");
  
  // Criar pagamento
  const result = await db.insert(pagamentosAtendimento).values({
    atendimentoId: data.atendimentoId,
    pacienteId: data.pacienteId,
    profissionalId: data.profissionalId,
    valor: String(data.valor),
    dataPagamento: data.dataPagamento,
    referenciaDatas: data.referenciaDatas,
    metodoPagamento: data.metodoPagamento,
    formasPagamento: data.formasPagamento?.length ? JSON.stringify(data.formasPagamento) : null,
    observacoes: data.observacoes || null,
    comprovanteUrl: (data as any).comprovanteUrl || null,
    comprovanteKey: (data as any).comprovanteKey || null,
    atendimentosVinculados: (data as any).atendimentosVinculados ? JSON.stringify((data as any).atendimentosVinculados) : null,
    criadoPor: data.criadoPor || null,
  });

  const pagamentoId = result[0].insertId;

  // Criar automaticamente uma entrada em Contas a Receber
  const paciente = await db.select().from(pacientes).where(eq(pacientes.id, data.pacienteId)).limit(1);
  const pacienteNome = paciente[0]?.nome || `Paciente ${data.pacienteId}`;

  const contaExistente = await db.select({ id: contasReceber.id })
    .from(contasReceber)
    .where(eq(contasReceber.pagamentoAtendimentoId, pagamentoId))
    .limit(1);

  if (!contaExistente.length) {
    const dadosContaReceber = montarContaReceberPagamento({
      pacienteNome,
      referenciaDatas: data.referenciaDatas,
      valor: data.valor,
      convenioNome: (data as any).convenioNome,
    });
    const contaResult = await db.insert(contasReceber).values({
      ...dadosContaReceber,
      dataVencimento: new Date(data.dataPagamento),
      dataRecebimento: new Date(data.dataPagamento),
      observacoes: data.observacoes || null,
      pagamentoAtendimentoId: pagamentoId,
      criadoPor: data.criadoPor || null,
    });

    await db.update(pagamentosAtendimento)
      .set({ contaReceberCriadaId: contaResult[0].insertId })
      .where(eq(pagamentosAtendimento.id, pagamentoId));
  }

  // Todo pagamento Particular registrado cria o repasse de 50% do profissional
  // no módulo Contas a Pagar. A chave única do pagamento impede duplicidades.
  const atendimentoComConvenio = await db.select({
    convenioNome: convenios.nome,
    profissionalNome: profissionais.nome,
  })
    .from(atendimentos)
    .innerJoin(convenios, eq(convenios.id, atendimentos.convenioId))
    .innerJoin(profissionais, eq(profissionais.id, atendimentos.profissionalId))
    .where(eq(atendimentos.id, data.atendimentoId))
    .limit(1);

  if (ehConvenioParticular(atendimentoComConvenio[0]?.convenioNome)) {
    const valorRepasse = calcularRepasseParticular(data.valor);
    if (valorRepasse > 0) {
      await db.insert(contasPagar).values({
        descricao: `Repasse particular - ${pacienteNome} - ${atendimentoComConvenio[0]?.profissionalNome || `Profissional ${data.profissionalId}`}`,
        categoria: 'Repasse Profissional',
        valor: String(valorRepasse) as any,
        dataVencimento: new Date(data.dataPagamento),
        status: 'pendente',
        observacoes: `Pagamento particular #${pagamentoId} — ${pacienteNome} — Ref: ${data.referenciaDatas}`,
        pagamentoAtendimentoId: pagamentoId,
        criadoPor: data.criadoPor || null,
      }).onDuplicateKeyUpdate({ set: { updatedAt: new Date() } });
    }
  }

  return pagamentoId;
}

export async function getPagamentosAtendimento(filtros?: {
  atendimentoId?: number;
  pacienteId?: number;
  profissionalId?: number;
}): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  const { pagamentosAtendimento } = await import("../drizzle/schema");

  let query: any = db.select().from(pagamentosAtendimento);

  if (filtros?.atendimentoId) {
    query = query.where(eq(pagamentosAtendimento.atendimentoId, filtros.atendimentoId));
  }
  if (filtros?.pacienteId) {
    query = query.where(eq(pagamentosAtendimento.pacienteId, filtros.pacienteId));
  }
  if (filtros?.profissionalId) {
    query = query.where(eq(pagamentosAtendimento.profissionalId, filtros.profissionalId));
  }

  return query.orderBy(desc(pagamentosAtendimento.dataPagamento));
}

export async function deletePagamentoAtendimento(pagamentoId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { pagamentosAtendimento, contasReceber } = await import("../drizzle/schema");

  // Buscar o pagamento para obter a conta criada
  const pagamento = await db.select().from(pagamentosAtendimento).where(eq(pagamentosAtendimento.id, pagamentoId)).limit(1);
  
  if (pagamento[0]?.contaReceberCriadaId) {
    // Deletar a conta a receber criada automaticamente
    await db.delete(contasReceber).where(eq(contasReceber.id, pagamento[0].contaReceberCriadaId));
  } else {
    // Compatibilidade: pagamentos antigos podem não ter recebido o vínculo reverso.
    await db.delete(contasReceber).where(eq(contasReceber.pagamentoAtendimentoId, pagamentoId));
  }

  // Deletar o pagamento
  await db.delete(pagamentosAtendimento).where(eq(pagamentosAtendimento.id, pagamentoId));
}


// ===================== GERAÇÃO DE COMPROVANTE PDF =====================
export async function gerarComprovantePagamentoPDF(pagamentoId: number): Promise<any> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { pagamentosAtendimento, atendimentos, pacientes, profissionais } = await import("../drizzle/schema");
  const PDFDocument = (await import('pdfkit')).default;
  const { format } = await import('date-fns');
  const { ptBR } = await import('date-fns/locale');

  // Buscar pagamento
  const pagamento = await db.select().from(pagamentosAtendimento).where(eq(pagamentosAtendimento.id, pagamentoId)).limit(1);
  if (!pagamento[0]) throw new Error("Pagamento não encontrado");

  const pag = pagamento[0];

  // Buscar dados relacionados
  const paciente = await db.select().from(pacientes).where(eq(pacientes.id, pag.pacienteId)).limit(1);
  const profissional = await db.select().from(profissionais).where(eq(profissionais.id, pag.profissionalId)).limit(1);

  // Gerar hash SHA-256 do pagamento
  const hashContent = `${pag.id}|${pag.valor}|${pag.dataPagamento}|${pag.referenciaDatas}`;
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  // Criar PDF
  const doc = new PDFDocument();
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Cabeçalho
  doc.fontSize(18).fillColor('#1e40af').text('COMPROVANTE DE PAGAMENTO', { align: 'center' });
  doc.moveDown();

  // Dados do pagamento
  doc.fontSize(12).fillColor('#000000');
  doc.text(`ID do Pagamento: #${pag.id}`);
  doc.text(`Paciente: ${paciente[0]?.nome || 'N/A'}`);
  doc.text(`Profissional: ${profissional[0]?.nome || 'N/A'}`);
  doc.text(`Valor: R$ ${parseFloat(pag.valor as any).toFixed(2)}`);
  doc.text(`Data do Pagamento: ${format(new Date(pag.dataPagamento), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`);
  doc.text(`Referência: ${pag.referenciaDatas}`);
  try {
    const formasPagamento = pag.formasPagamento ? JSON.parse(pag.formasPagamento) : null;
    if (Array.isArray(formasPagamento) && formasPagamento.length === 2) {
      const nomes: Record<string, string> = {
        dinheiro: 'Dinheiro',
        cartao_credito: 'Cartão de Crédito',
        cartao_debito: 'Cartão de Débito',
        pix: 'PIX',
        transferencia: 'Transferência',
        outro: 'Outro',
      };
      doc.text('Formas de pagamento:');
      formasPagamento.forEach((forma: any) => {
        doc.text(`• ${nomes[forma.metodoPagamento] || forma.metodoPagamento}: R$ ${Number(forma.valor).toFixed(2)}`);
      });
    } else {
      doc.text(`Método: ${pag.metodoPagamento.replace('_', ' ')}`);
    }
  } catch {
    doc.text(`Método: ${pag.metodoPagamento.replace('_', ' ')}`);
  }
  if (pag.observacoes) doc.text(`Observações: ${pag.observacoes}`);

  doc.moveDown();

  // Hash SHA-256
  doc.fontSize(10).fillColor('#666666').text('Hash de Autenticação (SHA-256):');
  doc.fontSize(8).fillColor('#999999').text(hash, { align: 'left' });

  doc.moveDown();

  // Rodapé
  doc.fontSize(9).fillColor('#999999').text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm:ss", { locale: ptBR })}`);

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks) as any);
    });
    doc.on('error', reject);
  });
}

/**
 * Busca pacientes com link de assinatura enviado mas ainda pendente
 * (token gerado, sem assinatura ainda e token não expirado)
 */
export async function getPacientesComLinkPendente(pacienteIds: number[]): Promise<Set<number>> {
  if (pacienteIds.length === 0) return new Set();
  const db = await getDb();
  if (!db) return new Set();

  const agora = new Date();

  // Busca assinaturas com token gerado, sem assinatura (assinaturaPacienteUrl vazio) e token não expirado
  const rows = await db
    .select({ pacienteId: assinaturasGuias.pacienteId })
    .from(assinaturasGuias)
    .where(
      and(
        inArray(assinaturasGuias.pacienteId, pacienteIds),
        // Tem token gerado
        sql`${assinaturasGuias.token} IS NOT NULL`,
        // Ainda não assinou (assinaturaPacienteUrl vazio ou null)
        sql`(${assinaturasGuias.assinaturaPacienteUrl} IS NULL OR ${assinaturasGuias.assinaturaPacienteUrl} = '')`,
        // Token não expirado
        sql`(${(assinaturasGuias as any).tokenExpiresAt} IS NULL OR ${(assinaturasGuias as any).tokenExpiresAt} > ${agora})`,
      )
    );

  return new Set(rows.map(r => r.pacienteId));
}
