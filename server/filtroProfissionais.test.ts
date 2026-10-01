import { describe, expect, it } from 'vitest';
import {
  deveInicializarFiltroProfissionais,
  obterIdsIniciaisDaAgenda,
  obterIdsParaConsultaDaAgenda,
  obterIdsVisiveisDaAgenda,
} from '@shared/filtroProfissionais';

describe('deveInicializarFiltroProfissionais', () => {
  it('inicializa a seleção automática somente na primeira carga administrativa', () => {
    expect(deveInicializarFiltroProfissionais({
      perfil: 'administrador',
      quantidadeProfissionais: 13,
      quantidadeSelecionados: 0,
      limpezaManual: false,
    })).toBe(true);
  });

  it('respeita a limpeza manual mesmo quando a seleção fica vazia', () => {
    expect(deveInicializarFiltroProfissionais({
      perfil: 'administrador',
      quantidadeProfissionais: 13,
      quantidadeSelecionados: 0,
      limpezaManual: true,
    })).toBe(false);
  });

  it('não inicializa o filtro para o perfil profissional', () => {
    expect(deveInicializarFiltroProfissionais({
      perfil: 'profissional',
      quantidadeProfissionais: 1,
      quantidadeSelecionados: 0,
      limpezaManual: false,
    })).toBe(false);
  });

  it('usa a lista carregada de profissionais para iniciar a Agenda sem depender dos atendimentos', () => {
    expect(obterIdsIniciaisDaAgenda([
      { id: 12 },
      { id: '15' },
      { id: 12 },
      { id: 0 },
      {},
    ])).toEqual([12, 15]);
  });

  it('limita a seleção automática a quatro profissionais para manter pacientes visíveis na grade', () => {
    expect(obterIdsIniciaisDaAgenda([
      { id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 },
    ])).toEqual([11, 12, 13, 14]);
  });

  it('mantém os profissionais visíveis antes da seleção automática persistir', () => {
    const profissionais = [{ id: 12 }, { id: 15 }];

    expect(obterIdsVisiveisDaAgenda(profissionais, [], false)).toEqual([12, 15]);
    expect(obterIdsVisiveisDaAgenda(profissionais, [15], false)).toEqual([15]);
    expect(obterIdsVisiveisDaAgenda(profissionais, [], true)).toEqual([]);
  });

  it('consulta a Agenda pelo vínculo do profissional mesmo sem seleção administrativa', () => {
    expect(obterIdsParaConsultaDaAgenda({
      perfil: 'profissional',
      idsSelecionados: [],
      profissionalVinculadoId: 42,
    })).toEqual([42]);

    expect(obterIdsParaConsultaDaAgenda({
      perfil: 'recepcao',
      idsSelecionados: [12, 15],
      profissionalVinculadoId: undefined,
    })).toEqual([12, 15]);
  });
});
