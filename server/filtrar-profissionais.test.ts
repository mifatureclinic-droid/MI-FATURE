import { describe, expect, it } from 'vitest';
import { filtrarProfissionaisPorBusca } from '../shared/filtrarProfissionais';

describe('filtrarProfissionaisPorBusca', () => {
  const profissionais = [
    { nome: 'Dra. Suzy', crm: 'CRP 20/1234', especialidade: 'Psicologia', ativo: 1 },
    { nome: 'Dra. Thiffane', crm: null, especialidade: null, ativo: 1 },
    { nome: 'Profissional Inativo', crm: 'CRP 20/9999', especialidade: 'Psicologia', ativo: 0 },
  ];

  it('localiza por nome sem depender de maiúsculas, minúsculas ou espaços', () => {
    expect(filtrarProfissionaisPorBusca(profissionais, '  suzy ', false))
      .toEqual([profissionais[0]]);
  });

  it('não falha quando CRM ou especialidade estão ausentes em cadastro legado', () => {
    expect(filtrarProfissionaisPorBusca(profissionais, 'thiffane', false))
      .toEqual([profissionais[1]]);
    expect(filtrarProfissionaisPorBusca(profissionais, 'psicologia', false))
      .toEqual([profissionais[0]]);
  });

  it('oculta inativos por padrão e permite incluí-los quando solicitado', () => {
    expect(filtrarProfissionaisPorBusca(profissionais, '', false)).toHaveLength(2);
    expect(filtrarProfissionaisPorBusca(profissionais, 'inativo', true))
      .toEqual([profissionais[2]]);
  });
});
