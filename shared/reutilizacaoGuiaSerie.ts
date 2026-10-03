export type AtendimentoComGuiaSerie = {
  id: number;
  serieId?: string | null;
  pacienteId?: number | null;
  profissionalId?: number | null;
  convenioId?: number | null;
  guiaId?: number | null;
};

export type GuiaComSerie = {
  id: number;
  serieId?: string | null;
  pacienteId?: number | null;
  profissionalId?: number | null;
  convenioId?: number | null;
};

/**
 * Localiza a guia já vinculada à mesma série e ao mesmo contexto de
 * paciente, profissional e convênio. Nunca reutiliza guia de outra série.
 */
export function encontrarGuiaDaSerie(
  atendimento: AtendimentoComGuiaSerie | null | undefined,
  atendimentos: AtendimentoComGuiaSerie[],
  guias: GuiaComSerie[] = [],
): number | null {
  if (!atendimento) return null;
  if (atendimento.guiaId != null) return atendimento.guiaId;
  if (!atendimento.serieId) return null;

  const atendimentoComGuia = atendimentos.find((candidato) =>
    candidato.serieId === atendimento.serieId &&
    candidato.pacienteId === atendimento.pacienteId &&
    candidato.profissionalId === atendimento.profissionalId &&
    candidato.convenioId === atendimento.convenioId &&
    candidato.guiaId != null,
  );

  if (atendimentoComGuia?.guiaId != null) return atendimentoComGuia.guiaId;

  // A Agenda carrega uma janela de datas. A sessão que já recebeu a guia pode
  // estar em outra semana, mas a consulta de guias continua disponível.
  const guiaDaSerie = guias.find((guia) =>
    guia.serieId === atendimento.serieId &&
    guia.pacienteId === atendimento.pacienteId &&
    guia.profissionalId === atendimento.profissionalId &&
    guia.convenioId === atendimento.convenioId,
  );

  return guiaDaSerie?.id ?? null;
}

/**
 * Confere a lista atual de guias antes de decidir pela criação. Isso impede
 * que uma tela da Agenda aberta há algum tempo crie guia duplicada por usar
 * um cache desatualizado.
 */
export async function encontrarGuiaDaSerieAtualizada(
  atendimento: AtendimentoComGuiaSerie | null | undefined,
  atendimentos: AtendimentoComGuiaSerie[],
  buscarGuias: () => Promise<GuiaComSerie[]>,
): Promise<number | null> {
  if (atendimento?.guiaId != null) return atendimento.guiaId;
  const guiasAtualizadas = await buscarGuias();
  return encontrarGuiaDaSerie(atendimento, atendimentos, guiasAtualizadas);
}
