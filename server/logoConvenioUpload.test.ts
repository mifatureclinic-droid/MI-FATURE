import { describe, expect, it } from 'vitest';
import { extrairBase64DeArquivo, mensagemErroLogoConvenio } from '@shared/logoConvenioUpload';

describe('upload de logo de convênio', () => {
  it('extrai a carga base64 de uma imagem lida pelo navegador', () => {
    expect(extrairBase64DeArquivo('data:image/png;base64,QUJDRA==')).toBe('QUJDRA==');
  });

  it('preserva uma mensagem útil de erro para a tela', () => {
    expect(mensagemErroLogoConvenio(new Error('Arquivo inválido'))).toBe('Arquivo inválido');
    expect(mensagemErroLogoConvenio(null)).toContain('Não foi possível');
  });
});
