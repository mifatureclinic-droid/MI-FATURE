import { describe, expect, it } from 'vitest';
import { normalizarCnpjPrestadorTiss, resolverCodigoClinicaNaOperadoraTiss } from '../shared/identificacaoPrestadorTiss';

describe('identificação do prestador no lote TISS', () => {
  it('remove a máscara do CNPJ antes de gravar o lote', () => {
    expect(normalizarCnpjPrestadorTiss('22.218.474/0001-47')).toBe('22218474000147');
  });

  it('mantém o limite de quatorze dígitos do campo de lote', () => {
    expect(normalizarCnpjPrestadorTiss('12.345.678/9012-3456')).toBe('12345678901234');
  });

  it('prioriza o código da clínica na operadora cadastrado no convênio', () => {
    expect(resolverCodigoClinicaNaOperadoraTiss({
      codigoNaOperadora: 'CLINICA-POSTAL',
      codigoPrestadorNaOperadora: 'CODIGO-GERAL',
      cnpj: '22.218.474/0001-47',
    })).toBe('CLINICA-POSTAL');
  });

  it('usa o código geral somente quando o cadastro do convênio está vazio', () => {
    expect(resolverCodigoClinicaNaOperadoraTiss({
      codigoNaOperadora: '  ',
      codigoPrestadorNaOperadora: 'CODIGO-GERAL',
      cnpj: '22.218.474/0001-47',
    })).toBe('CODIGO-GERAL');
  });
});
