import { describe, expect, it } from 'vitest';
import { prepararDadosExportacaoRepasse } from '../shared/relatorioRepasseExportacao';

describe('dados de exportação do repasse', () => {
  it('mantém as linhas filtradas e calcula totais para Excel e PDF', () => {
    const resultado = prepararDadosExportacaoRepasse([
      { pacienteNome: 'Ana', profissionalNome: 'Dra. Ana', convenioNome: 'Convênio A', data: '2026-08-10', valorBruto: 48.24, valorRepasse: 20.26, valorGlosa: 0, statusRecebimento: 'recebido' },
      { pacienteNome: 'Bia', profissionalNome: 'Dra. Ana', convenioNome: 'Convênio B', data: '2026-08-12', valorBruto: 60, valorRepasse: 25.2, valorGlosa: 60, statusRecebimento: 'glosa' },
    ]);

    expect(resultado.registros).toHaveLength(2);
    expect(resultado.registros[0].Data).toBe('10/08/2026');
    expect(resultado.totais).toEqual({ valorBruto: 108.24, valorRepasse: 45.46, valorGlosa: 60 });
  });
});
