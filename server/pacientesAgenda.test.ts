import { describe, expect, it } from 'vitest';
import { filtrarPacientesDaAgenda } from '@shared/pacientesAgenda';
import { resolverNomePacienteAgenda } from '@shared/nomePacienteAgenda';

const pacientes = [
  { id: 1, nome: 'Ana Beatriz Lima', cpf: '123.456.789-00', telefone: '92999990000', whatsapp: '92999990000' },
  { id: 2, nome: 'Carlos Eduardo', cpf: '987.654.321-00', telefone: null, whatsapp: null },
];

describe('lista resumida de pacientes da Agenda', () => {
  it('mantém a busca por nome e por CPF sem trazer o cadastro completo', () => {
    expect(filtrarPacientesDaAgenda(pacientes, 'bea')).toEqual([pacientes[0]]);
    expect(filtrarPacientesDaAgenda(pacientes, '654')).toEqual([pacientes[1]]);
  });

  it('evita varrer a lista antes de haver termo suficiente', () => {
    expect(filtrarPacientesDaAgenda(pacientes, 'an')).toEqual([]);
  });

  it('prioriza o nome retornado no atendimento para evitar N/A enquanto a lista resumida carrega', () => {
    expect(resolverNomePacienteAgenda({
      pacienteId: 999,
      pacienteNome: '  Maria Aparecida  ',
      pacientes: [],
    })).toBe('Maria Aparecida');
  });

  it('recupera o nome da lista resumida quando o atendimento ainda não o trouxe', () => {
    expect(resolverNomePacienteAgenda({
      pacienteId: 2,
      pacienteNome: null,
      pacientes,
    })).toBe('Carlos Eduardo');
  });
});
