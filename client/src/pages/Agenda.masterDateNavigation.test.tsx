/** @vitest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Agenda } from './Agenda';
import { deslocarDataAgenda } from '@shared/navegacaoDataAgenda';

let resultadoProfissionais: Record<string, unknown> | null = null;
let dadosAtendimentos: Record<string, unknown>[] | null = null;
let dadosPacientes: Record<string, unknown>[] | null = null;

vi.mock('../lib/trpc', () => {
  const queryResult = (data: unknown) => ({ data, isLoading: false, refetch: vi.fn() });
  const mutationResult = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });

  return { trpc: {
    auth: { me: { useQuery: () => queryResult({ perfil: 'master', role: 'admin' }) } },
    profissionais: {
      list: { useQuery: () => resultadoProfissionais ?? queryResult([
        { id: 570008, nome: 'Dra. Jéssica', especialidade: 'Psicologia' },
        { id: 570009, nome: 'Dra. Thiffane', especialidade: 'Psicologia' },
      ]) },
      getAllHorarios: { useQuery: () => queryResult([]) },
    },
    atendimentos: {
      list: { useQuery: () => queryResult(dadosAtendimentos ?? [{
        id: 1830050,
        pacienteId: 780226,
        profissionalId: 570008,
        data: '2026-08-03',
        hora: '13:00',
        duracao: 30,
        status: 'realizado',
        tipo: 'Psicologia',
      }]) },
      countSerie: { useQuery: () => queryResult({ count: 0 }) },
      passarEmSerie: { useMutation: mutationResult },
      delete: { useMutation: mutationResult },
      update: { useMutation: mutationResult },
      updateDuracao: { useMutation: mutationResult },
      updateDuracaoSerie: { useMutation: mutationResult },
      deleteSerie: { useMutation: mutationResult },
      deleteSerieCompleta: { useMutation: mutationResult },
      reagendarSerie: { useMutation: mutationResult },
      mudarProfissionalSerie: { useMutation: mutationResult },
    },
    faturamentoTISS: { getNomeClinica: { useQuery: () => queryResult(null) } },
    convenios: { list: { useQuery: () => queryResult([]) } },
    procedimentos: { getProcedimentosPorConvenio: { useQuery: () => queryResult([]) } },
    pacientes: { listParaAgenda: { useQuery: () => queryResult(dadosPacientes ?? [{ id: 780226, nome: 'MURILO DE SOUSA DE FARIA', cpf: '00000000000', telefone: null, whatsapp: null }]) } },
    liberacoes: { list: { useQuery: () => queryResult([]) }, create: { useMutation: mutationResult } },
    guias: {
      list: { useQuery: () => queryResult([]), invalidate: vi.fn(), fetch: vi.fn(async () => []) },
      create: { useMutation: mutationResult },
      criarGuiasPorSerie: { useMutation: mutationResult },
    },
    alertas: { getAtendimentosAtrasados: { useQuery: () => queryResult([]) } },
    coresAtendimento: { listar: { useQuery: () => queryResult([]) } },
    historicoAlteracoes: { getByAtendimento: { useQuery: () => queryResult([]) } },
    assinaturasGuias: { getGuiaAssinada: { useQuery: () => queryResult(null) } },
    assinaturaGuiaWhatsApp: { gerarLink: { useMutation: mutationResult } },
    confirmacaoAtendimento: { gerarLink: { useMutation: mutationResult } },
    useUtils: () => ({
      guias: { list: { invalidate: vi.fn(), fetch: vi.fn(async () => []) } },
      procedimentos: { getProcedimentosPorConvenio: { fetch: vi.fn(async () => []) } },
    }),
  } };
});

vi.mock('../contexts/ProntuarioContext', () => ({
  useProntuarioContext: () => ({ setProntuarioTarget: vi.fn() }),
}));

vi.mock('../components/AgendamentoModal', () => ({
  AgendamentoModal: () => null,
}));

afterEach(() => {
  cleanup();
  resultadoProfissionais = null;
  dadosAtendimentos = null;
  dadosPacientes = null;
});

describe('Agenda — navegação de datas pelo master', () => {
  it('permite voltar um dia pela ação direta da coluna do profissional', async () => {
    const dataAnterior = format(
      deslocarDataAgenda(new Date(), -1),
      "d 'de' MMMM 'de' yyyy",
      { locale: ptBR },
    );
    render(<Agenda />);

    const anterior = await screen.findByLabelText('Ver data anterior de Dra. Thiffane');
    fireEvent.click(anterior);

    await waitFor(() => {
      expect(screen.getByText(dataAnterior)).toBeTruthy();
    });
  });

  it('não renderiza o seletor global de data da Agenda', async () => {
    render(<Agenda />);

    await screen.findByLabelText('Ver data anterior de Dra. Thiffane');
    expect(screen.queryByLabelText('Data da Agenda (Master)')).toBeNull();
    expect(screen.queryByLabelText('Navegação de datas da Agenda')).toBeNull();
  });

  it('não renderiza o controle global de data no celular', async () => {
    render(<Agenda />);

    await screen.findByLabelText('Ver data anterior de Dra. Thiffane');
    expect(screen.queryByLabelText('Data da Agenda (Master - celular)')).toBeNull();
    expect(screen.queryByLabelText('Navegação de datas da Agenda no celular')).toBeNull();
  });

  it('informa carregamento em vez de exibir Agenda vazia enquanto busca profissionais', () => {
    resultadoProfissionais = {
      data: [],
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    };

    render(<Agenda />);

    expect(screen.getByText('Carregando profissionais e pacientes…')).toBeTruthy();
    expect(screen.queryByText('Nenhum profissional selecionado')).toBeNull();
  });

  it('mostra o nome do próprio atendimento mesmo antes da lista resumida de pacientes carregar', async () => {
    dadosPacientes = [];
    dadosAtendimentos = [{
      id: 1830051,
      pacienteId: 990001,
      pacienteNome: 'LUCAS DA SILVA',
      profissionalId: 570008,
      data: format(new Date(), 'yyyy-MM-dd'),
      hora: '13:00',
      duracao: 30,
      status: 'agendado',
      tipo: 'Psicologia',
    }];

    render(<Agenda />);

    expect(await screen.findByText('LUCAS DA SILVA')).toBeTruthy();
    expect(screen.queryByText('N/A')).toBeNull();
  });
});
