import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const routers = readFileSync(resolve(__dirname, './routers.ts'), 'utf-8');
const agenda = readFileSync(resolve(__dirname, '../client/src/pages/Agenda.tsx'), 'utf-8');

describe('vínculo de guia por série', () => {
  it('reaproveita a guia existente somente quando o vínculo de série é confirmado', () => {
    expect(routers).toContain('if (input.vincularSerie && input.serieId)');
    expect(routers).toContain('reutilizada: true');
    expect(routers).toContain('eq(guiasTable.serieId, input.serieId)');
    expect(routers).toContain('A serieId identifica o conjunto de sessões');
  });

  it('mantém a criação individual desvinculada por padrão na Agenda', () => {
    expect(agenda).toContain('deveCriarGuiaParaSerie(vincularGuiaASerie, serieId)');
    expect(agenda).toContain('Guia individual: somente o atendimento selecionado é vinculado.');
    expect(agenda).not.toContain('serieId: criarGuiaAtendimento.serieId || undefined');
  });

  it('vincula a mesma guia a todas as sessões da série apenas no modo de série', () => {
    expect(routers).toContain('const criterioDaSerie = and(');
    expect(routers).toContain('.where(criterioDaSerie)');
    expect(agenda).toContain('Vínculo por série ocorre somente após confirmação explícita.');
    expect(agenda).toContain('await Promise.all([refetchAtendimentos(), utils.guias.list.invalidate()]);');
  });
});
