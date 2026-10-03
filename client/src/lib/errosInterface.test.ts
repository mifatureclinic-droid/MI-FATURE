import { describe, expect, it } from 'vitest';
import { ehErroTransitórioDeDesmontagem } from './errosInterface';

describe('erros de interface transitórios', () => {
  it('reconhece a falha de removeChild que pode ocorrer na desmontagem', () => {
    const erro = new DOMException('Falha ao executar removeChild em Node', 'NotFoundError');

    expect(ehErroTransitórioDeDesmontagem(erro)).toBe(true);
  });

  it('não mascara erros diferentes', () => {
    expect(ehErroTransitórioDeDesmontagem(new Error('Falha de rede'))).toBe(false);
  });

  it('aceita NotFoundError do DOM mesmo fora da cadeia Error do JavaScript', () => {
    expect(ehErroTransitórioDeDesmontagem({
      name: 'NotFoundError',
      message: 'The node to be removed is not a child of this node.',
    })).toBe(true);
  });
});
