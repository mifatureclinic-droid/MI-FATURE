export const AVISO_FERIADO_SETEMBRO_2026 = {
  codigo: 'feriado-setembro-2026',
  titulo: 'Atenção — reposição de pacientes',
  mensagem: 'Haverá feriado nos dias 05 (sábado) e 07 (segunda-feira) de Setembro/2026. Solicitamos que até o dia 20 passem os pacientes de reposição.',
  inicio: '2026-08-12',
  fim: '2026-08-18',
} as const;

export function dataManaus(valor: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Manaus',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(valor);
  const obter = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(parte => parte.type === tipo)?.value ?? '';
  return `${obter('year')}-${obter('month')}-${obter('day')}`;
}

export function deveExibirAvisoFeriado(params: {
  perfil?: string | null;
  dataReferencia: string;
  cienteHoje: boolean;
}): boolean {
  if (params.perfil !== 'profissional') return false;
  if (params.dataReferencia < AVISO_FERIADO_SETEMBRO_2026.inicio) return false;
  if (params.dataReferencia > AVISO_FERIADO_SETEMBRO_2026.fim) return false;
  return !params.cienteHoje;
}

export function montarAvisoCienciaEmail(params: {
  profissional: string;
  dataCiencia: Date;
}): { assunto: string; texto: string } {
  const dataHora = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Manaus',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(params.dataCiencia);

  return {
    assunto: `Ciência registrada — ${AVISO_FERIADO_SETEMBRO_2026.titulo}`,
    texto: `O profissional ${params.profissional} deu ciência do aviso de feriado em ${dataHora} (horário de Manaus).`,
  };
}
