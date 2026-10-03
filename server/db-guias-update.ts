import { getDb } from './db';
import { guias } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

/**
 * Atualiza uma guia existente
 */
export async function updateGuia(
  id: number,
  data: {
    numeroGuia?: string;
    pacienteId?: number;
    profissionalId?: number;
    convenioId?: number;
    dataEmissao?: Date;
    procedimento?: string;
    codigoTUSS?: string;
    cid?: string;
    valor?: string;
    status?: 'rascunho' | 'emitida' | 'enviada' | 'processada' | 'paga' | 'glosa';
    observacoes?: string;
    dataAtendimento?: Date;
    horaAtendimento?: string;
    numeroGuiaInterno?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  
  // Apenas incluir campos que foram fornecidos
  if (data.numeroGuia !== undefined) updateData.numeroGuia = data.numeroGuia;
  if (data.pacienteId !== undefined) updateData.pacienteId = data.pacienteId;
  if (data.profissionalId !== undefined) updateData.profissionalId = data.profissionalId;
  if (data.convenioId !== undefined) updateData.convenioId = data.convenioId;
  if (data.dataEmissao !== undefined) updateData.dataEmissao = data.dataEmissao;
  if (data.procedimento !== undefined) updateData.procedimento = data.procedimento;
  if (data.codigoTUSS !== undefined) updateData.codigoTUSS = data.codigoTUSS;
  if (data.cid !== undefined) updateData.cid = data.cid;
  if (data.valor !== undefined) updateData.valor = data.valor;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  if (data.dataAtendimento !== undefined) updateData.dataAtendimento = data.dataAtendimento;
  if (data.horaAtendimento !== undefined) updateData.horaAtendimento = data.horaAtendimento;
  if (data.numeroGuiaInterno !== undefined) updateData.numeroGuiaInterno = data.numeroGuiaInterno;
  
  // Validar se há campos a atualizar
  if (Object.keys(updateData).length === 0) {
    throw new Error("Nenhum campo fornecido para atualizar");
  }
  
  const result = await db.update(guias)
    .set(updateData)
    .where(eq(guias.id, id));
  
  return result;
}

/**
 * Obtém uma guia por ID
 */
export async function getGuiaById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(guias).where(eq(guias.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}
