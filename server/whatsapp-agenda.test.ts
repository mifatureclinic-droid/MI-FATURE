import { describe, expect, it } from 'vitest';
import { criarLinkWhatsAppAgenda } from '../shared/whatsappAgenda';

describe('atalho de WhatsApp da Agenda', () => {
  it('normaliza número brasileiro sem código do país', () => {
    expect(criarLinkWhatsAppAgenda('(92) 99999-1234')).toBe('https://wa.me/5592999991234');
  });

  it('preserva número já informado com código do país', () => {
    expect(criarLinkWhatsAppAgenda('55 92 99999-1234')).toBe('https://wa.me/5592999991234');
  });

  it('não cria link para telefone ausente ou incompleto', () => {
    expect(criarLinkWhatsAppAgenda(null)).toBeNull();
    expect(criarLinkWhatsAppAgenda('999')).toBeNull();
  });
});
