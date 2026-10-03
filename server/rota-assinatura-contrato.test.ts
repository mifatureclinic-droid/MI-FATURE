import { describe, expect, it } from 'vitest';
import { extrairTokenAssinaturaContrato } from '../shared/rotaAssinaturaContrato';

describe('rota pública de assinatura de contrato', () => {
  it('extrai o token mesmo quando a página é renderizada fora de uma Route do Wouter', () => {
    expect(extrairTokenAssinaturaContrato('/assinar-contrato/token-seguro')).toBe('token-seguro');
  });

  it('remove parâmetros de consulta e hash do token público', () => {
    expect(extrairTokenAssinaturaContrato('/assinar-contrato/token-seguro?utm=whatsapp#assinatura')).toBe('token-seguro');
  });

  it('não interpreta rotas diferentes como links de contrato', () => {
    expect(extrairTokenAssinaturaContrato('/assinar-sessao/token-seguro')).toBe('');
  });
});
