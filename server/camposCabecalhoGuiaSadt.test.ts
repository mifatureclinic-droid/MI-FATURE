import { describe, expect, it } from 'vitest';
import { sincronizarCamposCabecalhoGuiaSadt } from '@shared/camposCabecalhoGuiaSadt';

describe('campos espelhados do cabeçalho da Guia SP/SADT', () => {
  it('replica o número do campo 2 no número principal da guia', () => {
    expect(sincronizarCamposCabecalhoGuiaSadt({
      numeroGuia: 'GUIA-ANTIGA',
      numeroGuiaPrestador: 'GUIA-ATUAL',
    })).toMatchObject({
      numeroGuia: 'GUIA-ATUAL',
      numeroGuiaPrestador: 'GUIA-ATUAL',
    });
  });

  it('replica a data da solicitação do campo 22 no campo 4', () => {
    expect(sincronizarCamposCabecalhoGuiaSadt({
      dataAutorizacao: '2026-08-01',
      dataSolicitacao: '2026-08-15',
    })).toMatchObject({
      dataAutorizacao: '2026-08-15',
      dataSolicitacao: '2026-08-15',
    });
  });
});
