import { describe, expect, it } from 'vitest';
import {
  formatPacienteIdForSelect,
  getPacienteIdFromCreateResult,
} from '../shared/paciente';

describe('resultado de criação de paciente', () => {
  it('usa o id da linha criada', () => {
    expect(getPacienteIdFromCreateResult({ id: 42, nome: 'Paciente Teste' })).toBe(42);
    expect(formatPacienteIdForSelect({ id: 42 })).toBe('42');
  });

  it('aceita insertId dos metadados do MySQL', () => {
    expect(getPacienteIdFromCreateResult({ insertId: 87 })).toBe(87);
    expect(formatPacienteIdForSelect({ insertId: '87' })).toBe('87');
  });

  it('não lança erro quando o retorno não contém id', () => {
    expect(() => formatPacienteIdForSelect(undefined)).not.toThrow();
    expect(formatPacienteIdForSelect(undefined)).toBeNull();
    expect(formatPacienteIdForSelect({ nome: 'Sem identificador' })).toBeNull();
    expect(formatPacienteIdForSelect({ id: 0 })).toBeNull();
    expect(formatPacienteIdForSelect({ id: 'abc' })).toBeNull();
  });
});

