export type AtendimentoAlvoAgenda = {
  id: number;
  data: unknown;
  assinaturaDigitalObrigatoria?: boolean | null;
  assinaturaPaciente?: boolean | null;
};

function normalizarDataAtendimento(rawData: unknown): string {
  if (!rawData) return "";
  if (typeof rawData === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawData)) return rawData;
  if (typeof rawData === "string" && /^\d{4}-\d{2}-\d{2}T/.test(rawData)) return rawData.slice(0, 10);
  if (rawData instanceof Date) return rawData.toISOString().slice(0, 10);
  return String(rawData).slice(0, 10);
}

/** Resolve a sessão exata que a Agenda entregou à página de prontuário. */
export function resolverAtendimentoAlvoDaAgenda<T extends AtendimentoAlvoAgenda>(
  agendamentos: T[],
  atendimentoId: number | null | undefined,
): { atendimento: T; data: string } | null {
  if (!atendimentoId) return null;
  const atendimento = agendamentos.find(item => item.id === atendimentoId);
  if (!atendimento) return null;
  return { atendimento, data: normalizarDataAtendimento(atendimento.data) };
}

/** Mantém o bloqueio clínico limitado à sessão efetivamente selecionada. */
export function deveFecharProntuarioDoProfissional(input: {
  perfil?: string | null;
  pacienteSelecionado: boolean;
  atendimentoSelecionado?: AtendimentoAlvoAgenda | null;
}): boolean {
  if (input.perfil !== "profissional") return false;
  if (input.pacienteSelecionado && !input.atendimentoSelecionado) return true;
  if (!input.atendimentoSelecionado) return false;
  return input.atendimentoSelecionado.assinaturaDigitalObrigatoria !== false
    && !input.atendimentoSelecionado.assinaturaPaciente;
}
