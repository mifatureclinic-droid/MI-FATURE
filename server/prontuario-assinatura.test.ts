import { describe, expect, it } from 'vitest';
import { deveExibirAssinaturaPendenteProntuario, obterAbaAtalhoProntuario } from '../shared/prontuarioAssinatura';

describe('indicador de assinatura e prontuário pendente', () => {
  it('exibe para administrador quando a sessão foi assinada e o prontuário está pendente', () => {
    expect(deveExibirAssinaturaPendenteProntuario({
      perfil: 'administrador',
      atendimentoSelecionado: true,
      assinaturaPaciente: 1,
      prontuarioFeito: 0,
    })).toBe(true);
  });

  it('exibe para profissional quando a sessão foi assinada e o prontuário está pendente', () => {
    expect(deveExibirAssinaturaPendenteProntuario({
      perfil: 'profissional',
      atendimentoSelecionado: true,
      assinaturaPaciente: true,
      prontuarioFeito: false,
    })).toBe(true);
  });

  it('não exibe para recepção nem depois que o prontuário foi concluído', () => {
    expect(deveExibirAssinaturaPendenteProntuario({
      perfil: 'recepcao',
      atendimentoSelecionado: true,
      assinaturaPaciente: true,
      prontuarioFeito: false,
    })).toBe(false);

    expect(deveExibirAssinaturaPendenteProntuario({
      perfil: 'profissional',
      atendimentoSelecionado: true,
      assinaturaPaciente: true,
      prontuarioFeito: 1,
    })).toBe(false);
  });
  it("abre a aba Novo Atendimento somente para uma sessão assinada e pendente", () => {
    expect(obterAbaAtalhoProntuario({
      perfil: "profissional",
      atendimentoSelecionado: true,
      assinaturaPaciente: true,
      prontuarioFeito: false,
    })).toBe("novo");

    expect(obterAbaAtalhoProntuario({
      perfil: "recepcao",
      atendimentoSelecionado: true,
      assinaturaPaciente: true,
      prontuarioFeito: false,
    })).toBeNull();
  });
});
