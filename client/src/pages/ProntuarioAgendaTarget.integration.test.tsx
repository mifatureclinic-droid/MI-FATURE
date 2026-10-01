/** @vitest-environment jsdom */
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Prontuario } from "./Prontuario";

const testState = vi.hoisted(() => ({
  assinaturaPaciente: true,
  atendimentoId: 72,
  clearTarget: vi.fn(),
  queryResult: (data: unknown) => ({ data, isLoading: false }),
  mutationResult: () => ({ mutateAsync: vi.fn(), isPending: false }),
  paciente: { id: 1, nome: "Paciente de teste", email: "teste@clinica.com" },
}));

const paciente = testState.paciente;

vi.mock("@/lib/trpc", () => ({
  trpc: {
    profissionais: { getById: { useQuery: () => testState.queryResult({ id: 570009, especialidade: "Psicologia" }) } },
    pacientes: {
      getCadastrados: { useQuery: () => testState.queryResult([testState.paciente]) },
      getAgendamentos: {
        useQuery: () => testState.queryResult([{
          id: testState.atendimentoId,
          pacienteId: 1,
          profissionalId: 570009,
          data: "2026-08-27",
          hora: "14:00",
          assinaturaDigitalObrigatoria: true,
          assinaturaPaciente: testState.assinaturaPaciente,
        }]),
      },
      getById: { useQuery: () => testState.queryResult(testState.paciente) },
    },
    contratos: { list: { useQuery: () => testState.queryResult([]) } },
    assinaturas: { listarPorPaciente: { useQuery: () => testState.queryResult([]) } },
    prontuarios: {
      getHistoricoPaciente: { useQuery: () => testState.queryResult([]) },
      getById: { useQuery: () => testState.queryResult(null) },
      delete: { useMutation: testState.mutationResult },
      save: { useMutation: testState.mutationResult },
      exportarPDF: { useMutation: testState.mutationResult },
    },
    useUtils: () => ({ prontuarios: { getHistoricoPaciente: { invalidate: vi.fn() } } }),
  },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { perfil: "profissional", profissionalVinculadoId: 570009, role: "user" } }),
}));

vi.mock("../contexts/ProntuarioContext", () => ({
  useProntuarioContext: () => ({
    pacienteId: 1,
    atendimentoId: testState.atendimentoId,
    clearProntuarioTarget: testState.clearTarget,
  }),
}));

vi.mock("../components/ProntuarioPsicologia", () => ({
  ProntuarioPsicologia: () => <div data-testid="editor-psicologia">Editor psicológico</div>,
}));

vi.mock("../components/IntegracaoHelp", () => ({
  IntegracaoHelp: () => null,
}));

afterEach(() => {
  cleanup();
  testState.assinaturaPaciente = true;
  testState.clearTarget.mockClear();
});

describe("Prontuario aberto pela Agenda para psicólogo", () => {
  it("abre o editor quando a sessão-alvo recebida da Agenda está assinada", async () => {
    testState.assinaturaPaciente = true;
    render(<Prontuario />);

    await waitFor(() => expect(screen.getByTestId("editor-psicologia")).toBeTruthy());
    expect(testState.clearTarget).toHaveBeenCalled();
  });

  it("permanece fechado quando a sessão-alvo ainda não possui assinatura", async () => {
    testState.assinaturaPaciente = false;
    render(<Prontuario />);

    await waitFor(() => expect(screen.getByText("Prontuário fechado")).toBeTruthy());
    expect(screen.queryByTestId("editor-psicologia")).toBeNull();
  });
});
