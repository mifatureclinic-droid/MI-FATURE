import { describe, expect, it } from 'vitest';
import { extrairDatasAssinadas } from '@shared/datasAssinaturaGuia';

describe('datas de execução vinculadas às assinaturas da guia', () => {
  it('extrai e ordena todas as datas assinadas, sem duplicidades', () => {
    expect(extrairDatasAssinadas([
      { datasAtendimento: '["2026-08-19", "2026-08-05"]' },
      { dataSessao: '2026-08-12T15:00:00.000Z' },
      { datasAtendimento: '["2026-08-12"]' },
    ])).toEqual(['2026-08-05', '2026-08-12', '2026-08-19']);
  });

  it('aceita registros legados com data de assinatura direta', () => {
    expect(extrairDatasAssinadas([{ dataAssinatura: '20/08/2026' }])).toEqual(['2026-08-20']);
  });
});
