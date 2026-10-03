import { describe, expect, it } from 'vitest';
import { deslocarDataAgenda } from '@shared/navegacaoDataAgenda';

describe('deslocarDataAgenda', () => {
  it('permite voltar para dias anteriores, inclusive ao cruzar o mês', () => {
    const dataAtual = new Date(2026, 7, 1, 12);
    const anterior = deslocarDataAgenda(dataAtual, -1);

    expect(anterior.getFullYear()).toBe(2026);
    expect(anterior.getMonth()).toBe(6);
    expect(anterior.getDate()).toBe(31);
  });

  it('permite avançar e mantém a data original sem alteração', () => {
    const dataAtual = new Date(2026, 7, 27, 12);
    const posterior = deslocarDataAgenda(dataAtual, 1);

    expect(posterior.getDate()).toBe(28);
    expect(dataAtual.getDate()).toBe(27);
  });
});
