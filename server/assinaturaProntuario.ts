import { eq, inArray } from "drizzle-orm";
import { atendimentos, assinaturasGuias, assinaturasSadt, convenios, guias } from "../drizzle/schema";
import { getAtendimentosComStatusAssinatura } from "../shared/assinaturasAgenda";
import { convenioUsaAssinaturaEmGuiaFisica } from "../shared/assinaturaGuiaFisica";
import { getDb } from "./db";

export interface ElegibilidadeAssinaturaProntuario {
  atendimento: {
    id: number;
    pacienteId: number;
    profissionalId: number;
    convenioId: number | null;
  };
  assinaturaDigitalObrigatoria: boolean;
  assinaturaConfirmada: boolean;
  convenioNome: string | null;
}

export function podeRegistrarProntuarioPorAssinatura(input: {
  atendimentoId: number;
  assinaturaDigitalObrigatoria: boolean;
  atendimentosAssinados: ReadonlySet<number>;
}): boolean {
  return !input.assinaturaDigitalObrigatoria || input.atendimentosAssinados.has(input.atendimentoId);
}

/**
 * Resolve a assinatura da sessão do prontuário com o mesmo algoritmo usado na Agenda.
 * A avaliação é por atendimento, nunca apenas por paciente, para que uma assinatura em
 * uma data não libere indevidamente as demais sessões da série.
 */
export async function obterElegibilidadeAssinaturaProntuario(
  atendimentoId: number,
): Promise<ElegibilidadeAssinaturaProntuario> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível para verificar a assinatura do paciente.");

  const [atendimento] = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.id, atendimentoId))
    .limit(1);

  if (!atendimento) throw new Error("Atendimento não encontrado.");

  const atendimentosDoPaciente = await db
    .select()
    .from(atendimentos)
    .where(eq(atendimentos.pacienteId, atendimento.pacienteId));

  const convenioIds = Array.from(
    new Set(
      atendimentosDoPaciente
        .map(item => item.convenioId)
        .filter((id): id is number => id != null),
    ),
  );

  const [guiasDoPaciente, assinaturasSadtDoPaciente, assinaturasGuiasDoPaciente, conveniosDoPaciente] = await Promise.all([
    db.select().from(guias).where(eq(guias.pacienteId, atendimento.pacienteId)),
    db.select().from(assinaturasSadt).where(eq(assinaturasSadt.pacienteId, atendimento.pacienteId)),
    db.select().from(assinaturasGuias).where(eq(assinaturasGuias.pacienteId, atendimento.pacienteId)),
    convenioIds.length > 0
      ? db.select({ id: convenios.id, nome: convenios.nome }).from(convenios).where(inArray(convenios.id, convenioIds))
      : Promise.resolve([]),
  ]);

  const convenioNomePorId = new Map(conveniosDoPaciente.map(convenio => [convenio.id, convenio.nome]));
  const atendimentosComRegraAssinatura = atendimentosDoPaciente.map(item => ({
    ...item,
    assinaturaDigitalObrigatoria: !convenioUsaAssinaturaEmGuiaFisica(
      item.convenioId != null ? convenioNomePorId.get(item.convenioId) : null,
    ),
  }));

  const status = getAtendimentosComStatusAssinatura(
    atendimentosComRegraAssinatura,
    guiasDoPaciente,
    assinaturasSadtDoPaciente,
    assinaturasGuiasDoPaciente,
  );

  const convenioNome = atendimento.convenioId != null
    ? convenioNomePorId.get(atendimento.convenioId) ?? null
    : null;
  const assinaturaDigitalObrigatoria = !convenioUsaAssinaturaEmGuiaFisica(convenioNome);

  return {
    atendimento: {
      id: atendimento.id,
      pacienteId: atendimento.pacienteId,
      profissionalId: atendimento.profissionalId,
      convenioId: atendimento.convenioId,
    },
    assinaturaDigitalObrigatoria,
    assinaturaConfirmada: podeRegistrarProntuarioPorAssinatura({
      atendimentoId: atendimento.id,
      assinaturaDigitalObrigatoria,
      atendimentosAssinados: status.assinados,
    }),
    convenioNome,
  };
}
