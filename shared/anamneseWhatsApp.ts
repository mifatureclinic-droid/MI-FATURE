export const PRAZO_LINK_ANAMNESE_MS = 7 * 24 * 60 * 60 * 1000;

export const CAMPOS_ANAMNESE_PUBLICA = [
  'queixaPrincipal',
  'historiaDoenca',
  'historiaFamiliar',
  'historiaSocial',
  'antecedentesPatologicos',
  'medicamentosEmUso',
  'alergias',
  'cirurgiasAnteriores',
  'habitos',
  'observacoes',
] as const;

export type RespostaAnamnesePublica = Partial<Record<(typeof CAMPOS_ANAMNESE_PUBLICA)[number], string>>;

export function montarLinkPreenchimentoAnamnese(token: string) {
  return `https://mifature.click/preencher-anamnese/${encodeURIComponent(token)}`;
}

export function montarMensagemLinkAnamnese(pacienteNome: string, link: string) {
  const primeiroNome = pacienteNome.trim().split(/\s+/)[0] || 'paciente';
  return `Olá, ${primeiroNome}. A CLÍNICA CLIPSI solicita o preenchimento da sua anamnese.\n\nAcesse o link individual abaixo para responder com segurança:\n${link}\n\nO link é válido por 7 dias. Não envie informações clínicas por esta conversa.`;
}
