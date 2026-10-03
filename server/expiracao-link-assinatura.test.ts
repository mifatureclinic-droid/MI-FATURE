import { describe, expect, it } from 'vitest';
import { calcularExpiracaoLinkManaus, janelaEnvioAssinaturaEstaAberta } from '../shared/expiracaoLinkAssinatura.mjs';

describe('calcularExpiracaoLinkManaus', () => {
  it('define a expiração uma hora antes e converte Manaus para UTC', () => {
    const resultado = calcularExpiracaoLinkManaus('2026-08-12', '15:00');
    expect(resultado?.horaManaus).toBe('14:00');
    expect(resultado?.timestampUtc.toISOString()).toBe('2026-08-12T18:00:00.000Z');
  });

  it('não permite criar link quando a consulta não tem janela de uma hora', () => {
    expect(calcularExpiracaoLinkManaus('2026-08-12', '00:30')).toBeNull();
  });

  it('permite informar outra antecedência de maneira explícita', () => {
    expect(calcularExpiracaoLinkManaus('2026-08-12', '15:00', 120)?.horaManaus).toBe('13:00');
  });

  it('permite gerar o link de consulta futura mesmo após a hora de expiração de hoje', () => {
    expect(janelaEnvioAssinaturaEstaAberta({
      dataSessao: '2026-08-14',
      dataAtual: '2026-08-13',
      horaAtual: '19:28',
      horaExpiracao: '13:00',
    })).toBe(true);
  });

  it('mantém o bloqueio de uma consulta de hoje após a hora de expiração', () => {
    expect(janelaEnvioAssinaturaEstaAberta({
      dataSessao: '2026-08-13',
      dataAtual: '2026-08-13',
      horaAtual: '19:28',
      horaExpiracao: '18:30',
    })).toBe(false);
  });
});
