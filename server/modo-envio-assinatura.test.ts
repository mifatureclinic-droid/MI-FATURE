import { describe, expect, it } from 'vitest';
import { determinarModoEnvioAssinatura, deveEnviarWhatsApp } from '../shared/modoEnvioAssinatura.mjs';

describe('modo de preparação de links de assinatura', () => {
  it('prepara tokens sem autorizar o WhatsApp', () => {
    const modo = determinarModoEnvioAssinatura({ aplicar: false, preparar: true });
    expect(modo).toBe('preparado');
    expect(deveEnviarWhatsApp(modo)).toBe(false);
  });

  it('só autoriza o WhatsApp no modo aplicado', () => {
    expect(deveEnviarWhatsApp(determinarModoEnvioAssinatura({ aplicar: true, preparar: true }))).toBe(true);
    expect(deveEnviarWhatsApp(determinarModoEnvioAssinatura({ aplicar: false, preparar: false }))).toBe(false);
  });
});
