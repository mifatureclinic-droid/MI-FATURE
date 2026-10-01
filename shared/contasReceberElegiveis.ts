export function contaReceberEntraNoRepasse(conta: { descricao: string }, pagamentoId: number | null): boolean {
  const ePagamentoParticularAutomatico = conta.descricao.startsWith('Pagamento recebido - ');
  return !ePagamentoParticularAutomatico || pagamentoId !== null;
}
