import { describe, expect, it } from 'vitest';

function validarProcedimentoManual(codigo: string, descricao: string, valor: string) {
  const codigoNormalizado = codigo.trim();
  const descricaoNormalizada = descricao.trim();
  const valorNumerico = Number.parseFloat(valor);
  return {
    valido: Boolean(codigoNormalizado && descricaoNormalizada && Number.isFinite(valorNumerico) && valorNumerico >= 0),
    codigoNormalizado,
    descricaoNormalizada,
    valorFormatado: Number.isFinite(valorNumerico) ? valorNumerico.toFixed(2) : null,
  };
}

describe('cadastro manual de procedimento por convênio', () => {
  it('normaliza os dados válidos antes do salvamento', () => {
    expect(validarProcedimentoManual(' 000000 ', ' SESSÃO DE PSICOTERAPIA ', '70'))
      .toEqual({
        valido: true,
        codigoNormalizado: '000000',
        descricaoNormalizada: 'SESSÃO DE PSICOTERAPIA',
        valorFormatado: '70.00',
      });
  });

  it('exige código, descrição e valor válido', () => {
    expect(validarProcedimentoManual('', 'Sessão', '70').valido).toBe(false);
    expect(validarProcedimentoManual('100', '', '70').valido).toBe(false);
    expect(validarProcedimentoManual('100', 'Sessão', '-1').valido).toBe(false);
  });
});

function resolverExibicaoProcedimento(p: {
  codigoConvenio?: string | null;
  codigoANS?: string | null;
  descricaoConvenio?: string | null;
  descricaoANS?: string | null;
}) {
  return {
    codigo: p.codigoConvenio || p.codigoANS || '',
    descricao: p.descricaoConvenio || p.descricaoANS || '',
  };
}

describe('prioridade de procedimento específico do convênio', () => {
  it('mantém a descrição AFFEAM e o código do convênio em vez da descrição genérica da tabela', () => {
    expect(resolverExibicaoProcedimento({
      codigoConvenio: '50000470',
      codigoANS: '84250127',
      descricaoConvenio: 'SESSÃO EM PSICOTERAPIA INDIVIDUAL POR PSICÓLOGO',
      descricaoANS: 'AVAL. NEUROPSICOLÓGICA SESSÕES SUBSEQUENTES',
    })).toEqual({
      codigo: '50000470',
      descricao: 'SESSÃO EM PSICOTERAPIA INDIVIDUAL POR PSICÓLOGO',
    });
  });
});
