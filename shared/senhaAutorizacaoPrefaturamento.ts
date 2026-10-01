export function normalizarSenhaAutorizacaoPrefaturamento(valor: unknown): string | undefined {
  if (valor === undefined || valor === null) return undefined;
  return String(valor).trim();
}

export function resolverSenhaExibidaNoPrefaturamento(input: {
  senhaAutorizacao?: string | null;
  numeroAutorizacao?: string | null;
}): string {
  const senhaDaGuia = normalizarSenhaAutorizacaoPrefaturamento(input.senhaAutorizacao);
  if (senhaDaGuia !== undefined) return senhaDaGuia;
  return normalizarSenhaAutorizacaoPrefaturamento(input.numeroAutorizacao) ?? '';
}
