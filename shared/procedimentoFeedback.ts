export interface ProcedimentoSalvoResumo {
  codigo: string;
  descricao: string;
  valor: string;
}

export function formatarResumoProcedimentoSalvo(procedimento: ProcedimentoSalvoResumo): string {
  return `Código: ${procedimento.codigo} · Descrição: ${procedimento.descricao} · Valor: R$ ${procedimento.valor}`;
}
