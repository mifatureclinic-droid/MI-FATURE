import { describe, expect, it } from 'vitest';
import {
  calcularHoraFinalSadt,
  GRAU_PARTICIPACAO_BRADESCO_SADT,
  GRAU_PARTICIPACAO_PADRAO_SADT,
  obterGrauParticipacaoSadt,
  TECNICA_UTILIZADA_PADRAO_SADT,
  TIPOS_ATENDIMENTO_SADT,
  VIA_ACESSO_PADRAO_SADT,
} from './guiaSadtPadroes';

describe('padrões da Guia SADT', () => {
  it('inclui o tipo 13 para pequenos atendimentos', () => {
    expect(TIPOS_ATENDIMENTO_SADT).toContainEqual({ codigo: '13', descricao: 'Pequenos atendimentos' });
  });

  it('calcula a hora final em 30 minutos quando a duração não é informada', () => {
    expect(calcularHoraFinalSadt('08:00', undefined)).toBe('08:30');
    expect(calcularHoraFinalSadt('23:45', undefined)).toBe('00:15');
    expect(calcularHoraFinalSadt('08:00', 60)).toBe('09:00');
  });

  it('mantém via e técnica 1 e aplica grau de participação 00 para Bradesco', () => {
    expect(VIA_ACESSO_PADRAO_SADT).toBe('1');
    expect(TECNICA_UTILIZADA_PADRAO_SADT).toBe('1');
    expect(obterGrauParticipacaoSadt('Bradesco Saúde')).toBe(GRAU_PARTICIPACAO_BRADESCO_SADT);
    expect(obterGrauParticipacaoSadt('Bradesco Operadora')).toBe(GRAU_PARTICIPACAO_BRADESCO_SADT);
    expect(obterGrauParticipacaoSadt('Particular')).toBe(GRAU_PARTICIPACAO_PADRAO_SADT);
  });
});
