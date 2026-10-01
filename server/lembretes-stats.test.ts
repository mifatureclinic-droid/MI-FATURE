import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Estatísticas de Lembretes WhatsApp', () => {
  let testPacienteId: number;
  let testProfissionalId: number;
  let testConvenioId: number;
  let atendimentoPendenteId: number;
  let atendimentoEnviadoId: number;
  let atendimentoConfirmadoId: number;

  beforeAll(async () => {
    const timestamp = Date.now().toString().slice(-8);
    const uniqueCpf = `${timestamp.slice(0, 3)}.${timestamp.slice(3, 6)}.${timestamp.slice(6)}-10`;

    const pacienteResult = await db.createPaciente({
      nome: 'Paciente Lembrete Teste',
      cpf: uniqueCpf,
      dataNascimento: new Date('1988-03-10'),
      whatsapp: '(11) 98888-7777',
      recebeLembretesWhatsapp: 1,
    });
    testPacienteId = (pacienteResult as any).insertId || 1;

    const profissionalResult = await db.createProfissional({
      nome: 'Dr. Lembrete',
      cpf: `${timestamp.slice(0, 3)}.${timestamp.slice(3, 6)}.${timestamp.slice(6)}-11`,
      crm: `${timestamp}L`,
      especialidade: 'Clínica Geral',
      email: 'dr.lembrete@test.com',
    });
    testProfissionalId = (profissionalResult as any).insertId || 1;

    const convenioResult = await db.createConvenio({
      nome: 'Convênio Lembrete',
      cnpj: `${timestamp}.0000-10`,
      codigoOperadora: '654321',
    });
    testConvenioId = (convenioResult as any).insertId || 1;

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);

    // Atendimento com lembrete pendente (solicitado, não enviado)
    const at1 = await db.createAtendimento({
      pacienteId: testPacienteId,
      profissionalId: testProfissionalId,
      convenioId: testConvenioId,
      data: amanha,
      hora: '09:00',
      tipo: 'Consulta',
      status: 'agendado',
      lembreteSolicitado: 1,
      lembreteEnviado: 0,
    });
    atendimentoPendenteId = (at1 as any)?.insertId || 0;

    // Atendimento com lembrete enviado
    const at2 = await db.createAtendimento({
      pacienteId: testPacienteId,
      profissionalId: testProfissionalId,
      convenioId: testConvenioId,
      data: amanha,
      hora: '10:00',
      tipo: 'Consulta',
      status: 'agendado',
      lembreteSolicitado: 1,
      lembreteEnviado: 1,
    });
    atendimentoEnviadoId = (at2 as any)?.insertId || 0;

    // Atendimento confirmado
    const at3 = await db.createAtendimento({
      pacienteId: testPacienteId,
      profissionalId: testProfissionalId,
      convenioId: testConvenioId,
      data: amanha,
      hora: '11:00',
      tipo: 'Consulta',
      status: 'agendado',
      lembreteSolicitado: 1,
      lembreteEnviado: 1,
      confirmacaoAtendimento: 1,
    });
    atendimentoConfirmadoId = (at3 as any)?.insertId || 0;
  });

  it('deve retornar estatísticas com a estrutura correta', async () => {
    const stats = await db.getEstatisticasLembretes();
    expect(stats).toBeDefined();
    expect(typeof stats.totalPendentes).toBe('number');
    expect(typeof stats.totalEnviados).toBe('number');
    expect(typeof stats.totalConfirmados).toBe('number');
    expect(typeof stats.totalNaoConfirmados).toBe('number');
    expect(typeof stats.taxaConfirmacao).toBe('number');
  });

  it('deve contar pelo menos os lembretes de teste criados', async () => {
    const stats = await db.getEstatisticasLembretes();
    expect(stats.totalPendentes).toBeGreaterThanOrEqual(1);
    expect(stats.totalEnviados).toBeGreaterThanOrEqual(2);
    expect(stats.totalConfirmados).toBeGreaterThanOrEqual(1);
  });

  it('taxa de confirmação deve estar entre 0 e 100', async () => {
    const stats = await db.getEstatisticasLembretes();
    expect(stats.taxaConfirmacao).toBeGreaterThanOrEqual(0);
    expect(stats.taxaConfirmacao).toBeLessThanOrEqual(100);
  });

  it('deve retornar detalhes de lembretes pendentes', async () => {
    const detalhes = await db.getDetalhesLembretesPorStatus('pendentes');
    expect(Array.isArray(detalhes)).toBe(true);
    // Cada item deve conter atendimento, paciente e profissional
    if (detalhes.length > 0) {
      expect(detalhes[0]).toHaveProperty('atendimento');
      expect(detalhes[0]).toHaveProperty('paciente');
      expect(detalhes[0]).toHaveProperty('profissional');
    }
  });

  it('deve retornar detalhes de lembretes enviados', async () => {
    const detalhes = await db.getDetalhesLembretesPorStatus('enviados');
    expect(Array.isArray(detalhes)).toBe(true);
    // Todos os itens devem ter lembreteEnviado = 1
    detalhes.forEach((item: any) => {
      expect(item.atendimento.lembreteEnviado).toBe(1);
    });
  });

  it('deve retornar detalhes de lembretes confirmados', async () => {
    const detalhes = await db.getDetalhesLembretesPorStatus('confirmados');
    expect(Array.isArray(detalhes)).toBe(true);
    detalhes.forEach((item: any) => {
      expect(item.atendimento.confirmacaoAtendimento).toBe(1);
    });
  });

  it('deve retornar resumo de lembretes para hoje com estrutura correta', async () => {
    const resumo = await db.getResumoLembretesHoje();
    expect(resumo).toBeDefined();
    expect(typeof resumo.agendadosHoje).toBe('number');
    expect(typeof resumo.comLembretePendente).toBe('number');
    expect(typeof resumo.comLembreteEnviado).toBe('number');
    expect(typeof resumo.confirmados).toBe('number');
  });
});
