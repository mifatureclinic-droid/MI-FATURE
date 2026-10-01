export function extrairDataCalendario(valor: string | Date | null | undefined): string | null {
  if (!valor) return null;

  const dataIso = valor instanceof Date
    ? valor.toISOString().slice(0, 10)
    : String(valor).trim().slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(dataIso) ? dataIso : null;
}

export function formatarDataConfirmacaoManaus(valor: string | Date | null | undefined): string {
  const dataCalendario = extrairDataCalendario(valor);
  if (!dataCalendario) return "-";

  const [ano, mes, dia] = dataCalendario.split("-").map(Number);
  // Meio-dia UTC preserva o mesmo dia no fuso UTC-4 de Manaus, sem depender do fuso do aparelho.
  const dataSegura = new Date(Date.UTC(ano, mes - 1, dia, 12));

  return dataSegura.toLocaleDateString("pt-BR", {
    timeZone: "America/Manaus",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
