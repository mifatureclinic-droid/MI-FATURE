import { describe, expect, it } from 'vitest';
import { criarEntradaAssinaturasDaGuia } from './consultaAssinaturasGuia';

describe('criarEntradaAssinaturasDaGuia', () => {
  it('consulta somente a guia individual selecionada', () => {
    expect(criarEntradaAssinaturasDaGuia(240085)).toEqual({ guiaId: 240085 });
  });

  it('não permite substituir a guia por uma consulta ampla de paciente', () => {
    expect(criarEntradaAssinaturasDaGuia(undefined)).toBeNull();
    expect(criarEntradaAssinaturasDaGuia(0)).toBeNull();
  });
});
