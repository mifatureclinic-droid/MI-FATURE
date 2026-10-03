import { describe, expect, it } from 'vitest';
import {
  mesclarCamposPrefaturamento,
  reidratarCamposPrefaturamento,
  removerHistoricoAssinaturasDoPrefaturamento,
  serializarCamposPrefaturamento,
} from '../shared/prefaturamentoPersistencia';
import { gerarXmlTissSPSADT, type TissGuia } from './tissXml';

describe('persistência do pré-faturamento', () => {
  it('preserva campos clínicos, valores zero e limpezas intencionais ao reabrir', () => {
    const salvo = serializarCamposPrefaturamento({
      indicacaoClinica: 'Acompanhamento psicoterapêutico semanal.',
      motivoEncerramento: '',
      numeroGuiaOperadora: '',
      totalOPME: 0,
      totalGasesMedicinais: 0,
    });

    expect(reidratarCamposPrefaturamento(salvo)).toEqual({
      indicacaoClinica: 'Acompanhamento psicoterapêutico semanal.',
      motivoEncerramento: '',
      numeroGuiaOperadora: '',
      totalOPME: 0,
      totalGasesMedicinais: 0,
    });
  });

  it('não impede a abertura de guias antigas com espelho inválido', () => {
    expect(reidratarCamposPrefaturamento('{guia incompleta')).toEqual({});
    expect(reidratarCamposPrefaturamento(null)).toEqual({});
  });

  it('preserva campos previamente salvos quando uma edição atualiza apenas parte do formulário', () => {
    const existente = serializarCamposPrefaturamento({
      indicacaoClinica: 'Acompanhamento clínico.',
      observacaoJustificativa: 'Informação já revisada.',
      totalMateriais: 35,
    });

    expect(mesclarCamposPrefaturamento(existente, {
      indicacaoClinica: '',
      totalMateriais: 0,
    })).toEqual({
      indicacaoClinica: '',
      observacaoJustificativa: 'Informação já revisada.',
      totalMateriais: 0,
    });
  });

  it('preserva data de execução e grau de participação dos profissionais ao salvar outra parte da guia', () => {
    const existente = serializarCamposPrefaturamento({
      profissionais: [{ seqRef: '1', grauPart: '12', nome: 'Profissional A' }],
      execucoes: [{ sequencial: 1, data: '14/08/2026', codigo: '50000470' }],
    });

    expect(mesclarCamposPrefaturamento(existente, {
      indicacaoClinica: 'Texto atualizado.',
    })).toEqual({
      profissionais: [{ seqRef: '1', grauPart: '12', nome: 'Profissional A' }],
      execucoes: [{ sequencial: 1, data: '14/08/2026', codigo: '50000470' }],
      indicacaoClinica: 'Texto atualizado.',
    });
  });

  it('não duplica imagens de assinatura no espelho textual da guia', () => {
    const campos = {
      numeroGuiaPrestador: 'G202608630012570001',
      profissionais: [{ seqRef: '1', grauPart: '00' }],
      historicoAssinaturas: [{
        id: 1,
        assinaturaPacienteUrl: 'data:image/png;base64,assinatura-muito-grande',
        hashAssinatura: 'a'.repeat(64),
      }],
    };

    expect(removerHistoricoAssinaturasDoPrefaturamento(campos)).toEqual({
      numeroGuiaPrestador: 'G202608630012570001',
      profissionais: [{ seqRef: '1', grauPart: '00' }],
    });
    expect(serializarCamposPrefaturamento(campos)).not.toContain('assinatura-muito-grande');
    expect(serializarCamposPrefaturamento(campos)).not.toContain('historicoAssinaturas');
  });

  it('leva a indicação clínica e o campo 65 salvo para o XML TISS 4.02.00', () => {
    const guia: TissGuia = {
      numeroGuiaPrestador: 'GUIA-EDITADA-001',
      registroANS: '123456',
      numeroCarteira: '000111222333',
      nomeBeneficiario: 'Paciente de Teste',
      codigoPrestadorNaOperadora: 'PREST001',
      nomeContratado: 'CLÍNICA CLIPSI',
      nomeProfissional: 'Profissional de Teste',
      numeroConselhoProfissional: '12345',
      ufConselho: 'AM',
      caraterAtendimento: '1',
      tipoAtendimento: '05',
      indicacaoAcidente: '9',
      regimeAtendimento: '11',
      indicacaoClinica: 'Acompanhamento psicoterapêutico semanal.',
      procedimentos: [{
        sequencial: 1,
        dataExecucao: '2026-08-14',
        codigoProcedimento: '50000470',
        descricaoProcedimento: 'Sessão de Psicoterapia',
        quantidadeExecutada: 1,
        valorUnitario: 60.61,
        valorTotal: 60.61,
      }],
      valorProcedimentos: 60.61,
      valorTotalGeral: 75.61,
    };

    const { xml } = gerarXmlTissSPSADT({
      sequencialTransacao: '1',
      numeroLote: '1001',
      registroANS: '123456',
      cnpjPrestador: '12345678000199',
      codigoPrestadorNaOperadora: 'PREST001',
      dataRegistro: '2026-08-14',
      horaRegistro: '10:00:00',
    }, [guia]);

    expect(xml).toContain('<ans:numeroGuiaPrestador>GUIA-EDITADA-001</ans:numeroGuiaPrestador>');
    expect(xml).toContain('<ans:indicacaoClinica>Acompanhamento psicoterapêutico semanal.</ans:indicacaoClinica>');
    expect(xml).toContain('<ans:valorTotalGeral>75.61</ans:valorTotalGeral>');
  });
});
