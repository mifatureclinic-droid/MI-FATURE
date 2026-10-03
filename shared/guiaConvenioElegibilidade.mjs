export function avaliarElegibilidadeGuia({ numeroCarteira, sessoes }) {
  if (!numeroCarteira || !String(numeroCarteira).trim()) {
    return { processavel: false, motivo: 'Paciente sem número de carteirinha.' };
  }

  const procedimentos = [...new Set(sessoes.map((sessao) => sessao.procedimentoConvenioId).filter(Boolean))];
  if (procedimentos.length === 0) {
    return { processavel: false, motivo: 'Sem procedimento vinculado.' };
  }
  if (procedimentos.length > 1) {
    return { processavel: false, motivo: 'Série possui procedimentos distintos.' };
  }

  const procedimentoId = procedimentos[0];
  const referencia = sessoes.find((sessao) => sessao.procedimentoConvenioId === procedimentoId);
  const valorUnitario = Number.parseFloat(String(referencia?.valorUnitario ?? 0)) || 0;
  if (valorUnitario <= 0 || !referencia?.procedimento) {
    return { processavel: false, motivo: 'Procedimento sem valor ou descrição válida.' };
  }

  return {
    processavel: true,
    procedimentoId,
    procedimento: referencia.procedimento,
    valorUnitario,
  };
}
