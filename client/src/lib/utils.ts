import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna o fuso horário local do browser do utilizador.
 * Usa Intl.DateTimeFormat para detectar automaticamente o fuso,
 * funcionando corretamente para Manaus (UTC-4), Brasília (UTC-3), etc.
 */
function getLocalTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD usando o fuso horário local do browser.
 * Funciona corretamente para qualquer fuso (Manaus UTC-4, Brasília UTC-3, etc.).
 */
export function getHojeBrasilia(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: getLocalTimeZone() });
}

/**
 * Converte uma data qualquer para string YYYY-MM-DD no fuso local do browser.
 */
export function toDateStringBrasilia(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: getLocalTimeZone() });
}

/**
 * Formata uma data do banco (string YYYY-MM-DD ou Date) para exibição no formato DD/MM/AAAA.
 * Evita o desvio de fuso horário (UTC shift) que ocorre com new Date(str).toLocaleDateString().
 * Quando a entrada é uma string YYYY-MM-DD, usa-a directamente sem conversão UTC.
 */
export function formatDateBR(value: string | Date | null | undefined): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    // Formato YYYY-MM-DD vindo do banco — usar directamente sem conversão
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-');
      return `${d}/${m}/${y}`;
    }
    // Formato ISO com timestamp (ex: '2026-07-04T00:00:00.000Z') —
    // Extrair apenas a parte da data (antes do T) para evitar UTC shift
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      const datePart = value.substring(0, 10); // 'YYYY-MM-DD'
      const [y, m, d] = datePart.split('-');
      return `${d}/${m}/${y}`;
    }
  }
  // É um objecto Date — usar toISOString para extrair a data sem conversão de fuso
  // (o campo DATE do MySQL chega como Date com T00:00:00.000Z — toISOString dá o dia correto)
  if (value instanceof Date) {
    const iso = value.toISOString().substring(0, 10);
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  // Fallback para outros tipos — extrair via ISO
  const d = new Date(value as any);
  if (!isNaN(d.getTime())) {
    const iso = d.toISOString().substring(0, 10);
    const [y, m, day] = iso.split('-');
    return `${day}/${m}/${y}`;
  }
  return String(value);
}

/**
 * Converte uma data do banco (string YYYY-MM-DD ou Date) para string YYYY-MM-DD segura.
 * Quando já é YYYY-MM-DD, retorna directamente sem conversão UTC.
 */
export function toSafeISODate(value: string | Date | null | undefined): string {
  if (!value) return '';
  // Já está no formato correcto — retornar directamente
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  // ISO string com timestamp — extrair apenas a data
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return value.substring(0, 10);
  }
  // Objecto Date — usar toISOString para extrair sem conversão de fuso
  const d = value instanceof Date ? value : new Date(value as any);
  if (!isNaN(d.getTime())) {
    return d.toISOString().substring(0, 10);
  }
  return '';
}
