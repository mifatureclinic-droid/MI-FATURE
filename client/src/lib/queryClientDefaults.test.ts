import { describe, expect, it } from 'vitest';
import { queryClientDefaults } from './queryClientDefaults';

describe('política de cache das consultas', () => {
  it('evita recarregar a mesma consulta a cada foco da janela', () => {
    expect(queryClientDefaults.queries.staleTime).toBe(30_000);
    expect(queryClientDefaults.queries.refetchOnWindowFocus).toBe(false);
    expect(queryClientDefaults.queries.refetchOnReconnect).toBe(false);
    expect(queryClientDefaults.queries.retry).toBe(1);
  });
});
