import { describe, expect, it } from 'vitest';
import { prepararRequisicaoDoPortal } from '@shared/requisicaoPortal';

describe('prepararRequisicaoDoPortal', () => {
  it('mantém a sessão e impede cache de respostas de API no navegador', () => {
    expect(prepararRequisicaoDoPortal({ method: 'GET' })).toMatchObject({
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });
  });

  it('preserva opções existentes da chamada', () => {
    const signal = new AbortController().signal;
    expect(prepararRequisicaoDoPortal({ method: 'POST', signal })).toMatchObject({
      method: 'POST',
      signal,
      credentials: 'include',
      cache: 'no-store',
    });
  });
});
