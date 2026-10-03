import { describe, expect, it } from 'vitest';
import { normalizarDadosConvenio } from '@shared/dadosConvenio';

describe('normalizarDadosConvenio', () => {
  it('omite campos opcionais vazios antes da criação', () => {
    expect(normalizarDadosConvenio({
      nome: ' Convênio Exemplo ',
      cnpj: '',
      aniversarioConvenio: '',
      email: ' ',
      registroANS: ' 123456 ',
    })).toEqual({
      nome: 'Convênio Exemplo',
      registroANS: '123456',
    });
  });

  it('preserva uma data informada para conversão no servidor', () => {
    expect(normalizarDadosConvenio({
      nome: 'Convênio Exemplo',
      aniversarioConvenio: '2026-08-01',
    })).toEqual({
      nome: 'Convênio Exemplo',
      aniversarioConvenio: '2026-08-01',
    });
  });
});
