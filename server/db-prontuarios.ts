import { eq, desc, gte, lte, and } from "drizzle-orm";
import { prontuarios, atendimentos, pacientes, profissionais, InsertProntuario } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Criar um novo prontuário
 */
export async function createProntuarioCompleto(data: {
  pacienteId: number;
  profissionalId: number;
  atendimentoId: number;
  tipoRegistro?: "anamnese" | "continuidade";
  queixa?: string;
  diagnostico?: string;
  tratamento?: string;
  observacoes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const insertData: InsertProntuario = {
    pacienteId: data.pacienteId,
    profissionalId: data.profissionalId,
    atendimentoId: data.atendimentoId,
    tipoRegistro: data.tipoRegistro ?? "continuidade",
    queixa: data.queixa || null,
    diagnostico: data.diagnostico || null,
    tratamento: data.tratamento || null,
    observacoes: data.observacoes || null,
    statusAtraso: "noTempo",
  };

  try {
    // Inserir o prontuário
    await db.insert(prontuarios).values(insertData);
    
    // Marcar o atendimento como prontuário feito (prontuarioFeito = 1)
    // Isso faz o atendimento aparecer automaticamente no repasse do profissional
    await db
      .update(atendimentos)
      .set({ prontuarioFeito: 1 })
      .where(eq(atendimentos.id, data.atendimentoId));
    
    // Retornar o prontuário criado com todos os dados
    const result = await db
      .select()
      .from(prontuarios)
      .where(eq(prontuarios.atendimentoId, data.atendimentoId))
      .orderBy(desc(prontuarios.createdAt))
      .limit(1);
    
    return result[0] || insertData;
  } catch (error) {
    console.error('Erro ao criar prontuário:', error);
    throw error;
  }
}

/**
 * Obter histórico de prontuários de um paciente com filtro de datas
 */
export async function getHistoricoProntuariosPaciente(
  pacienteId: number,
  dataInicio?: Date,
  dataFim?: Date
) {
  const db = await getDb();
  if (!db) return [];

  try {
    let whereConditions: any[] = [eq(prontuarios.pacienteId, pacienteId)];

    if (dataInicio) {
      whereConditions.push(gte(atendimentos.data, dataInicio));
    }

    if (dataFim) {
      whereConditions.push(lte(atendimentos.data, dataFim));
    }

    const result = await db
      .select({
        id: prontuarios.id,
        pacienteId: prontuarios.pacienteId,
        profissionalId: prontuarios.profissionalId,
        profissionalNome: profissionais.nome,
        atendimentoId: prontuarios.atendimentoId,
        tipoRegistro: prontuarios.tipoRegistro,
        dataAtendimento: atendimentos.data,
        horaAtendimento: atendimentos.hora,
        tipoAtendimento: atendimentos.tipo,
        queixa: prontuarios.queixa,
        diagnostico: prontuarios.diagnostico,
        tratamento: prontuarios.tratamento,
        observacoes: prontuarios.observacoes,
        statusAtraso: prontuarios.statusAtraso,
        atendimentoStatus: atendimentos.status,
        criadoEm: prontuarios.createdAt,
      })
      .from(prontuarios)
      .innerJoin(atendimentos, eq(prontuarios.atendimentoId, atendimentos.id))
      .innerJoin(profissionais, eq(prontuarios.profissionalId, profissionais.id))
      .where(and(...whereConditions))
      .orderBy(desc(atendimentos.data), desc(atendimentos.hora));

    // Converter campos Date do MySQL para string YYYY-MM-DD para evitar UTC shift no frontend
    // IMPORTANTE: usar toISOString().substring(0,10) e NÃO toLocaleDateString com fuso
    // O campo DATE do MySQL chega como Date com T00:00:00.000Z (UTC)
    // toLocaleDateString('sv-SE', {timeZone: 'America/Sao_Paulo'}) converte para UTC-3 e dá dia anterior
    // toISOString().substring(0,10) extrai a data UTC que é a data correta do banco
    return result.map(row => ({
      ...row,
      dataAtendimento: row.dataAtendimento
        ? (row.dataAtendimento instanceof Date
            ? row.dataAtendimento.toISOString().substring(0, 10)
            : String(row.dataAtendimento).substring(0, 10))
        : undefined,
    }));
  } catch (error) {
    console.error("Erro ao buscar histórico de prontuários:", error);
    return [];
  }
}

/**
 * Obter prontuário por ID
 */
export async function getProntuarioById(prontuarioId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select({
        id: prontuarios.id,
        pacienteId: prontuarios.pacienteId,
        profissionalId: prontuarios.profissionalId,
        atendimentoId: prontuarios.atendimentoId,
        tipoRegistro: prontuarios.tipoRegistro,
        queixa: prontuarios.queixa,
        diagnostico: prontuarios.diagnostico,
        tratamento: prontuarios.tratamento,
        observacoes: prontuarios.observacoes,
        statusAtraso: prontuarios.statusAtraso,
        createdAt: prontuarios.createdAt,
        updatedAt: prontuarios.updatedAt,
      })
      .from(prontuarios)
      .where(eq(prontuarios.id, prontuarioId))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Erro ao buscar prontuário:", error);
    return null;
  }
}

/**
 * Atualizar prontuário
 */
export async function updateProntuario(
  prontuarioId: number,
  data: Partial<InsertProntuario>
) {
  if (Object.keys(data).length === 0) {
    throw new Error("Nenhum campo fornecido para atualização do prontuário");
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .update(prontuarios)
    .set(data)
    .where(eq(prontuarios.id, prontuarioId));

  return result;
}


/**
 * Obter prontuários pendentes
 */
export async function getProntuariosPendentes() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: prontuarios.id,
        pacienteId: prontuarios.pacienteId,
        pacienteNome: pacientes.nome,
        profissionalId: prontuarios.profissionalId,
        profissionalNome: profissionais.nome,
        statusAtraso: prontuarios.statusAtraso,
        createdAt: prontuarios.createdAt,
      })
      .from(prontuarios)
      .innerJoin(pacientes, eq(prontuarios.pacienteId, pacientes.id))
      .innerJoin(profissionais, eq(prontuarios.profissionalId, profissionais.id))
      .where(eq(prontuarios.statusAtraso, "atrasado"))
      .orderBy(desc(prontuarios.createdAt));

    return result;
  } catch (error) {
    console.error("Erro ao buscar prontuários pendentes:", error);
    return [];
  }
}

/**
 * Excluir prontuário (somente master/admin)
 */
export async function deleteProntuario(prontuarioId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.transaction(async (tx) => {
      const registro = await tx
        .select({ atendimentoId: prontuarios.atendimentoId })
        .from(prontuarios)
        .where(eq(prontuarios.id, prontuarioId))
        .limit(1);

      const prontuario = registro[0];
      if (!prontuario) {
        throw new Error("Prontuário não encontrado");
      }

      await tx.delete(prontuarios).where(eq(prontuarios.id, prontuarioId));
      await tx
        .update(atendimentos)
        .set({ prontuarioFeito: 0 })
        .where(eq(atendimentos.id, prontuario.atendimentoId));
    });
  } catch (error) {
    console.error("Erro ao excluir prontuário:", error);
    throw new Error("Erro ao excluir prontuário");
  }
}
