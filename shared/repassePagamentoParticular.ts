export function resolverValorBrutoDoRepasse(params: {
  valorDaGuia: number;
  valorDoPagamento: number | null | undefined;
  ehParticular: boolean;
  quantidadeSessoesVinculadas?: number | null | undefined;
}) {
  const valorDoPagamento = Number(params.valorDoPagamento ?? 0);
  if (params.ehParticular && Number.isFinite(valorDoPagamento) && valorDoPagamento > 0) {
    const quantidadeSessoesVinculadas = Number(params.quantidadeSessoesVinculadas ?? 1);
    const divisor = Number.isInteger(quantidadeSessoesVinculadas) && quantidadeSessoesVinculadas > 0
      ? quantidadeSessoesVinculadas
      : 1;
    return valorDoPagamento / divisor;
  }
  return params.valorDaGuia;
}

export function contarSessoesDoPagamentoParticular(
  atendimentoPrincipalId: number | null | undefined,
  atendimentosVinculados: string | null | undefined,
) {
  const ids = new Set<number>();
  const principal = Number(atendimentoPrincipalId);
  if (Number.isInteger(principal) && principal > 0) ids.add(principal);

  if (atendimentosVinculados) {
    try {
      const vinculados = JSON.parse(atendimentosVinculados);
      if (Array.isArray(vinculados)) {
        for (const id of vinculados) {
          const numero = Number(id);
          if (Number.isInteger(numero) && numero > 0) ids.add(numero);
        }
      }
    } catch {
      // O registro legado sem JSON válido mantém o pagamento como uma sessão.
    }
  }

  return Math.max(1, ids.size);
}

export function pagamentoParticularConfirmaRecebimento(params: {
  ehParticular: boolean;
  pagamentoId: number | null | undefined;
  guiaGlosada: boolean;
}) {
  return params.ehParticular && !!params.pagamentoId && !params.guiaGlosada;
}
