function normalizarConvenio(nome: string | null | undefined): string {
  return String(nome || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function ehConvenioOab(nome: string | null | undefined): boolean {
  return normalizarConvenio(nome).includes('oab');
}

export function permitePagamentoNoBalcao(nome: string | null | undefined): boolean {
  const convenio = normalizarConvenio(nome);
  return convenio.includes('particular') || convenio.includes('mente aberta') || convenio.includes('vale saude') || convenio.includes('valesaude') || ehConvenioOab(convenio);
}

export function podeRegistrarRecebimentoOabNoBalcao(perfil: string | null | undefined): boolean {
  const perfilNormalizado = normalizarConvenio(perfil);
  return ['master', 'administrador', 'admin', 'recepcao', 'recepcionista'].includes(perfilNormalizado);
}
