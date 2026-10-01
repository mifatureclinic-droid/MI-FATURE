import { describe, expect, it } from 'vitest';
import { resolverSerieDaGuiaPrefaturamento } from '../shared/serieGuiaPrefaturamento';

describe('resolverSerieDaGuiaPrefaturamento', () => {
  it('preserva a série explícita da guia', () => {
    expect(resolverSerieDaGuiaPrefaturamento('serie-psicoterapia', 'serie-avaliacao'))
      .toBe('serie-psicoterapia');
  });

  it('usa a série do atendimento vinculado quando a guia não a persistiu', () => {
    expect(resolverSerieDaGuiaPrefaturamento(null, 'serie-avaliacao'))
      .toBe('serie-avaliacao');
  });

  it('não cria vínculo de série quando nenhum identificador foi informado', () => {
    expect(resolverSerieDaGuiaPrefaturamento(' ', null)).toBeNull();
  });
});
