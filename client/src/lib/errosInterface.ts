export function ehErroTransitórioDeDesmontagem(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const erroDoDom = error as { name?: unknown; message?: unknown };

  return erroDoDom.name === 'NotFoundError'
    && typeof erroDoDom.message === 'string'
    && /removeChild|nó a ser removido não é filho|node to be removed/i.test(erroDoDom.message);
}

export function ehErroDeModuloDinamico(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const erro = error as { message?: unknown };
  return typeof erro.message === 'string'
    && /failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk .* failed/i.test(erro.message);
}

export function criarUrlDeAtualizacaoDeModulo(urlAtual: string, marcaDeAtualizacao: string): string {
  const url = new URL(urlAtual);
  url.searchParams.set('atualizar', marcaDeAtualizacao);
  return url.toString();
}
