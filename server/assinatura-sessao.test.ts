import { describe, expect, it } from 'vitest';
import { encontrarAssinaturaDaSessao } from '../shared/assinaturaSessao';

describe('assinaturas no modal da Guia SADT', () => {
  it('encontra uma assinatura antiga pela data exata da sessão', () => {
    const assinatura = encontrarAssinaturaDaSessao([
      { dataAssinatura: '2026-08-11 15:00:33', assinaturaPacienteUrl: 'data:image/png;base64,ok' },
    ], '11/08/2026');

    expect(assinatura).not.toBeNull();
  });

  it('não reutiliza assinatura de outra data', () => {
    const assinatura = encontrarAssinaturaDaSessao([
      { dataAssinatura: '2026-08-11 15:00:33' },
    ], '2026-08-18');

    expect(assinatura).toBeNull();
  });

  it('prioriza a lista de datas indicada no link de assinatura', () => {
    const assinatura = encontrarAssinaturaDaSessao([
      { dataAssinatura: '2026-08-11', datasAtendimento: JSON.stringify(['2026-08-18']), assinaturaPacienteUrl: 'data:image/png;base64,ok' },
    ], '2026-08-18');

    expect(assinatura?.datasAtendimento).toContain('2026-08-18');
  });

  it('não marca link pendente ou hash como assinatura concluída', () => {
    const assinatura = encontrarAssinaturaDaSessao([
      { dataAssinatura: '2026-08-12', assinaturaPacienteUrl: '' },
      { dataAssinatura: '2026-08-12', assinaturaPacienteUrl: 'a'.repeat(64) },
    ], '2026-08-12');

    expect(assinatura).toBeNull();
  });
});
