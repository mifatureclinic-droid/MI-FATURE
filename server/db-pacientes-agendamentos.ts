import { getDb } from './db';
import { pacientes, atendimentos, assinaturasSadt, assinaturasGuias, guias, convenios } from '../drizzle/schema';
import { isNotNull, ne, sql } from 'drizzle-orm';
import { eq, inArray, and } from 'drizzle-orm';
import { convenioIsentoDeAssinaturaDigital, unirPacientesElegiveisProntuario } from '../shared/elegibilidadeProntuario';
import { getAtendimentosComStatusAssinatura } from '../shared/assinaturasAgenda';

/**
 * Obtém pacientes que têm agendamentos.
 * Se profissionalId for fornecido, filtra apenas pacientes do profissional.
 */
export async function getPacientesComAgendamentos(profissionalId?: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const whereClause = profissionalId !== undefined
      ? and(eq(atendimentos.status, 'agendado'), eq(atendimentos.profissionalId, profissionalId))
      : eq(atendimentos.status, 'agendado');

    const pacientesComAgendamentos = await db
      .selectDistinct({ pacienteId: atendimentos.pacienteId })
      .from(atendimentos)
      .where(whereClause);

    if (pacientesComAgendamentos.length === 0) return [];

    const pacienteIds = pacientesComAgendamentos.map(p => p.pacienteId);
    const result = await db
      .select()
      .from(pacientes)
      .where(inArray(pacientes.id, pacienteIds))
      .orderBy(pacientes.nome);

    return result;
  } catch (error) {
    console.error('Erro ao obter pacientes com agendamentos:', error);
    return [];
  }
}

/**
 * Obtém todos os pacientes cadastrados (sem filtro).
 */
export async function getPacientesCadastrados() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(pacientes)
      .orderBy(pacientes.nome);
    return result;
  } catch (error) {
    console.error('Erro ao obter pacientes cadastrados:', error);
    return [];
  }
}

/**
 * Obtém pacientes que têm atendimentos vinculados a um profissional específico.
 * Usado para restringir o Prontuário ao profissional logado.
 */
export async function getPacientesDoProfissional(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const pacientesDoProf = await db
      .selectDistinct({ pacienteId: atendimentos.pacienteId })
      .from(atendimentos)
      .where(eq(atendimentos.profissionalId, profissionalId));

    if (pacientesDoProf.length === 0) return [];

    const pacienteIds = pacientesDoProf.map(p => p.pacienteId);
    const result = await db
      .select()
      .from(pacientes)
      .where(inArray(pacientes.id, pacienteIds))
      .orderBy(pacientes.nome);

    return result;
  } catch (error) {
    console.error('Erro ao obter pacientes do profissional:', error);
    return [];
  }
}

/**
 * Obtém pacientes elegíveis para o Prontuário do profissional: aqueles com
 * assinatura confirmada e os convênios que não exigem assinatura digital.
 */
export async function getPacientesDoProfissionalComGuiaAssinada(profissionalId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    // 1. Pacientes vinculados ao profissional via atendimentos
    const pacientesDoProf = await db
      .selectDistinct({ pacienteId: atendimentos.pacienteId })
      .from(atendimentos)
      .where(eq(atendimentos.profissionalId, profissionalId));

    if (pacientesDoProf.length === 0) return [];

    const pacienteIds = pacientesDoProf.map(p => p.pacienteId);

    // 2a. Filtrar os que possuem assinatura SADT antiga com status 'assinado'
    const comAssinaturaSadt = await db
      .selectDistinct({ pacienteId: assinaturasSadt.pacienteId })
      .from(assinaturasSadt)
      .where(
        and(
          inArray(assinaturasSadt.pacienteId, pacienteIds),
          eq(assinaturasSadt.status, 'assinado'),
        ),
      );

    // 2b. Filtrar os que possuem assinatura de guia nova (assinaturaPacienteUrl preenchido)
    const comAssinaturaGuia = await db
      .selectDistinct({ pacienteId: assinaturasGuias.pacienteId })
      .from(assinaturasGuias)
      .where(
        and(
          inArray(assinaturasGuias.pacienteId, pacienteIds),
          isNotNull(assinaturasGuias.assinaturaPacienteUrl),
          ne(assinaturasGuias.assinaturaPacienteUrl, ''),
        ),
      );

    // 2c. Guias legadas podem ter apenas o campo assinadoPaciente atualizado,
    // sem uma linha associada nas tabelas de assinatura por sessão.
    const comGuiaMarcadaAssinada = await db
      .selectDistinct({ pacienteId: guias.pacienteId })
      .from(guias)
      .where(
        and(
          inArray(guias.pacienteId, pacienteIds),
          eq(guias.profissionalId, profissionalId),
          eq(guias.assinadoPaciente, 1),
        ),
      );

    // 2d. PROASA (incluindo PROASA PARÁ) e Mediservice não usam assinatura
    // digital. Os atendimentos desses convênios seguem elegíveis ao prontuário.
    const atendimentosDoProfissional = await db
      .select({ pacienteId: atendimentos.pacienteId, convenioNome: convenios.nome })
      .from(atendimentos)
      .leftJoin(convenios, eq(atendimentos.convenioId, convenios.id))
      .where(eq(atendimentos.profissionalId, profissionalId));
    const pacientesIsentosAssinatura = atendimentosDoProfissional
      .filter(atendimento => convenioIsentoDeAssinaturaDigital(atendimento.convenioNome))
      .map(atendimento => atendimento.pacienteId);

    const idsComAssinatura = unirPacientesElegiveisProntuario(
      comAssinaturaSadt.map(assinatura => assinatura.pacienteId),
      comAssinaturaGuia.map(assinatura => assinatura.pacienteId),
      comGuiaMarcadaAssinada.map(guia => guia.pacienteId),
      pacientesIsentosAssinatura,
    );

    if (idsComAssinatura.length === 0) return [];

    // 3. Buscar dados completos dos pacientes filtrados
    const result = await db
      .select()
      .from(pacientes)
      .where(inArray(pacientes.id, idsComAssinatura))
      .orderBy(pacientes.nome);

    return result;
  } catch (error) {
    console.error('Erro ao obter pacientes com guia assinada:', error);
    return [];
  }
}

async function enriquecerAgendamentosComAssinatura<T extends { id: number; pacienteId: number; guiaId?: number | null; profissionalId?: number | null; convenioId?: number | null; data: unknown }>(
  result: T[],
) {
  const db = await getDb();
  if (!db || result.length === 0) {
    return result.map(atendimento => ({
      ...atendimento,
      assinaturaPaciente: false,
      assinaturaPendente: false,
    }));
  }

  const pacienteId = result[0].pacienteId;
  const convenioIds = Array.from(new Set(
    result.map(atendimento => atendimento.convenioId).filter((id): id is number => id != null),
  ));
  const conveniosDoAtendimento = convenioIds.length > 0
    ? await db.select({ id: convenios.id, nome: convenios.nome }).from(convenios).where(inArray(convenios.id, convenioIds))
    : [];
  const convenioNomePorId = new Map(conveniosDoAtendimento.map(convenio => [convenio.id, convenio.nome]));
  const atendimentosComRegraAssinatura = result.map(atendimento => ({
    ...atendimento,
    assinaturaDigitalObrigatoria: !convenioIsentoDeAssinaturaDigital(
      atendimento.convenioId != null ? convenioNomePorId.get(atendimento.convenioId) : null,
    ),
  }));
  const [guiasDoPaciente, assinaturasSadtDoPaciente, assinaturasGuiasDoPaciente] = await Promise.all([
    db.select().from(guias).where(eq(guias.pacienteId, pacienteId)),
    db.select().from(assinaturasSadt).where(eq(assinaturasSadt.pacienteId, pacienteId)),
    db.select().from(assinaturasGuias).where(
      and(
        eq(assinaturasGuias.pacienteId, pacienteId),
        sql`${assinaturasGuias.assinaturaPacienteUrl} IS NOT NULL AND ${assinaturasGuias.assinaturaPacienteUrl} != ''`,
      ),
    ),
  ]);

  const status = getAtendimentosComStatusAssinatura(
    atendimentosComRegraAssinatura,
    guiasDoPaciente,
    assinaturasSadtDoPaciente,
    assinaturasGuiasDoPaciente,
  );

  return result.map(atendimento => ({
    ...atendimento,
    assinaturaDigitalObrigatoria: !convenioIsentoDeAssinaturaDigital(
      atendimento.convenioId != null ? convenioNomePorId.get(atendimento.convenioId) : null,
    ),
    assinaturaPaciente: status.assinados.has(atendimento.id),
    assinaturaPendente: status.pendentes.has(atendimento.id),
  }));
}

/**
 * Obtém agendamentos de um paciente específico (todos os profissionais).
 */
export async function getAgendamentosDoPaciente(pacienteId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(atendimentos)
      .where(eq(atendimentos.pacienteId, pacienteId))
      .orderBy(atendimentos.data);
    // Converter campos Date do MySQL para string YYYY-MM-DD para evitar desvio de fuso
    const normalizados = result.map(r => ({
      ...r,
      data: r.data instanceof Date ? r.data.toISOString().substring(0, 10) : r.data,
    }));
    return await enriquecerAgendamentosComAssinatura(normalizados);
  } catch (error) {
    console.error('Erro ao obter agendamentos do paciente:', error);
    return [];
  }
}

/**
 * Obtém agendamentos de um paciente filtrados pelo profissional logado.
 * Usado para restringir o Prontuário ao profissional responsável.
 */
export async function getAgendamentosDoPacientePorProfissional(
  pacienteId: number,
  profissionalId: number,
) {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db
      .select()
      .from(atendimentos)
      .where(
        and(
          eq(atendimentos.pacienteId, pacienteId),
          eq(atendimentos.profissionalId, profissionalId),
        ),
      )
      .orderBy(atendimentos.data);
    // Converter campos Date do MySQL para string YYYY-MM-DD para evitar desvio de fuso
    const normalizados = result.map(r => ({
      ...r,
      data: r.data instanceof Date ? r.data.toISOString().substring(0, 10) : r.data,
    }));
    return await enriquecerAgendamentosComAssinatura(normalizados);
  } catch (error) {
    console.error('Erro ao obter agendamentos do paciente por profissional:', error);
    return [];
  }
}
