const OPERACOES_CRITICAS_AGENDA = new Set([
  'profissionais.list',
  'atendimentos.list',
  'pacientes.listParaAgenda',
  // Exclusões de assinatura são ações críticas e nunca devem aguardar
  // consultas administrativas agrupadas no mesmo pedido HTTP.
  'assinaturasGuias.excluirAssinatura',
  'assinaturas.excluirAssinatura',
]);

/**
 * Impede que a grade da Agenda espere por consultas administrativas grandes
 * que não são necessárias para mostrar profissionais, sessões e pacientes.
 */
export function consultaDaAgendaDeveIgnorarLote(path: string): boolean {
  return OPERACOES_CRITICAS_AGENDA.has(path);
}
