import { describe, expect, it } from 'vitest';
import { ehProfissionalNoMenu, podeExibirAcoesAdministrativas, podeExcluirPaciente } from '../shared/acoesPorPerfil';

describe('visibilidade de ações por perfil', () => {
  it('oculta a coluna e o menu de ações para profissional', () => {
    expect(podeExibirAcoesAdministrativas({ perfil: 'profissional', role: 'user' })).toBe(false);
    expect(podeExibirAcoesAdministrativas({ perfil: undefined, role: 'user', profissionalVinculadoId: 570009 })).toBe(false);
    expect(ehProfissionalNoMenu({ perfil: ' PROFISSIONAL ', role: 'user' })).toBe(true);
  });

  it('mantém a coluna e o menu para master, recepção e administrador', () => {
    expect(podeExibirAcoesAdministrativas({ perfil: 'master', role: 'user' })).toBe(true);
    expect(podeExibirAcoesAdministrativas({ perfil: 'recepcao', role: 'user' })).toBe(true);
    expect(podeExibirAcoesAdministrativas({ perfil: 'recepção', role: 'user' })).toBe(true);
    expect(podeExibirAcoesAdministrativas({ perfil: 'recepcionista', role: 'user' })).toBe(true);
    expect(podeExibirAcoesAdministrativas({ perfil: 'administrador', role: 'user', profissionalVinculadoId: 570015 })).toBe(true);
    expect(podeExibirAcoesAdministrativas({ perfil: undefined, role: 'admin', profissionalVinculadoId: 570015 })).toBe(true);
  });

  it('permite excluir pacientes somente ao perfil master', () => {
    expect(podeExcluirPaciente({ perfil: 'master' })).toBe(true);
    expect(podeExcluirPaciente({ perfil: ' MASTER ' })).toBe(true);
    expect(podeExcluirPaciente({ perfil: 'recepcao' })).toBe(false);
    expect(podeExcluirPaciente({ perfil: 'administrador' })).toBe(false);
    expect(podeExcluirPaciente({ perfil: undefined, role: 'admin' })).toBe(false);
    expect(podeExcluirPaciente({ perfil: 'profissional' })).toBe(false);
  });
});
