/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
import {
  criarUrlDeAtualizacaoDeModulo,
  ehErroDeModuloDinamico,
} from '@/lib/errosInterface';

describe('ErrorBoundary', () => {
  beforeEach(() => {
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('agenda uma única recuperação para NotFoundError de removeChild', () => {
    const boundary = new ErrorBoundary({ children: null });
    const setState = vi.spyOn(boundary, 'setState').mockImplementation((atualizacao: any) => {
      const proximoEstado = typeof atualizacao === 'function'
        ? atualizacao(boundary.state, boundary.props)
        : atualizacao;
      boundary.state = { ...boundary.state, ...proximoEstado };
    });
    let recuperar: (() => void) | undefined;
    const agendarRecuperacao = vi.spyOn(window, 'setTimeout').mockImplementation((callback) => {
      recuperar = callback as () => void;
      return undefined as unknown as ReturnType<typeof window.setTimeout>;
    });

    boundary.componentDidCatch(new DOMException('Falha ao executar removeChild em Node', 'NotFoundError'));

    expect(agendarRecuperacao).toHaveBeenCalledTimes(1);
    recuperar?.();
    expect(setState).toHaveBeenCalledTimes(1);
    expect(boundary.state).toMatchObject({
      hasError: false,
      error: null,
      tentativasDeRecuperacao: 1,
    });
  });

  it('não tenta recuperar falhas persistentes que não são de desmontagem', () => {
    const boundary = new ErrorBoundary({ children: null });
    const setState = vi.spyOn(boundary, 'setState');
    const agendarRecuperacao = vi.spyOn(window, 'setTimeout');

    boundary.componentDidCatch(new Error('Falha persistente de renderização'));

    expect(setState).not.toHaveBeenCalled();
    expect(agendarRecuperacao).not.toHaveBeenCalled();
  });

  it('reconhece módulos dinâmicos desatualizados e gera uma URL nova sem perder a rota', () => {
    const erro = new TypeError('Failed to fetch dynamically imported module: https://mifature.click/assets/Login-antigo.js');

    expect(ehErroDeModuloDinamico(erro)).toBe(true);
    expect(criarUrlDeAtualizacaoDeModulo(
      'https://mifature.click/guias-sadt?guia=4980032',
      '12345',
    )).toBe('https://mifature.click/guias-sadt?guia=4980032&atualizar=12345');
  });

  it('não classifica falhas regulares de renderização como módulo dinâmico', () => {
    expect(ehErroDeModuloDinamico(new Error('Falha regular de formulário'))).toBe(false);
  });
});
