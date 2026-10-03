import { describe, expect, it } from 'vitest';
import {
  deveIgnorarElementoNaCapturaPdf,
  estiloPossuiCorIncompativelComHtml2Canvas,
  OPCOES_SEGURO_CAPTURA_PDF,
} from './pdfCaptureCompat';

describe('compatibilidade da captura de PDF', () => {
  it('reconhece as funções modernas de cor que html2canvas não interpreta', () => {
    expect(estiloPossuiCorIncompativelComHtml2Canvas('oklch(0.92 0.03 160)')).toBe(true);
    expect(estiloPossuiCorIncompativelComHtml2Canvas('oklab(0.92 -0.03 0.04)')).toBe(true);
    expect(estiloPossuiCorIncompativelComHtml2Canvas('linear-gradient(oklch(0.92 0.03 160), #fff)')).toBe(true);
  });

  it('mantém cores legadas compatíveis com html2canvas', () => {
    expect(estiloPossuiCorIncompativelComHtml2Canvas('rgb(255, 255, 255)')).toBe(false);
    expect(estiloPossuiCorIncompativelComHtml2Canvas('#111827')).toBe(false);
  });

  it('ignora apenas ícones SVG decorativos na captura da guia', () => {
    expect(deveIgnorarElementoNaCapturaPdf({ tagName: 'svg', getAttribute: () => null } as Element)).toBe(true);
    expect(deveIgnorarElementoNaCapturaPdf({ tagName: 'div', getAttribute: () => null } as Element)).toBe(false);
  });

  it('não permite canvas contaminado por recursos externos', () => {
    expect(OPCOES_SEGURO_CAPTURA_PDF.useCORS).toBe(true);
    expect(OPCOES_SEGURO_CAPTURA_PDF.allowTaint).toBe(false);
  });

  it('mantém assinaturas incorporadas e ignora somente imagens externas', () => {
    const imagemAssinatura = { tagName: 'img', getAttribute: () => 'data:image/png;base64,assinatura' } as Element;
    const imagemExterna = { tagName: 'img', getAttribute: () => '/manus-storage/logo.png' } as Element;

    expect(deveIgnorarElementoNaCapturaPdf(imagemAssinatura)).toBe(false);
    expect(deveIgnorarElementoNaCapturaPdf(imagemExterna)).toBe(true);
  });
});
