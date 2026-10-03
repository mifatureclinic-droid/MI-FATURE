import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const agenda = readFileSync(resolve(__dirname, '../client/src/pages/Agenda.tsx'), 'utf-8');
const db = readFileSync(resolve(__dirname, './db.ts'), 'utf-8');

describe('conjuntos persistidos de sessões', () => {
  it('não infere uma série por horário e dia da semana na Agenda', () => {
    expect(agenda).toContain('Somente uma série persistida representa um conjunto de sessões');
    expect(agenda).not.toContain('Sem serieId: agrupar por pacienteId+profissionalId+hora+diaSemana');
  });

  it('trata agendamento sem serieId como avulso nas operações de série', () => {
    expect(db).toContain('Sem serieId, o agendamento é avulso');
    expect(db).toContain('return 1;');
    expect(db).toContain('futuros = [a];');
  });
});
