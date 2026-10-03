import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Pagamentos de repasse — transparência, filtros e nota fiscal', () => {
  const source = readFileSync(resolve(process.cwd(), 'client/src/components/PagamentosRepasse.tsx'), 'utf8');

  it('oferece filtro por convênio ao consultar uma competência', () => {
    expect(source).toContain('convenioId');
    expect(source).toContain('Convênio');
    expect(source).toContain('Todos os convênios');
    expect(source).toContain('convenioId,');
  });

  it('permite visualizar a nota fiscal anexada sem expor o URL no conteúdo da lista', () => {
    expect(source).toContain('notaEmVisualizacao');
    expect(source).toContain('Visualizar nota fiscal');
    expect(source).toContain('<Dialog');
    expect(source).toContain('application/pdf');
  });

  it('permite ao profissional selecionar mês, ano e visualizar o valor recebido pela clínica', () => {
    expect(source).toContain('mesCompetencia');
    expect(source).toContain('anoCompetencia');
    expect(source).toContain('Ano de pagamento');
    expect(source).toContain('Valor recebido pela clínica');
    expect(source).toContain('linha.valorBruto');
  });

  it('calcula e exibe o total previsto para a competência selecionada', () => {
    expect(source).toContain('const totalDaCompetencia = useMemo(');
    expect(source).toContain('linhasDaCompetencia.reduce((total, linha) => total + Number(linha.valorRepasse || 0), 0)');
    expect(source).toContain('Total de repasse da competência');
    expect(source).toContain('formatarBRL(totalDaCompetencia)');
  });

  it('exibe para o profissional seus atendimentos da competência, inclusive os aguardando baixa', () => {
    expect(source).toContain("const linhasDaAba = isMaster ? (aba === 'pago' ? pagos : pendentes) : linhasDaCompetencia;");
    expect(source).toContain("'Atendimentos da competência'");
    expect(source).toContain("{isMaster && <button");
  });

  it('permite que o profissional anexe somente a própria nota fiscal da competência', () => {
    expect(source).toContain("const profissionalDaNota = isMaster ? profissionalId : user?.profissionalVinculadoId;");
    expect(source).toContain("Envie a sua nota fiscal referente à competência selecionada.");
    expect(source).not.toContain('{isMaster && <div className="flex flex-col justify-end gap-2">');
  });
});
