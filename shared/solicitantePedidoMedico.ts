export type ExtracaoSolicitantePedido = {
  encontrado: boolean;
  nome: string | null;
  conselho: string | null;
  numeroConselho: string | null;
  uf: string | null;
  cbo: string | null;
  confianca: number;
};

export type SolicitanteValidado = {
  nome: string;
  conselho: string;
  numeroConselho: string;
  uf: string;
  cbo: string | null;
  confianca: number;
};

const CONSELHOS_ACEITOS = new Set([
  'CRM', 'CRO', 'COREN', 'CRF', 'CREFITO', 'CRN', 'CRFA', 'CRP',
  'CRBM', 'CREF', 'CRTR', 'CRBIO', 'CRAS',
]);

const limparTexto = (valor: unknown) => typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ') : '';

/**
 * Aceita apenas uma assinatura documental completa e com confiança suficiente.
 * CBO não é inferido: só é usado quando estiver explícito no documento.
 */
export function validarExtracaoSolicitante(
  valor: ExtracaoSolicitantePedido,
): SolicitanteValidado | null {
  const nome = limparTexto(valor.nome);
  const conselho = limparTexto(valor.conselho).toUpperCase();
  const numeroConselho = limparTexto(valor.numeroConselho).replace(/[^A-Za-z0-9.-]/g, '');
  const uf = limparTexto(valor.uf).toUpperCase();
  const cbo = limparTexto(valor.cbo).replace(/\D/g, '');

  if (
    !valor.encontrado
    || valor.confianca < 0.85
    || nome.length < 3
    || !CONSELHOS_ACEITOS.has(conselho)
    || numeroConselho.length < 3
    || !/^[A-Z]{2}$/.test(uf)
  ) {
    return null;
  }

  return {
    nome,
    conselho,
    numeroConselho,
    uf,
    cbo: /^\d{6}$/.test(cbo) ? cbo : null,
    confianca: valor.confianca,
  };
}

/** Atualiza somente lacunas do cadastro, nunca dados já confirmados manualmente. */
export function camposAusentesDoSolicitante(
  atual: {
    nomeMedicoSolicitante?: string | null;
    crmMedicoSolicitante?: string | null;
    ufMedicoSolicitante?: string | null;
    cbosMedicoSolicitante?: string | null;
  },
  sugestao: SolicitanteValidado,
) {
  return {
    ...(limparTexto(atual.nomeMedicoSolicitante) ? {} : { nomeMedicoSolicitante: sugestao.nome }),
    ...(limparTexto(atual.crmMedicoSolicitante) ? {} : { crmMedicoSolicitante: sugestao.numeroConselho }),
    ...(limparTexto(atual.ufMedicoSolicitante) ? {} : { ufMedicoSolicitante: sugestao.uf }),
    ...(limparTexto(atual.cbosMedicoSolicitante) || !sugestao.cbo ? {} : { cbosMedicoSolicitante: sugestao.cbo }),
  };
}
