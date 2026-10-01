import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const agenda = readFileSync(resolve(__dirname, '../client/src/pages/Agenda.tsx'), 'utf-8');

describe('ação de pré-faturamento individual na Agenda', () => {
  it('abre o formulário de guia individual sem redirecionar automaticamente à guia da série', () => {
    expect(agenda).toContain('Criar Guia Individual');
    expect(agenda).toContain('setVincularGuiaASerie(false);');
    expect(agenda).not.toContain('A Guia SADT desta série já existe. Abrindo o pré-faturamento vinculado.');
  });
});
