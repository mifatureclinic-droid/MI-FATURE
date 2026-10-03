import { describe, expect, it } from 'vitest';
import { gerarCsvRelatorioFinanceiro } from '../shared/relatorioFinanceiroCsv';

describe('exportação do relatório financeiro', () => {
  it('gera CSV com contas a receber, contas a pagar e resumo', () => {
    const csv = gerarCsvRelatorioFinanceiro({
      dataInicio: '2026-08-01',
      dataFim: '2026-08-31',
      contasReceber: [{ descricao: 'Sessão "Particular"', valor: 100, dataVencimento: '2026-08-10', status: 'recebido', paciente: 'Ana' }],
      contasPagar: [{ descricao: 'Repasse', valor: 40, dataVencimento: '2026-08-15', status: 'pago', profissional: 'Dra. Bia' }],
    });

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Contas a Receber"');
    expect(csv).toContain('"Contas a Pagar"');
    expect(csv).toContain('"Sessão ""Particular"""');
    expect(csv).toContain('"10/08/2026"');
    expect(csv).toContain('"15/08/2026"');
    expect(csv).not.toContain('"2026-08-10"');
    expect(csv).toContain('"60,00"');
  });
});
