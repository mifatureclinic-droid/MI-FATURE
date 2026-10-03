import { describe, expect, it } from 'vitest';
import { podeGerenciarDatasAssinatura } from '../shared/permissoesAssinatura';

describe('permissões de gestão de datas de assinatura', () => {
  it('autoriza administrador, master e recepção', () => {
    expect(podeGerenciarDatasAssinatura(undefined, 'admin')).toBe(true);
    expect(podeGerenciarDatasAssinatura('administrador')).toBe(true);
    expect(podeGerenciarDatasAssinatura('master')).toBe(true);
    expect(podeGerenciarDatasAssinatura('recepção')).toBe(true);
    expect(podeGerenciarDatasAssinatura('recepcao')).toBe(true);
    expect(podeGerenciarDatasAssinatura('recepcionista')).toBe(true);
  });

  it('não autoriza o perfil profissional a alterar provas de assinatura', () => {
    expect(podeGerenciarDatasAssinatura('profissional')).toBe(false);
  });
});
