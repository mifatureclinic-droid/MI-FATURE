import { describe, expect, it } from 'vitest';
import { podeGerirPastaPaciente } from '../shared/permissoesPastaPaciente';

describe('permissões da Pasta do Paciente', () => {
  it('permite que recepção acesse anamnese e contrato terapêutico', () => {
    expect(podeGerirPastaPaciente({ perfil: 'recepcao' })).toBe(true);
    expect(podeGerirPastaPaciente({ perfil: 'recepção' })).toBe(true);
    expect(podeGerirPastaPaciente({ perfil: 'recepcionista' })).toBe(true);
  });

  it('permite que master e administrador gerenciem anexos e documentos', () => {
    expect(podeGerirPastaPaciente({ perfil: 'master' })).toBe(true);
    expect(podeGerirPastaPaciente({ perfil: 'administrador' })).toBe(true);
    expect(podeGerirPastaPaciente({ role: 'admin' })).toBe(true);
  });

  it('mantém os documentos indisponíveis para perfis não autorizados', () => {
    expect(podeGerirPastaPaciente({ perfil: 'usuario' })).toBe(false);
    expect(podeGerirPastaPaciente(null)).toBe(false);
  });
});
