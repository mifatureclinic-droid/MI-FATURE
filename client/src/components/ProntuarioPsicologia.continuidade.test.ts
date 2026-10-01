import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validarCamposObrigatoriosContinuidade } from './ProntuarioPsicologia';

describe('validação da continuidade de sessão', () => {
  it('exige modalidade, sessão e queixa/demanda, mas não técnica aplicada', () => {
    expect(validarCamposObrigatoriosContinuidade({
      modalidadeAtendimento: '',
      tipoSessao: '',
      queixaPrincipal: ' ',
      intervencoes: '',
    })).toBe('Preencha: Modalidade, Sessão, Queixa principal/Demanda.');
  });

  it('aceita a continuidade sem técnica aplicada quando os campos obrigatórios foram preenchidos', () => {
    expect(validarCamposObrigatoriosContinuidade({
      modalidadeAtendimento: 'Presencial',
      tipoSessao: 'Sequência',
      queixaPrincipal: 'Acompanhamento da demanda relatada.',
      intervencoes: '',
    })).toBeNull();
  });

  it('mantém a ação de salvar visível na continuidade de sessão', () => {
    const source = readFileSync(resolve(process.cwd(), 'client/src/components/ProntuarioPsicologia.tsx'), 'utf8');
    const inicioContinuidade = source.indexOf("tipoRegistro === 'continuidade'");
    const inicioAnamnese = source.indexOf("      ) : (", inicioContinuidade);
    const blocoContinuidade = source.slice(inicioContinuidade, inicioAnamnese);

    expect(blocoContinuidade).toContain('Salvar continuidade');
    expect(blocoContinuidade).toContain('onClick={handleSalvar}');
  });
});
