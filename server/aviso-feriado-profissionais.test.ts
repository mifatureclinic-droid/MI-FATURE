import { describe, expect, it } from 'vitest';
import {
  AVISO_FERIADO_SETEMBRO_2026,
  deveExibirAvisoFeriado,
  montarAvisoCienciaEmail,
} from '../shared/avisoFeriadoProfissionais';

describe('aviso temporário de feriado para profissionais', () => {
  it('exibe para profissional sem ciência durante os sete dias da vigência', () => {
    expect(deveExibirAvisoFeriado({
      perfil: 'profissional',
      dataReferencia: AVISO_FERIADO_SETEMBRO_2026.inicio,
      cienteHoje: false,
    })).toBe(true);
  });

  it('oculta após a ciência no dia e reapresenta no dia seguinte', () => {
    expect(deveExibirAvisoFeriado({
      perfil: 'profissional',
      dataReferencia: '2026-08-12',
      cienteHoje: true,
    })).toBe(false);
    expect(deveExibirAvisoFeriado({
      perfil: 'profissional',
      dataReferencia: '2026-08-13',
      cienteHoje: false,
    })).toBe(true);
  });

  it('usa a referência diária no formato DATE para identificar uma ciência já registrada', () => {
    expect(AVISO_FERIADO_SETEMBRO_2026.inicio).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(AVISO_FERIADO_SETEMBRO_2026.inicio).toBe('2026-08-12');
  });

  it('não exibe para recepção nem fora da vigência', () => {
    expect(deveExibirAvisoFeriado({ perfil: 'recepcao', dataReferencia: '2026-08-12', cienteHoje: false })).toBe(false);
    expect(deveExibirAvisoFeriado({ perfil: 'profissional', dataReferencia: '2026-08-19', cienteHoje: false })).toBe(false);
  });

  it('monta e-mail com nome e horário de Manaus da ciência', () => {
    const mensagem = montarAvisoCienciaEmail({
      profissional: 'Dra. Suzy',
      dataCiencia: new Date('2026-08-12T16:30:00.000Z'),
    });
    expect(mensagem.assunto).toContain('Ciência registrada');
    expect(mensagem.texto).toContain('Dra. Suzy');
    expect(mensagem.texto).toContain('Manaus');
  });
});
