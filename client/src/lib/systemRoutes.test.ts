import { describe, expect, it } from 'vitest';
import { getSystemLocationForPage, getSystemPageFromLocation } from './systemRoutes';

describe('rotas internas do sistema', () => {
  it('resolve a rota direta do painel Bradesco', () => {
    expect(getSystemPageFromLocation('/autorizacoes-bradesco')).toBe('autorizacoes-bradesco');
    expect(getSystemPageFromLocation('/autorizacoes-bradesco?filtro=liberada')).toBe('autorizacoes-bradesco');
  });

  it('mantém a navegação do painel Bradesco na rota direta correspondente', () => {
    expect(getSystemLocationForPage('autorizacoes-bradesco')).toBe('/autorizacoes-bradesco');
    expect(getSystemLocationForPage('pagina-inexistente')).toBe('/');
  });

  it('preserva a resolução de rotas críticas já existentes', () => {
    expect(getSystemPageFromLocation('/agenda')).toBe('agenda');
    expect(getSystemPageFromLocation('/faturamento-tiss')).toBe('faturamento-tiss');
    expect(getSystemPageFromLocation('/ponto-eletronico')).toBe('ponto-eletronico');
    expect(getSystemPageFromLocation('/dashboard')).toBe('dashboard');
  });
});
