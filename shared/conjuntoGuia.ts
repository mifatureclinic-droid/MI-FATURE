export function procedimentoFoiAlterado(
  procedimentoAtual: number | null | undefined,
  novoProcedimento: number | null | undefined,
): boolean {
  return novoProcedimento != null && novoProcedimento !== procedimentoAtual;
}
