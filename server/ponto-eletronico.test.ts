import { describe, expect, it } from 'vitest';
import { calcularResumoMensalPonto, calcularResumoPonto, JORNADA_PADRAO_RECEPCAO } from '../shared/pontoEletronico';

describe('apuração do ponto eletrônico', () => {
  it('aplica a tolerância de até cinco minutos por marcação e dez minutos no dia', () => {
    const resumo = calcularResumoPonto({ entrada: '08:03', inicioIntervalo: '12:00', fimIntervalo: '13:00', saida: '17:05' }, JORNADA_PADRAO_RECEPCAO);
    expect(resumo.toleranciaAplicada).toBe(true);
    expect(resumo.horasExtrasMinutos).toBe(0);
    expect(resumo.atrasoMinutos).toBe(0);
  });

  it('apura hora extra fora da tolerância com adicional configurado', () => {
    const resumo = calcularResumoPonto({ entrada: '08:00', inicioIntervalo: '12:00', fimIntervalo: '13:00', saida: '17:30' }, { ...JORNADA_PADRAO_RECEPCAO, valorHora: 20 });
    expect(resumo.horasExtrasMinutos).toBe(30);
    expect(resumo.valorHoraExtra).toBe(15);
  });

  it('mantém a jornada pendente até que as quatro marcações sejam realizadas', () => {
    const resumo = calcularResumoPonto({ entrada: '08:00', inicioIntervalo: '12:00' }, JORNADA_PADRAO_RECEPCAO);
    expect(resumo.completo).toBe(false);
  });

  it('não conta folga, férias e atestado como faltas no resumo mensal', () => {
    const resumo = calcularResumoMensalPonto({
      competencia: '2026-08',
      dataLimite: '2026-08-07',
      jornada: JORNADA_PADRAO_RECEPCAO,
      registros: [{ data: '2026-08-03', entrada: '08:00', inicioIntervalo: '12:00', fimIntervalo: '13:00', saida: '17:00' }],
      ocorrencias: [
        { tipo: 'folga', dataInicio: '2026-08-04', dataFim: '2026-08-04' },
        { tipo: 'ferias', dataInicio: '2026-08-05', dataFim: '2026-08-05' },
        { tipo: 'atestado', dataInicio: '2026-08-06', dataFim: '2026-08-06' },
      ],
    });
    expect(resumo.faltas).toBe(1);
    expect(resumo.folgas).toBe(1);
    expect(resumo.ferias).toBe(1);
    expect(resumo.atestados).toBe(1);
    expect(resumo.diasCompletos).toBe(1);
  });

  it('consolida horas trabalhadas, atrasos e extras apenas em registros completos', () => {
    const resumo = calcularResumoMensalPonto({
      competencia: '2026-08',
      dataLimite: '2026-08-04',
      jornada: { ...JORNADA_PADRAO_RECEPCAO, valorHora: 20, adicionalHoraExtra: 50 },
      registros: [
        { data: '2026-08-03', entrada: '08:00', inicioIntervalo: '12:00', fimIntervalo: '13:00', saida: '18:00' },
        { data: '2026-08-04', entrada: '08:30' },
      ],
      ocorrencias: [],
    });
    expect(resumo.minutosTrabalhados).toBe(540);
    expect(resumo.horasExtrasMinutos).toBe(60);
    expect(resumo.registrosIncompletos).toBe(1);
    expect(resumo.valorHorasExtras).toBe(30);
  });
});
