import React, { useState, useEffect, useRef, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { Printer, Save, Plus, Trash2, FileDown, Loader2, Edit2, X, FileSearch, Copy } from 'lucide-react';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '../_core/hooks/useAuth';
import { podeGerenciarDatasAssinatura } from '@shared/permissoesAssinatura';
import { normalizarHoraAtendimento } from '@shared/horarioAtendimento';
import {
  calcularHoraFinalSadt,
  obterGrauParticipacaoSadt,
  TECNICA_UTILIZADA_PADRAO_SADT,
  TIPOS_ATENDIMENTO_SADT,
  VIA_ACESSO_PADRAO_SADT,
} from '@shared/guiaSadtPadroes';
import { sincronizarCamposCabecalhoGuiaSadt } from '@shared/camposCabecalhoGuiaSadt';
import { extrairDatasAssinadas } from '@shared/datasAssinaturaGuia';
import { normalizarSenhaAutorizacaoPrefaturamento } from '@shared/senhaAutorizacaoPrefaturamento';
import { calcularValorTotalCampo65 } from '@shared/campo65ValorTotalGuia';
import { obterPrimeiraDataAtendimentoDaAssinatura } from '@shared/datasAtendimentoAssinatura';
import { criarEntradaAssinaturasDaGuia } from '@shared/consultaAssinaturasGuia';
import { assinaturaPertenceCompetenciaDaGuia } from '@shared/competenciaAssinaturaGuia';
import { calcularEscalaImpressaoGuiaSadt } from '@shared/impressaoGuiaSadt';
import { ehPacoteAvaliacaoNeuropsicologica, ratearValorPacotePorSessao } from '@shared/repasseValorSessao';
import { formatDateBR } from '../lib/utils';
import { OPCOES_SEGURO_CAPTURA_PDF } from '../lib/pdfCaptureCompat';
import { EditorDataSessaoModal } from './EditorDataSessaoModal';
import { AnexoRegistroDigitalSadt } from './AnexoRegistroDigitalSadt';

// Tabela 24 × Tabela 26 ANS — CBOs permitidos por conselho
const CBOS_POR_CONSELHO: Record<string, Array<{ codigo: string; descricao: string }>> = {
  '01': [{ codigo: '225125', descricao: 'Médico Fisiatra / Reabilitador' }],
  '03': [{ codigo: '223575', descricao: 'Obstetriz' }],
  '06': [
    { codigo: '223605', descricao: 'Fisioterapeuta Geral' },
    { codigo: '223630', descricao: 'Terapeuta Ocupacional' },
  ],
  '08': [{ codigo: '223810', descricao: 'Fonoaudiólogo Geral' }],
  '11': [
    { codigo: '251510', descricao: 'Psicólogo Clínico' },
    { codigo: '251545', descricao: 'Neuropsicólogo' },
  ],
};

// Todos os CBOs disponíveis (fallback quando conselho não tem regras mapeadas)
const TODOS_CBOS = [
  { codigo: '225125', descricao: 'Médico Fisiatra / Reabilitador' },
  { codigo: '223575', descricao: 'Obstetriz' },
  { codigo: '223605', descricao: 'Fisioterapeuta Geral' },
  { codigo: '223630', descricao: 'Terapeuta Ocupacional' },
  { codigo: '223810', descricao: 'Fonoaudiólogo Geral' },
  { codigo: '251510', descricao: 'Psicólogo Clínico' },
  { codigo: '251545', descricao: 'Neuropsicólogo' },
];

const CONSELHOS_SOLICITANTE = [
  { codigo: '01', descricao: 'CRM' }, { codigo: '02', descricao: 'CRO' },
  { codigo: '03', descricao: 'COREN' }, { codigo: '05', descricao: 'CRF' },
  { codigo: '06', descricao: 'CREFITO' }, { codigo: '07', descricao: 'CRN' },
  { codigo: '08', descricao: 'CRFA' }, { codigo: '11', descricao: 'CRP' },
  { codigo: '12', descricao: 'CRBM' }, { codigo: '13', descricao: 'CREF' },
  { codigo: '14', descricao: 'CRTR' }, { codigo: '15', descricao: 'CRBIO' },
  { codigo: '16', descricao: 'CRAS' },
];

const CODIGO_PRESTADOR_BRADESCO = '376402';

function getCBOsParaConselho(codigoConselho: string): Array<{ codigo: string; descricao: string }> {
  return CBOS_POR_CONSELHO[codigoConselho] ?? TODOS_CBOS;
}

interface Procedimento {
  id: number;
  tabela: string;
  codigo: string;
  descricao: string;
  qtdeSolic: number;
  qtdeAutorz: number;
}

interface ExecucaoProcedimento {
  id: number;
  data: string;
  horaInicial: string;
  horaFinal: string;
  tabela: string;
  codigo: string;
  descricao: string;
  qtde: number;
  via: string;
  tec: string;
  fatorRedAcresc: string;
  valorUnitario: number;
  valorTotal: number;
  profissionalId?: number; // vínculo com profissional executante
}

interface ProfissionalExecutante {
  id: number;
  profissionalId?: number; // id do profissional cadastrado
  seqRef: string;
  grauPart: string;
  codigoOperadoraCPF: string;
  nome: string;
  conselhoProfissional: string;
  numeroConselho: string;
  uf: string;
  codigoCBO: string;
}

interface GuiaFormData {
  // Cabeçalho
  registroANS?: string;
  codigoNaOperadora?: string;
  logoConvenio?: string;
  numeroGuiaPrincipal?: string;
  numeroGuiaPrestador?: string;
  dataAutorizacao?: string;
  senha?: string;
  dataValidadeSenha?: string;
  numeroGuiaOperadora?: string;
  // Beneficiário
  numeroCarteira?: string;
  validadeCarteira?: string;
  nomeBeneficiario?: string;
  nomeSocial?: string;
  atendimentoRN?: string;
  // Contratado Solicitante
  codigoOperadoraSolicitante?: string;
  nomeContratadoSolicitante?: string;
  nomeProfissionalSolicitante?: string;
  conselhoProfissionalSolicitante?: string;
  numeroConselhoSolicitante?: string;
  ufSolicitante?: string;
  codigoCBOSolicitante?: string;
  // Solicitação
  caraterAtendimento?: string;
  dataSolicitacao?: string;
  indicacaoClinica?: string;
  indicadorCobertura?: string;
  // Contratado Executante
  codigoOperadoraExecutante?: string;
  nomeContratadoExecutante?: string;
  codigoCNES?: string;
  // Atendimento
  tipoAtendimento?: string;
  indicacaoAcidente?: string;
  tipoConsulta?: string;
  motivoEncerramento?: string;
  regimeAtendimento?: string;
  saudeOcupacional?: string;
  // Datas em série (campo 58)
  datasSerieAssinatura?: string[];
  // Observação
  observacaoJustificativa?: string;
  // Totais
  totalProcedimentos?: number;
  totalTaxasAlugueis?: number;
  totalMateriais?: number;
  totalOPME?: number;
  totalMedicamentos?: number;
  totalGasesMedicinais?: number;
  totalGeral?: number;
  // Meta
  guiaId?: number;
  pacienteId?: number;
  pacienteNome?: string;
  pacienteCPF?: string;
  numeroGuia?: string;
  procedimento?: string;
  dataAtendimento?: Date;
  totalSessoes?: number;
  historicoAssinaturas?: any[];
  geradoPor?: string;
  [key: string]: any;
}

interface GuiaSPSADTPrefaturamentoProps {
  guiaData?: GuiaFormData;
  onSave?: (data: any) => void;
  loteVinculado?: {
    id: number;
    numeroLote: string;
    status?: string | null;
  } | null;
  onAbrirLote?: (loteId: number) => void;
  onExtrairSolicitantePedido?: () => Promise<{
    encontrou: boolean;
    salvoAutomaticamente: boolean;
    motivo: string | null;
    dados: { nome: string; conselho: string; numeroConselho: string; uf: string; cbo: string | null; confianca: number } | null;
  }>;
  convenioId?: number;
  onClose?: () => void;
  procedimentosSalvos?: Array<{
    id: number;
    guiaId: number;
    sequencial: number;
    dataExecucao?: Date | string | null;
    horaInicial?: string | null;
    horaFinal?: string | null;
    codigoTabela?: string | null;
    codigoProcedimento: string;
    descricaoProcedimento: string;
    quantidadeExecutada: string | number;
    valorUnitario: string | number;
    valorTotal: string | number;
    reducaoAcrescimo?: string | number | null;
    profissionalId?: number | null;
  }>;
  sessoes?: Array<{
    id: number;
    data?: string | null;
    hora?: string | null;
    duracao?: number | null;
    status?: string;
    codigoTUSS?: string | null;
    descricaoProcedimento?: string | null;
    valor?: string | null;
    codigoTabela?: string;
  }>;
}

// Campo de formulário compacto no estilo da guia oficial
function Campo({
  numero,
  label,
  value,
  onChange,
  disabled,
  className = '',
  inputClassName = '',
  type = 'text',
}: {
  numero?: string | number;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  type?: string;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-[9px] leading-tight text-gray-600 font-medium">
        {numero ? `${numero}-` : ''}{label}
      </span>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        className={`border-b border-gray-400 bg-transparent text-[10px] leading-tight outline-none w-full ${disabled ? '' : 'focus:border-blue-500'} ${inputClassName}`}
      />
    </div>
  );
}

export function GuiaSPSADTPrefaturamento({ guiaData, onSave, loteVinculado, onAbrirLote, onExtrairSolicitantePedido, convenioId, onClose, procedimentosSalvos, sessoes }: GuiaSPSADTPrefaturamentoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GuiaFormData>(guiaData || {});
  const campo49Bradesco = obterGrauParticipacaoSadt(guiaData?.nomeConvenio) === '00';
  const [assinaturaEmEdicao, setAssinaturaEmEdicao] = useState<{ id: number; origem: 'legada' | 'sadt' } | null>(null);
  const [assinaturaParaExcluir, setAssinaturaParaExcluir] = useState<{ id: number; guiaId: number; origem: 'legada' | 'sadt' } | null>(null);
  const [erroExclusaoAssinatura, setErroExclusaoAssinatura] = useState<string | null>(null);
  const [exclusaoEmAndamento, setExclusaoEmAndamento] = useState(false);
  const [assinaturaParaDuplicar, setAssinaturaParaDuplicar] = useState<{ id: number; guiaId: number; origem: 'legada' | 'sadt'; dataOrigem: string } | null>(null);
  const [novaDataSessao, setNovaDataSessao] = useState('');
  const [novaDataDuplicada, setNovaDataDuplicada] = useState('');
  const { user } = useAuth();
  const podeGerenciarAssinaturas = podeGerenciarDatasAssinatura((user as any)?.perfil, (user as any)?.role);
  const utils = trpc.useUtils();

  // Carregar lista de profissionais para os seletores de solicitante e executante
  const { data: listaProfissionais = [] } = trpc.profissionais.list.useQuery();
  const profissionaisAtivos = listaProfissionais.filter((p: any) => p.ativo !== 0);

  // Carregar procedimentos disponíveis para o convênio selecionado
  const convenioIdNum = convenioId ?? 0;
  const { data: procedimentosConvenio = [] } = trpc.procedimentos.getProcedimentosPorConvenio.useQuery(
    { convenioId: convenioIdNum },
    { enabled: convenioIdNum > 0 }
  );

  // Cada guia possui seu próprio registro digital. Não misturar assinaturas de
  // guias anteriores ou posteriores, mesmo quando o paciente pertence a uma série.
  // A lista de guias entrega o identificador como `id`; o fluxo de Agenda
  // pode entregá-lo como `guiaId`. Aceitar ambos evita desabilitar a consulta
  // de assinaturas quando o pré-faturamento abre uma guia já existente.
  const guiaIdNum = guiaData?.id ?? guiaData?.guiaId ?? 0;
  const entradaAssinaturasDaGuia = useMemo(
    () => criarEntradaAssinaturasDaGuia(guiaIdNum),
    [guiaIdNum],
  );
  const { data: assinaturasLive = [], refetch: refetchAssinaturas } = trpc.assinaturasGuias.list.useQuery(
    entradaAssinaturasDaGuia ?? { guiaId: 0 },
    { enabled: entradaAssinaturasDaGuia !== null, staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true }
  );
  const { data: assinaturasSadtLive = [], refetch: refetchAssinaturasSadt } = trpc.assinaturas.listarPorGuia.useQuery(
    { guiaId: guiaIdNum },
    { enabled: guiaIdNum > 0, staleTime: 0, refetchOnMount: 'always', refetchOnWindowFocus: true }
  );
  const assinaturasLegadasDaCompetencia = assinaturasLive.filter((assinatura: any) => (
    assinaturaPertenceCompetenciaDaGuia(
      assinatura.datasAtendimento,
      guiaData?.dataEmissao ?? guiaData?.dataAtendimento,
    )
  ));
  // Assinaturas registradas pelo fluxo SADT são o comprovante por sessão. Elas
  // não existem necessariamente na tabela legada e devem aparecer na guia sem
  // criar cópias nem reaproveitar registros de outra guia.
  const assinaturasSadtDaGuia = assinaturasSadtLive
    .filter((assinatura: any) => assinatura.status === 'assinado' && Boolean(assinatura.assinaturaDataUrl))
    .map((assinatura: any) => {
      const dataSessao = assinatura.dataSessao instanceof Date
        ? assinatura.dataSessao.toISOString().slice(0, 10)
        : String(assinatura.dataSessao).slice(0, 10);
      return {
        id: assinatura.id,
        guiaId: assinatura.guiaId,
        sessaoNumero: assinatura.numeroSessao,
        datasAtendimento: JSON.stringify([dataSessao]),
        assinaturaPacienteUrl: assinatura.assinaturaDataUrl,
        dataAssinatura: assinatura.dataAssinatura,
        hashAssinatura: assinatura.assinaturaHash,
        origem: 'sadt' as const,
      };
    });
  const assinaturasDaCompetencia = [...assinaturasLegadasDaCompetencia, ...assinaturasSadtDaGuia].filter((assinatura: any, indice, lista) => {
    const chave = `${assinatura.origem ?? 'legada'}:${assinatura.id}:${assinatura.datasAtendimento}`;
    return lista.findIndex((candidata: any) => `${candidata.origem ?? 'legada'}:${candidata.id}:${candidata.datasAtendimento}` === chave) === indice;
  });

  const editarDataSessao = trpc.assinaturasGuias.editarDataSessao.useMutation({
    onSuccess: () => {
      toast.success('Data da sessão atualizada');
      setAssinaturaEmEdicao(null);
      setNovaDataSessao('');
      refetchAssinaturas();
      refetchAssinaturasSadt();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
    },
    onError: (erro: any) => toast.error(`Erro ao atualizar data da sessão: ${erro.message}`),
  });

  const editarDataSessaoSadt = trpc.assinaturas.editarDataSessao.useMutation({
    onSuccess: () => {
      toast.success('Data da sessão atualizada');
      setAssinaturaEmEdicao(null);
      setNovaDataSessao('');
      refetchAssinaturas();
      refetchAssinaturasSadt();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
      utils.assinaturas.listarPorGuia.invalidate();
    },
    onError: (erro: any) => toast.error(`Erro ao atualizar data da sessão: ${erro.message}`),
  });

  const excluirAssinatura = trpc.assinaturasGuias.excluirAssinatura.useMutation({
    onSuccess: () => {
      toast.success('Assinatura excluída');
      setErroExclusaoAssinatura(null);
      setAssinaturaParaExcluir(null);
      refetchAssinaturas();
      refetchAssinaturasSadt();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
    },
    onError: (erro: any) => {
      const mensagem = erro?.message || 'Não foi possível excluir a assinatura.';
      setErroExclusaoAssinatura(mensagem);
      toast.error(`Erro ao excluir assinatura: ${mensagem}`);
    },
  });

  const excluirAssinaturaSadt = trpc.assinaturas.excluirAssinatura.useMutation({
    onSuccess: () => {
      toast.success('Assinatura excluída');
      setErroExclusaoAssinatura(null);
      setAssinaturaParaExcluir(null);
      refetchAssinaturas();
      refetchAssinaturasSadt();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
      utils.assinaturas.listarPorGuia.invalidate();
    },
    onError: (erro: any) => {
      const mensagem = erro?.message || 'Não foi possível excluir a assinatura.';
      setErroExclusaoAssinatura(mensagem);
      toast.error(`Erro ao excluir assinatura: ${mensagem}`);
    },
  });

  const executarExclusaoAssinatura = async () => {
    if (!assinaturaParaExcluir || exclusaoEmAndamento) return;
    const payload = { assinaturaId: assinaturaParaExcluir.id, guiaId: assinaturaParaExcluir.guiaId };
    const mutacao = assinaturaParaExcluir.origem === 'sadt' ? excluirAssinaturaSadt : excluirAssinatura;
    setErroExclusaoAssinatura(null);
    setExclusaoEmAndamento(true);
    let limite: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        mutacao.mutateAsync(payload),
        new Promise<never>((_, rejeitar) => {
          limite = setTimeout(() => rejeitar(new Error('A exclusão demorou mais do que o esperado. A tela foi liberada; atualize a guia antes de tentar novamente.')), 12_000);
        }),
      ]);
    } catch (erro: unknown) {
      const mensagem = erro instanceof Error && erro.message
        ? erro.message
        : 'Não foi possível excluir a assinatura.';
      console.error('[Prefat] exclusão de assinatura falhou', { payload, origem: assinaturaParaExcluir.origem, erro });
      setErroExclusaoAssinatura(mensagem);
      toast.error(`Erro ao excluir assinatura: ${mensagem}`);
      try {
        mutacao.reset();
      } catch (resetErro) {
        console.error('[Prefat] não foi possível resetar a mutação de exclusão', resetErro);
      }
    } finally {
      if (limite !== undefined) clearTimeout(limite);
      setExclusaoEmAndamento(false);
    }
  };

  const duplicarAssinatura = trpc.assinaturasGuias.duplicarAssinatura.useMutation({
    onSuccess: (resultado: any) => {
      toast.success(`Assinatura duplicada para ${String(resultado.novaDataSessao).split('-').reverse().join('/')}`);
      setAssinaturaParaDuplicar(null);
      setNovaDataDuplicada('');
      refetchAssinaturas();
      refetchAssinaturasSadt();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
      utils.assinaturas.listarPorGuia.invalidate();
    },
    onError: (erro: any) => toast.error(`Erro ao duplicar assinatura: ${erro.message}`),
  });

  // Atualiza a cópia local apenas fora do modo de edição. A página pai cria um
  // novo objeto guiaData a cada renderização; sem esta proteção, qualquer
  // atualização de consulta substitui os valores que o usuário está digitando.
  useEffect(() => {
    if (guiaData && !isEditing) setFormData(guiaData);
  }, [guiaData, isEditing]);

  const [procedimentos, setProcedimentos] = useState<Procedimento[]>(() => {
    // Preencher com procedimentos salvos se existirem
    if (procedimentosSalvos && procedimentosSalvos.length > 0) {
      return procedimentosSalvos.map((p, i) => ({
        id: i + 1,
        tabela: p.codigoTabela || '22',
        codigo: p.codigoProcedimento || '',
        descricao: p.descricaoProcedimento || '',
        qtdeSolic: Number(p.quantidadeExecutada) || 1,
        qtdeAutorz: Number(p.quantidadeExecutada) || 1,
      }));
    }
    // Preencher com dados do guiaData se houver código TUSS
    if (guiaData?.codigoTUSS) {
      return [{ id: 1, tabela: '22', codigo: guiaData.codigoTUSS, descricao: guiaData.descricaoProcedimento || guiaData.procedimento || '', qtdeSolic: 1, qtdeAutorz: 1 }];
    }
    return [{ id: 1, tabela: '22', codigo: '', descricao: '', qtdeSolic: 1, qtdeAutorz: 1 }];
  });

  const [execucoes, setExecucoes] = useState<ExecucaoProcedimento[]>(() => {
    // Preencher execuções com os procedimentos salvos
    if (procedimentosSalvos && procedimentosSalvos.length > 0) {
      return procedimentosSalvos.map((p, i) => ({
        id: i + 1,
        data: p.dataExecucao ? formatDateBR(p.dataExecucao) : '',
        horaInicial: normalizarHoraAtendimento(p.horaInicial),
        horaFinal: normalizarHoraAtendimento(p.horaFinal),
        tabela: p.codigoTabela || '22',
        codigo: p.codigoProcedimento || '',
        descricao: p.descricaoProcedimento || '',
        qtde: Number(p.quantidadeExecutada) || 1,
        via: VIA_ACESSO_PADRAO_SADT,
        tec: TECNICA_UTILIZADA_PADRAO_SADT,
        fatorRedAcresc: String(p.reducaoAcrescimo || '1,00'),
        valorUnitario: parseFloat(String(p.valorUnitario || '0')),
        valorTotal: parseFloat(String(p.valorTotal || '0')),
        profissionalId: (p as any).profissionalId || guiaData?.profissionalId || undefined,
      }));
    }
    // Preencher com dados do guiaData se houver código TUSS
    if (guiaData?.codigoTUSS) {
      const dataAtend = guiaData.dataAtendimento ? formatDateBR(guiaData.dataAtendimento) : '';
      return [{
        id: 1,
        data: dataAtend,
        horaInicial: '',
        horaFinal: calcularHoraFinalSadt('', undefined),
        tabela: '22',
        codigo: guiaData.codigoTUSS,
        descricao: guiaData.descricaoProcedimento || guiaData.procedimento || '',
        qtde: 1,
        via: VIA_ACESSO_PADRAO_SADT,
        tec: TECNICA_UTILIZADA_PADRAO_SADT,
        fatorRedAcresc: '1,00',
        valorUnitario: guiaData.valorUnitario || 0,
        valorTotal: guiaData.valorTotal || 0,
        profissionalId: guiaData.profissionalId || undefined,
      }];
    }
    return [{ id: 1, data: '', horaInicial: '', horaFinal: '', tabela: '22', codigo: '', descricao: '', qtde: 1, via: VIA_ACESSO_PADRAO_SADT, tec: TECNICA_UTILIZADA_PADRAO_SADT, fatorRedAcresc: '1,00', valorUnitario: 0, valorTotal: 0, profissionalId: guiaData?.profissionalId || undefined }];
  });

  const [profissionais, setProfissionais] = useState<ProfissionalExecutante[]>(() => {
    // Preencher com dados do profissional executante se disponíveis
    if (guiaData?.nomeProfissional || guiaData?.registroProfissional) {
      return [{
        id: 1,
        profissionalId: guiaData.profissionalId,
        seqRef: '1',
        grauPart: obterGrauParticipacaoSadt(guiaData?.nomeConvenio),
        codigoOperadoraCPF: guiaData.cpfProfissional || '',
        nome: guiaData.nomeProfissional || '',
        conselhoProfissional: guiaData.conselhoProfissional || 'CRM',
        numeroConselho: guiaData.registroProfissional || '',
        uf: guiaData.uf || '',
        codigoCBO: guiaData.codigoCBO || '',
      }];
    }
    return [{ id: 1, profissionalId: guiaData?.profissionalId, seqRef: '1', grauPart: obterGrauParticipacaoSadt(guiaData?.nomeConvenio), codigoOperadoraCPF: '', nome: '', conselhoProfissional: '9', numeroConselho: '', uf: '13', codigoCBO: '' }];
  });

  // Quando guiaData, procedimentosSalvos ou sessoes mudam, re-hidratar as tabelas
  useEffect(() => {
    // As linhas de procedimentos/execuções são editáveis. Nunca substituí-las
    // enquanto a pessoa estiver alterando a guia.
    if (isEditing) return;
    // Procedimentos salvos válidos (com código preenchido)
    const salvosValidos = (procedimentosSalvos || []).filter(p => p.codigoProcedimento);
    const profissionaisPersistidos = Array.isArray((guiaData as any)?.profissionais)
      ? (guiaData as any).profissionais.map((p: any, i: number) => ({
          id: p.id ?? i + 1,
          profissionalId: p.profissionalId ? Number(p.profissionalId) : undefined,
          seqRef: String(p.seqRef ?? i + 1),
          grauPart: obterGrauParticipacaoSadt(guiaData?.nomeConvenio),
          codigoOperadoraCPF: p.codigoOperadoraCPF || '',
          nome: p.nome || '',
          conselhoProfissional: p.conselhoProfissional || '9',
          numeroConselho: p.numeroConselho || '',
          uf: p.uf || '13',
          codigoCBO: p.codigoCBO || '',
        }))
      : [];
    // Data do atendimento para preencher campo 36 (formato dd/mm/aaaa)
    const formatarDataAbreviada = (dataInput: any): string => {
      if (!dataInput) return '';
      const dataFormatada = formatDateBR(dataInput);
      return dataFormatada === '—' ? '' : dataFormatada;
    };
    const dataAtend = formatarDataAbreviada(guiaData?.dataAtendimento);
    const datasAssinadas = extrairDatasAssinadas(
      (guiaData?.historicoAssinaturas || formData.historicoAssinaturas || []) as Array<Record<string, unknown>>,
    );
    const dataAssinadaExibida = (indice: number) => formatarDataAbreviada(datasAssinadas[indice]);

    // Sessões do paciente — cada sessão gera uma linha na tabela de execuções
    const sessoesValidas = (sessoes || []).filter(s => s.data);

    if (sessoesValidas.length > 1) {
      // Múltiplas sessões: uma linha por sessão na tabela de execuções
      // Usar o código TUSS da sessão ou o do guiaData como fallback
      const codigoPadrao = guiaData?.codigoTUSS || '';
      const descricaoPadrao = guiaData?.descricaoProcedimento || guiaData?.procedimento || '';
      const valorPadrao = guiaData?.valorUnitario || 0;
      const ehPacoteNeuropsicologico = ehPacoteAvaliacaoNeuropsicologica(
        guiaData?.nomeConvenio,
        descricaoPadrao,
      );
      const valoresRateadosDoPacote = ehPacoteNeuropsicologico
        ? ratearValorPacotePorSessao(valorPadrao, sessoesValidas.length)
        : [];

      // Tabela de procedimentos solicitados: apenas 1 linha com o procedimento principal
      setProcedimentos([{
        id: 1,
        tabela: '22',
        codigo: codigoPadrao,
        descricao: descricaoPadrao,
        qtdeSolic: sessoesValidas.length,
        qtdeAutorz: sessoesValidas.length,
      }]);

      // Tabela de execuções: uma linha por sessão, com profissional da sessão
      setExecucoes(sessoesValidas.map((s, i) => {
        const execucaoSalva = salvosValidos.find(p => Number(p.sequencial) === i + 1) || salvosValidos[i];
        const codigo = s.codigoTUSS || codigoPadrao;
        const descricao = s.descricaoProcedimento || descricaoPadrao;
        const valor = s.valor ? parseFloat(String(s.valor)) : valorPadrao;
        const valorRateado = valoresRateadosDoPacote[i];
        const valorUnitario = ehPacoteNeuropsicologico
          ? valorRateado
          : Number(execucaoSalva?.valorUnitario) || valor;
        const quantidadeExecutada = Number(execucaoSalva?.quantidadeExecutada) || 1;
        return {
          id: i + 1,
          data: execucaoSalva?.dataExecucao
            ? formatarDataAbreviada(execucaoSalva.dataExecucao)
            : dataAssinadaExibida(i) || formatarDataAbreviada(s.data),
          horaInicial: execucaoSalva?.horaInicial || normalizarHoraAtendimento(s.hora),
          horaFinal: calcularHoraFinalSadt(execucaoSalva?.horaInicial || s.hora, s.duracao),
          tabela: execucaoSalva?.codigoTabela || s.codigoTabela || '22',
          codigo: execucaoSalva?.codigoProcedimento || codigo,
          descricao: execucaoSalva?.descricaoProcedimento || descricao,
          qtde: quantidadeExecutada,
          via: VIA_ACESSO_PADRAO_SADT,
          tec: TECNICA_UTILIZADA_PADRAO_SADT,
          fatorRedAcresc: String(execucaoSalva?.reducaoAcrescimo || '1,00'),
          valorUnitario,
          valorTotal: ehPacoteNeuropsicologico
            ? valorUnitario * quantidadeExecutada
            : Number(execucaoSalva?.valorTotal) || valor,
          profissionalId: execucaoSalva?.profissionalId || (s as any).profissionalId || guiaData?.profissionalId || undefined,
        };
      }));

      // Tabela 48-55: uma linha por execução (mesmo profissional repete), seqRef = sequencial da execução
      const profissionaisPorExecucao = sessoesValidas.map((s: any, i: number) => ({
        id: Date.now() + i,
        profissionalId: s.profissionalId || guiaData?.profissionalId || undefined,
        seqRef: String(i + 1),
        grauPart: obterGrauParticipacaoSadt(guiaData?.nomeConvenio),
        codigoOperadoraCPF: s.profissionalCpf || guiaData?.cpfProfissional || '',
        nome: s.profissionalNome || guiaData?.nomeProfissional || '',
        conselhoProfissional: s.profissionalConselho || guiaData?.conselhoProfissional || 'CRM',
        numeroConselho: s.profissionalNumeroConselho || guiaData?.registroProfissional || '',
        uf: s.profissionalUf || guiaData?.uf || '',
        codigoCBO: s.profissionalCbo || guiaData?.codigoCBO || '',
      }));
      if (profissionaisPersistidos.length > 0) {
        setProfissionais(profissionaisPersistidos);
      } else if (profissionaisPorExecucao.length > 0) {
        setProfissionais(profissionaisPorExecucao);
      }
    } else if (salvosValidos.length > 0) {
      // A edição do usuário tem precedência sobre o preenchimento automático.
      setProcedimentos(salvosValidos.map((p, i) => ({
        id: i + 1,
        tabela: p.codigoTabela || '22',
        codigo: p.codigoProcedimento || '',
        descricao: p.descricaoProcedimento || '',
        qtdeSolic: Number(p.quantidadeExecutada) || 1,
        qtdeAutorz: Number(p.quantidadeExecutada) || 1,
      })));
      setExecucoes(salvosValidos.map((p, i) => ({
        id: i + 1,
        data: p.dataExecucao
          ? formatarDataAbreviada(p.dataExecucao)
          : dataAssinadaExibida(i) || dataAtend,
        horaInicial: normalizarHoraAtendimento(p.horaInicial),
        horaFinal: calcularHoraFinalSadt(p.horaInicial, undefined),
        tabela: p.codigoTabela || '22',
        codigo: p.codigoProcedimento || '',
        descricao: p.descricaoProcedimento || '',
        qtde: Number(p.quantidadeExecutada) || 1,
        via: VIA_ACESSO_PADRAO_SADT,
        tec: TECNICA_UTILIZADA_PADRAO_SADT,
        fatorRedAcresc: String(p.reducaoAcrescimo || '1,00'),
        valorUnitario: parseFloat(String(p.valorUnitario || '0')),
        valorTotal: parseFloat(String(p.valorTotal || '0')),
        profissionalId: p.profissionalId || guiaData?.profissionalId || undefined,
      })));
    } else if (guiaData?.codigoTUSS) {
      // Sessão única ou sem sessões: usar o procedimento do atendimento
      setProcedimentos([{
        id: 1,
        tabela: '22',
        codigo: guiaData.codigoTUSS,
        descricao: guiaData.descricaoProcedimento || guiaData.procedimento || '',
        qtdeSolic: 1,
        qtdeAutorz: 1,
      }]);
      setExecucoes([{
        id: 1,
        data: dataAssinadaExibida(0) || dataAtend,
        horaInicial: normalizarHoraAtendimento(guiaData?.horaAtendimento),
        horaFinal: calcularHoraFinalSadt(guiaData?.horaAtendimento, guiaData?.duracaoAtendimento),
        tabela: '22',
        codigo: guiaData.codigoTUSS,
        descricao: guiaData.descricaoProcedimento || guiaData.procedimento || '',
        qtde: 1,
        via: VIA_ACESSO_PADRAO_SADT,
        tec: TECNICA_UTILIZADA_PADRAO_SADT,
        fatorRedAcresc: '1,00',
        valorUnitario: guiaData.valorUnitario || 0,
        valorTotal: guiaData.valorTotal || 0,
        profissionalId: guiaData?.profissionalId || undefined,
      }]);
    }
    // Actualizar tabela de profissionais
    if (profissionaisPersistidos.length > 0) {
      setProfissionais(profissionaisPersistidos);
    } else if (sessoesValidas.length <= 1 && (guiaData?.nomeProfissional || guiaData?.registroProfissional)) {
      setProfissionais([{
        id: 1,
        profissionalId: guiaData.profissionalId || undefined,
        seqRef: '1',
        grauPart: obterGrauParticipacaoSadt(guiaData?.nomeConvenio),
        codigoOperadoraCPF: guiaData.cpfProfissional || '',
        nome: guiaData.nomeProfissional || '',
        conselhoProfissional: guiaData.conselhoProfissional || 'CRM',
        numeroConselho: guiaData.registroProfissional || '',
        uf: guiaData.uf || '',
        codigoCBO: guiaData.codigoCBO || '',
      }]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guiaData?.guiaId, guiaData?.cpfProfissional, guiaData?.uf, guiaData?.codigoCBO, guiaData?.nomeProfissional, guiaData?.registroProfissional, guiaData?.historicoAssinaturas?.length, guiaData?.profissionais, procedimentosSalvos, sessoes, isEditing]);

  const [datasSerieAssinatura, setDatasSerieAssinatura] = useState<string[]>(Array(10).fill(''));

  const set = (field: keyof GuiaFormData, value: any) => {
    setHasChanges(true);
    const camposSolicitante: Array<keyof GuiaFormData> = [
      'nomeProfissionalSolicitante',
      'conselhoProfissionalSolicitante',
      'numeroConselhoSolicitante',
      'ufSolicitante',
      'codigoCBOSolicitante',
    ];
    setFormData(prev => {
      const proximo = {
        ...prev,
        [field]: value,
        ...(camposSolicitante.includes(field) ? { solicitanteOrigem: 'manual' } : {}),
      };

      if (field === 'numeroGuiaPrestador') {
        return sincronizarCamposCabecalhoGuiaSadt(proximo);
      }
      if (field === 'dataAutorizacao' || field === 'dataSolicitacao') {
        return sincronizarCamposCabecalhoGuiaSadt({
          ...proximo,
          dataSolicitacao: value,
        });
      }
      return proximo;
    });
  };

  const guiaRef = useRef<HTMLDivElement>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (!guiaRef.current) return;
    setExportingPDF(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Capturar a guia como imagem de alta resolução
      const canvas = await html2canvas(guiaRef.current, {
        scale: 2,
        ...OPCOES_SEGURO_CAPTURA_PDF,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth / 2), pdfHeight / (imgHeight / 2));
      const imgX = (pdfWidth - (imgWidth / 2) * ratio) / 2;
      const scaledHeight = (imgHeight / 2) * ratio;
      const larguraGuia = (imgWidth / 2) * ratio;
      const yGuia = (pdfHeight - scaledHeight) / 2;

      // A guia principal ocupa sempre a primeira página A4 horizontal.
      pdf.addImage(imgData, 'JPEG', imgX, yGuia, larguraGuia, scaledHeight);

      const nomeGuia = formData.numeroGuia || 'guia';
      const nomePaciente = (formData.nomePaciente || 'paciente').replace(/\s+/g, '_');
      pdf.save(`GuiaSADT_${nomeGuia}_${nomePaciente}.pdf`);
      toast.success('PDF exportado com sucesso!');
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
      const mensagem = err instanceof Error ? err.message : '';
      toast.error(`Erro ao gerar PDF: ${mensagem || 'tente novamente.'}`, { duration: 10000 });
    } finally {
      setExportingPDF(false);
    }
  };

  const [hasChanges, setHasChanges] = React.useState(false);
  const [extraindoSolicitante, setExtraindoSolicitante] = useState(false);

  const handleExtrairSolicitantePedido = async () => {
    if (!onExtrairSolicitantePedido) return;
    setExtraindoSolicitante(true);
    try {
      const resultado = await onExtrairSolicitantePedido();
      if (!resultado.encontrou || !resultado.dados) {
        toast.warning(resultado.motivo || 'Não foi possível confirmar o profissional solicitante no pedido médico.');
        return;
      }

      setFormData(atual => ({
        ...atual,
        // Dados digitados manualmente têm precedência. O preenchimento
        // automático pelo profissional executante pode ser substituído pelo
        // profissional que efetivamente assinou o pedido médico.
        nomeProfissionalSolicitante: atual.solicitanteOrigem === 'manual' ? atual.nomeProfissionalSolicitante : resultado.dados!.nome,
        conselhoProfissionalSolicitante: atual.solicitanteOrigem === 'manual' ? atual.conselhoProfissionalSolicitante : resultado.dados!.conselho,
        numeroConselhoSolicitante: atual.solicitanteOrigem === 'manual' ? atual.numeroConselhoSolicitante : resultado.dados!.numeroConselho,
        ufSolicitante: atual.solicitanteOrigem === 'manual' ? atual.ufSolicitante : resultado.dados!.uf,
        codigoCBOSolicitante: atual.solicitanteOrigem === 'manual' ? atual.codigoCBOSolicitante : (resultado.dados!.cbo || atual.codigoCBOSolicitante || ''),
        solicitanteOrigem: atual.solicitanteOrigem === 'manual' ? 'manual' : 'pedido_medico',
      }));
      setHasChanges(true);
      setIsEditing(true);
      toast.success('Profissional solicitante identificado no pedido médico. Revise os campos e salve a guia.');
    } catch (erro: any) {
      toast.error(erro?.message || 'Não foi possível ler o pedido médico.');
    } finally {
      setExtraindoSolicitante(false);
    }
  };

  const [salvandoGuia, setSalvandoGuia] = React.useState(false);

  const handleSave = async () => {
    if (salvandoGuia || !onSave) return;

    setSalvandoGuia(true);
    try {
      try {
        await onSave({
          ...formData,
          totalProcedimentos,
          totalGeral,
          procedimentos,
          execucoes,
          profissionais,
        });
        // O pai invalida a consulta e reabre a guia com os dados persistidos.
        // Não limpar as linhas locais antes disso: a limpeza fazia a guia
        // parecer vazia e podia encobrir o resultado do salvamento.
        setHasChanges(false);
        setIsEditing(false);
        toast.success('Guia salva com sucesso!');
      } catch (err: any) {
        // Exibir erro de duplicado de forma clara
        const msg = err?.message || err?.data?.message || '';
        if (msg.startsWith('DUPLICADO:')) {
          toast.error(
            `⚠️ Dados duplicados detectados!\n${msg.replace('DUPLICADO: ', '')}`,
            { duration: 8000, style: { whiteSpace: 'pre-line' } }
          );
        } else {
          toast.error(`Erro ao salvar guia: ${msg || 'verifique os dados e tente novamente.'}`, {
            duration: 10000,
          });
        }
      } finally {
        setSalvandoGuia(false);
      }
    } catch {
      // O erro já é tratado no bloco interno para manter a mensagem exibida ao usuário.
    }
  };

  const handlePrint = () => {
    const guia = guiaRef.current;
    if (!guia) {
      window.print();
      return;
    }

    // O Chrome aplica zoom também ao fluxo de impressão. Assim, a altura da
    // guia é reduzida antes da paginação, mantendo todos os campos em A4 horizontal.
    const escala = calcularEscalaImpressaoGuiaSadt(guia.scrollHeight);
    guia.style.setProperty('--escala-impressao-sadt', String(escala));

    const limparEscala = () => guia.style.removeProperty('--escala-impressao-sadt');
    window.addEventListener('afterprint', limparEscala, { once: true });
    window.print();
  };

  // Totais automáticos
  const totalProcedimentos = execucoes.reduce((acc, e) => acc + (e.valorTotal || 0), 0);
  const totalGeral = calcularValorTotalCampo65({
    procedimentos: totalProcedimentos,
    taxasAlugueis: formData.totalTaxasAlugueis,
    materiais: formData.totalMateriais,
    opme: formData.totalOPME,
    medicamentos: formData.totalMedicamentos,
    gasesMedicinais: formData.totalGasesMedicinais,
  });

  React.useEffect(() => {
    setFormData(atual => {
      if (atual.totalProcedimentos === totalProcedimentos && atual.totalGeral === totalGeral) {
        return atual;
      }
      return { ...atual, totalProcedimentos, totalGeral };
    });
  }, [totalProcedimentos, totalGeral]);

  const d = (field: keyof GuiaFormData) => {
    if (field === 'codigoOperadoraSolicitante' && !formData[field]) {
      return CODIGO_PRESTADOR_BRADESCO;
    }
    return String(formData[field] || '');
  };
  const senhaAutorizacao = normalizarSenhaAutorizacaoPrefaturamento(formData.senha) ?? '';

  // Converte YYYY-MM-DD → DD/MM/AAAA para exibição
  const fmtDateBR = (val: string) => {
    if (!val) return '';
    const s = String(val);
    // Already in DD/MM/YYYY format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
    // Convert from YYYY-MM-DD
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  };

  // Converte DD/MM/AAAA → YYYY-MM-DD para armazenamento
  const parseDateBR = (val: string) => {
    if (!val) return '';
    const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return val;
  };
  const dis = !isEditing;

  return (
    <div data-sadt-print-shell className="flex flex-col h-screen w-screen bg-gray-50">
      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 print:hidden">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors"
              title="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-800">Prefaturamento da Guia SADT</h2>
        </div>
        <div className="flex gap-2">
          {onExtrairSolicitantePedido && guiaData?.pedidoMedicoUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtrairSolicitantePedido}
              disabled={extraindoSolicitante}
              className="flex items-center gap-2 border-violet-300 text-violet-700 hover:bg-violet-50"
              title="Ler a assinatura do pedido médico sem substituir campos preenchidos"
            >
              {extraindoSolicitante ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
              Ler pedido médico
            </Button>
          )}
          {!isEditing ? (
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  if (guiaData) setFormData(guiaData);
                }}
                className="flex items-center gap-2 text-gray-600"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button
                size="sm"
                type="button"
                onClick={handleSave}
                disabled={salvandoGuia}
                className={`flex items-center gap-2 ${hasChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
              >
                {salvandoGuia ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {salvandoGuia ? 'Salvando...' : (hasChanges ? 'Salvar Mudanças' : 'Salvar')}
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPDF}
            disabled={exportingPDF}
            className="flex items-center gap-2"
          >
            {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Exportar PDF
          </Button>
          {guiaData?.id && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (window.confirm('Excluir esta guia? Esta ação não pode ser desfeita.')) {
                  // Chamar callback de exclusão
                  if (onClose) onClose();
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Guia
            </Button>
          )}
          <Button
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>
      {/* Área de conteúdo scrollável */}
      <div data-sadt-print-container className="flex-1 overflow-auto bg-gray-50 p-4">
        <div ref={guiaRef} className="print-area guia-sadt-principal w-full bg-white font-sans text-[10px] print:text-[9px] mx-auto" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '297mm', minHeight: '210mm' }}>

      {/* ═══ CABEÇALHO ═══ */}
      <div className="border border-black">
        {/* Linha do título */}
        <div className="flex border-b border-black">
          {/* Logo / operadora */}
          <div className="w-32 border-r border-black p-1 flex items-center justify-center">
            {d('logoConvenio') ? (
              <img
                src={d('logoConvenio')}
                alt="Logo convênio"
                className="max-h-12 max-w-full object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="text-[11px] font-bold text-gray-600 leading-tight">Convênio</div>
              </div>
            )}
          </div>
          {/* Título */}
          <div className="flex-1 p-1 text-center flex items-center justify-center">
            <div>
              <div className="text-[10px] font-bold uppercase leading-tight">
                GUIA DE SERVIÇO PROFISSIONAL / SERVIÇO AUXILIAR DE DIAGNÓSTICO E TERAPIA - SP/SADT
              </div>
            </div>
          </div>
          {/* Nº Guia Prestador */}
          <div className="w-40 border-l border-black p-1">
            <div className="text-[9px] text-gray-600">2 - N° Guia do Prestador</div>
            <input
              type="text"
              value={d('numeroGuiaPrestador')}
              onChange={e => set('numeroGuiaPrestador', e.target.value)}
              disabled={dis}
              className="w-full text-[10px] font-bold border-b border-gray-400 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Linha 1: Registro ANS, Nº Guia Principal, Data Autorização, Senha, Validade, Nº Guia Operadora */}
        <div className="flex border-b border-black">
          <div className="flex-1 border-r border-black p-1">
            <Campo numero="1" label="Registro ANS" value={d('registroANS')} onChange={v => set('registroANS', v)} disabled={dis} />
          </div>
          <div className="flex-1 border-r border-black p-1">
            <Campo numero="2" label="N° Guia Principal" value={d('numeroGuiaPrincipal')} onChange={v => set('numeroGuiaPrincipal', v)} disabled={dis} />
            <div className="mt-1 flex items-center justify-between gap-1 text-[9px] leading-tight">
              <span className="text-gray-600 font-medium">Lote vinculado</span>
              {loteVinculado ? (
                <button
                  type="button"
                  onClick={() => onAbrirLote?.(loteVinculado.id)}
                  className="rounded border border-blue-300 bg-blue-50 px-1.5 py-0.5 font-semibold text-blue-700 hover:bg-blue-100 print:border-0 print:bg-transparent print:p-0 print:text-black"
                  title={`Abrir informações do lote ${loteVinculado.numeroLote}`}
                >
                  {loteVinculado.numeroLote}{loteVinculado.status ? ` · ${loteVinculado.status}` : ''}
                </button>
              ) : (
                <span className="font-medium text-gray-400">Sem lote</span>
              )}
            </div>
          </div>
          <div className="flex-1 border-r border-black p-1">
            <Campo numero="4" label="Data da Autorização" value={fmtDateBR(d('dataAutorizacao'))} onChange={v => set('dataAutorizacao', parseDateBR(v))} disabled={dis} />
          </div>
          <div className="flex-1 border-r border-black p-1">
            <Campo numero="5" label="Senha" value={senhaAutorizacao} onChange={v => set('senha', normalizarSenhaAutorizacaoPrefaturamento(v) ?? '')} disabled={dis} />
          </div>
          <div className="flex-1 border-r border-black p-1">
            <Campo numero="6" label="Data de Validade da Senha" value={fmtDateBR(d('dataValidadeSenha'))} onChange={v => set('dataValidadeSenha', parseDateBR(v))} disabled={dis} />
          </div>
          <div className="flex-1 p-1">
            <Campo numero="7" label="Número da Guia Atribuído pela Operadora" value={d('numeroGuiaOperadora')} onChange={v => set('numeroGuiaOperadora', v)} disabled={dis} />
          </div>
        </div>

        {/* ═══ DADOS DO BENEFICIÁRIO ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados do Beneficiário</div>
          <div className="flex">
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="8" label="N° Carteira" value={d('numeroCarteira')} onChange={v => set('numeroCarteira', v)} disabled={dis} />
            </div>
            <div className="w-28 border-r border-black p-1">
              <Campo numero="9" label="Validade da Carteira" value={fmtDateBR(d('validadeCarteira'))} onChange={v => set('validadeCarteira', parseDateBR(v))} disabled={dis} />
            </div>
            <div className="flex-[3] border-r border-black p-1">
              <Campo numero="10" label="Nome" value={d('nomeBeneficiario')} onChange={v => set('nomeBeneficiario', v)} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="99" label="Nome Social" value={d('nomeSocial')} onChange={v => set('nomeSocial', v)} disabled={dis} />
            </div>
            <div className="w-28 p-1">
              <Campo numero="12" label="Atendimento a RN" value={d('atendimentoRN')} onChange={v => set('atendimentoRN', v)} disabled={dis} />
            </div>
          </div>
        </div>

        {/* ═══ DADOS DO CONTRATADO SOLICITANTE ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados do Contratado Solicitante</div>
          <div className="flex border-b border-black">
            <div className="w-36 border-r border-black p-1">
              <Campo numero="13" label="Código na Operadora / CPF" value={d('codigoOperadoraSolicitante')} onChange={v => set('codigoOperadoraSolicitante', v)} disabled={dis} />
            </div>
            <div className="flex-1 p-1">
              <Campo numero="14" label="Nome do Contratado" value={d('nomeContratadoSolicitante')} onChange={v => set('nomeContratadoSolicitante', v)} disabled={dis} />
            </div>
          </div>
          {/* Seletor de profissional solicitante — visível apenas no modo de edição */}
          {!dis && profissionaisAtivos.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded px-2 py-1.5 mb-1 print:hidden">
              <div className="text-[9px] font-semibold text-green-800 mb-1">Selecionar Profissional Solicitante:</div>
              <select
                className="w-full text-[9px] border border-green-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-green-500"
                defaultValue=""
                onChange={e => {
                  const id = parseInt(e.target.value);
                  if (!id) return;
                  const p = profissionaisAtivos.find((p: any) => p.id === id) as any;
                  if (!p) return;
                  set('nomeProfissionalSolicitante', p.nome || '');
                  set('conselhoProfissionalSolicitante', p.conselhoProfissional || p.crm ? (p.crm ? 'CRM' : p.conselhoProfissional || '') : '');
                  set('numeroConselhoSolicitante', p.crm || p.numeroConselho || '');
                  set('ufSolicitante', p.uf || p.estado || '');
                  set('codigoCBOSolicitante', p.codigoCBO || '');
                  e.target.value = '';
                }}
              >
                <option value="">-- Escolha um profissional --</option>
                {profissionaisAtivos.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}{p.especialidade ? ` — ${p.especialidade}` : ''}{p.crm ? ` (CRM: ${p.crm})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[8px] text-green-600 mt-0.5">Ao selecionar, os campos Nome, Conselho, Número, UF e CBO serão preenchidos automaticamente.</p>
            </div>
          )}
          <div className="flex">
            <div className="flex-[2] border-r border-black p-1">
              <Campo numero="15" label="Nome do Profissional Solicitante" value={d('nomeProfissionalSolicitante')} onChange={v => set('nomeProfissionalSolicitante', v)} disabled={dis} />
            </div>
            <div className="w-24 border-r border-black p-1">
              <span className="text-[9px] text-gray-500 block mb-0.5">16-Conselho Profissional</span>
              {dis ? <span className="text-[9px]">{d('conselhoProfissionalSolicitante')}</span> : (
                <select value={d('conselhoProfissionalSolicitante')} onChange={e => set('conselhoProfissionalSolicitante', e.target.value)} className="w-full text-[9px] border-0 bg-transparent outline-none focus:ring-0 p-0">
                  <option value="">Selecione</option>
                  {CONSELHOS_SOLICITANTE.map(c => <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>)}
                </select>
              )}
            </div>
            <div className="w-24 border-r border-black p-1">
              <Campo numero="17" label="Número do Conselho" value={d('numeroConselhoSolicitante')} onChange={v => set('numeroConselhoSolicitante', v)} disabled={dis} />
            </div>
            <div className="w-16 border-r border-black p-1">
              <Campo numero="18" label="UF" value={d('ufSolicitante')} onChange={v => set('ufSolicitante', v)} disabled={dis} />
            </div>
            <div className="w-24 border-r border-black p-1">
              <span className="text-[9px] text-gray-500 block mb-0.5">19-Código CBO</span>
              {dis ? (
                <span className="text-[9px]">{d('codigoCBOSolicitante')}</span>
              ) : (
                <>
                  <input
                    list="cbos-solicitante"
                    value={d('codigoCBOSolicitante')}
                    onChange={e => set('codigoCBOSolicitante', e.target.value)}
                    className="w-full text-[9px] border-0 bg-transparent outline-none focus:ring-0 p-0"
                    title="Código CBO do profissional solicitante (Tabela 24 ANS)"
                  />
                  <datalist id="cbos-solicitante">
                    {getCBOsParaConselho(d('conselhoProfissionalSolicitante') || '').map(c => (
                      <option key={c.codigo} value={c.codigo}>{c.descricao}</option>
                    ))}
                  </datalist>
                </>
              )}
            </div>
            <div className="flex-1 p-1">
              <span className="text-[9px] text-gray-600">20-Assinatura do Profissional Solicitante</span>
              <div className="h-6 border-b border-gray-400 mt-1" />
            </div>
          </div>
        </div>

        {/* ═══ DADOS DA SOLICITAÇÃO ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados da Solicitação / Procedimentos e Exames Solicitados</div>
          <div className="flex border-b border-black">
            <div className="w-36 border-r border-black p-1">
              <Campo numero="21" label="Caráter do Atendimento" value={d('caraterAtendimento')} onChange={v => set('caraterAtendimento', v)} disabled={dis} />
            </div>
            <div className="w-32 border-r border-black p-1">
              <Campo numero="22" label="Data da Solicitação" value={fmtDateBR(d('dataSolicitacao'))} onChange={v => set('dataSolicitacao', parseDateBR(v))} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="23" label="Indicação Clínica" value={d('indicacaoClinica')} onChange={v => set('indicacaoClinica', v)} disabled={dis} />
            </div>
            <div className="w-40 p-1">
              <Campo numero="90" label="Indicador de Cobertura Especial" value={d('indicadorCobertura')} onChange={v => set('indicadorCobertura', v)} disabled={dis} />
            </div>
          </div>
          {/* Seletor de procedimento por convênio — visível apenas no modo de edição */}
          {!dis && procedimentosConvenio.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mb-1 print:hidden">
              <div className="text-[9px] font-semibold text-blue-800 mb-1">Selecionar procedimento do convênio:</div>
              <select
                className="w-full text-[9px] border border-blue-300 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue=""
                onChange={e => {
                  const id = parseInt(e.target.value);
                  if (!id) return;
                  const p = procedimentosConvenio.find(p => p.id === id);
                  if (!p) return;
                  const tabela = '22';
                  const codigo = p.codigoConvenio || p.codigoANS || '';
                  const descricao = p.descricaoConvenio || p.descricaoANS || '';
                  const valor = parseFloat(String(p.valor || '0'));
                  // Preencher tabela de procedimentos solicitados
                  setProcedimentos(prev => prev.map((proc, idx) =>
                    idx === 0 ? { ...proc, tabela, codigo, descricao } : proc
                  ));
                  // Preencher tabela de execução
                  setExecucoes(prev => prev.map((ex, idx) =>
                    idx === 0 ? { ...ex, tabela, codigo, descricao, valorUnitario: valor, valorTotal: valor * ex.qtde } : ex
                  ));
                  e.target.value = '';
                }}
              >
                <option value="">-- Escolha um procedimento --</option>
                {procedimentosConvenio.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.codigoConvenio || p.codigoANS} — {p.descricaoConvenio || p.descricaoANS || p.codigoConvenio}
                    {p.valor ? ` (R$ ${Number(p.valor).toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[8px] text-blue-600 mt-0.5">Ao selecionar, os campos Código e Descrição serão preenchidos automaticamente.</p>
            </div>
          )}
          {/* Tabela de procedimentos solicitados */}
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1 py-0.5 text-left w-12">24-Tabela</th>
                <th className="border border-black px-1 py-0.5 text-left w-24">25-Código do Procedimento</th>
                <th className="border border-black px-1 py-0.5 text-left">26-Descrição</th>
                <th className="border border-black px-1 py-0.5 text-center w-16">27-Qtde. Solic.</th>
                <th className="border border-black px-1 py-0.5 text-center w-16">28-Qtde. Autorizz.</th>
                {!dis && <th className="border border-black px-1 py-0.5 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {procedimentos.map(proc => (
                <tr key={proc.id}>
                  <td className="border border-black px-1">
                    <input value={proc.tabela} onChange={e => setProcedimentos(prev => prev.map(p => p.id === proc.id ? { ...p, tabela: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  <td className="border border-black px-1">
                    <input value={proc.codigo} onChange={e => setProcedimentos(prev => prev.map(p => p.id === proc.id ? { ...p, codigo: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  <td className="border border-black px-1">
                    <input value={proc.descricao} onChange={e => setProcedimentos(prev => prev.map(p => p.id === proc.id ? { ...p, descricao: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  <td className="border border-black px-1 text-center">
                    <input value={proc.qtdeSolic} onChange={e => setProcedimentos(prev => prev.map(p => p.id === proc.id ? { ...p, qtdeSolic: Number(e.target.value) } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px] text-center" type="number" />
                  </td>
                  <td className="border border-black px-1 text-center">
                    <input value={proc.qtdeAutorz} onChange={e => setProcedimentos(prev => prev.map(p => p.id === proc.id ? { ...p, qtdeAutorz: Number(e.target.value) } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px] text-center" type="number" />
                  </td>
                  {!dis && (
                    <td className="border border-black px-1 text-center">
                      <button onClick={() => { setProcedimentos(prev => prev.filter(p => p.id !== proc.id)); setHasChanges(true); }} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!dis && (
            <button onClick={() => setProcedimentos(prev => [...prev, { id: Date.now(), tabela: '22', codigo: '', descricao: '', qtdeSolic: 1, qtdeAutorz: 1 }])} className="text-[9px] text-blue-600 hover:text-blue-800 px-1 py-0.5 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Adicionar procedimento
            </button>
          )}
        </div>

        {/* ═══ DADOS DO CONTRATADO EXECUTANTE ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados do Contratado Executante</div>
          <div className="flex">
            <div className="w-36 border-r border-black p-1">
              <Campo numero="29" label="Código na Operadora" value={d('codigoOperadoraExecutante')} onChange={v => set('codigoOperadoraExecutante', v)} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="30" label="Nome do Contratado" value={d('nomeContratadoExecutante')} onChange={v => set('nomeContratadoExecutante', v)} disabled={dis} />
            </div>
            <div className="w-36 p-1">
              <Campo numero="31" label="Código CNES" value={d('codigoCNES')} onChange={v => set('codigoCNES', v)} disabled={dis} />
            </div>
          </div>
        </div>

        {/* ═══ DADOS DO ATENDIMENTO ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados do Atendimento</div>
          <div className="flex">
            <div className="flex-1 border-r border-black p-1">
              <span className="text-[9px] text-gray-500 block mb-0.5">32-Tipo de Atendimento</span>
              {dis ? <span className="text-[9px]">{d('tipoAtendimento')}</span> : (
                <select value={d('tipoAtendimento')} onChange={e => set('tipoAtendimento', e.target.value)} className="w-full text-[9px] border-0 bg-transparent outline-none focus:ring-0 p-0">
                  <option value="">Selecione</option>
                  {TIPOS_ATENDIMENTO_SADT.map(tipo => <option key={tipo.codigo} value={tipo.codigo}>{tipo.codigo} — {tipo.descricao}</option>)}
                </select>
              )}
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="33" label="Indicação de Acidente" value={d('indicacaoAcidente')} onChange={v => set('indicacaoAcidente', v)} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="34" label="Tipo de Consulta" value={d('tipoConsulta')} onChange={v => set('tipoConsulta', v)} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="35" label="Motivo de Encerramento do Atendimento" value={d('motivoEncerramento')} onChange={v => set('motivoEncerramento', v)} disabled={dis} />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <Campo numero="91" label="Regime de Atendimento" value={d('regimeAtendimento')} onChange={v => set('regimeAtendimento', v)} disabled={dis} />
            </div>
            <div className="flex-1 p-1">
              <Campo numero="92" label="Saúde Ocupacional" value={d('saudeOcupacional')} onChange={v => set('saudeOcupacional', v)} disabled={dis} />
            </div>
          </div>
        </div>

        {/* ═══ DADOS DE EXECUÇÃO ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Dados de Execução / Procedimentos e Exames Realizados</div>
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1 py-0.5 text-left w-20">36-Data</th>
                <th className="border border-black px-1 py-0.5 text-center w-14">37-Hora Inicial</th>
                <th className="border border-black px-1 py-0.5 text-center w-14">38-Hora Final</th>
                <th className="border border-black px-1 py-0.5 text-center w-10">39-Tabela</th>
                <th className="border border-black px-1 py-0.5 text-left w-20">40-Código do Procedimento</th>
                <th className="border border-black px-1 py-0.5 text-left">41-Descrição</th>
                <th className="border border-black px-1 py-0.5 text-center w-10">42-Qtde.</th>
                <th className="border border-black px-1 py-0.5 text-center w-8">43-Via</th>
                <th className="border border-black px-1 py-0.5 text-center w-8">44-Tec.</th>
                <th className="border border-black px-1 py-0.5 text-center w-16">45-Fator Red./Acresc.</th>
                <th className="border border-black px-1 py-0.5 text-right w-20">46-Valor Unitário - R$</th>
                <th className="border border-black px-1 py-0.5 text-right w-20">47-Valor Total - R$</th>
                {!dis && <th className="border border-black px-1 py-0.5 w-8 print:hidden"></th>}
              </tr>
            </thead>
            <tbody>
              {execucoes.map(exec => (
                <tr key={exec.id}>
                  {(['data','horaInicial','horaFinal','tabela','codigo','descricao'] as const).map(field => (
                    <td key={field} className="border border-black px-1">
                      <input value={exec[field]} onChange={e => {
                        const valor = e.target.value;
                        setExecucoes(prev => prev.map(ex => ex.id === exec.id ? {
                          ...ex,
                          [field]: valor,
                          ...(field === 'horaInicial' ? { horaFinal: calcularHoraFinalSadt(valor, undefined) } : {}),
                        } : ex));
                        setHasChanges(true);
                      }} disabled={dis} readOnly={field === 'horaFinal'} className="w-full bg-transparent outline-none text-[9px]" />
                    </td>
                  ))}
                  <td className="border border-black px-1 text-center">
                    <input value={exec.qtde} onChange={e => setExecucoes(prev => prev.map(ex => ex.id === exec.id ? { ...ex, qtde: Number(e.target.value), valorTotal: Number(e.target.value) * ex.valorUnitario } : ex))} disabled={dis} className="w-full bg-transparent outline-none text-[9px] text-center" type="number" />
                  </td>
                  <td className="border border-black px-1 text-center">
                    <input value={VIA_ACESSO_PADRAO_SADT} readOnly aria-label="Via de acesso 1" className="w-full bg-transparent outline-none text-[9px] text-center" />
                  </td>
                  <td className="border border-black px-1 text-center">
                    <input value={TECNICA_UTILIZADA_PADRAO_SADT} readOnly aria-label="Técnica utilizada 1 convencional" className="w-full bg-transparent outline-none text-[9px] text-center" />
                  </td>
                  <td className="border border-black px-1 text-center">
                    <input value={exec.fatorRedAcresc} onChange={e => setExecucoes(prev => prev.map(ex => ex.id === exec.id ? { ...ex, fatorRedAcresc: e.target.value } : ex))} disabled={dis} className="w-full bg-transparent outline-none text-[9px] text-center" />
                  </td>
                  <td className="border border-black px-1 text-right">
                    <input value={exec.valorUnitario.toFixed(2)} onChange={e => { const v = parseFloat(e.target.value) || 0; setExecucoes(prev => prev.map(ex => ex.id === exec.id ? { ...ex, valorUnitario: v, valorTotal: v * ex.qtde } : ex)); }} disabled={dis} className="w-full bg-transparent outline-none text-[9px] text-right" type="number" step="0.01" />
                  </td>
                  <td className="border border-black px-1 text-right font-bold">
                    {exec.valorTotal.toFixed(2)}
                  </td>
                  {!dis && (
                    <td className="border border-black px-1 text-center print:hidden">
                      <button onClick={() => { setExecucoes(prev => prev.filter(ex => ex.id !== exec.id)); setHasChanges(true); }} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!dis && (
            <button onClick={() => setExecucoes(prev => [...prev, { id: Date.now(), data: '', horaInicial: '', horaFinal: '', tabela: '22', codigo: '', descricao: '', qtde: 1, via: VIA_ACESSO_PADRAO_SADT, tec: TECNICA_UTILIZADA_PADRAO_SADT, fatorRedAcresc: '1,00', valorUnitario: 0, valorTotal: 0, profissionalId: guiaData?.profissionalId || undefined }])} className="text-[9px] text-blue-600 hover:text-blue-800 px-1 py-0.5 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Adicionar execução
            </button>
          )}
        </div>

        {/* ═══ IDENTIFICAÇÃO DO(S) PROFISSIONAL(IS) EXECUTANTE(S) ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold uppercase border-b border-black">Identificação do(s) Profissional(is) Executante(s)</div>

          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black px-1 py-0.5 text-center w-10">48-Seq/Ref</th>
                <th className="border border-black px-1 py-0.5 text-center w-14">49-Grau Part.</th>
                <th className="border border-black px-1 py-0.5 text-left w-28">50-Código na Operadora/CPF</th>
                <th className="border border-black px-1 py-0.5 text-left">51-Nome do Profissional</th>
                <th className="border border-black px-1 py-0.5 text-center w-20">52-Conselho Profissional</th>
                <th className="border border-black px-1 py-0.5 text-center w-20">53-Número do Conselho</th>
                <th className="border border-black px-1 py-0.5 text-center w-10">54-UF</th>
                <th className="border border-black px-1 py-0.5 text-center w-16">55-Código CBO</th>
                {!dis && <th className="border border-black px-1 py-0.5 w-8"></th>}
              </tr>
            </thead>
            <tbody>
              {profissionais.map(prof => (
                <tr key={prof.id}>
                  {/* 48-SeqRef */}
                  <td className="border border-black px-1">
                    <input value={prof.seqRef} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, seqRef: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 49-Grau Part */}
                  <td className="border border-black px-1">
                    <input value={campo49Bradesco ? '00' : prof.grauPart} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, grauPart: e.target.value } : p))} disabled={dis || campo49Bradesco} aria-label="Campo 49 grau de participação" className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 50-CPF */}
                  <td className="border border-black px-1">
                    <input value={prof.codigoOperadoraCPF} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, codigoOperadoraCPF: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 51-Nome: selector de profissional cadastrado */}
                  <td className="border border-black px-1">
                    {dis ? (
                      <span className="text-[9px]">{prof.nome}</span>
                    ) : (
                      <select
                        value={prof.profissionalId || ''}
                        onChange={e => {
                          const pid = e.target.value ? Number(e.target.value) : undefined;
                          const p = profissionaisAtivos.find((p: any) => p.id === pid) as any;
                          if (p) {
                            setProfissionais(prev => prev.map(pr => pr.id === prof.id ? {
                              ...pr,
                              profissionalId: pid,
                              nome: p.nome || '',
                              codigoOperadoraCPF: p.cpf || pr.codigoOperadoraCPF,
                              conselhoProfissional: p.conselhoProfissional || 'CRM',
                              numeroConselho: p.crm || p.numeroConselho || '',
                              uf: p.uf || '',
                              codigoCBO: p.codigoCBO || '',
                            } : pr));
                          } else {
                            setProfissionais(prev => prev.map(pr => pr.id === prof.id ? { ...pr, profissionalId: undefined, nome: '' } : pr));
                          }
                        }}
                        className="w-full bg-transparent outline-none text-[9px] border-0"
                      >
                        <option value="">-- selecione --</option>
                        {profissionaisAtivos.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  {/* 52-Conselho */}
                  <td className="border border-black px-1">
                    <input value={prof.conselhoProfissional} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, conselhoProfissional: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 53-Número */}
                  <td className="border border-black px-1">
                    <input value={prof.numeroConselho} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, numeroConselho: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 54-UF */}
                  <td className="border border-black px-1">
                    <input value={prof.uf} onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, uf: e.target.value } : p))} disabled={dis} className="w-full bg-transparent outline-none text-[9px]" />
                  </td>
                  {/* 55-CBO */}
                  <td className="border border-black px-1">
                    {dis ? (
                      <span className="text-[9px]">{prof.codigoCBO}</span>
                    ) : (
                      <select
                        value={prof.codigoCBO}
                        onChange={e => setProfissionais(prev => prev.map(p => p.id === prof.id ? { ...p, codigoCBO: e.target.value } : p))}
                        className="w-full bg-transparent outline-none text-[9px] border-0"
                        title="Código CBO (Tabela 24 ANS)"
                      >
                        <option value="">-- CBO --</option>
                        {getCBOsParaConselho(prof.conselhoProfissional).map(c => (
                          <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.descricao}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  {!dis && (
                    <td className="border border-black px-1 text-center">
                      <button onClick={() => { setProfissionais(prev => prev.filter(p => p.id !== prof.id)); setHasChanges(true); }} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!dis && (
            <button onClick={() => setProfissionais(prev => [...prev, { id: Date.now(), seqRef: String(prev.length + 1), grauPart: obterGrauParticipacaoSadt(formData.nomeConvenio), codigoOperadoraCPF: '', nome: '', conselhoProfissional: '9', numeroConselho: '', uf: '13', codigoCBO: '' }])} className="text-[9px] text-blue-600 hover:text-blue-800 px-1 py-0.5 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Adicionar profissional
            </button>
          )}
        </div>

        {/* ═══ CAMPOS 56 E 57: DATAS EM SÉRIE / ASSINATURA ═══ */}
        <div className="border-b border-black">
          <div className="bg-gray-200 px-1 py-0.5 text-[9px] font-bold border-b border-black">
            56-Data de Realização de Procedimentos em Série / 57-Assinatura do Beneficiário ou Responsável
          </div>
          <div className="grid grid-cols-5 gap-0">
            {(() => {
              // Ordenar todas as assinaturas cronologicamente para exibir em sequência
              // independente do sessaoNumero original (que pode ter duplicados entre guias)
              const sessoesOrdenadas = [...assinaturasDaCompetencia].sort((a: any, b: any) => {
                const da = obterPrimeiraDataAtendimentoDaAssinatura(a.datasAtendimento) ?? String(a.dataAssinatura).slice(0, 10);
                const db2 = obterPrimeiraDataAtendimentoDaAssinatura(b.datasAtendimento) ?? String(b.dataAssinatura).slice(0, 10);
                return da !== db2 ? da.localeCompare(db2) : (a.id - b.id);
              });
              return Array.from({ length: 10 }).map((_, idx) => {
              const sessao = sessoesOrdenadas[idx] ?? null;
              const dataSessao = sessao ? obterPrimeiraDataAtendimentoDaAssinatura(sessao.datasAtendimento) : null;
              const dataFormatada = dataSessao
                ? (() => { const m = dataSessao.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : dataSessao; })()
                : datasSerieAssinatura[idx] || '';
              return (
                <div key={idx} className="border-r border-b border-black p-1 min-h-[60px]">
                  <div className="text-[8px] text-gray-500 font-bold">{idx + 1}-</div>
                  {sessao ? (
                    <>
                      <div className="text-[8px] text-gray-800 border-b border-gray-400 pb-0.5 font-medium">{dataFormatada}</div>
                      {sessao.assinaturaPacienteUrl ? (
                        <img
                          src={sessao.assinaturaPacienteUrl}
                          alt={`Assinatura sessão ${idx + 1}`}
                          className="w-full h-10 object-contain mt-0.5"
                        />
                      ) : (
                        <div className="h-10 border-b border-gray-300 mt-0.5" />
                      )}
                      {podeGerenciarAssinaturas && (
                        <div className="mt-1 flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Editar data da assinatura da sessão ${idx + 1}`}
                            className="rounded p-0.5 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                            title="Editar data da sessão"
                          onClick={() => {
                            setNovaDataSessao(obterPrimeiraDataAtendimentoDaAssinatura(sessao.datasAtendimento) ?? '');
                            setAssinaturaEmEdicao({ id: sessao.id, origem: (sessao as any).origem === 'sadt' ? 'sadt' : 'legada' });
                          }}
                          ><Edit2 className="w-3 h-3" /></button>
                          <button
                            type="button"
                            aria-label={`Duplicar assinatura da sessão ${idx + 1}`}
                            className="rounded p-0.5 text-violet-600 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Duplicar assinatura para outra data da mesma série"
                            disabled={duplicarAssinatura.isPending}
                            onClick={() => {
                              setNovaDataDuplicada('');
                              setAssinaturaParaDuplicar({
                                id: sessao.id,
                                guiaId: sessao.guiaId ?? guiaIdNum,
                                origem: (sessao as any).origem === 'sadt' ? 'sadt' : 'legada',
                                dataOrigem: obterPrimeiraDataAtendimentoDaAssinatura(sessao.datasAtendimento) ?? '',
                              });
                            }}
                          ><Copy className="w-3 h-3" /></button>
                          <button
                            type="button"
                            aria-label={`Excluir assinatura da sessão ${idx + 1}`}
                            className="rounded p-0.5 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Excluir assinatura"
                            disabled={excluirAssinatura.isPending || excluirAssinaturaSadt.isPending}
                            onClick={() => {
                              setErroExclusaoAssinatura(null);
                              setAssinaturaParaExcluir({
                                id: sessao.id,
                                guiaId: sessao.guiaId ?? guiaIdNum,
                                origem: (sessao as any).origem === 'sadt' ? 'sadt' : 'legada',
                              });
                            }}
                          ><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        value={dataFormatada}
                        onChange={e => setDatasSerieAssinatura(prev => prev.map((d, i) => i === idx ? e.target.value : d))}
                        disabled={dis}
                        placeholder="__/__/____"
                        className="w-full bg-transparent outline-none text-[9px] border-b border-gray-400"
                      />
                      <div className="h-10 border-b border-gray-300 mt-0.5" />
                    </>
                  )}
                </div>
              );
            });
            })()}
          </div>
        </div>

        {/* ═══ OBSERVAÇÃO / JUSTIFICATIVA ═══ */}
        <div className="border-b border-black">
          <div className="px-1 py-0.5 text-[9px] font-bold border-b border-black">58-Observação / Justificativa</div>
          <textarea
            value={d('observacaoJustificativa')}
            onChange={e => set('observacaoJustificativa', e.target.value)}
            disabled={dis}
            rows={2}
            className="w-full text-[9px] p-1 bg-transparent outline-none resize-none"
          />
        </div>

        {/* ═══ TOTAIS ═══ */}
        <div className="border-b border-black">
          <div className="flex">
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">59-Total de Procedimentos R$</div>
              <div className="text-[10px] font-bold">{totalProcedimentos.toFixed(2)}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">60-Total de Taxas e Aluguéis R$</div>
              <input value={(formData.totalTaxasAlugueis || 0).toFixed(2)} onChange={e => set('totalTaxasAlugueis', parseFloat(e.target.value) || 0)} disabled={dis} className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-gray-400" type="number" step="0.01" />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">61-Total de Materiais R$</div>
              <input value={(formData.totalMateriais || 0).toFixed(2)} onChange={e => set('totalMateriais', parseFloat(e.target.value) || 0)} disabled={dis} className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-gray-400" type="number" step="0.01" />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">62-Total de OPME R$</div>
              <input value={(formData.totalOPME || 0).toFixed(2)} onChange={e => set('totalOPME', parseFloat(e.target.value) || 0)} disabled={dis} className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-gray-400" type="number" step="0.01" />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">63-Total de Medicamentos R$</div>
              <input value={(formData.totalMedicamentos || 0).toFixed(2)} onChange={e => set('totalMedicamentos', parseFloat(e.target.value) || 0)} disabled={dis} className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-gray-400" type="number" step="0.01" />
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[8px] text-gray-600">64-Total Gases Medicinais R$</div>
              <input value={(formData.totalGasesMedicinais || 0).toFixed(2)} onChange={e => set('totalGasesMedicinais', parseFloat(e.target.value) || 0)} disabled={dis} className="w-full bg-transparent outline-none text-[10px] font-bold border-b border-gray-400" type="number" step="0.01" />
            </div>
            <div className="flex-1 p-1 bg-gray-100">
              <div className="text-[8px] text-gray-600 font-bold">65-Total Geral da Guia R$</div>
              <div className="text-[11px] font-bold text-black">{totalGeral.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* ═══ ASSINATURAS ═══ */}
        <div className="flex">
          <div className="flex-1 border-r border-black p-2">
            <div className="text-[8px] text-gray-600 mb-1">66-Assinatura do Responsável pela Autorização</div>
            <div className="h-10 border-b border-gray-400" />
          </div>
          <div className="flex-1 border-r border-black p-2">
            <div className="text-[8px] text-gray-600 mb-1">67-Assinatura do Beneficiário ou Responsável</div>
            {formData.guiaId ? (
              <div className="flex h-14 items-center justify-center">
                {assinaturasDaCompetencia.length > 0 && (() => {
                  const ultimaAssinatura = [...assinaturasDaCompetencia]
                    .sort((a: any, b: any) => b.sessaoNumero - a.sessaoNumero)[0];
                  return ultimaAssinatura?.assinaturaPacienteUrl ? (
                    <img
                      src={ultimaAssinatura.assinaturaPacienteUrl}
                      alt="Assinatura do paciente"
                      className="h-12 w-full object-contain"
                    />
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="h-10 border-b border-gray-400" />
            )}
          </div>
          <div className="flex-1 p-2">
            <div className="text-[8px] text-gray-600 mb-1">68-Assinatura do Prestador Executante</div>
            <div className="h-10 border-b border-gray-400" />
          </div>
        </div>
      </div>

      {/* ═══ RODAPÉ ═══ */}
      <div className="text-[8px] text-center text-gray-500 mt-1 print:hidden">
        Documento gerado automaticamente pelo sistema MIFATURE — {new Date().toLocaleDateString('pt-BR')}
        {formData.geradoPor && ` — Gerado por: ${formData.geradoPor}`}
      </div>

      <EditorDataSessaoModal
        aberta={assinaturaEmEdicao !== null}
        data={novaDataSessao}
        salvando={editarDataSessao.isPending || editarDataSessaoSadt.isPending}
        onAlterarData={setNovaDataSessao}
        onCancelar={() => { setAssinaturaEmEdicao(null); setNovaDataSessao(''); }}
        onSalvar={() => {
          if (assinaturaEmEdicao === null || !novaDataSessao) return;
          (assinaturaEmEdicao.origem === 'sadt' ? editarDataSessaoSadt : editarDataSessao).mutate({ assinaturaId: assinaturaEmEdicao.id, novaDataSessao });
        }}
      />

      <AlertDialog open={assinaturaParaExcluir !== null} onOpenChange={(aberto) => {
        if (!aberto) {
          setAssinaturaParaExcluir(null);
          setErroExclusaoAssinatura(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir assinatura desta sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove a assinatura somente após confirmação. A guia e os demais registros não serão excluídos.
            </AlertDialogDescription>
            {erroExclusaoAssinatura && (
              <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                Não foi possível excluir: {erroExclusaoAssinatura}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              disabled={exclusaoEmAndamento}
              onClick={executarExclusaoAssinatura}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {exclusaoEmAndamento ? 'Excluindo...' : 'Excluir assinatura'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={assinaturaParaDuplicar !== null} onOpenChange={(aberto) => {
        if (!aberto) {
          setAssinaturaParaDuplicar(null);
          setNovaDataDuplicada('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicar assinatura para outra sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              A cópia usa a evidência da sessão de origem e só pode ser criada em uma data existente da mesma guia e série. A assinatura original não será modificada e a ação ficará registrada na auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Nova data da sessão
            <input
              type="date"
              value={novaDataDuplicada}
              onChange={evento => setNovaDataDuplicada(evento.target.value)}
              className="h-10 rounded border border-input bg-background px-3 text-sm"
              aria-label="Nova data da sessão para duplicar assinatura"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!assinaturaParaDuplicar || !novaDataDuplicada || duplicarAssinatura.isPending}
              onClick={() => {
                if (!assinaturaParaDuplicar || !novaDataDuplicada) return;
                duplicarAssinatura.mutate({
                  assinaturaId: assinaturaParaDuplicar.id,
                  guiaId: assinaturaParaDuplicar.guiaId,
                  origem: assinaturaParaDuplicar.origem,
                  novaDataSessao: novaDataDuplicada,
                });
              }}
              className="bg-violet-700 hover:bg-violet-800"
            >
              Duplicar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
      <AnexoRegistroDigitalSadt
        numeroGuia={d('numeroGuia') || d('numeroGuiaPrestador')}
        paciente={d('nomePaciente') || d('nomeBeneficiario')}
        profissional={profissionais.find(profissional => profissional.nome)?.nome || formData.nomeProfissionalSolicitante}
        procedimento={procedimentos.map(procedimento => `${procedimento.codigo} — ${procedimento.descricao}`).join('; ')}
        assinaturas={assinaturasDaCompetencia}
      />
      </div>
    </div>
  );
}
