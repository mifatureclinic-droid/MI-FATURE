import { describe, expect, it } from 'vitest';
import { criarMensagemLinkAssinatura, criarMensagemLinkAssinaturaAprovada, formatarDataAssinatura } from '../shared/mensagemLinkAssinatura.mjs';

describe('mensagem do link de assinatura', () => {
  it('formata a data ISO no padrão brasileiro', () => {
    expect(formatarDataAssinatura('2026-08-14')).toBe('14/08/2026');
  });

  it('menciona a data futura da sessão e da expiração sem afirmar que é hoje', () => {
    const mensagem = criarMensagemLinkAssinatura({
      paciente: 'Ana Clara da Frota Lima',
      profissional: 'SUZY JESUS DA SILVA',
      dataSessao: '2026-08-14',
      horario: '15:00',
      horarioExpiracao: '14:00',
      sessaoNumero: 2,
      totalSessoes: 10,
      link: 'https://mifature.click/assinar-sessao/token',
    });

    expect(mensagem).toContain('2ª sessão de 10, em 14/08/2026, às 15:00');
    expect(mensagem).toContain('válido até 14/08/2026, às 14:00');
    expect(mensagem).not.toContain('atendimento de hoje');
  });

  it('omite o número de sessões quando a clínica solicita uma mensagem neutra', () => {
    const mensagem = criarMensagemLinkAssinatura({
      paciente: 'Paterson Texeira de Lima',
      profissional: 'SILMARA ELIZANDRA BARBOSA BORGES',
      dataSessao: '2026-08-18',
      horario: '15:30',
      horarioExpiracao: '14:30',
      sessaoNumero: 1,
      totalSessoes: 10,
      link: 'https://mifature.click/assinar-sessao/token',
      ocultarSessao: true,
    });

    expect(mensagem).toContain('Para seu atendimento em 18/08/2026, às 15:30');
    expect(mensagem).not.toContain('sessão');
  });

  it('informa duas datas e preserva um campo de assinatura para cada uma', () => {
    const mensagem = criarMensagemLinkAssinatura({
      paciente: 'Gabriel Passos Cortezão',
      profissional: 'THIFFANE FERREIRA COSTA',
      dataSessao: '2026-08-18',
      datasAtendimento: ['2026-08-18', '2026-08-19'],
      horario: '12:00',
      horarioExpiracao: '11:00',
      link: 'https://mifature.click/assinar-sessao/token',
      ocultarSessao: true,
    });

    expect(mensagem).toContain('atendimentos dos dias 18/08/2026 e 19/08/2026');
    expect(mensagem).toContain('um campo de assinatura para cada data');
    expect(mensagem).not.toContain('sessão');
  });

  it('usa o texto aprovado pela clínica sem incluir conteúdo clínico ou aviso de expiração', () => {
    const mensagem = criarMensagemLinkAssinaturaAprovada({
      paciente: 'Ayla Maria Siqueira de Araujo',
      dataSessao: '2026-09-08',
      link: 'https://mifature.click/assinar-sessao/token',
    });

    expect(mensagem).toContain('Solicitamos, por gentileza, que abra o link abaixo e assine:');
    expect(mensagem).toContain('atendimento de 08/09/2026');
    expect(mensagem).not.toContain('link seguro');
    expect(mensagem).not.toContain('válido até');
  });
});
