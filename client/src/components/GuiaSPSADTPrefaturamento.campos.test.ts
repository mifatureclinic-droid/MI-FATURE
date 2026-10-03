import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonteGuia = readFileSync(new URL('./GuiaSPSADTPrefaturamento.tsx', import.meta.url), 'utf8');
const fonteEstilos = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

describe('campos da Guia SADT no pré-faturamento', () => {
  it('mantém o tipo 13 e calcula a hora final automaticamente', () => {
    expect(fonteGuia).toContain('TIPOS_ATENDIMENTO_SADT.map');
    expect(fonteGuia).toContain("horaFinal: calcularHoraFinalSadt(execucaoSalva?.horaInicial || s.hora, s.duracao)");
    expect(fonteGuia).toContain("horaFinal: calcularHoraFinalSadt(p.horaInicial, undefined)");
    expect(fonteGuia).toContain("readOnly={field === 'horaFinal'}");
  });

  it('fixa via e técnica como 1 na execução do procedimento', () => {
    expect(fonteGuia).toContain('value={VIA_ACESSO_PADRAO_SADT}');
    expect(fonteGuia).toContain('value={TECNICA_UTILIZADA_PADRAO_SADT}');
    expect(fonteGuia).toContain('aria-label="Via de acesso 1"');
    expect(fonteGuia).toContain('aria-label="Técnica utilizada 1 convencional"');
  });

  it('reorganiza a tabela do profissional a partir dos campos 48 e 49', () => {
    expect(fonteGuia).toContain('48-Seq/Ref');
    expect(fonteGuia).toContain('49-Grau Part.');
    expect(fonteGuia).toContain('50-Código na Operadora/CPF');
    expect(fonteGuia).toContain('55-Código CBO');
    expect(fonteGuia).toContain('56-Data de Realização de Procedimentos em Série / 57-Assinatura do Beneficiário ou Responsável');
    expect(fonteGuia).not.toContain('50-Seq/Ref');
  });

  it('mantém o campo 67 exclusivamente com a assinatura visual do paciente', () => {
    expect(fonteGuia).toContain('67-Assinatura do Beneficiário ou Responsável');
    expect(fonteGuia).toContain('alt="Assinatura do paciente"');
    expect(fonteGuia).not.toContain('Última assinatura —');
    expect(fonteGuia).not.toContain('AssinaturaGuiaSADT');
    expect(fonteGuia).toContain('<AnexoRegistroDigitalSadt');
  });

  it('exibe assinaturas SADT assinadas em cada data clínica da própria guia e permite editar essa data', () => {
    expect(fonteGuia).toContain('const guiaIdNum = guiaData?.id ?? guiaData?.guiaId ?? 0;');
    expect(fonteGuia).toContain('trpc.assinaturas.listarPorGuia.useQuery');
    expect(fonteGuia).toContain("assinatura.status === 'assinado'");
    expect(fonteGuia).toContain('assinatura.assinaturaDataUrl');
    expect(fonteGuia).toContain("origem: 'sadt' as const");
    expect(fonteGuia).toContain('trpc.assinaturas.editarDataSessao.useMutation');
    expect(fonteGuia).toContain("origem: (sessao as any).origem === 'sadt' ? 'sadt' : 'legada'");
  });

  it('gera o PDF da Guia SADT em orientação horizontal', () => {
    expect(fonteGuia).toContain("orientation: 'landscape'");
  });

  it('configura a impressão da Guia SADT em A4 horizontal', () => {
    expect(fonteEstilos).toContain('size: A4 landscape;');
  });

  it('limita a impressão e o PDF à única folha horizontal da guia', () => {
    expect(fonteGuia).toContain('calcularEscalaImpressaoGuiaSadt(guia.scrollHeight)');
    expect(fonteGuia).not.toContain('pdf.addPage()');
    expect(fonteGuia).not.toContain('while (yOffset < imgHeight)');
    expect(fonteGuia).not.toContain('while (deslocamentoAnexo < anexoCanvas.height)');
    expect(fonteEstilos).toContain("[data-sadt-document='anexo']");
    expect(fonteEstilos).toContain('display: none !important;');
  });

  it('mostra o lote vinculado ao lado da guia principal e permite abri-lo', () => {
    expect(fonteGuia).toContain('Lote vinculado');
    expect(fonteGuia).toContain('onAbrirLote?.(loteVinculado.id)');
  });

  it('abre controles visíveis para editar a data ou confirmar a exclusão da assinatura', () => {
    expect(fonteGuia).toContain('Editar data da assinatura da sessão');
    expect(fonteGuia).toContain('Excluir assinatura desta sessão?');
    expect(fonteGuia).not.toContain("window.confirm('Excluir esta assinatura?')");
    expect(fonteGuia).toContain('const executarExclusaoAssinatura = async () =>');
    expect(fonteGuia).toContain("assinaturaParaExcluir.origem === 'sadt' ? excluirAssinaturaSadt : excluirAssinatura");
    expect(fonteGuia).toContain('await Promise.race([');
    expect(fonteGuia).toContain("? 'Excluindo...' : 'Excluir assinatura'");
  });

  it('permite duplicar uma assinatura somente após escolher uma data da mesma série', () => {
    expect(fonteGuia).toContain('Duplicar assinatura da sessão');
    expect(fonteGuia).toContain('Duplicar assinatura para outra sessão?');
    expect(fonteGuia).toContain('Nova data da sessão para duplicar assinatura');
    expect(fonteGuia).toContain('trpc.assinaturasGuias.duplicarAssinatura.useMutation');
  });

  it('dilui o pacote neuropsicológico pelas sessões na guia SADT sem modificar seu total', () => {
    expect(fonteGuia).toContain('ehPacoteAvaliacaoNeuropsicologica');
    expect(fonteGuia).toContain('ratearValorPacotePorSessao(valorPadrao, sessoesValidas.length)');
    expect(fonteGuia).toContain('valorTotal: ehPacoteNeuropsicologico');
  });

  it('protege o salvamento contra duplo clique e torna o estado do envio visível', () => {
    expect(fonteGuia).toContain('const [salvandoGuia, setSalvandoGuia]');
    expect(fonteGuia).toContain('if (salvandoGuia || !onSave) return;');
    expect(fonteGuia).toContain('disabled={salvandoGuia}');
    expect(fonteGuia).toContain("{salvandoGuia ? 'Salvando...' : (hasChanges ? 'Salvar Mudanças' : 'Salvar')}");
  });
});
