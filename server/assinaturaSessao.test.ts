import { describe, expect, it } from 'vitest';
import { encontrarAssinaturaDaSessao } from '../shared/assinaturaSessao';

describe('assinatura exibida no atendimento correspondente', () => {
  const assinaturaDaSegundaSessao = {
    sessaoNumero: 2,
    datasAtendimento: '["2026-08-07"]',
    dataAssinatura: new Date('2026-08-07T14:49:51Z'),
    assinaturaPacienteUrl: 'data:image/png;base64,assinatura-real',
  };

  it('localiza a assinatura pública pela data do atendimento, mesmo com data em formato brasileiro', () => {
    expect(encontrarAssinaturaDaSessao([assinaturaDaSegundaSessao], '07/08/2026'))
      .toEqual(assinaturaDaSegundaSessao);
  });

  it('não mostra a assinatura em outra data de atendimento', () => {
    expect(encontrarAssinaturaDaSessao([assinaturaDaSegundaSessao], '14/08/2026')).toBeNull();
  });

  it('não permite reutilizar uma assinatura histórica quando a sessão atual está pendente', () => {
    const historica = { ...assinaturaDaSegundaSessao, datasAtendimento: '["2026-08-07"]' };
    expect(encontrarAssinaturaDaSessao([historica], '15/08/2026')).toBeNull();
  });

  it('mantém a associação da assinatura quando a data vem da Agenda em formato brasileiro', () => {
    const assinaturaDaAgenda = { ...assinaturaDaSegundaSessao, datasAtendimento: '["2026-08-15"]' };
    expect(encontrarAssinaturaDaSessao([assinaturaDaAgenda], '15/08/2026'))
      .toEqual(assinaturaDaAgenda);
  });
});
