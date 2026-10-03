/**
 * Mantém a sessão autenticada e evita que navegadores reutilizem respostas de
 * API que pertençam a uma versão anterior do portal após uma publicação.
 */
export function prepararRequisicaoDoPortal(init?: RequestInit): RequestInit {
  return {
    ...(init ?? {}),
    credentials: 'include',
    cache: 'no-store',
  };
}
