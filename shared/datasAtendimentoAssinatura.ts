function formatarDataIso(data: string): string {
  const encontrada = data.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return encontrada ? `${encontrada[3]}/${encontrada[2]}/${encontrada[1]}` : data;
}

/**
 * Converte exclusivamente as datas de atendimento declaradas no link de assinatura.
 * A data/hora em que o paciente assinou é uma evidência distinta e não deve ser usada
 * como se fosse a data da sessão clínica.
 */
export function formatarDatasAtendimentoDaAssinatura(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;

  try {
    const datas = JSON.parse(valor);
    if (!Array.isArray(datas)) return null;
    const formatadas = datas
      .filter((data): data is string => typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data))
      .map(formatarDataIso);
    return formatadas.length > 0 ? formatadas.join(", ") : null;
  } catch {
    return null;
  }
}

/** Retorna a primeira data clínica declarada no comprovante de assinatura. */
export function obterPrimeiraDataAtendimentoDaAssinatura(valor: unknown): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;

  try {
    const datas = JSON.parse(valor);
    if (!Array.isArray(datas)) return null;
    return datas.find((data): data is string => typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Atualiza somente a primeira data clínica de uma assinatura, preservando outras
 * datas eventualmente declaradas no mesmo comprovante e a evidência temporal.
 */
export function atualizarPrimeiraDataAtendimentoDaAssinatura(valor: unknown, novaData: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
    throw new Error("A data da sessão deve estar no formato AAAA-MM-DD");
  }

  let datas: string[] = [];
  if (typeof valor === "string" && valor.trim()) {
    try {
      const parsed = JSON.parse(valor);
      if (Array.isArray(parsed)) {
        datas = parsed.filter((data): data is string => typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data));
      }
    } catch {
      // Um valor legado inválido é substituído por uma data clínica válida.
    }
  }

  const outrasDatas = datas.slice(1).filter((data) => data !== novaData);
  return JSON.stringify([novaData, ...outrasDatas]);
}
