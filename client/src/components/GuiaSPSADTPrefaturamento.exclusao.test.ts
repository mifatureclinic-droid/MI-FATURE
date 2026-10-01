import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const fonteGuia = readFileSync(new URL('./GuiaSPSADTPrefaturamento.tsx', import.meta.url), 'utf8');

describe('exclusão de assinatura no pré-faturamento', () => {
  it('mantém o modal aberto enquanto a exclusão está pendente', () => {
    const modal = fonteGuia.slice(fonteGuia.indexOf('Excluir assinatura desta sessão?'), fonteGuia.indexOf('Duplicar assinatura para outra sessão?'));
    const executor = fonteGuia.slice(fonteGuia.indexOf('const executarExclusaoAssinatura ='), fonteGuia.indexOf('const duplicarAssinatura ='));
    expect(modal).toContain('<Button');
    expect(modal).toContain('onClick={executarExclusaoAssinatura}');
    expect(executor).toContain('mutateAsync(payload)');
    expect(executor).toContain('Promise.race([');
    expect(modal).not.toContain('setAssinaturaParaExcluir(null);\n              }}');
  });

  it('fecha somente no sucesso e preserva o modal quando a operação falha', () => {
    const sucessoLegado = fonteGuia.slice(fonteGuia.indexOf('const excluirAssinatura ='), fonteGuia.indexOf('const excluirAssinaturaSadt ='));
    const sucessoSadt = fonteGuia.slice(fonteGuia.indexOf('const excluirAssinaturaSadt ='), fonteGuia.indexOf('const duplicarAssinatura ='));
    expect(sucessoLegado).toContain('setAssinaturaParaExcluir(null);');
    expect(sucessoSadt).toContain('setAssinaturaParaExcluir(null);');
    expect(fonteGuia).toContain('Não foi possível excluir: {erroExclusaoAssinatura}');
    expect(fonteGuia).toContain('setErroExclusaoAssinatura(mensagem);');
    expect(fonteGuia).toContain('A exclusão demorou mais do que o esperado');
    expect(fonteGuia).toContain('mutacao.reset();');
    expect(fonteGuia).toContain('onClick={executarExclusaoAssinatura}');
  });
});
