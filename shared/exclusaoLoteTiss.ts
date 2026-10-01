export const STATUS_LOTE_TISS_EXCLUIVEL = ["aberto", "gerado"] as const;

export function loteTissPodeSerExcluido(status: string | null | undefined): boolean {
  return STATUS_LOTE_TISS_EXCLUIVEL.includes(status as (typeof STATUS_LOTE_TISS_EXCLUIVEL)[number]);
}

export function mensagemLoteTissNaoExcluivel(status: string | null | undefined): string {
  return `O lote está com status "${status || "desconhecido"}" e não pode ser excluído. Apenas lotes abertos ou gerados podem ser removidos.`;
}
