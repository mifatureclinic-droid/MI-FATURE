export interface AssinaturaDaSessao {
  dataAssinatura?: unknown;
  datasAtendimento?: string | null;
  assinaturaPacienteUrl?: unknown;
}

/** Verifica se o valor armazenado pode ser apresentado como imagem de assinatura. */
export function temComprovanteAssinatura(valor: unknown): boolean {
  if (typeof valor !== 'string') return false;
  const url = valor.trim().toLowerCase();
  return url.startsWith('data:image/')
    || url.startsWith('/manus-storage/')
    || url.startsWith('https://')
    || url.startsWith('http://');
}

function normalizarData(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const dataBrasileira = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (dataBrasileira) return `${dataBrasileira[3]}-${dataBrasileira[2]}-${dataBrasileira[1]}`;
    return value.slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function datasDaAssinatura(assinatura: AssinaturaDaSessao): string[] {
  if (!assinatura.datasAtendimento) return [];
  try {
    const datas = JSON.parse(assinatura.datasAtendimento);
    return Array.isArray(datas) ? datas.map(normalizarData).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Localiza uma assinatura cujo registo corresponde exatamente à data da sessão. */
export function encontrarAssinaturaDaSessao<T extends AssinaturaDaSessao>(
  assinaturas: T[],
  dataAtendimento?: unknown,
): T | null {
  const data = normalizarData(dataAtendimento);
  if (!data) return null;

  return assinaturas.find(assinatura => {
    if (!temComprovanteAssinatura(assinatura.assinaturaPacienteUrl)) return false;
    const datasRegistradas = datasDaAssinatura(assinatura);
    return datasRegistradas.includes(data) || normalizarData(assinatura.dataAssinatura) === data;
  }) ?? null;
}
