export type AtendimentoParaAssinatura = {
  id: number;
  pacienteId: number;
  profissionalId: number;
  convenioId?: number | null;
  guiaId?: number | null;
  data?: string | Date | null;
};

export type GuiaParaAssinatura = {
  id: number;
  pacienteId: number;
  profissionalId?: number | null;
  convenioId?: number | null;
  status?: string | null;
  dataEmissao?: string | Date | null;
};

function mesDaData(data?: string | Date | null) {
  if (!data) return null;
  if (typeof data === 'string') return data.slice(0, 7);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
}

function guiaDisponivel(guia: GuiaParaAssinatura) {
  return guia.status === 'rascunho' || guia.status === 'emitida';
}

function guiaCompativelComAtendimento(
  guia: GuiaParaAssinatura,
  atendimento: AtendimentoParaAssinatura,
) {
  return guia.pacienteId === atendimento.pacienteId
    && guia.profissionalId === atendimento.profissionalId
    && guia.convenioId === atendimento.convenioId
    && guiaDisponivel(guia);
}

/**
 * Escolhe a guia que será exibida no link de assinatura. A guia já vinculada
 * ao atendimento tem prioridade absoluta, impedindo que uma guia antiga do
 * mesmo paciente, mas de outro convênio, seja reutilizada por engano.
 */
export function selecionarGuiaParaAssinatura(
  atendimento: AtendimentoParaAssinatura,
  guias: GuiaParaAssinatura[],
) {
  const guiaVinculada = atendimento.guiaId == null
    ? undefined
    : guias.find(guia => guia.id === atendimento.guiaId);
  if (guiaVinculada && guiaCompativelComAtendimento(guiaVinculada, atendimento)) {
    return guiaVinculada;
  }

  const compativeis = guias.filter(guia => guiaCompativelComAtendimento(guia, atendimento));
  const mesAtendimento = mesDaData(atendimento.data);
  return compativeis.find(guia => mesDaData(guia.dataEmissao) === mesAtendimento) ?? compativeis[0];
}
