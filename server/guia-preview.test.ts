import { describe, expect, it } from 'vitest';
import { prepararGuiaParaPreview } from '../shared/guiaPreview';

describe('pré-visualização de guia', () => {
  it('prepara uma guia identificada para abrir no modal', () => {
    const guia = { id: 1170001, numeroGuia: 'GUIA-2026-001' };
    expect(prepararGuiaParaPreview(guia)).toEqual(guia);
  });

  it('bloqueia a abertura quando não há guia ou identificador', () => {
    expect(prepararGuiaParaPreview(null)).toBeNull();
    expect(prepararGuiaParaPreview({ numeroGuia: 'SEM-ID' })).toBeNull();
  });
});
