import { describe, expect, it } from 'vitest';
import { encontrarGuiaDaSerie, encontrarGuiaDaSerieAtualizada } from '@shared/reutilizacaoGuiaSerie';

describe('reutilização de guia por série', () => {
  const atendimentos = [
    { id: 1, serieId: 'serie-theo', pacienteId: 10, profissionalId: 20, convenioId: 30, guiaId: 700 },
    { id: 2, serieId: 'serie-theo', pacienteId: 10, profissionalId: 20, convenioId: 30, guiaId: null },
    { id: 3, serieId: 'outra-serie', pacienteId: 10, profissionalId: 20, convenioId: 30, guiaId: 701 },
  ];

  it('reutiliza a guia já vinculada a outra sessão da mesma série', () => {
    expect(encontrarGuiaDaSerie(atendimentos[1], atendimentos)).toBe(700);
  });

  it('mantém a guia já vinculada ao próprio atendimento', () => {
    expect(encontrarGuiaDaSerie(atendimentos[0], atendimentos)).toBe(700);
  });

  it('encontra a guia da série mesmo quando a sessão vinculada está fora da semana aberta', () => {
    const apenasSessaoAtual = [atendimentos[1]];
    const guias = [{ id: 700, serieId: 'serie-theo', pacienteId: 10, profissionalId: 20, convenioId: 30 }];

    expect(encontrarGuiaDaSerie(atendimentos[1], apenasSessaoAtual, guias)).toBe(700);
  });

  it('consulta a lista atualizada antes de permitir a criação de outra guia', async () => {
    const apenasSessaoAtual = [atendimentos[1]];
    const buscarGuias = async () => [{ id: 700, serieId: 'serie-theo', pacienteId: 10, profissionalId: 20, convenioId: 30 }];

    await expect(encontrarGuiaDaSerieAtualizada(atendimentos[1], apenasSessaoAtual, buscarGuias)).resolves.toBe(700);
  });

  it('não reutiliza guia de outra série ou atendimento avulso', () => {
    expect(encontrarGuiaDaSerie({ ...atendimentos[1], serieId: 'serie-sem-guia' }, atendimentos)).toBeNull();
    expect(encontrarGuiaDaSerie({ id: 4, pacienteId: 10, profissionalId: 20, convenioId: 30 }, atendimentos)).toBeNull();
    expect(encontrarGuiaDaSerie(atendimentos[1], [atendimentos[1]], [{ id: 701, serieId: 'outra-serie', pacienteId: 10, profissionalId: 20, convenioId: 30 }])).toBeNull();
  });
});
