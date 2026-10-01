import { describe, expect, it } from 'vitest';
import {
  MENSAGEM_ASSINATURA_EM_GUIA_FISICA,
  convenioUsaAssinaturaEmGuiaFisica,
} from '@shared/assinaturaGuiaFisica';

describe('assinatura em guia física por convênio', () => {
  it.each([
    'PROASA Saúde',
    'PROASA PARÁ',
    'AFFEAM',
    'MEDISERVICE',
    'MEDSERVICE',
    'FUSEX',
  ])('reconhece %s como convênio de guia física', (convenio) => {
    expect(convenioUsaAssinaturaEmGuiaFisica(convenio)).toBe(true);
  });

  it('mantém outros convênios elegíveis para assinatura digital', () => {
    expect(convenioUsaAssinaturaEmGuiaFisica('BRADESCO SAÚDE')).toBe(false);
    expect(MENSAGEM_ASSINATURA_EM_GUIA_FISICA).toContain('guia física');
  });
});
