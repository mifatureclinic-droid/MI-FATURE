function normalizarDataIso(valor: unknown): string {
  if (!valor) return '';
  const texto = String(valor);
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const brasileiro = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brasileiro) return `${brasileiro[3]}-${brasileiro[2]}-${brasileiro[1]}`;
  return '';
}

/** Extrai, remove duplicidades e ordena as datas das sessões registradas nas assinaturas. */
export function extrairDatasAssinadas(assinaturas: Array<Record<string, unknown>> | null | undefined): string[] {
  const datas = new Set<string>();
  for (const assinatura of assinaturas ?? []) {
    const datasAtendimento = assinatura.datasAtendimento;
    if (typeof datasAtendimento === 'string') {
      try {
        const lista = JSON.parse(datasAtendimento);
        if (Array.isArray(lista)) {
          lista.map(normalizarDataIso).filter(Boolean).forEach(data => datas.add(data));
        }
      } catch {
        // O fallback abaixo cobre registros antigos sem JSON válido.
      }
    }
    const dataDireta = normalizarDataIso(assinatura.dataSessao ?? assinatura.dataAssinatura);
    if (dataDireta) datas.add(dataDireta);
  }
  return Array.from(datas).sort();
}
