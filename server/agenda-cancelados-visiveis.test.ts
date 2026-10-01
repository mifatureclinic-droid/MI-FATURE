import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Agenda — atendimentos cancelados', () => {
  it('não exclui cancelados da lista de horários visíveis', () => {
    const agenda = readFileSync(resolve(process.cwd(), 'client/src/pages/Agenda.tsx'), 'utf8');
    expect(agenda).toContain('Cancelados continuam visíveis na Agenda');
    expect(agenda).not.toContain("atendimento.status === 'cancelado' || !horarioAgendaValido(atendimento.hora)");
  });
});
