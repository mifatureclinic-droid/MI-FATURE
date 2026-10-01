import { describe, expect, it } from 'vitest';
import {
  calcularValorBrutoPorSessao,
  calcularValorPacoteNeuropsicologicoPorAtendimento,
  calcularValorTotalAutorizadoDaSerie,
  ehPacoteAvaliacaoNeuropsicologica,
  obterPercentualEspecialDeRepasse,
  ratearValorPacotePorSessao,
  resolverValorBaseDoPacoteNeuropsicologico,
} from '../shared/repasseValorSessao';

describe('rateio do valor de guia no repasse', () => {
  it('rateia o valor total da guia por sessão realizada', () => {
    expect(calcularValorBrutoPorSessao({ valor: '187.32', totalSessoes: 4 })).toBeCloseTo(46.83, 2);
  });

  it('prioriza total geral ou procedimentos antes do campo base quando disponível', () => {
    expect(calcularValorBrutoPorSessao({ valor: '50', valorTotalGeral: '200', totalSessoes: 4 })).toBe(50);
    expect(calcularValorBrutoPorSessao({ valorProcedimentos: '140.49', totalSessoes: 3 })).toBeCloseTo(46.83, 2);
  });

  it('mantém o valor integral para guia de uma sessão e zero sem guia', () => {
    expect(calcularValorBrutoPorSessao({ valor: '46.83', totalSessoes: 1 })).toBeCloseTo(46.83, 2);
    expect(calcularValorBrutoPorSessao(null)).toBe(0);
  });

  it('mantém R$ 60,61 por sessão para Luminar, sem dividir pelos dias da série', () => {
    expect(calcularValorBrutoPorSessao({ valor: '60.61', totalSessoes: 4 }, 'LUMINAR SAÚDE')).toBe(60.61);
    expect(calcularValorBrutoPorSessao({ valor: '242.44', totalSessoes: 4 }, 'Luminar Saúde')).toBe(60.61);
  });

  it('aplica R$ 48,24 e 42% somente ao procedimento 50000470 dos convênios indicados', () => {
    expect(calcularValorBrutoPorSessao({ valor: '192.96', totalSessoes: 4 }, 'BRADESCO SAÚDE', '50000470')).toBe(48.24);
    expect(calcularValorBrutoPorSessao({ valor: '192.96', totalSessoes: 4 }, 'MEDSERVICE', '50000470')).toBe(48.24);
    expect(obterPercentualEspecialDeRepasse('Bradesco Saúde - Operadora de Planos S/A', '50000470')).toBe(0.42);
    expect(obterPercentualEspecialDeRepasse('BRADESCO SAÚDE', '50001221')).toBeNull();
  });

  it('prioriza o valor atualizado do procedimento sobre o valor histórico da guia no repasse', () => {
    expect(calcularValorBrutoPorSessao(
      { valor: '187.32', totalSessoes: 4 },
      'GEAP',
      '50000470',
      '67.19',
    )).toBe(67.19);
  });

  it('usa o valor atualizado do procedimento mesmo quando o atendimento ainda não tem guia', () => {
    expect(calcularValorBrutoPorSessao(null, 'Proasa Saúde', '50001221', '60.00')).toBe(60);
  });

  it('grava o total autorizado da série a partir do valor unitário', () => {
    expect(calcularValorTotalAutorizadoDaSerie('67.19', 4)).toBeCloseTo(268.76, 2);
    expect(calcularValorTotalAutorizadoDaSerie('46.83', 4)).toBeCloseTo(187.32, 2);
  });

  it('restringe o rateio de pacote às avaliações neuropsicológicas dos quatro convênios autorizados', () => {
    expect(ehPacoteAvaliacaoNeuropsicologica('Proasa Saúde', 'Avaliação Neuropsicológica')).toBe(true);
    expect(ehPacoteAvaliacaoNeuropsicologica('PROASA PARÁ', 'Avaliação Neuropsicológica')).toBe(true);
    expect(ehPacoteAvaliacaoNeuropsicologica('PETROBRAS AMS', 'Avaliação Neuropsicológica')).toBe(true);
    expect(ehPacoteAvaliacaoNeuropsicologica('POSTAL SAUDE (CORREIOS)', 'Avaliação Neuropsicológica')).toBe(true);
    expect(ehPacoteAvaliacaoNeuropsicologica('GEAP', 'Avaliação Neuropsicológica')).toBe(false);
    expect(ehPacoteAvaliacaoNeuropsicologica('Proasa Saúde', 'Sessão em Psicoterapia')).toBe(false);
  });

  it('dilui o valor global do pacote pelo total de atendimentos ativos da série', () => {
    const valorBase = resolverValorBaseDoPacoteNeuropsicologico(
      { valorTotalGeral: '14400.00', totalSessoes: 8 },
      '1800.00',
    );
    expect(valorBase).toBe(1800);
    expect(calcularValorPacoteNeuropsicologicoPorAtendimento(valorBase, 8)).toBe(225);
  });

  it('utiliza o valor global de guia histórica antes do rateio da série', () => {
    const valorBase = resolverValorBaseDoPacoteNeuropsicologico(
      { valorTotalGeral: '720.00', totalSessoes: 8 },
      null,
    );
    expect(valorBase).toBe(720);
    expect(calcularValorPacoteNeuropsicologicoPorAtendimento(valorBase, 6)).toBe(120);
  });

  it('dilui o pacote na guia SADT sem perder centavos no total das sessões', () => {
    const valores = ratearValorPacotePorSessao('1800.00', 7);

    expect(valores).toEqual([257.15, 257.15, 257.14, 257.14, 257.14, 257.14, 257.14]);
    expect(Math.round(valores.reduce((soma, valor) => soma + valor, 0) * 100)).toBe(180000);
  });
});
