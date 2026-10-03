import { describe, expect, it } from 'vitest';
import { opcoesDuracaoParaProfissional, unidadesRepassePorDuracao } from '../shared/duracaoRepasseProfissional';

describe('duração e unidades de repasse por profissional', () => {
  it('calcula duas unidades para qualquer profissional em atendimento de uma hora', () => {
    expect(opcoesDuracaoParaProfissional('Thiffane Ferreira Costa')).toEqual([30, 60]);
    expect(unidadesRepassePorDuracao('Thiffane Ferreira Costa', 60, '2026-08-01')).toBe(2);
    expect(unidadesRepassePorDuracao('Dra. Suzy', 60, '2026-08-01')).toBe(2);
    expect(unidadesRepassePorDuracao('Dra. Suzy', 30, '2026-08-01')).toBe(1);
  });

  it('mantém a opção de 1 hora e duas unidades para Silmara', () => {
    expect(opcoesDuracaoParaProfissional('SILMARA ELIZANDRA BARBOSA BORGES')).toEqual([30, 60]);
    expect(unidadesRepassePorDuracao('Silmara Elizandra Barbosa Borges', 60, '2026-08-31')).toBe(2);
  });

  it('mantém uma unidade para as exceções nominais, mesmo com uma hora', () => {
    for (const nome of ['Nayara Silva', 'Jéssica Maia', 'Vanessa de Souza', 'Loriene Melo', 'Kátia Marinho']) {
      expect(unidadesRepassePorDuracao(nome, 60, '2026-09-01')).toBe(1);
      expect(unidadesRepassePorDuracao(nome, 30, '2026-09-01')).toBe(1);
      expect(opcoesDuracaoParaProfissional(nome)).toEqual([30, 40, 60]);
    }
  });

  it('mantém uma unidade nas avaliações neuropsicológicas do Jairo, mas não nas demais sessões', () => {
    expect(unidadesRepassePorDuracao('Jairo de Assis Mascaren', 60, '2026-09-01', 'Avaliação Neuropsicológica')).toBe(1);
    expect(unidadesRepassePorDuracao('Jairo de Assis Mascaren', 60, '2026-09-01', 'SESSÃO EM PSICOLOGIA INDIVIDUAL')).toBe(2);
  });
});
