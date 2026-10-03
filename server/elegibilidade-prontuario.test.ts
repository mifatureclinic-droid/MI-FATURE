import { describe, expect, it } from 'vitest';
import {
  convenioIsentoDeAssinaturaDigital,
  unirPacientesElegiveisProntuario,
} from '../shared/elegibilidadeProntuario';

describe('elegibilidade de pacientes no Prontuário', () => {
  it('reconhece PROASA Saúde, PROASA PARÁ e Mediservice como convênios isentos', () => {
    expect(convenioIsentoDeAssinaturaDigital('Proasa Saúde')).toBe(true);
    expect(convenioIsentoDeAssinaturaDigital('PROASA PARÁ')).toBe(true);
    expect(convenioIsentoDeAssinaturaDigital('MEDISERVICE')).toBe(true);
  });

  it('mantém a assinatura obrigatória para os outros convênios', () => {
    expect(convenioIsentoDeAssinaturaDigital('Bradesco Saúde')).toBe(false);
  });

  it('une pacientes assinados, pacientes de guia legada e pacientes isentos sem duplicar', () => {
    expect(unirPacientesElegiveisProntuario([10, null], [11], [10, 12], [13, undefined]))
      .toEqual([10, 11, 12, 13]);
  });
});
