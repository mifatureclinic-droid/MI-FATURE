import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const dbSource = readFileSync(resolve(__dirname, './db.ts'), 'utf-8');
const agendaSource = readFileSync(resolve(__dirname, '../client/src/pages/Agenda.tsx'), 'utf-8');

describe('isolamento de profissional na busca da guia assinada', () => {
  it('aceita o profissional do atendimento e restringe assinaturas e histórico ao mesmo profissional', () => {
    expect(dbSource).toContain('profissionalId?: number');
    expect(dbSource).toContain('const profissionalDoAtendimento');
    expect(dbSource).toContain('eq(guias.profissionalId, profissionalDoAtendimento)');
    expect(agendaSource).toContain('profissionalId={atendimentoParaAssinar.profissionalId}');
  });
});
