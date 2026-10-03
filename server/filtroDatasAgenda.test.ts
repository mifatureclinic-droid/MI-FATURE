import { describe, expect, it } from 'vitest';
import {
  MAXIMO_DATAS_POR_CONSULTA_AGENDA,
  deveUsarRetornoSeguroDaAgenda,
  normalizarDatasParaConsultaAgenda,
  obterDatasVisiveisDaAgenda,
} from '../shared/filtroDatasAgenda';

describe('filtro de datas visíveis da Agenda', () => {
  const hoje = new Date('2026-08-30T12:00:00.000Z');

  it('carrega todo o mês de hoje antes de selecionar profissionais', () => {
    const datas = obterDatasVisiveisDaAgenda({}, [], hoje);

    expect(datas).toHaveLength(31);
    expect(datas[0]).toBe('2026-08-01');
    expect(datas[30]).toBe('2026-08-31');
  });

  it('deduplica a competência escolhida e usa hoje como padrão do profissional sem data própria', () => {
    const datas = obterDatasVisiveisDaAgenda({
      10: new Date('2026-08-21T12:00:00.000Z'),
      11: new Date('2026-08-21T12:00:00.000Z'),
    }, [10, 11, 12], hoje);

    expect(datas).toHaveLength(31);
    expect(datas).toContain('2026-08-21');
    expect(datas).toContain('2026-08-30');
  });

  it('carrega as competências de meses diferentes quando profissionais usam datas distintas', () => {
    const datas = obterDatasVisiveisDaAgenda({
      10: new Date('2026-08-21T12:00:00.000Z'),
      11: new Date('2026-09-02T12:00:00.000Z'),
    }, [10, 11], hoje);

    expect(datas).toHaveLength(61);
    expect(datas).toContain('2026-08-31');
    expect(datas).toContain('2026-09-01');
    expect(datas).toContain('2026-09-30');
  });

  it('aceita até quatro competências de 31 dias na consulta da Agenda', () => {
    expect(MAXIMO_DATAS_POR_CONSULTA_AGENDA).toBeGreaterThanOrEqual(31 * 4);
  });

  it('preserva datas ISO para a consulta SQL por dia e descarta entradas inválidas', () => {
    expect(normalizarDatasParaConsultaAgenda([
      '2026-08-13',
      '2026-08-13',
      '13/08/2026',
      '2026-08-20',
    ])).toEqual(['2026-08-13', '2026-08-20']);
  });

  it('solicita retorno seguro somente quando o período filtrado não retorna pacientes', () => {
    expect(deveUsarRetornoSeguroDaAgenda(['2026-08-13'], 0)).toBe(true);
    expect(deveUsarRetornoSeguroDaAgenda(['2026-08-13'], 1)).toBe(false);
    expect(deveUsarRetornoSeguroDaAgenda([], 0)).toBe(false);
  });
});
