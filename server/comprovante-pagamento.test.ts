import { describe, expect, it } from 'vitest';
import { normalizarChaveComprovante } from '../shared/comprovantePagamento';

describe('normalizarChaveComprovante', () => {
  it('preserva uma chave de armazenamento direta', () => {
    expect(normalizarChaveComprovante('pagamentos/780269/comprovante.pdf')).toBe('pagamentos/780269/comprovante.pdf');
  });

  it('remove o prefixo manus-storage de URL legada', () => {
    expect(normalizarChaveComprovante('/manus-storage/pagamentos/780269/comprovante.pdf')).toBe('pagamentos/780269/comprovante.pdf');
  });

  it('normaliza URL absoluta legada com caminho manus-storage', () => {
    expect(normalizarChaveComprovante('https://mifature.click/manus-storage/pagamentos/780269/comprovante.pdf')).toBe('pagamentos/780269/comprovante.pdf');
  });
});
