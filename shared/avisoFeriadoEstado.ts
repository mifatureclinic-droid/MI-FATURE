export type EstadoAvisoFeriado = {
  exibir: boolean;
  cienteHoje: boolean;
  [chave: string]: unknown;
};

/** Atualiza a interface imediatamente após a ciência, sem esperar o refetch. */
export function aplicarCienciaNoAviso<T extends EstadoAvisoFeriado | undefined>(aviso: T): T {
  if (!aviso) return aviso;
  return { ...aviso, cienteHoje: true, exibir: false } as T;
}
