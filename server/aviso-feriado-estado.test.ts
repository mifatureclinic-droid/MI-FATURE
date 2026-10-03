import { describe, expect, it } from 'vitest';
import { aplicarCienciaNoAviso } from '../shared/avisoFeriadoEstado';

describe('aplicarCienciaNoAviso', () => {
  it('oculta imediatamente o aviso do dia após a ciência', () => {
    expect(aplicarCienciaNoAviso({ exibir: true, cienteHoje: false, titulo: 'Atenção' })).toEqual({
      exibir: false,
      cienteHoje: true,
      titulo: 'Atenção',
    });
  });

  it('mantém indefinido quando o cache ainda não possui o aviso', () => {
    expect(aplicarCienciaNoAviso(undefined)).toBeUndefined();
  });
});
