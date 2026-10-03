export function exibirHashIntegridade(hash: string | null | undefined) {
  const valor = hash?.trim();
  return valor || "Hash não disponível";
}

export function statusAssinaturaSadt(status: string | null | undefined) {
  const rotulos: Record<string, string> = {
    assinado: "Assinado",
    pendente: "Pendente",
    expirado: "Expirado",
    cancelado: "Cancelado",
  };
  return rotulos[status ?? ""] ?? "Não informado";
}
