import { describe, expect, it } from 'vitest';
import { calcularNumeroSessaoSerie, formatarReferenciaSessao } from '../shared/sessaoSerie.mjs';

describe('posição da sessão na série', () => {
  it('calcula a segunda e a terceira sessão sem voltar para a primeira', () => {
    expect(calcularNumeroSessaoSerie({ sessaoInicial: 1, atendimentosAnteriores: 1 })).toBe(2);
    expect(calcularNumeroSessaoSerie({ sessaoInicial: 1, atendimentosAnteriores: 2 })).toBe(3);
  });

  it('preserva o início específico da guia e formata a referência completa', () => {
    expect(calcularNumeroSessaoSerie({ sessaoInicial: 11, atendimentosAnteriores: 2 })).toBe(13);
    expect(formatarReferenciaSessao({ sessaoNumero: 3, totalSessoes: 10 })).toBe('3ª sessão de 10');
    expect(formatarReferenciaSessao({ sessaoNumero: 1 })).toBe('1ª sessão');
  });
});
