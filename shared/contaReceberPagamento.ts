export function montarContaReceberPagamento(input: {
  pacienteNome: string;
  referenciaDatas: string;
  valor: number | string;
  convenioNome?: string | null;
}) {
  const convenio = String(input.convenioNome ?? '').trim();
  return {
    descricao: `Pagamento recebido - ${input.pacienteNome} (Ref: ${input.referenciaDatas})`,
    categoria: convenio ? `Atendimento ${convenio}` : 'Atendimento Particular',
    valor: String(input.valor),
    status: 'recebido' as const,
  };
}
