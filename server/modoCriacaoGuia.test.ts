import { describe, expect, it } from 'vitest';
import { deveCriarGuiaParaSerie } from '../shared/modoCriacaoGuia';

describe('modo de criação de guia', () => {
  it('mantém a guia individual quando há série, mas não há confirmação explícita', () => {
    expect(deveCriarGuiaParaSerie(false, 'serie-01')).toBe(false);
  });

  it('só cria guia de série após confirmação explícita e identificador válido', () => {
    expect(deveCriarGuiaParaSerie(true, 'serie-01')).toBe(true);
    expect(deveCriarGuiaParaSerie(true, '')).toBe(false);
    expect(deveCriarGuiaParaSerie(true, null)).toBe(false);
  });
});
