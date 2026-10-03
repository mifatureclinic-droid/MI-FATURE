import { describe, expect, it } from 'vitest';
import {
  camposAusentesDoSolicitante,
  validarExtracaoSolicitante,
} from '../shared/solicitantePedidoMedico';

describe('profissional solicitante extraído do pedido médico', () => {
  const assinaturaValida = {
    encontrado: true,
    nome: 'Dra. Beatriz Viana',
    conselho: 'CRM',
    numeroConselho: 'CRM-AM 12439',
    uf: 'AM',
    cbo: null,
    confianca: 0.96,
  };

  it('aceita uma assinatura documental completa e não inventa CBO', () => {
    expect(validarExtracaoSolicitante(assinaturaValida)).toEqual({
      nome: 'Dra. Beatriz Viana',
      conselho: 'CRM',
      numeroConselho: 'CRM-AM12439',
      uf: 'AM',
      cbo: null,
      confianca: 0.96,
    });
  });

  it('recusa extração sem registro verificável ou com baixa confiança', () => {
    expect(validarExtracaoSolicitante({ ...assinaturaValida, numeroConselho: '', confianca: 0.5 })).toBeNull();
  });

  it('preenche apenas lacunas e preserva informações confirmadas manualmente', () => {
    const sugestao = validarExtracaoSolicitante(assinaturaValida)!;
    expect(camposAusentesDoSolicitante({
      nomeMedicoSolicitante: 'Dra. Confirmada',
      crmMedicoSolicitante: '99999',
      ufMedicoSolicitante: 'AM',
      cbosMedicoSolicitante: '225125',
    }, sugestao)).toEqual({});
  });
});
