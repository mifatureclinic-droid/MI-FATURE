import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatarDataParaInput } from '../shared/pedidoMedicoOpcional';

const paginaPacientes = readFileSync(new URL('../client/src/pages/Pacientes.tsx', import.meta.url), 'utf8');

describe('datas carregadas no formulário de paciente', () => {
  it('converte a data do banco recebida como Date para o formato aceito pelo campo', () => {
    expect(formatarDataParaInput(new Date('2026-08-01T00:00:00.000Z'))).toBe('2026-08-01');
  });

  it('aceita datas ISO e recupera um valor de data legado em formato textual', () => {
    expect(formatarDataParaInput('2035-05-02')).toBe('2035-05-02');
    expect(formatarDataParaInput('Fri Jul 31 2026 20:00:00 GMT-0400')).toBe('2026-08-01');
  });

  it('não envia conteúdo inválido para o campo de data', () => {
    expect(formatarDataParaInput('data sem formato')).toBe('');
    expect(formatarDataParaInput(null)).toBe('');
  });

  it('aplica a normalização às três datas ao carregar um cadastro para edição', () => {
    expect(paginaPacientes).toContain('dataNascimento: formatarDataParaInput(pacienteCompleto.dataNascimento)');
    expect(paginaPacientes).toContain('validadeCarteira: formatarDataParaInput((pacienteCompleto as any).validadeCarteira)');
    expect(paginaPacientes).toContain('dataVencimentoPedido: formatarDataParaInput(pacienteCompleto.dataVencimentoPedido)');
  });
});
