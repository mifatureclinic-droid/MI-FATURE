import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('alteração manual de duração na Agenda', () => {
  it('usa as opções de duração do profissional no menu de ações', () => {
    const agenda = readFileSync(resolve(process.cwd(), 'client/src/pages/Agenda.tsx'), 'utf8');
    expect(agenda).toContain("from '@shared/duracaoRepasseProfissional';");
    expect(agenda).toContain('opcoesDuracaoParaProfissional(getProfissionalNome(atendimentoSelecionado?.profissionalId))');
    expect(agenda).toContain('profissionalRecebeDuasUnidadesPorHora(getProfissionalNome(atendimentoSelecionado?.profissionalId || 0))');
    expect(agenda).toContain('1 hora equivale a 2 unidades de repasse');
  });
});
