import { describe, expect, it } from 'vitest';
import { montarContaReceberPagamento } from '../shared/contaReceberPagamento';

describe('conta a receber de pagamento particular', () => {
  it('cria a descrição e a categoria do pagamento particular para a competência correta', () => {
    expect(montarContaReceberPagamento({
      pacienteNome: 'ANA CLARA SILVA MOTA',
      referenciaDatas: '05/08/2026',
      valor: 220,
      convenioNome: 'Particular',
    })).toEqual({
      descricao: 'Pagamento recebido - ANA CLARA SILVA MOTA (Ref: 05/08/2026)',
      categoria: 'Atendimento Particular',
      valor: '220',
      status: 'recebido',
    });
  });
});
