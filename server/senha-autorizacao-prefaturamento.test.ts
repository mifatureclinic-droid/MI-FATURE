import { describe, expect, it } from 'vitest';
import {
  normalizarSenhaAutorizacaoPrefaturamento,
  resolverSenhaExibidaNoPrefaturamento,
} from '../shared/senhaAutorizacaoPrefaturamento';

describe('senha de autorização no pré-faturamento', () => {
  it('prioriza a senha já vinculada à Guia SADT', () => {
    expect(resolverSenhaExibidaNoPrefaturamento({
      senhaAutorizacao: ' SENHA-123 ',
      numeroAutorizacao: 'AUT-ANTIGA',
    })).toBe('SENHA-123');
  });

  it('usa o número de autorização somente quando a guia ainda não possui senha', () => {
    expect(resolverSenhaExibidaNoPrefaturamento({
      senhaAutorizacao: null,
      numeroAutorizacao: ' AUT-456 ',
    })).toBe('AUT-456');
  });

  it('preserva uma limpeza intencional e não altera guia quando o campo não foi enviado', () => {
    expect(normalizarSenhaAutorizacaoPrefaturamento('   ')).toBe('');
    expect(normalizarSenhaAutorizacaoPrefaturamento(undefined)).toBeUndefined();
  });
});
