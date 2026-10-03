export const TIPOS_ATENDIMENTO_DISPONIVEIS = [
  '1º Consulta',
  'Avaliação Neuropsicológica',
  'TEA - ABA',
  'Psicologia',
  'Outro',
] as const;

export const ROTULOS_PROCEDIMENTO_POR_TIPO: Record<(typeof TIPOS_ATENDIMENTO_DISPONIVEIS)[number], string> = {
  '1º Consulta': '1º Consulta',
  'Avaliação Neuropsicológica': 'AVALIAÇÃO NEUROPSICOLÓGICA',
  'TEA - ABA': 'TEA - ABA',
  Psicologia: 'PSICOLOGIA',
  Outro: 'OUTRO',
};
