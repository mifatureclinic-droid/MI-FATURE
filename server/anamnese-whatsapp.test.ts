import { describe, expect, it } from 'vitest';
import { montarLinkPreenchimentoAnamnese, montarMensagemLinkAnamnese } from '../shared/anamneseWhatsApp';

describe('Anamnese por WhatsApp', () => {
  it('monta um link público individual com o token no caminho', () => {
    const token = 'a'.repeat(64);
    expect(montarLinkPreenchimentoAnamnese(token)).toBe(`https://mifature.click/preencher-anamnese/${token}`);
  });

  it('envia uma mensagem sem dados clínicos do paciente', () => {
    const mensagem = montarMensagemLinkAnamnese('MARIA DA SILVA', 'https://mifature.click/preencher-anamnese/token-seguro');

    expect(mensagem).toContain('Olá, MARIA.');
    expect(mensagem).toContain('link individual');
    expect(mensagem).toContain('Não envie informações clínicas por esta conversa.');
    expect(mensagem).not.toContain('queixa');
    expect(mensagem).not.toContain('histórico');
  });
});
