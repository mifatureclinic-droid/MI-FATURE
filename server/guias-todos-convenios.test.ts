import { describe, expect, it } from 'vitest';
import { avaliarElegibilidadeGuia } from '../shared/guiaConvenioElegibilidade.mjs';

describe('elegibilidade para geração de guia por convênio', () => {
  const sessaoValida = {
    procedimentoConvenioId: 77,
    procedimento: 'Sessão de Psicoterapia',
    valorUnitario: '46.83',
  };

  it('aprova grupo com carteirinha, procedimento e valor válidos', () => {
    expect(avaliarElegibilidadeGuia({ numeroCarteira: '12345', sessoes: [sessaoValida] })).toMatchObject({
      processavel: true,
      procedimentoId: 77,
      valorUnitario: 46.83,
    });
  });

  it('bloqueia grupo sem carteirinha ou procedimento', () => {
    expect(avaliarElegibilidadeGuia({ numeroCarteira: '', sessoes: [sessaoValida] })).toMatchObject({ processavel: false, motivo: 'Paciente sem número de carteirinha.' });
    expect(avaliarElegibilidadeGuia({ numeroCarteira: '12345', sessoes: [{ ...sessaoValida, procedimentoConvenioId: null }] })).toMatchObject({ processavel: false, motivo: 'Sem procedimento vinculado.' });
  });

  it('bloqueia série com procedimentos distintos', () => {
    expect(avaliarElegibilidadeGuia({
      numeroCarteira: '12345',
      sessoes: [sessaoValida, { ...sessaoValida, procedimentoConvenioId: 88 }],
    })).toMatchObject({ processavel: false, motivo: 'Série possui procedimentos distintos.' });
  });
});
