import { describe, expect, it } from 'vitest';
import { ALTURA_UTIL_A4_HORIZONTAL_PX, calcularEscalaImpressaoGuiaSadt } from '../shared/impressaoGuiaSadt';

describe('calcularEscalaImpressaoGuiaSadt', () => {
  it('mantém o tamanho original quando a guia já cabe na folha A4 horizontal', () => {
    expect(calcularEscalaImpressaoGuiaSadt(ALTURA_UTIL_A4_HORIZONTAL_PX)).toBe(1);
    expect(calcularEscalaImpressaoGuiaSadt(500)).toBe(1);
  });

  it('reduz proporcionalmente guias maiores para caberem em uma única folha', () => {
    expect(calcularEscalaImpressaoGuiaSadt(1542)).toBe(0.5);
  });

  it('trata medições indisponíveis sem ocultar o documento', () => {
    expect(calcularEscalaImpressaoGuiaSadt(0)).toBe(1);
    expect(calcularEscalaImpressaoGuiaSadt(Number.NaN)).toBe(1);
  });
});
