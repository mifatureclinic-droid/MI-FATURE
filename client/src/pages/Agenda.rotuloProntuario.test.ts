import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const agendaSource = readFileSync(fileURLToPath(new URL('./Agenda.tsx', import.meta.url)), 'utf8');

describe('Agenda — rótulo da ação de prontuário', () => {
  it('exibe “Ir para prontuário” e mantém a navegação da ação', () => {
    expect(agendaSource).toContain('Ir para prontuário');
    expect(agendaSource).not.toContain('Ir para Prontuário');
    expect(agendaSource).toContain("onNavigate?.('prontuario')");
  });

  it('sinaliza o prontuário pendente em sessão já ocorrida e não preenchida', () => {
    expect(agendaSource).toContain("mePerfil === 'administrador' || mePerfil === 'master' || mePerfil === 'profissional'");
    expect(agendaSource).toContain('deveExibirPendenciaProntuarioNaAgenda(atendimento, today)');
    expect(agendaSource).toContain('Prontuário pendente');
  });
});
