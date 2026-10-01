import { describe, expect, it } from 'vitest';

describe('configuração do Resend', () => {
  it('autentica a chave de envio sem disparar uma mensagem', async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey).toMatch(/^re_/);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.status, await response.text()).toBe(422);
  }, 15_000);

  it('mantém o remetente informado disponível ao serviço de avisos', () => {
    expect(process.env.RESEND_FROM_EMAIL).toBe('mifatureclinic@gmail.com');
  });
});
