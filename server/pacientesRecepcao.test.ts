import { describe, expect, it } from 'vitest';
import { filtrarPacientesDaRecepcao } from '@shared/pacientesRecepcao';

const pacientes = [
  { id: 1, nome: 'Ana Maria', cpf: '12345678900', dataNascimento: null, telefone: null, whatsapp: null, dataVencimentoPedido: null },
  { id: 2, nome: 'Bruno Silva', cpf: '98765432100', dataNascimento: null, telefone: null, whatsapp: null, dataVencimentoPedido: null },
];

describe('lista leve de pacientes para recepção', () => {
  it('mantém todos os pacientes disponíveis antes da busca', () => {
    expect(filtrarPacientesDaRecepcao(pacientes, '')).toHaveLength(2);
  });

  it('localiza pacientes por nome e CPF sem depender de dados documentais', () => {
    expect(filtrarPacientesDaRecepcao(pacientes, 'maria').map((p) => p.id)).toEqual([1]);
    expect(filtrarPacientesDaRecepcao(pacientes, '98765432100').map((p) => p.id)).toEqual([2]);
  });
});
