import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { trpc } from '../lib/trpc';
import { getHojeBrasilia, formatDateBR, toSafeISODate } from '../lib/utils';
import { normalizarDataExecucaoCampo36 } from '../../../shared/dataExecucaoCampo36';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Eye, PenLine, X, CalendarIcon, ChevronDown, Download, FileCode, Edit2 as EditIcon, Link2 } from 'lucide-react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { DateRange } from 'react-day-picker';
import { GuiaVisualizacao } from '../components/GuiaVisualizacao';
import { GuiaSPSADTPrefaturamento } from '../components/GuiaSPSADTPrefaturamento';
import { criarEntradaAssinaturasDaGuia } from '@shared/consultaAssinaturasGuia';
import { AssinaturaCanvas } from '../components/AssinaturaCanvas';
import { useAuth } from '../_core/hooks/useAuth';
import { prepararGuiaParaPreview } from '../../../shared/guiaPreview';
import {
  reidratarCamposPrefaturamento,
  removerHistoricoAssinaturasDoPrefaturamento,
} from '../../../shared/prefaturamentoPersistencia';
import { sincronizarCamposCabecalhoGuiaSadt } from '../../../shared/camposCabecalhoGuiaSadt';
import { normalizarSenhaAutorizacaoPrefaturamento, resolverSenhaExibidaNoPrefaturamento } from '../../../shared/senhaAutorizacaoPrefaturamento';
import { CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO, lerGuiaPrefaturamentoDirecionada } from '../../../shared/navegacaoPrefaturamento';

interface Procedimento {
  id: string;
  procedimento: string;
  codigoTUSS: string;
  data: string;
  acesso: string;
  quantidade: number;
  valor: number;
  desconto: number;
}

export function GuiasSPSADT() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const perfil = (user as any)?.perfil as string | undefined;
  const isMaster = (user as any)?.role === 'admin';
  const isRecepcao = perfil === 'recepção' || perfil === 'recepcao' || perfil === 'recepcionista' || perfil === 'master';
  const canEditGuia = isMaster || isRecepcao;
  const [isOpen, setIsOpen] = useState(false);
  // Estado do modal de edição de guia
  const [showEditGuia, setShowEditGuia] = useState(false);
  const [editGuia, setEditGuia] = useState<any>(null);
  const [editGuiaForm, setEditGuiaForm] = useState({
    numeroGuia: '',
    numeroGuiaInterno: '',
    dataEmissao: '',
    procedimento: '',
    codigoTUSS: '',
    valor: '',
    cid: '',
    status: '',
    observacoes: '',
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProcedimentosModal, setShowProcedimentosModal] = useState(false);
  const [showGuiaVisualizacao, setShowGuiaVisualizacao] = useState(false);
  const [guiaSelecionada, setGuiaSelecionada] = useState<any>(null);
  const [showPrefaturamento, setShowPrefaturamento] = useState(false);
  const [guiaPrefaturamento, setGuiaPrefaturamento] = useState<any>(null);
  // Assinatura digital do paciente
  const [showAssinatura, setShowAssinatura] = useState(false);
  const [guiaParaAssinar, setGuiaParaAssinar] = useState<any>(null);
  // Pré-preenchimento automático
  const [atendimentoSelecionadoId, setAtendimentoSelecionadoId] = useState<number | null>(null);
  const [pacienteFiltroId, setPacienteFiltroId] = useState<string>('');
  const [guiaDataPrefill, setGuiaDataPrefill] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [convenioFilter, setConvenioFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [profissionalFilter, setProfissionalFilter] = useState('todos');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNumeroLote, setExportNumeroLote] = useState('');
  const [exportProtocolo, setExportProtocolo] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  // Edição inline do numeroGuiaInterno
  const [editingNumeroGuiaId, setEditingNumeroGuiaId] = useState<number | null>(null);
  const [editingNumeroGuiaValue, setEditingNumeroGuiaValue] = useState('');
  // Selecção de guias para exportação
  const [selectedGuiaIds, setSelectedGuiaIds] = useState<Set<number>>(new Set());
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [novoProcedimento, setNovoProcedimento] = useState({
    procedimento: '',
    codigoTUSS: '',
    data: getHojeBrasilia(),
    acesso: 'U',
    quantidade: 1,
    valor: 0,
    desconto: 0,
  });
  const [authData, setAuthData] = useState({
    senhaAutorizacao: '',
    dataAutorizacao: '',
    validadeSenha: '',
    quantidadeAutorizada: '1',
  });
  const [formData, setFormData] = useState({
    numero: '',
    pacienteId: '',
    convenioId: '',
    profissionalId: '',
    procedimento: '',
    codigoTUSS: '',
    cid: '',
    dataAtendimento: '',
    dataEmissao: getHojeBrasilia(),
    hora: '19:29',
    valor: '',
    status: 'rascunho',
    tipoPagamento: '',
    grauParticipacao: 'NAO_SE_APLICA',
    utilizaEquipe: false,
    formaPagamento: 'PADRAO',
    solicitante: '',
    observacoes: '',
  });

  const { data: guias = [], refetch, isLoading: carregandoGuias } = trpc.guias.list.useQuery(undefined, { staleTime: 0, refetchOnMount: 'always' });
  const { data: pacientes = [] } = trpc.pacientes.list.useQuery(undefined, { staleTime: 0, refetchOnMount: 'always' });
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();
  const { data: lotesTiss = [] } = trpc.faturamentoTISS.listLotes.useQuery();

  useEffect(() => {
    if (carregandoGuias || typeof window === 'undefined') return;
    const guiaId = lerGuiaPrefaturamentoDirecionada(
      window.sessionStorage.getItem(CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO),
    );
    if (guiaId == null) return;

    window.sessionStorage.removeItem(CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO);
    const guia = (guias as any[]).find((item: any) => item.id === guiaId);
    if (guia) {
      setGuiaPrefaturamento(guia);
      setShowPrefaturamento(true);
      return;
    }
    toast.error('A guia vinculada não foi encontrada para abrir o pré-faturamento.');
  }, [carregandoGuias, guias]);
  const { data: agendamentos = [] } = trpc.pacientes.getAgendamentos.useQuery(
    { pacienteId: parseInt(formData.pacienteId) },
    { enabled: !!formData.pacienteId }
  );
  // Atendimentos do paciente filtrado (para seletor de pré-preenchimento)
  const { data: atendimentosPaciente = [] } = trpc.pacientes.getAgendamentos.useQuery(
    { pacienteId: parseInt(pacienteFiltroId) },
    { enabled: !!pacienteFiltroId }
  );
  // Dados completos do atendimento selecionado para pré-preenchimento
  const { data: dadosParaGuia, isLoading: loadingDadosGuia } = trpc.guias.dadosParaGuia.useQuery(
    { atendimentoId: atendimentoSelecionadoId! },
    { enabled: !!atendimentoSelecionadoId }
  );
  const vincularGuiaASerieMutation = trpc.guias.vincularGuiaASerie.useMutation({
    onSuccess: () => {
      toast.success('Guia vinculada à série com sucesso!');
      setGuiaParaVincularSerie(null);
      setSerieIdParaVincular('');
      refetch();
    },
    onError: (e) => toast.error(e.message || 'Erro ao vincular guia à série'),
  });

  const deleteMutation = trpc.guias.delete.useMutation({
    onSuccess: () => {
      toast.success('Guia excluída com sucesso.');
      refetch();
    },
    onError: (err: any) => toast.error(`Erro ao excluir guia: ${err.message}`),
  });

  const createMutation = trpc.guias.create.useMutation({
    onSuccess: () => {
      refetch();
    }
  });
  const updateMutation = trpc.guias.update.useMutation({
    onSuccess: () => {
      refetch();
    }
  });
  const salvarSPSADTMutation = trpc.guias.salvarSPSADT.useMutation({
    onSuccess: () => {
      refetch();
    }
  });
  const extrairSolicitantePedidoMutation = trpc.atendimentos.extrairSolicitanteDoPedido.useMutation();
  const criarAssinaturaMutation = trpc.assinaturasGuias.create.useMutation({
    onSuccess: () => {
      refetch();
      toast.success('Assinatura registrada com sucesso!');
      setShowAssinatura(false);
      setGuiaParaAssinar(null);
    },
    onError: () => {
      toast.error('Erro ao registrar assinatura.');
    }
  });
  const gerarLoteMutation = trpc.faturamentoTISS.gerarLote.useMutation({
    onError: () => {
      toast.error('Erro ao gerar XML TISS. Verifique os dados das guias.');
      setExportLoading(false);
    }
  });

  // Buscar total de sessões da guia selecionada para assinatura
  const { data: totalSessoesData } = trpc.assinaturasGuias.totalSessoes.useQuery(
    { guiaId: guiaParaAssinar?.id ?? 0 },
    { enabled: !!guiaParaAssinar?.id }
  );
  // Cada guia é documentalmente individual. Nunca buscar assinaturas de outra guia
  // do mesmo paciente, inclusive em competências mensais diferentes.
  const entradaAssinaturasDaGuia = criarEntradaAssinaturasDaGuia(guiaPrefaturamento?.id);
  const { data: assinaturasPrefaturamento, refetch: refetchAssinaturas } = trpc.assinaturasGuias.list.useQuery(
    entradaAssinaturasDaGuia ?? { guiaId: 0 },
    { enabled: entradaAssinaturasDaGuia !== null, staleTime: 0, refetchOnMount: 'always' }
  );
  // Buscar dados enriquecidos da guia para preencher automaticamente o prefaturamento
  const { data: dadosGuiaPrefaturamento } = trpc.guias.getDadosGuiaPrefaturamento.useQuery(
    { guiaId: guiaPrefaturamento?.id ?? 0 },
    { enabled: !!guiaPrefaturamento?.id, staleTime: 0, refetchOnMount: 'always' }
  );

  // Histórico de guias do paciente em pré-faturamento (para painel lateral)
  const { data: historicoGuiasPaciente = [] } = trpc.guias.getHistoricoGuiasPaciente.useQuery(
    { pacienteId: guiaPrefaturamento?.pacienteId ?? 0 },
    { enabled: !!guiaPrefaturamento?.pacienteId, staleTime: 0 }
  );
  const [showHistoricoLateral, setShowHistoricoLateral] = useState(false);
  const [guiaParaVincularSerie, setGuiaParaVincularSerie] = useState<any>(null);
  const [serieIdParaVincular, setSerieIdParaVincular] = useState('');

  let filteredGuias = guias;
  if (convenioFilter !== 'todos') {
    filteredGuias = filteredGuias.filter(g => g.convenioId === parseInt(convenioFilter));
  }
  if (profissionalFilter !== 'todos') {
    filteredGuias = filteredGuias.filter(g => g.profissionalId === parseInt(profissionalFilter));
  }
  if (statusFilter === 'assinadas') {
    filteredGuias = filteredGuias.filter(g => (g as any).assinadoPaciente === 1);
  } else if (statusFilter !== 'todos') {
    filteredGuias = filteredGuias.filter(g => g.status === statusFilter);
  }
  if (dateRange?.from) {
    const from = new Date(dateRange.from);
    from.setHours(0, 0, 0, 0);
    filteredGuias = filteredGuias.filter(g => {
      const d = new Date(g.dataEmissao);
      d.setHours(0, 0, 0, 0);
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        return d >= from && d <= to;
      }
      return d >= from;
    });
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredGuias = filteredGuias.filter(g =>
      g.numeroGuia.toLowerCase().includes(term) ||
      g.procedimento.toLowerCase().includes(term) ||
      ((g as any).nomeBeneficiario || '').toLowerCase().includes(term) ||
      (pacientes.find(p => p.id === g.pacienteId)?.nome || '').toLowerCase().includes(term)
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho': return 'bg-blue-100 text-blue-700';
      case 'emitida': return 'bg-yellow-100 text-yellow-700';
      case 'enviada': return 'bg-green-100 text-green-700';
      case 'processada': return 'bg-purple-100 text-purple-700';
      case 'paga': return 'bg-green-100 text-green-700';
      case 'glosa': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (confirmed: boolean) => {
    if (!confirmed) {
      setShowAuthModal(false);
      return;
    }
    setShowAuthModal(false);
    setShowProcedimentosModal(true);
  };

  const handleAddProcedimento = () => {
    if (!novoProcedimento.procedimento || novoProcedimento.valor <= 0) {
      toast.error('Preencha todos os campos do procedimento');
      return;
    }
    const newProc: Procedimento = {
      id: Date.now().toString(),
      ...novoProcedimento,
    };
    setProcedimentos([...procedimentos, newProc]);
    setNovoProcedimento({
      procedimento: '',
      codigoTUSS: '',
      data: getHojeBrasilia(),
      acesso: 'U',
      quantidade: 1,
      valor: 0,
      desconto: 0,
    });
    toast.success('Procedimento adicionado');
  };

  const handleRemoveProcedimento = (id: string) => {
    setProcedimentos(procedimentos.filter(p => p.id !== id));
    toast.success('Procedimento removido');
  };

  const handleFinalizarGuia = async () => {
    if (procedimentos.length === 0) {
      toast.error('Adicione pelo menos um procedimento');
      return;
    }
    // Validar campos obrigatórios antes de enviar
    const pacienteIdNum = parseInt(formData.pacienteId);
    const profissionalIdNum = parseInt(formData.profissionalId);
    const convenioIdNum = parseInt(formData.convenioId);
    if (!formData.pacienteId || isNaN(pacienteIdNum)) {
      toast.error('Selecione um paciente antes de finalizar a guia');
      return;
    }
    if (!formData.profissionalId || isNaN(profissionalIdNum)) {
      toast.error('Selecione um profissional antes de finalizar a guia. Use o pré-preenchimento automático selecionando o atendimento.');
      return;
    }
    if (!formData.convenioId || isNaN(convenioIdNum)) {
      toast.error('Selecione um convênio antes de finalizar a guia');
      return;
    }
    // Gerar número da guia automaticamente se estiver vazio
    const numeroGuiaFinal = formData.numero || `G${Date.now()}`;

    try {
      const totalValor = procedimentos.reduce((sum, p) => sum + (p.valor * p.quantidade - p.desconto), 0);
      const pacienteParaGuia = pacientes.find(p => p.id === pacienteIdNum);
      await createMutation.mutateAsync({
        numeroGuia: numeroGuiaFinal,
        pacienteId: pacienteIdNum,
        profissionalId: profissionalIdNum,
        convenioId: convenioIdNum,
        dataEmissao: formData.dataEmissao,
        procedimento: procedimentos.map(p => p.procedimento).join(', '),
        valor: totalValor.toString(),
        status: formData.status as any,
        // Salvar nº da carteirinha do convênio do cadastro do paciente
        numeroCarteira: (pacienteParaGuia as any)?.numeroCarteira || undefined,
        validadeCarteira: (pacienteParaGuia as any)?.validadeCarteira
          ? new Date((pacienteParaGuia as any).validadeCarteira).toISOString().split('T')[0]
          : undefined,
      });
      toast.success('Guia criada com sucesso!');
      setFormData({
        numero: '',
        pacienteId: '',
        convenioId: '',
        profissionalId: '',
        procedimento: '',
        codigoTUSS: '',
        cid: '',
        dataAtendimento: '',
        dataEmissao: getHojeBrasilia(),
        hora: '19:29',
        valor: '',
        status: 'rascunho',
        tipoPagamento: '',
        grauParticipacao: 'NAO_SE_APLICA',
        utilizaEquipe: false,
        formaPagamento: 'PADRAO',
        solicitante: '',
        observacoes: '',
      });
      setProcedimentos([]);
      setAuthData({
        senhaAutorizacao: '',
        dataAutorizacao: '',
        validadeSenha: '',
        quantidadeAutorizada: '1',
      });
      setShowProcedimentosModal(false);
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao criar guia');
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({...formData, [name]: value});
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({...formData, [name]: value});
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({...formData, [name]: checked});
  };

  const totalValor = procedimentos.reduce((sum, p) => sum + (p.valor * p.quantidade - p.desconto), 0);

  // Mapear dadosParaGuia para guiaDataPrefill quando os dados chegam do servidor
  useEffect(() => {
    if (!dadosParaGuia) return;
    const { atendimento, paciente, profissional, convenio, autorizacao, procedimentosConvenio, procedimentoVinculado, prestador, numeroSessao } = dadosParaGuia as any;
    // atendimentos.data é o campo de data (não dataAtendimento)
    const dataAtend = atendimento.data
      ? new Date(atendimento.data).toISOString().split('T')[0]
      : getHojeBrasilia();
    // Usar procedimento vinculado ao atendimento; se não houver, usar o primeiro do convênio
    const procPrincipal = procedimentoVinculado || procedimentosConvenio?.[0];
    const valorUnitario = procPrincipal ? parseFloat(String(procPrincipal.valor || '0')) : 0;
    const prefill: any = {
      // Cabeçalho
      registroANS: convenio.registroANS || convenio.codigoOperadora || '',
      codigoNaOperadora: convenio.codigoNaOperadora || convenio.codigoOperadora || '',
      logoConvenio: convenio.logoUrl || '',
      // Campo 4 espelha a data da solicitação (campo 22).
      dataAutorizacao: dataAtend,
      senha: autorizacao?.numeroAutorizacao || '',
      dataValidadeSenha: autorizacao?.dataValidade
        ? new Date(autorizacao.dataValidade).toISOString().split('T')[0]
        : '',
      numeroGuiaOperadora: autorizacao?.numeroAutorizacao || '',
      // Beneficiário
      nomeBeneficiario: paciente.nome || '',
      // Fonte de verdade: Nº da carteirinha do convênio (campo obrigatório no cadastro)
      numeroCarteira: (paciente as any).numeroCarteira || '',
      validadeCarteira: (paciente as any).validadeCarteira
        ? new Date((paciente as any).validadeCarteira).toISOString().split('T')[0]
        : '',
      // Contratado Solicitante: campo 13 usa o cadastro do convênio
      codigoOperadoraSolicitante: convenio.codigoNaOperadora || prestador?.codigoPrestadorNaOperadora || '',
      nomeContratadoSolicitante: prestador?.razaoSocial || prestador?.nomeFantasia || '',
      codigoCNES: prestador?.cnes || '',
      // Profissional Solicitante
      nomeProfissionalSolicitante: profissional.nome || '',
      conselhoProfissionalSolicitante: profissional.conselhoProfissional || 'CRM',
      numeroConselhoSolicitante: profissional.crm || profissional.numeroConselho || '',
      ufSolicitante: profissional.uf || '',
      codigoCBOSolicitante: profissional.codigoCBO || '',
      // Contratado Executante: usa o mesmo código cadastrado no convênio
      codigoOperadoraExecutante: convenio.codigoNaOperadora || prestador?.codigoPrestadorNaOperadora || '',
      nomeContratadoExecutante: prestador?.razaoSocial || prestador?.nomeFantasia || '',
      // Solicitação
      dataSolicitacao: dataAtend,
      indicacaoClinica: atendimento.descricao || '',  // descricao é o campo disponível
      caraterAtendimento: '03', // Eletivo (padrão)
      // Atendimento
      tipoAtendimento: '03', // Ambulatorial
      regimeAtendimento: '01', // Ambulatorial
      // Procedimento principal
      codigoTUSS: procPrincipal?.codigoConvenio || procPrincipal?.codigoANS || '',
      descricaoProcedimento: procPrincipal?.descricaoConvenio || procPrincipal?.descricao || '',
      // Totais
      totalProcedimentos: valorUnitario,
      totalGeral: valorUnitario,
      // Meta
      guiaId: 0, // guia ainda não criada neste fluxo
      pacienteId: paciente.id,
      dataAtendimento: atendimento.data ? new Date(atendimento.data) : new Date(),
      totalSessoes: numeroSessao,
      geradoPor: 'Sistema MIFATURE',
      // Profissional executante (para a tabela de profissionais)
      nomeProfissional: profissional.nome || '',
      conselhoProfissional: profissional.conselhoProfissional || 'CRM',
      registroProfissional: profissional.crm || profissional.numeroConselho || '',
      especialidade: profissional.especialidade || '',
      codigoCBO: profissional.codigoCBO || '',
      uf: profissional.uf || '',
      cpfProfissional: profissional.cpf || '',
    };
    setGuiaDataPrefill(prefill);
    // Atualizar formData com os IDs para o onSave
    setFormData(prev => ({
      ...prev,
      pacienteId: String(paciente.id),
      convenioId: String(convenio.id),
      profissionalId: String(profissional.id),
      dataAtendimento: dataAtend,
      codigoTUSS: procPrincipal?.codigoConvenio || procPrincipal?.codigoANS || '',
      procedimento: procPrincipal?.descricaoConvenio || procPrincipal?.descricao || '',
      valor: String(valorUnitario),
    }));
  }, [dadosParaGuia]);

  // Auto-preencher profissional quando paciente é selecionado
  useEffect(() => {
    if (!formData.pacienteId) return;
    // Buscar o paciente seleccionado para usar o convenioId do cadastro como fallback
    const pacienteSelecionado = pacientes.find(p => p.id === parseInt(formData.pacienteId));
    const convenioIdDoCadastro = (pacienteSelecionado as any)?.convenioId?.toString() || '';

    if (agendamentos && agendamentos.length > 0) {
      // Prioridade: convenio do agendamento > convenio do cadastro do paciente
      const atendimentoAtual = agendamentos[0];
      if (atendimentoAtual && atendimentoAtual.profissionalId) {
        setFormData(prev => ({
          ...prev,
          profissionalId: atendimentoAtual.profissionalId.toString(),
          convenioId: atendimentoAtual.convenioId?.toString() || convenioIdDoCadastro || prev.convenioId,
        }));
      }
    } else if (convenioIdDoCadastro) {
      // Sem agendamentos: usar o convenio do cadastro do paciente
      setFormData(prev => ({
        ...prev,
        convenioId: prev.convenioId || convenioIdDoCadastro,
      }));
    }
  }, [formData.pacienteId, agendamentos, pacientes]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Guias SP/SADT</h1>
        <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          + Nova Guia
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {/* Busca */}
          <input
            type="text"
            placeholder="Buscar por paciente, número ou procedimento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filtro por Convênio */}
          <select
            value={convenioFilter}
            onChange={(e) => setConvenioFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos os Convênios</option>
            {convenios.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          {/* Filtro por Profissional */}
          <select
            value={profissionalFilter}
            onChange={(e) => setProfissionalFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos os Profissionais</option>
            {profissionais.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          {/* Filtro por Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos os Status</option>
            <option value="assinadas">✅ Assinadas pelo Paciente</option>
            <option value="rascunho">Rascunho</option>
            <option value="emitida">Emitida</option>
            <option value="enviada">Enviada</option>
            <option value="processada">Processada</option>
            <option value="paga">Paga</option>
            <option value="glosa">Glosa</option>
          </select>

          {/* Filtro por Período - Calendário */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">
                  {dateRange?.from
                    ? dateRange.to
                      ? `${dateRange.from.toLocaleDateString('pt-BR')} – ${dateRange.to.toLocaleDateString('pt-BR')}`
                      : `A partir de ${dateRange.from.toLocaleDateString('pt-BR')}`
                    : 'Filtrar por período'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    if (range?.from && range?.to) setCalendarOpen(false);
                  }}
                  numberOfMonths={2}
                  locale={undefined}
                />
                {dateRange && (
                  <div className="flex justify-end pt-2 border-t mt-2">
                    <button
                      onClick={() => { setDateRange(undefined); setCalendarOpen(false); }}
                      className="text-sm text-red-500 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50"
                    >
                      Limpar filtro
                    </button>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Indicador de filtros activos */}
          {(convenioFilter !== 'todos' || statusFilter !== 'todos' || dateRange?.from) && (
            <span className="text-sm text-blue-600 font-medium">
              {filteredGuias.length} guia{filteredGuias.length !== 1 ? 's' : ''} encontrada{filteredGuias.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Botão Exportar XML TISS */}
          <Button
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
            onClick={() => {
              const now = new Date();
              const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
              const seq = String(Date.now()).slice(-5);
              setExportNumeroLote(`LOTE-${yyyymm}-${seq}`);
              setExportProtocolo('');
              setShowExportModal(true);
            }}
          >
            <FileCode className="w-4 h-4" />
            Exportar XML TISS
          </Button>
        </div>

        {/* Barra flutuante de selecção */}
        {selectedGuiaIds.size > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-green-50 border border-green-200 rounded-lg mb-2 text-sm">
            <span className="text-green-800 font-medium">
              {selectedGuiaIds.size} guia{selectedGuiaIds.size !== 1 ? 's' : ''} seleccionada{selectedGuiaIds.size !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedGuiaIds(new Set())}
                className="text-xs text-green-600 hover:text-green-800 underline"
              >
                Limpar selecção
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors"
              >
                <FileCode className="w-3 h-3" />
                Exportar seleccionadas
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-green-600 cursor-pointer"
                    title="Selecionar todas as guias visíveis"
                    checked={filteredGuias.length > 0 && filteredGuias.every(g => selectedGuiaIds.has(g.id))}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedGuiaIds(prev => new Set([...Array.from(prev), ...filteredGuias.map(g => g.id)]));
                      } else {
                        setSelectedGuiaIds(prev => {
                          const next = new Set(prev);
                          filteredGuias.forEach(g => next.delete(g.id));
                          return next;
                        });
                      }
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">Número</th>
                <th className="px-4 py-3 text-left font-semibold">Procedimento</th>
                <th className="px-4 py-3 text-left font-semibold">Profissional</th>
                <th className="px-4 py-3 text-left font-semibold">Paciente</th>
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Valor</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuias.map(guia => (
                <tr
                  key={guia.id}
                  className={`border-b hover:bg-gray-50 transition-colors ${selectedGuiaIds.has(guia.id) ? 'bg-green-50' : ''}`}
                >
                  <td className="px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-green-600 cursor-pointer"
                      checked={selectedGuiaIds.has(guia.id)}
                      onChange={e => {
                        setSelectedGuiaIds(prev => {
                          const next = new Set(Array.from(prev));
                          if (e.target.checked) next.add(guia.id);
                          else next.delete(guia.id);
                          return next;
                        });
                      }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {/* Número interno editável */}
                    {editingNumeroGuiaId === guia.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingNumeroGuiaValue}
                          onChange={e => setEditingNumeroGuiaValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              updateMutation.mutate({ id: guia.id, numeroGuiaInterno: editingNumeroGuiaValue });
                              setEditingNumeroGuiaId(null);
                            } else if (e.key === 'Escape') {
                              setEditingNumeroGuiaId(null);
                            }
                          }}
                          autoFocus
                          className="w-36 px-2 py-1 text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                        <button
                          onClick={() => {
                            updateMutation.mutate({ id: guia.id, numeroGuiaInterno: editingNumeroGuiaValue });
                            setEditingNumeroGuiaId(null);
                          }}
                          className="text-green-600 hover:text-green-800 text-xs font-bold px-1"
                          title="Salvar"
                        >&#10003;</button>
                        <button
                          onClick={() => setEditingNumeroGuiaId(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs px-1"
                          title="Cancelar"
                        >×</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNumeroGuiaId(guia.id);
                          setEditingNumeroGuiaValue((guia as any).numeroGuiaInterno || '');
                        }}
                        className="text-left text-sm font-mono text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 group"
                        title="Clique para editar o número interno"
                      >
                        <span>{(guia as any).numeroGuiaInterno || <span className="italic text-gray-400 text-xs">sem nº</span>}</span>
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">{guia.procedimento}</td>
                  <td className="px-4 py-3 font-medium text-blue-700">{profissionais.find(p => p.id === guia.profissionalId)?.nome || '-'}</td>
                  <td className="px-4 py-3">{pacientes.find(p => p.id === guia.pacienteId)?.nome || '-'}</td>
                  <td className="px-4 py-3">{formatDateBR(guia.dataEmissao as unknown as string)}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      // Campo 65 (valorTotalGeral) tem prioridade; fallback para valor base
                      const vTotalGeral = parseFloat(String((guia as any).valorTotalGeral || '0'));
                      const vBase = parseFloat(String(guia.valor || '0'));
                      const valor = vTotalGeral > 0 ? vTotalGeral : vBase;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold ${valor > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'text-gray-400'}`}>
                          {valor > 0 ? (
                            <>
                              <span className="text-[10px] font-normal text-green-500">R$</span>
                              {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </>
                          ) : '—'}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(guia.status)}`}>
                        {guia.status}
                      </span>
                    {(guia as any).assinadoPaciente === 1 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Assinado ({(guia as any).totalSessoes || 1} sess.)
                      </span>
                    )}
                    {(guia as any).serieId && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1 w-fit" title={`Série ${(guia as any).serieNumero ?? ''} — sessões ${(guia as any).serieSessaoInicio ?? 1}–${(guia as any).serieSessaoFim ?? (guia as any).totalSessoes ?? '?'}`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Série {(guia as any).serieNumero ?? ''}
                      </span>
                    )}
                  </div>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      title="Abrir Guia SADT oficial"
                      onClick={() => {
                        setGuiaPrefaturamento(guia);
                        setShowPrefaturamento(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {canEditGuia && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-orange-600 hover:text-orange-800"
                        title="Editar guia"
                        onClick={() => {
                          setEditGuia(guia);
                          setEditGuiaForm({
                            numeroGuia: guia.numeroGuia || '',
                            numeroGuiaInterno: (guia as any).numeroGuiaInterno || '',
                            // Datas antigas podem chegar como Date inválida; o
                            // input de edição deve receber somente YYYY-MM-DD.
                            dataEmissao: toSafeISODate(guia.dataEmissao as unknown as string | Date) || '',
                            procedimento: guia.procedimento || '',
                            codigoTUSS: (guia as any).codigoTUSS || '',
                            valor: guia.valor ? String(guia.valor) : '',
                            cid: (guia as any).cid || '',
                            status: guia.status || 'rascunho',
                            observacoes: (guia as any).observacoes || '',
                          });
                          setShowEditGuia(true);
                        }}
                      >
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-800"
                      onClick={() => {
                        setGuiaPrefaturamento(guia);
                        setShowPrefaturamento(true);
                        // Forçar re-busca das assinaturas para garantir dados frescos
                        // (a data pode ter sido editada no modal da Agenda)
                        setTimeout(() => refetchAssinaturas(), 100);
                      }}
                    >
                      Prefaturar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Registrar assinatura do paciente"
                      onClick={() => {
                        setGuiaParaAssinar(guia);
                        setShowAssinatura(true);
                      }}
                    >
                      <PenLine className="w-4 h-4" />
                    </Button>
                    {canEditGuia && !(guia as any).serieId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                        title="Vincular à série de atendimentos"
                        onClick={() => {
                          setGuiaParaVincularSerie(guia);
                          setSerieIdParaVincular('');
                        }}
                      >
                        <Link2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Excluir guia"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm(`Excluir a guia ${guia.numeroGuia}?\n\nEsta ação não pode ser desfeita. Os procedimentos vinculados também serão removidos.`)) {
                          deleteMutation.mutate({ id: guia.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição de Guia — para master e recepção */}
      <Dialog open={showEditGuia} onOpenChange={(open) => { if (!open) { setShowEditGuia(false); setEditGuia(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-orange-700 flex items-center gap-2">
              <EditIcon className="w-5 h-5" />
              Editar Guia SADT — {editGuia?.numeroGuia}
            </DialogTitle>
          </DialogHeader>
          {editGuia && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nº da Guia</Label>
                  <Input value={editGuiaForm.numeroGuia} onChange={e => setEditGuiaForm(f => ({ ...f, numeroGuia: e.target.value }))} />
                </div>
                <div>
                  <Label>Senha / Nº Interno</Label>
                  <Input value={editGuiaForm.numeroGuiaInterno} onChange={e => setEditGuiaForm(f => ({ ...f, numeroGuiaInterno: e.target.value }))} placeholder="Senha de autorização" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Autorização</Label>
                  <Input type="date" value={editGuiaForm.dataEmissao} onChange={e => setEditGuiaForm(f => ({ ...f, dataEmissao: e.target.value }))} />
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" value={editGuiaForm.valor} onChange={e => setEditGuiaForm(f => ({ ...f, valor: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código TUSS</Label>
                  <Input value={editGuiaForm.codigoTUSS} onChange={e => setEditGuiaForm(f => ({ ...f, codigoTUSS: e.target.value }))} />
                </div>
                <div>
                  <Label>CID</Label>
                  <Input value={editGuiaForm.cid} onChange={e => setEditGuiaForm(f => ({ ...f, cid: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Procedimento</Label>
                <Input value={editGuiaForm.procedimento} onChange={e => setEditGuiaForm(f => ({ ...f, procedimento: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={editGuiaForm.status} onValueChange={v => setEditGuiaForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="processada">Processada</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="glosa">Glosa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={editGuiaForm.observacoes} onChange={e => setEditGuiaForm(f => ({ ...f, observacoes: e.target.value }))} rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => { setShowEditGuia(false); setEditGuia(null); }}>Cancelar</Button>
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={updateMutation.isPending}
                  onClick={async () => {
                    try {
                      await updateMutation.mutateAsync({
                        id: editGuia.id,
                        numeroGuia: editGuiaForm.numeroGuia || undefined,
                        numeroGuiaInterno: editGuiaForm.numeroGuiaInterno || undefined,
                        dataEmissao: normalizarDataExecucaoCampo36(editGuiaForm.dataEmissao),
                        procedimento: editGuiaForm.procedimento || undefined,
                        codigoTUSS: editGuiaForm.codigoTUSS || undefined,
                        valor: editGuiaForm.valor || undefined,
                        cid: editGuiaForm.cid || undefined,
                        status: (editGuiaForm.status as any) || undefined,
                        observacoes: editGuiaForm.observacoes || undefined,
                      });
                      toast.success('Guia atualizada com sucesso!');
                      setShowEditGuia(false);
                      setEditGuia(null);
                      // Invalidar cache e refetch imediato para atualizar a lista sem trocar de página
                      await utils.guias.list.invalidate();
                      refetch();
                    } catch (err: any) {
                      toast.error('Erro ao atualizar guia: ' + (err?.message || 'Tente novamente'));
                    }
                  }}
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Guia — TELA INTEIRA */}
      {isOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998, background: '#f3f4f6', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          <div style={{ padding: '16px 24px', background: '#1e3a5f', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Nova Guia SP/SADT</h2>
            <button onClick={() => { setIsOpen(false); setAtendimentoSelecionadoId(null); setPacienteFiltroId(''); setGuiaDataPrefill(null); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Seletor de Atendimento para Pré-preenchimento */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
              ⚡ Pré-preenchimento automático por atendimento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">1. Selecione o paciente</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pacienteFiltroId}
                  onChange={(e) => { setPacienteFiltroId(e.target.value); setAtendimentoSelecionadoId(null); setGuiaDataPrefill(null); }}
                >
                  <option value="">-- Escolha um paciente --</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">2. Selecione o atendimento</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={atendimentoSelecionadoId || ''}
                  onChange={(e) => setAtendimentoSelecionadoId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!pacienteFiltroId || atendimentosPaciente.length === 0}
                >
                  <option value="">-- Escolha um atendimento --</option>
                  {atendimentosPaciente.map((a: any) => (
                    <option key={a.id} value={a.id}>
                      {a.data ? formatDateBR(a.data as string) : ''} – {a.tipo} – {a.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loadingDadosGuia && (
              <p className="text-xs text-blue-600 mt-2 animate-pulse">⏳ Carregando dados do atendimento...</p>
            )}
            {guiaDataPrefill && (
              <p className="text-xs text-green-600 mt-2 font-medium">✅ Campos preenchidos automaticamente com dados do atendimento selecionado</p>
            )}
          </div>

          <GuiaSPSADTPrefaturamento
            convenioId={formData.convenioId ? parseInt(formData.convenioId) : (guiaDataPrefill?.convenioId ?? (formData.pacienteId ? ((pacientes.find(p => p.id === parseInt(formData.pacienteId)) as any)?.convenioId ?? 0) : 0))}
            guiaData={guiaDataPrefill || (() => {
              const pacienteNovaGuia = formData.pacienteId ? pacientes.find(p => p.id === parseInt(formData.pacienteId)) : null;
              const convenioIdEfetivo = formData.convenioId || ((pacienteNovaGuia as any)?.convenioId?.toString() || '');
              return {
              numeroGuia: formData.numero,
              nomeBeneficiario: pacienteNovaGuia?.nome || '',
              // Fonte de verdade: Nº da carteirinha do convênio (campo obrigatório no cadastro)
              numeroCarteira: (pacienteNovaGuia as any)?.numeroCarteira || '',
              validadeCarteira: (pacienteNovaGuia as any)?.validadeCarteira
                ? new Date((pacienteNovaGuia as any).validadeCarteira).toISOString().split('T')[0]
                : '',
              dataNascimento: pacienteNovaGuia?.dataNascimento || '',
              nomeConvenio: convenioIdEfetivo ? convenios.find(c => c.id === parseInt(convenioIdEfetivo))?.nome || '' : '',
              codigoANS: convenioIdEfetivo ? convenios.find(c => c.id === parseInt(convenioIdEfetivo))?.codigoOperadora || '' : '',
              nomeProfissional: formData.profissionalId ? profissionais.find(p => p.id === parseInt(formData.profissionalId))?.nome || '' : '',
              conselhoProfissional: formData.profissionalId ? profissionais.find(p => p.id === parseInt(formData.profissionalId))?.conselhoProfissional || 'CRM' : 'CRM',
              registroProfissional: formData.profissionalId ? profissionais.find(p => p.id === parseInt(formData.profissionalId))?.crm || '' : '',
              especialidade: formData.profissionalId ? profissionais.find(p => p.id === parseInt(formData.profissionalId))?.especialidade || '' : '',
              dataAtendimento: formData.dataAtendimento ? new Date(formData.dataAtendimento) : new Date(),
              horaAtendimento: formData.hora,
              codigoTUSS: formData.codigoTUSS,
              descricaoProcedimento: formData.procedimento,
              cid: formData.cid,
              valorUnitario: parseFloat(formData.valor) || 0,
              valorTotal: parseFloat(formData.valor) || 0,
              valorLiquido: parseFloat(formData.valor) || 0,
              observacoes: formData.observacoes,
              geradoPor: user?.name || 'Sistema',
              };
            })()}
            onSave={async (data) => {
              try {
                const pacienteParaSalvar = pacientes.find(p => p.id === parseInt(formData.pacienteId));
                const convenioIdParaSalvar = formData.convenioId
                  || ((pacienteParaSalvar as any)?.convenioId?.toString() || '');
                await createMutation.mutateAsync({
                  numeroGuia: data.numeroGuia,
                  pacienteId: parseInt(formData.pacienteId),
                  convenioId: parseInt(convenioIdParaSalvar),
                  profissionalId: parseInt(formData.profissionalId),
                  procedimento: data.descricaoProcedimento,
                  valor: data.valorLiquido.toString(),
                  dataEmissao: getHojeBrasilia(),
                  status: 'rascunho',
                  // Vincular o atendimento à guia para preenchimento automático futuro
                  atendimentoId: atendimentoSelecionadoId ?? undefined,
                  // Salvar nº da carteirinha do convênio do cadastro do paciente
                  numeroCarteira: (pacienteParaSalvar as any)?.numeroCarteira || undefined,
                  validadeCarteira: (pacienteParaSalvar as any)?.validadeCarteira
                    ? new Date((pacienteParaSalvar as any).validadeCarteira).toISOString().split('T')[0]
                    : undefined,
                });
                toast.success('Guia criada com sucesso!');
                setIsOpen(false);
              } catch (error) {
                toast.error('Erro ao criar guia');
                console.error(error);
              }
            }}
          />
          </div>
        </div>,
        document.body
      )}
      {/* Modal antigo removido - agora usa GuiaSPSADTPrefaturamento */}

      {/* Modal de Autorização de Procedimento */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="bg-purple-700 text-white p-4 -m-6 mb-4 rounded-t-lg">Autorização de Procedimento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 p-4">
            <div>
              <p className="text-sm text-gray-700 mb-4">
                Procedimento requer autorização.<br />
                Existe autorização?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="senhaAutorizacao" className="text-sm">Senha de Autorização</Label>
                <Input
                  id="senhaAutorizacao"
                  name="senhaAutorizacao"
                  value={authData.senhaAutorizacao}
                  onChange={(e) => setAuthData({...authData, senhaAutorizacao: e.target.value})}
                  placeholder="Ex: 123456"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Exemplo: 123456</p>
              </div>
              <div>
                <Label htmlFor="dataAutorizacao" className="text-sm">Data de Autorização</Label>
                <Input
                  id="dataAutorizacao"
                  name="dataAutorizacao"
                  type="date"
                  value={authData.dataAutorizacao}
                  onChange={(e) => setAuthData({...authData, dataAutorizacao: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="validadeSenha" className="text-sm">Validade da Senha</Label>
                <Input
                  id="validadeSenha"
                  name="validadeSenha"
                  type="date"
                  value={authData.validadeSenha}
                  onChange={(e) => setAuthData({...authData, validadeSenha: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="quantidadeAutorizada" className="text-sm">Quantidade Autorizada</Label>
                <Input
                  id="quantidadeAutorizada"
                  name="quantidadeAutorizada"
                  type="number"
                  value={authData.quantidadeAutorizada}
                  onChange={(e) => setAuthData({...authData, quantidadeAutorizada: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAuthSubmit(false)}
              >
                Não
              </Button>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => handleAuthSubmit(true)}
              >
                Sim
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Procedimentos Lançados */}
      <Dialog open={showProcedimentosModal} onOpenChange={setShowProcedimentosModal}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procedimentos Lançados</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 p-4">
            {/* Adicionar novo procedimento */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-800">Adicionar Procedimento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="novoProcedimento">Procedimento *</Label>
                  <Input
                    id="novoProcedimento"
                    value={novoProcedimento.procedimento}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, procedimento: e.target.value})}
                    placeholder="Ex: Consulta"
                  />
                </div>
                <div>
                  <Label htmlFor="novoCodigoTUSS">Código TUSS *</Label>
                  <Input
                    id="novoCodigoTUSS"
                    value={novoProcedimento.codigoTUSS}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, codigoTUSS: e.target.value})}
                    placeholder="Ex: 30101010"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="novoData">Data</Label>
                  <Input
                    id="novoData"
                    type="date"
                    value={novoProcedimento.data}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, data: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="novoAcesso">Acesso</Label>
                  <Select value={novoProcedimento.acesso} onValueChange={(value) => setNovoProcedimento({...novoProcedimento, acesso: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="U">U</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="novoQuantidade">Qtde</Label>
                  <Input
                    id="novoQuantidade"
                    type="number"
                    min="1"
                    value={novoProcedimento.quantidade}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, quantidade: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label htmlFor="novoValor">Valor *</Label>
                  <Input
                    id="novoValor"
                    type="number"
                    step="0.01"
                    value={novoProcedimento.valor}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, valor: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="novoDesconto">Desc.(%)</Label>
                  <Input
                    id="novoDesconto"
                    type="number"
                    step="0.01"
                    value={novoProcedimento.desconto}
                    onChange={(e) => setNovoProcedimento({...novoProcedimento, desconto: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddProcedimento}
                    className="w-full bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabela de procedimentos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-purple-700 text-white">
                    <th className="px-4 py-3 text-left">Procedimento</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-left">Acesso</th>
                    <th className="px-4 py-3 text-center">Qtde</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-right">Desc.(%)</th>
                    <th className="px-4 py-3 text-right">Valor Final</th>
                    <th className="px-4 py-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {procedimentos.map(proc => (
                    <tr key={proc.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{proc.procedimento}</td>
                      <td className="px-4 py-3">{proc.data}</td>
                      <td className="px-4 py-3">{proc.acesso}</td>
                      <td className="px-4 py-3 text-center">{proc.quantidade}</td>
                      <td className="px-4 py-3 text-right">R$ {proc.valor.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{proc.desconto.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold">R$ {(proc.valor * proc.quantidade - proc.desconto).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProcedimento(proc.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="bg-gray-100 p-4 rounded-lg flex justify-end">
              <div className="text-lg font-bold text-gray-800">
                Total: R$ {totalValor.toFixed(2)}
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProcedimentosModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleFinalizarGuia}
              >
                Gerar Guia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Guia */}
      <GuiaVisualizacao 
        isOpen={showGuiaVisualizacao} 
        onClose={() => setShowGuiaVisualizacao(false)}
        guia={guiaSelecionada}
      />

      {/* Modal de Prefaturamento — dados enriquecidos buscados automaticamente do servidor */}
      {showPrefaturamento && guiaPrefaturamento && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: '#f3f4f6', display: 'flex', flexDirection: 'row' }}>
          {/* Painel lateral de histórico de guias */}
          {showHistoricoLateral && (
            <div style={{ width: 320, minWidth: 280, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto', zIndex: 1 }}>
              <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-purple-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="font-semibold text-purple-800 text-sm">Histórico de Guias</span>
                </div>
                <button onClick={() => setShowHistoricoLateral(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-3 space-y-2">
                {(historicoGuiasPaciente as any[]).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">Nenhuma guia anterior</p>
                ) : (
                  (historicoGuiasPaciente as any[]).map((g: any) => (
                    <div key={g.id} className={`rounded-lg border p-3 text-xs ${g.id === guiaPrefaturamento?.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-gray-700">{g.numeroGuiaInterno || g.numeroGuia}</span>
                        {g.serieId && (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">Série {g.serieNumero ?? ''}</span>
                        )}
                      </div>
                      <p className="text-gray-500 truncate">{g.procedimento}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-400">{g.nomeProfissional}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          g.status === 'paga' ? 'bg-green-100 text-green-700' :
                          g.status === 'enviada' ? 'bg-yellow-100 text-yellow-700' :
                          g.status === 'glosa' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{g.status}</span>
                      </div>
                      {g.senhaAutorizacao && (
                        <p className="text-gray-400 mt-0.5">Senha: {g.senhaAutorizacao}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {/* Área principal do pré-faturamento */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {/* Botão para abrir/fechar painel lateral */}
          {!showHistoricoLateral && (
            <button
              onClick={() => setShowHistoricoLateral(true)}
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}
              className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-lg shadow hover:bg-purple-700 transition-colors"
              title="Ver histórico de guias"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Histórico ({(historicoGuiasPaciente as any[]).length})
            </button>
          )}
          <GuiaSPSADTPrefaturamento
            guiaData={(() => {
              // Dados base da guia (sempre disponíveis)
              const d = dadosGuiaPrefaturamento;
              const paciente = d?.paciente || pacientes.find(p => p.id === guiaPrefaturamento.pacienteId);
              // Convênio: prioridade guia.convenioId > paciente.convenioId (do cadastro)
              const pacienteConvenioId = (paciente as any)?.convenioId;
              const convenio = d?.convenio
                || convenios.find(c => c.id === guiaPrefaturamento.convenioId)
                || (pacienteConvenioId ? convenios.find(c => c.id === pacienteConvenioId) : undefined);
              const profissional = d?.profissional || profissionais.find(p => p.id === guiaPrefaturamento.profissionalId);
              const autorizacao = d?.autorizacao;
              const prestador = d?.prestador;
              const guia = d?.guia || guiaPrefaturamento;

              // Procedimento principal: prioridade 1=procedimentoDoAtendimento (com código), 2=salvos, 3=convênio
              const procSalvos = d?.procedimentosSalvos || [];
              const procConvenio = d?.procedimentosConvenio || [];
              const procAtend = d?.procedimentoDoAtendimento || null;
              // Usar procedimentoDoAtendimento se tiver código TUSS válido
              const procAtendValido = procAtend && (procAtend.codigoANS || procAtend.codigoConvenio) ? procAtend : null;
              // Usar procedimentos salvos apenas se tiverem código válido
              const procSalvosValidos = procSalvos.filter((p: any) => p.codigoProcedimento);
              const procPrincipal = procAtendValido || procSalvosValidos[0] || procConvenio[0];
              const valorUnitario = procAtendValido
                ? parseFloat(String(procAtendValido.valor || '0'))
                : procSalvosValidos[0]
                  ? parseFloat(String((procSalvosValidos[0] as any).valorUnitario || '0'))
                  : procConvenio[0]
                    ? parseFloat(String((procConvenio[0] as any).valor || '0'))
                    : parseFloat(String(guiaPrefaturamento.valor || '0'));
              // Data do agendamento: usar dataAgendamento do procedimentoDoAtendimento se disponível
              const dataAgendamento = procAtend?.dataAgendamento || null;
              const horaAgendamento = procAtend?.horaAgendamento || null;

              // Alguns campos da guia oficial não possuem uma coluna isolada.
              // Eles são armazenados como espelho do formulário para que uma
              // edição nunca seja substituída por valores automáticos de cadastro.
              const camposEditadosSalvos = reidratarCamposPrefaturamento(
                (guia as any).dadosPrefaturamento,
              );

              const numeroDaGuia = guia.numeroGuia || guiaPrefaturamento.numeroGuia || '';
              const dataCampo22 = (camposEditadosSalvos as any).dataSolicitacao || (guia.dataEmissao
                ? new Date(guia.dataEmissao).toISOString().split('T')[0]
                : '');

              return {
                guiaId: guiaPrefaturamento.id,
                pacienteId: guiaPrefaturamento.pacienteId,
                // Campo 2: sempre usa o mesmo número da guia do prestador.
                numeroGuia: numeroDaGuia,
                numeroGuiaPrestador: numeroDaGuia,

                // ── Beneficiário ──
                nomeBeneficiario: paciente?.nome || '',
                nomePaciente: paciente?.nome || '',
                pacienteNome: paciente?.nome || '',
                pacienteCPF: paciente?.cpf || '',
                dataNascimento: paciente?.dataNascimento
                  ? new Date(paciente.dataNascimento).toISOString().split('T')[0]
                  : '',
                // A cópia própria da guia prevalece sobre o cadastro do paciente.
                numeroCarteira: guia.numeroCarteira || (paciente as any)?.numeroCarteira || '',
                validadeCarteira: guia.validadeCarteira
                    ? new Date(guia.validadeCarteira).toISOString().split('T')[0]
                    : (paciente as any)?.validadeCarteira
                      ? new Date((paciente as any).validadeCarteira).toISOString().split('T')[0]
                      : '',
                atendimentoRN: guia.atendimentoRN || 'N',

                // ── Convênio ──
                nomeConvenio: convenio?.nome || '',
                registroANS: convenio?.registroANS || convenio?.codigoOperadora || '',
                codigoANS: convenio?.registroANS || convenio?.codigoOperadora || '',
                logoConvenio: convenio?.logoUrl || '',

                // ── Autorização ──
                senha: resolverSenhaExibidaNoPrefaturamento({
                  senhaAutorizacao: guia.senhaAutorizacao,
                  numeroAutorizacao: autorizacao?.numeroAutorizacao,
                }),
                // Campo 4: espelho do campo 22.
                dataAutorizacao: dataCampo22,
                dataValidadeSenha: guia.dataValidadeSenha
                  ? new Date(guia.dataValidadeSenha).toISOString().split('T')[0]
                  : autorizacao?.dataValidade
                    ? new Date(autorizacao.dataValidade).toISOString().split('T')[0]
                    : '',
                numeroGuiaOperadora: guia.numeroGuiaOperadora || autorizacao?.numeroAutorizacao || '',
                numeroGuiaPrincipal: guia.numeroGuiaPrincipal || '',

                // ── Contratado Solicitante / Executante: cadastro do convênio ──
                codigoOperadoraSolicitante: convenio?.codigoNaOperadora || prestador?.codigoPrestadorNaOperadora || '',
                nomeContratadoSolicitante: prestador?.razaoSocial || prestador?.nomeFantasia || '',
                codigoCNES: prestador?.cnes || '',
                codigoOperadoraExecutante: convenio?.codigoNaOperadora || prestador?.codigoPrestadorNaOperadora || '',
                nomeContratadoExecutante: prestador?.razaoSocial || prestador?.nomeFantasia || '',

                // ── Profissional Solicitante ──
                pedidoMedicoUrl: paciente?.pedidoMedicoUrl || '',
                solicitanteOrigem: (paciente as any)?.nomeMedicoSolicitante ? 'pedido_medico' : 'profissional_padrao',
                nomeProfissionalSolicitante: (paciente as any)?.nomeMedicoSolicitante || profissional?.nome || '',
                conselhoProfissionalSolicitante: (paciente as any)?.nomeMedicoSolicitante ? 'CRM' : (profissional?.conselhoProfissional || 'CRM'),
                numeroConselhoSolicitante: (paciente as any)?.crmMedicoSolicitante || profissional?.crm || profissional?.numeroConselho || '',
                ufSolicitante: (paciente as any)?.ufMedicoSolicitante || profissional?.uf || '',
                codigoCBOSolicitante: (paciente as any)?.cbosMedicoSolicitante || profissional?.codigoCBO || '',

                // ── Profissional Executante (para tabela) ──
                profissionalId: profissional?.id || null,
                nomeProfissional: profissional?.nome || '',
                conselhoProfissional: profissional?.conselhoProfissional || 'CRM',
                registroProfissional: profissional?.crm || profissional?.numeroConselho || '',
                especialidade: profissional?.especialidade || '',
                codigoCBO: profissional?.codigoCBO || '',
                uf: profissional?.uf || '',
                cpfProfissional: profissional?.cpf || '',

                // ── Atendimento ──
                // Prioridade: data do agendamento > data de emissão da guia > hoje
                dataAtendimento: dataAgendamento
                  ? new Date(dataAgendamento)
                  : guia.dataEmissao
                    ? new Date(guia.dataEmissao)
                    : new Date(),
                horaAtendimento: horaAgendamento || '',
                caraterAtendimento: (guia.caraterAtendimento as any) || '1',
                tipoAtendimento: guia.tipoAtendimento || '05',
                indicacaoAcidente: guia.indicacaoAcidente || '9',
                regimeAtendimento: guia.regimeAtendimento || '01',
                dataSolicitacao: dataCampo22,

                // ── Diagnóstico ──
                cid: guia.cid10Principal || (guiaPrefaturamento as any).cid || '',
                indicacaoClinica: (guia as any).indicacaoClinica || '',
                motivoEncerramento: (guia as any).motivoEncerramento || '',
                saudeOcupacional: (guia as any).saudeOcupacional || '',

                // ── Procedimento principal ──
                // Prioridade: procedimento do atendimento (válido) > procedimentos salvos válidos > guia > convênio
                codigoTUSS: procAtendValido?.codigoANS
                  || procAtendValido?.codigoConvenio
                  || (procSalvosValidos[0] as any)?.codigoProcedimento
                  || (procConvenio[0] as any)?.codigoConvenio
                  || (guiaPrefaturamento as any).codigoTUSS
                  || '',
                descricaoProcedimento: procAtendValido?.descricao
                  || procAtendValido?.descricaoConvenio
                  || (procSalvosValidos[0] as any)?.descricaoProcedimento
                  || (procConvenio[0] as any)?.descricaoConvenio
                  || guiaPrefaturamento.procedimento
                  || '',
                valorUnitario,
                valorTotal: valorUnitario,
                valorLiquido: valorUnitario,
                // Totais persistidos da guia (campo 65 e sub-totais)
                // Prioridade: valores salvos no prefaturamento > valor unitário como fallback
                totalProcedimentos: parseFloat(String((guia as any).valorProcedimentos || '0')) || valorUnitario,
                totalTaxasAlugueis: parseFloat(String((guia as any).valorTaxasAlugueis || '0')) || 0,
                totalMateriais: parseFloat(String((guia as any).valorMateriais || '0')) || 0,
                totalOPME: parseFloat(String((guia as any).valorOPME || '0')) || 0,
                totalMedicamentos: parseFloat(String((guia as any).valorMedicamentos || '0')) || 0,
                totalGasesMedicinais: parseFloat(String((guia as any).valorGasesMedicinais || '0')) || 0,
                totalGeral: parseFloat(String((guia as any).valorTotalGeral || '0')) || valorUnitario,

                // ── Observações ──
                observacoes: guia.observacoesTISS || (guiaPrefaturamento as any).observacoes || '',

                // ── Assinaturas ──
                historicoAssinaturas: assinaturasPrefaturamento || [],
                totalSessoes: d?.numeroSessao || assinaturasPrefaturamento?.length || 0,

                // ── Meta ──
                geradoPor: 'Sistema MIFATURE',
                ...camposEditadosSalvos,
              };
            })()}
            convenioId={guiaPrefaturamento.convenioId}
            loteVinculado={(() => {
              const guia = (dadosGuiaPrefaturamento as any)?.guia || guiaPrefaturamento;
              const lote = (lotesTiss as any[]).find((item: any) => item.id === Number((guia as any).loteId));
              return lote ? { id: lote.id, numeroLote: lote.numeroLote, status: lote.status } : null;
            })()}
            onAbrirLote={(loteId) => {
              window.location.assign(`/faturamento-tiss?loteId=${loteId}`);
            }}
            onExtrairSolicitantePedido={async () => {
              const resultado = await extrairSolicitantePedidoMutation.mutateAsync({
                pacienteId: guiaPrefaturamento.pacienteId,
              });
              await Promise.all([
                utils.guias.getDadosGuiaPrefaturamento.invalidate({ guiaId: guiaPrefaturamento.id }),
                utils.pacientes.list.invalidate(),
              ]);
              return resultado;
            }}
            procedimentosSalvos={dadosGuiaPrefaturamento?.procedimentosSalvos || []}
            sessoes={dadosGuiaPrefaturamento?.sessoes || []}
            onSave={async (data) => {
              try {
                const d = data as any;
                // Mapear execuções (tabela 13) para o formato do servidor
                // Helper para converter DD/MM/YYYY para YYYY-MM-DD
                // Procedimentos solicitados da Tabela 1 (campos 24-28, tabela 22)
                // Estes são os procedimentos que o utilizador vê na primeira tabela
                const procedimentosSolicitados = ((d.procedimentos as any[]) || []).map((p: any) => ({
                  sequencial: p.id,
                  codigoTabela: p.tabela || '22',
                  dataExecucao: undefined,
                  codigoProcedimento: p.codigo || '',
                  descricaoProcedimento: p.descricao || '',
                  quantidadeExecutada: Number(p.qtdeSolic) || 1,
                  valorUnitario: 0,
                  reducaoAcrescimo: undefined,
                  profissionalId: undefined,
                })).filter((p: any) => p.codigoProcedimento);
                console.log(`[GuiasSPSADT] Procedimentos solicitados (Tabela 1): ${procedimentosSolicitados.length}`);

                // Execuções de terapia da Tabela 2 (campos 36-47, tabela 13)
                const execucoesParaSalvar = (d.execucoes || []).map((e: any, index: number) => ({
                  // O id visual pode ser Date.now() para sessões novas; a coluna
                  // TISS sequencial é ordinal da execução e deve ser 1..N.
                  sequencial: index + 1,
                  codigoTabela: e.tabela || '22',
                  dataExecucao: normalizarDataExecucaoCampo36(e.data),
                  horaInicial: e.horaInicial || undefined,
                  horaFinal: e.horaFinal || undefined,
                  codigoProcedimento: e.codigo || '',
                  descricaoProcedimento: e.descricao || '',
                  quantidadeExecutada: Number(e.qtde) || 1,
                  valorUnitario: Number(e.valorUnitario) || 0,
                  reducaoAcrescimo: e.fatorRedAcresc || undefined,
                  profissionalId: e.profissionalId ? Number(e.profissionalId) : undefined,
                })).filter((e: any) => e.codigoProcedimento);

                // A tabela de execuções é a fonte própria para a guia. Em uma
                // guia sem execuções, preserva-se a tabela de procedimentos
                // solicitados. Isso evita duplicar o mesmo procedimento ao salvar.
                const todosProcedimentos = execucoesParaSalvar.length > 0
                  ? execucoesParaSalvar
                  : procedimentosSolicitados;
                console.log(`[GuiasSPSADT] Procedimentos solicitados: ${procedimentosSolicitados.length}, Execuções: ${execucoesParaSalvar.length}, Persistidos: ${todosProcedimentos.length}`);

                // Salvar todos os campos TISS via salvarSPSADT
                const dadosSincronizados = sincronizarCamposCabecalhoGuiaSadt(d);
                const dadosPersistiveis = removerHistoricoAssinaturasDoPrefaturamento(dadosSincronizados);
                await salvarSPSADTMutation.mutateAsync({
                  id: guiaPrefaturamento.id,
                  // Campo 2: Nº Guia do Prestador = número da própria guia.
                  numeroGuia: dadosSincronizados.numeroGuia || undefined,
                  numeroGuiaInterno: dadosSincronizados.numeroGuiaPrestador || undefined,
                  // Autorização
                  senhaAutorizacao: normalizarSenhaAutorizacaoPrefaturamento(d.senha),
                  // Campo 4: espelha a data da solicitação do campo 22.
                  dataAutorizacao: dadosSincronizados.dataAutorizacao || null,
                  dataValidadeSenha: d.dataValidadeSenha || null,
                  numeroGuiaOperadora: d.numeroGuiaOperadora ?? undefined,
                  numeroGuiaPrincipal: d.numeroGuiaPrincipal ?? undefined,
                  // Beneficiário
                  numeroCarteira: d.numeroCarteira ?? undefined,
                  validadeCarteira: d.validadeCarteira || null,
                  atendimentoRN: d.atendimentoRN === 'S' ? 'S' : 'N',
                  // Atendimento
                  caraterAtendimento: (d.caraterAtendimento === '1' || d.caraterAtendimento === '2') ? d.caraterAtendimento : undefined,
                  tipoAtendimento: d.tipoAtendimento ?? undefined,
                  indicacaoAcidente: d.indicacaoAcidente ?? undefined,
                  tipoConsulta: d.tipoConsulta ?? undefined,
                  regimeAtendimento: d.regimeAtendimento ?? undefined,
                  motivoEncerramento: d.motivoEncerramento ?? undefined,
                  saudeOcupacional: d.saudeOcupacional ?? undefined,
                  // Diagnóstico
                  cid10Principal: d.cid ?? undefined,
                  indicacaoClinica: d.indicacaoClinica ?? undefined,
                  // Observações
                  observacoesTISS: d.observacoes ?? d.observacaoJustificativa ?? undefined,
                  // Valores totais
                  valorTaxasAlugueis: Number(d.totalTaxasAlugueis ?? 0),
                  valorMateriais: Number(d.totalMateriais ?? 0),
                  valorOPME: Number(d.totalOPME ?? 0),
                  valorMedicamentos: Number(d.totalMedicamentos ?? 0),
                  valorGasesMedicinais: Number(d.totalGasesMedicinais ?? 0),
                  dadosPrefaturamento: {
                    ...dadosPersistiveis,
                    // Campos 50 a 57 não possuem colunas próprias. Mantê-los
                    // no espelho persistido evita que seqRef e grauPart sejam
                    // reconstruídos com valores-padrão ao reabrir a guia.
                    profissionais: d.profissionais || [],
                  },
                  // Procedimentos/execuções
                  procedimentos: todosProcedimentos,
                });
                toast.success('Prefaturamento salvo com sucesso!');
                setShowPrefaturamento(false);

                // A gravação já foi confirmada no servidor. A atualização das
                // consultas não pode fazer o usuário acreditar que o salvamento
                // falhou caso haja uma oscilação de rede após a escrita.
                void (async () => {
                  try {
                    await Promise.all([
                      utils.guias.getDadosGuiaPrefaturamento.invalidate({ guiaId: guiaPrefaturamento.id }),
                      utils.guias.list.invalidate(),
                    ]);
                    await refetch();
                  } catch (erroAtualizacao) {
                    console.warn('Guia SADT salva, mas a atualização visual será tentada na próxima abertura.', erroAtualizacao);
                  }
                })();
              } catch (err: any) {
                console.error('Erro ao salvar prefaturamento:', err);
                // Exibir mensagem de duplicado de forma clara
                const msg = err?.message || err?.data?.message || '';
                if (msg.includes('DUPLICADO:')) {
                  toast.error(
                    `⚠️ Dados duplicados detectados!\n${msg.replace('DUPLICADO: ', '')}`,
                    { duration: 10000 }
                  );
                  // Re-lançar para que o GuiaSPSADTPrefaturamento também trate
                  throw err;
                } else {
                  toast.error(`Erro ao salvar prefaturamento: ${msg || 'verifique os dados da guia e tente novamente.'}`, {
                    duration: 10000,
                  });
                  throw err;
                }
              }
            }}
            onClose={() => setShowPrefaturamento(false)}
          />
          </div>
        </div>,
        document.body
      )}
      {/* Modal de Vincular Guia à Série */}
      {guiaParaVincularSerie && (
        <Dialog open onOpenChange={() => { setGuiaParaVincularSerie(null); setSerieIdParaVincular(''); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-700">
                <Link2 className="w-5 h-5" />
                Vincular Guia à Série
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-purple-800">Guia: {guiaParaVincularSerie.numeroGuiaInterno || guiaParaVincularSerie.numeroGuia}</p>
                <p className="text-purple-600 text-xs mt-0.5">Paciente: {pacientes.find((p: any) => p.id === guiaParaVincularSerie.pacienteId)?.nome || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID da Série *</label>
                <input
                  type="text"
                  placeholder="Ex: serie-1786231604777-r225yu"
                  value={serieIdParaVincular}
                  onChange={e => setSerieIdParaVincular(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <p className="text-xs text-gray-500 mt-1">O ID da série pode ser encontrado nos atendimentos do paciente na agenda.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setGuiaParaVincularSerie(null); setSerieIdParaVincular(''); }}>Cancelar</Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={!serieIdParaVincular.trim() || vincularGuiaASerieMutation.isPending}
                  onClick={() => {
                    if (!serieIdParaVincular.trim()) return;
                    // Buscar atendimentos da série para vincular
                    const atendimentosDaSerie = (agendamentos as any[]).filter((a: any) => a.serieId === serieIdParaVincular.trim());
                    vincularGuiaASerieMutation.mutate({
                      guiaId: guiaParaVincularSerie.id,
                      serieId: serieIdParaVincular.trim(),
                      serieNumero: 1,
                      atendimentoIds: atendimentosDaSerie.map((a: any) => a.id),
                    });
                  }}
                >
                  {vincularGuiaASerieMutation.isPending ? 'Vinculando...' : 'Vincular à Série'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Assinatura Digital do Paciente */}
      {showAssinatura && guiaParaAssinar && (() => {
        const paciente = pacientes.find(p => p.id === guiaParaAssinar.pacienteId);
        const sessaoAtual = (totalSessoesData ?? 0) + 1;
        return (
          <AssinaturaCanvas
            sessaoNumero={sessaoAtual}
            pacienteNome={paciente?.nome ?? 'Paciente'}
            onConfirm={(dataUrl) => {
              criarAssinaturaMutation.mutate({
                guiaId: guiaParaAssinar.id,
                pacienteId: guiaParaAssinar.pacienteId,
                assinaturaPacienteUrl: dataUrl,
                sessaoNumero: sessaoAtual,
              });
            }}
            onCancel={() => {
              setShowAssinatura(false);
              setGuiaParaAssinar(null);
            }}
          />
        );
      })()}

      {/* Modal de Exportação XML TISS em Lote */}
      {showExportModal && (() => {
        const exportConvenioId = convenioFilter !== 'todos' ? parseInt(convenioFilter) : null;
        // Se houver guias seleccionadas manualmente, usar apenas essas (filtradas por 'emitida')
        // Caso contrário, usar todas as filtradas com status 'emitida'
        const temSeleccao = selectedGuiaIds.size > 0;
        const baseGuias = temSeleccao
          ? filteredGuias.filter(g => selectedGuiaIds.has(g.id))
          : (exportConvenioId ? filteredGuias.filter(g => g.convenioId === exportConvenioId) : filteredGuias);
        const guiasEmitidas = baseGuias.filter(g => g.status === 'emitida');
        const guiasParaExportar = guiasEmitidas;
        const guiasExcluidas = baseGuias.filter(g => g.status !== 'emitida');
        const valorTotal = guiasParaExportar.reduce((s, g) => s + parseFloat(g.valor || '0'), 0);
        const convenioSelecionado = convenios.find(c => c.id === exportConvenioId);

        const handleGerarXml = async () => {
          if (!exportConvenioId) {
            toast.error('Selecione um convênio nos filtros antes de exportar.');
            return;
          }
          if (guiasParaExportar.length === 0) {
            toast.error('Nenhuma guia com status "emitida" encontrada. Altere o status das guias para "emitida" antes de exportar.');
            return;
          }
          if (!exportNumeroLote.trim()) {
            toast.error('Informe o número do lote.');
            return;
          }
          setExportLoading(true);
          try {
            const result = await gerarLoteMutation.mutateAsync({
              convenioId: exportConvenioId,
              guiaIds: guiasParaExportar.map(g => g.id),
              numeroLote: exportNumeroLote.trim(),
            });
            // Download automático do XML
            const blob = new Blob([result.xml], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TISS_${exportNumeroLote.trim()}_${getHojeBrasilia()}.xml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Lote ${result.numeroLote} gerado com ${result.quantidadeGuias} guia(s). Status actualizado para "enviada". XML baixado.`);
            refetch();
            setShowExportModal(false);
          } catch (e: any) {
            toast.error(e?.message || 'Erro ao gerar XML TISS.');
          } finally {
            setExportLoading(false);
          }
        };

        return createPortal(
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              {/* Cabeçalho */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileCode className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Exportar XML TISS</h2>
                    <p className="text-xs text-gray-500">Gerar lote de faturamento para convênio</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo */}
              <div className="px-6 py-5 space-y-4">
                {/* Convênio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Convênio <span className="text-red-500">*</span>
                  </label>
                  {exportConvenioId ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-md">
                      <span className="text-sm font-medium text-green-800">{convenioSelecionado?.nome || `Convênio #${exportConvenioId}`}</span>
                      <span className="text-xs text-green-600 ml-auto">(filtro activo)</span>
                    </div>
                  ) : (
                    <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-700">
                        Nenhum convênio seleccionado. Use o filtro de convênio na listagem antes de exportar.
                      </p>
                    </div>
                  )}
                </div>

                {/* Número do Lote */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Número do Lote <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={exportNumeroLote}
                    onChange={e => setExportNumeroLote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                    placeholder="Ex: LOTE-202507-00001"
                  />
                  <p className="text-xs text-gray-400 mt-1">Gerado automaticamente. Pode editar antes de enviar.</p>
                </div>

                {/* Protocolo (opcional) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Protocolo <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={exportProtocolo}
                    onChange={e => setExportProtocolo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Número de protocolo do convênio"
                  />
                </div>

                {/* Resumo das guias */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Guias a incluir no lote</h3>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      {temSeleccao ? `${selectedGuiaIds.size} seleccionada(s) • emitidas` : 'Apenas status: emitida'}
                    </span>
                  </div>
                  {guiasParaExportar.length === 0 ? (
                    <div>
                      <p className="text-sm text-amber-700 italic">Nenhuma guia com status "emitida" encontrada.</p>
                      {guiasExcluidas.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">{guiasExcluidas.length} guia(s) excluída(s) por não estarem emitidas.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="max-h-40 overflow-y-auto space-y-1 mb-3">
                        {guiasParaExportar.map(g => (
                          <div key={g.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-700 font-medium">{g.numeroGuia}</span>
                            <span className="text-gray-500">{pacientes.find(p => p.id === g.pacienteId)?.nome || '-'}</span>
                            <span className="text-green-700 font-semibold">R$ {parseFloat(g.valor).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">
                          {guiasParaExportar.length} guia{guiasParaExportar.length !== 1 ? 's' : ''}
                          {guiasExcluidas.length > 0 && (
                            <span className="text-xs text-gray-400 font-normal ml-1">({guiasExcluidas.length} excluída{guiasExcluidas.length !== 1 ? 's' : ''})</span>
                          )}
                        </span>
                        <span className="text-sm font-bold text-green-700">
                          Total: R$ {valorTotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Após gerar o lote, o status destas guias será automaticamente alterado para <strong>enviada</strong>.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Rodapé */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
                  disabled={exportLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGerarXml}
                  disabled={exportLoading || !exportConvenioId || guiasParaExportar.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {exportLoading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Gerar e Baixar XML
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}
export default GuiasSPSADT;
