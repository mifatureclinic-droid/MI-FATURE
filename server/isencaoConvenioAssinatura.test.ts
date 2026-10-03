import { describe, expect, it } from 'vitest';
import { convenioIsentoDeAssinaturaDigital } from '../shared/elegibilidadeProntuario';

describe('convenioIsentoDeAssinaturaDigital', () => {
  it('reconhece as duas grafias usadas para Mediservice', () => {
    expect(convenioIsentoDeAssinaturaDigital('MEDISERVICE')).toBe(true);
    expect(convenioIsentoDeAssinaturaDigital('MEDSERVICE')).toBe(true);
  });

  it('mantém PROASA como convênio isento e não isenta GEAP', () => {
    expect(convenioIsentoDeAssinaturaDigital('PROASA PARÁ')).toBe(true);
    expect(convenioIsentoDeAssinaturaDigital('GEAP')).toBe(false);
  });
});
