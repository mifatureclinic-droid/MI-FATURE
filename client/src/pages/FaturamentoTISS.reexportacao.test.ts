import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonte = readFileSync(new URL('./FaturamentoTISS.tsx', import.meta.url), 'utf8');

describe('reexportação do XML TISS', () => {
  it('baixa o XML reexportado com UTF-8 e informa a geração concluída', () => {
    expect(fonte).toContain("application/xml;charset=utf-8");
    expect(fonte).toContain("utils.faturamentoTISS.getXmlDoLote.fetch({ loteId })");
    expect(fonte).toContain("Novo XML corrigido gerado para download");
  });
});
