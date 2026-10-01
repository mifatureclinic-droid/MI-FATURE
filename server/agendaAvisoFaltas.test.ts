import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const agenda = readFileSync(resolve(__dirname, '../client/src/pages/Agenda.tsx'), 'utf-8');

describe('Agenda sem aviso de faltas consecutivas', () => {
  it('não consulta nem aciona o fluxo de alerta de faltas', () => {
    expect(agenda).not.toContain('getPacientesComFaltas.useQuery');
    expect(agenda).not.toContain('enviarAlertaFaltas.useMutation');
  });

  it('não exibe o cartão ou modal de WhatsApp para faltas consecutivas', () => {
    expect(agenda).not.toContain('Aviso de Faltas — WhatsApp');
    expect(agenda).not.toContain('faltas consecutivas nos últimos 30 dias');
  });
});
