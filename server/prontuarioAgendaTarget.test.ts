import { describe, expect, it } from "vitest";
import {
  deveFecharProntuarioDoProfissional,
  resolverAtendimentoAlvoDaAgenda,
} from "../shared/prontuarioAgendaTarget";

describe("abertura de prontuário a partir da Agenda", () => {
  const sessoes = [
    { id: 71, data: "2026-08-26", assinaturaDigitalObrigatoria: true, assinaturaPaciente: false },
    { id: 72, data: "2026-08-27", assinaturaDigitalObrigatoria: true, assinaturaPaciente: true },
  ];

  it("seleciona a sessão exata enviada pela Agenda, não a primeira do paciente", () => {
    const alvo = resolverAtendimentoAlvoDaAgenda(sessoes, 72);
    expect(alvo).toMatchObject({ data: "2026-08-27", atendimento: { id: 72 } });
  });

  it("abre o prontuário do psicólogo quando a sessão-alvo estiver assinada", () => {
    const alvo = resolverAtendimentoAlvoDaAgenda(sessoes, 72);
    expect(deveFecharProntuarioDoProfissional({
      perfil: "profissional",
      pacienteSelecionado: true,
      atendimentoSelecionado: alvo?.atendimento,
    })).toBe(false);
  });

  it("mantém fechado somente o prontuário da sessão-alvo ainda não assinada", () => {
    const alvo = resolverAtendimentoAlvoDaAgenda(sessoes, 71);
    expect(deveFecharProntuarioDoProfissional({
      perfil: "profissional",
      pacienteSelecionado: true,
      atendimentoSelecionado: alvo?.atendimento,
    })).toBe(true);
  });
});
