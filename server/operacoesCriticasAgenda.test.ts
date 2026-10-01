import { describe, expect, it } from 'vitest';
import { consultaDaAgendaDeveIgnorarLote } from '@shared/operacoesCriticasAgenda';

describe('consultas críticas da Agenda', () => {
  it('envia profissionais, atendimentos e a busca resumida em requisições independentes', () => {
    expect(consultaDaAgendaDeveIgnorarLote('profissionais.list')).toBe(true);
    expect(consultaDaAgendaDeveIgnorarLote('atendimentos.list')).toBe(true);
    expect(consultaDaAgendaDeveIgnorarLote('pacientes.listParaAgenda')).toBe(true);
    expect(consultaDaAgendaDeveIgnorarLote('assinaturasGuias.excluirAssinatura')).toBe(true);
    expect(consultaDaAgendaDeveIgnorarLote('assinaturas.excluirAssinatura')).toBe(true);
  });

  it('mantém as consultas administrativas no lote comum', () => {
    expect(consultaDaAgendaDeveIgnorarLote('guias.list')).toBe(false);
    expect(consultaDaAgendaDeveIgnorarLote('convenios.list')).toBe(false);
  });
});
