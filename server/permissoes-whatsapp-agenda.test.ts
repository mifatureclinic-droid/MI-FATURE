import { describe, expect, it } from 'vitest';
import { podeUsarWhatsAppNaAgenda } from '../shared/permissoesWhatsappAgenda';

describe('permissões do WhatsApp na Agenda', () => {
  it('permite master, administrador e recepção', () => {
    expect(podeUsarWhatsAppNaAgenda({ perfil: 'master' })).toBe(true);
    expect(podeUsarWhatsAppNaAgenda({ perfil: 'administrador' })).toBe(true);
    expect(podeUsarWhatsAppNaAgenda({ perfil: 'recepção' })).toBe(true);
    expect(podeUsarWhatsAppNaAgenda({ role: 'admin' })).toBe(true);
  });

  it('oculta o atalho para profissionais e perfis não autorizados', () => {
    expect(podeUsarWhatsAppNaAgenda({ perfil: 'profissional' })).toBe(false);
    expect(podeUsarWhatsAppNaAgenda({ perfil: 'usuario' })).toBe(false);
  });
});
