export function calcularNumeroSessaoSerie({ sessaoInicial, atendimentosAnteriores }) {
  const inicio = Number.isInteger(Number(sessaoInicial)) && Number(sessaoInicial) > 0
    ? Number(sessaoInicial)
    : 1;
  const anteriores = Number.isInteger(Number(atendimentosAnteriores)) && Number(atendimentosAnteriores) > 0
    ? Number(atendimentosAnteriores)
    : 0;
  return inicio + anteriores;
}

export function formatarReferenciaSessao({ sessaoNumero, totalSessoes }) {
  const numero = Math.max(1, Number(sessaoNumero) || 1);
  const total = Number(totalSessoes);
  return Number.isInteger(total) && total >= numero
    ? `${numero}ª sessão de ${total}`
    : `${numero}ª sessão`;
}
