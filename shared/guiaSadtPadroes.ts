import { calcularHoraFinalAtendimento } from './horarioAtendimento';

export const TIPOS_ATENDIMENTO_SADT = [
  { codigo: '01', descricao: 'Remoção' },
  { codigo: '02', descricao: 'Pequena cirurgia' },
  { codigo: '03', descricao: 'Outras terapias' },
  { codigo: '04', descricao: 'Consulta' },
  { codigo: '06', descricao: 'Atendimento domiciliar' },
  { codigo: '13', descricao: 'Pequenos atendimentos' },
] as const;

export const VIA_ACESSO_PADRAO_SADT = '1';
export const TECNICA_UTILIZADA_PADRAO_SADT = '1';
export const GRAU_PARTICIPACAO_PADRAO_SADT = '12';
export const GRAU_PARTICIPACAO_BRADESCO_SADT = '00';
export const DURACAO_PADRAO_SADT_MINUTOS = 30;

export function calcularHoraFinalSadt(
  horaInicial: string | null | undefined,
  duracaoMinutos: number | string | null | undefined,
): string {
  return calcularHoraFinalAtendimento(horaInicial, duracaoMinutos || DURACAO_PADRAO_SADT_MINUTOS);
}

export function obterGrauParticipacaoSadt(nomeConvenio: string | null | undefined): string {
  return /bradesco/i.test(String(nomeConvenio || ''))
    ? GRAU_PARTICIPACAO_BRADESCO_SADT
    : GRAU_PARTICIPACAO_PADRAO_SADT;
}
