export type ProfissionalListagem = {
  nome?: string | null;
  crm?: string | null;
  especialidade?: string | null;
  ativo?: number | null;
};

function textoNormalizado(valor: string | null | undefined): string {
  return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
}

/**
 * Mantém a listagem utilizável mesmo quando cadastros legados não possuem
 * todos os campos textuais preenchidos.
 */
export function filtrarProfissionaisPorBusca<T extends ProfissionalListagem>(
  profissionais: T[],
  busca: string,
  incluirInativos: boolean,
): T[] {
  const termo = textoNormalizado(busca);

  return profissionais.filter((profissional) => {
    if (!incluirInativos && profissional.ativo === 0) return false;
    if (!termo) return true;

    return [profissional.nome, profissional.crm, profissional.especialidade]
      .some((campo) => textoNormalizado(campo).includes(termo));
  });
}
