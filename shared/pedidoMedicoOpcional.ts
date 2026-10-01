export function normalizarPedidoMedicoOpcional(input: {
  pedidoMedicoUrl?: string | null;
  dataVencimentoPedido?: string | null;
}) {
  return {
    pedidoMedicoUrl: input.pedidoMedicoUrl?.trim() || undefined,
    dataVencimentoPedido: input.dataVencimentoPedido?.trim() || undefined,
  };
}

/**
 * Prepara uma data do banco para um campo HTML `type="date"`.
 * O SuperJSON pode devolver datas como Date; String(Date) produz um texto
 * local inválido para o input e não deve seguir para a atualização do paciente.
 */
export function formatarDataParaInput(valor: unknown): string {
  if (!valor) return '';

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? '' : valor.toISOString().slice(0, 10);
  }

  const texto = String(valor).trim();
  const correspondenciaIso = texto.match(/^(\d{4}-\d{2}-\d{2})/);
  if (correspondenciaIso) return correspondenciaIso[1];

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? '' : data.toISOString().slice(0, 10);
}
