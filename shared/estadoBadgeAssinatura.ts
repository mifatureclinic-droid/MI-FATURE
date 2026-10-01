export type EstadoBadgeAssinatura = 'assinado' | 'pendente' | null;

/** A assinatura concluída sempre tem precedência sobre qualquer pendência. */
export function resolverEstadoBadgeAssinatura(input: {
  assinadoPaciente?: number | boolean | string | null;
  assinaturaPendente?: boolean | number | string | null;
  guiaId?: number | null;
}): EstadoBadgeAssinatura {
  const assinado = input.assinadoPaciente === 1
    || input.assinadoPaciente === true
    || input.assinadoPaciente === '1'
    || input.assinadoPaciente === 'true';
  const pendente = input.assinaturaPendente === 1
    || input.assinaturaPendente === true
    || input.assinaturaPendente === '1'
    || input.assinaturaPendente === 'true';

  if (assinado) return 'assinado';
  if (input.guiaId != null && pendente) return 'pendente';
  return null;
}
