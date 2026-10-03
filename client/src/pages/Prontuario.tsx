import React, { useState, useEffect } from 'react';
import { FileText, Save, Eye, AlertCircle, Shield, Clock, Activity, Brain, Mic, Apple, Download, User, Phone, Mail, MapPin, ChevronDown, ChevronUp, FileCheck, Calendar, PenLine, CheckCircle2, XCircle, ExternalLink, FileSignature, Paperclip, Upload, Trash2, FileImage, FileArchive, File } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { IntegracaoHelp } from '../components/IntegracaoHelp';
import { ProntuarioFisioterapia } from '../components/ProntuarioFisioterapia';
import { ProntuarioPsicologia } from '../components/ProntuarioPsicologia';
import { ProntuarioFonoaudiologia } from '../components/ProntuarioFonoaudiologia';
import { ProntuarioNutricao } from '../components/ProntuarioNutricao';
import { trpc } from '../lib/trpc';
import { formatDateBR, getHojeBrasilia } from '../lib/utils';
import { toast } from 'sonner';
import { useProntuarioContext } from '../contexts/ProntuarioContext';
import { AnexosPaciente } from '../components/AnexosPaciente';
import { useAuth } from '../_core/hooks/useAuth';
import { deveExibirAssinaturaPendenteProntuario, obterAbaAtalhoProntuario } from '@shared/prontuarioAssinatura';
import { deveFecharProntuarioDoProfissional, resolverAtendimentoAlvoDaAgenda } from '@shared/prontuarioAgendaTarget';

// Mapeia a especialidade do profissional para o tipo de prontuário
function especialidadeParaTipo(especialidade: string): 'medico' | 'fisioterapia' | 'psicologia' | 'fonoaudiologia' | 'nutricao' {
  const e = especialidade.toLowerCase();
  if (e.includes('fisio')) return 'fisioterapia';
  if (e.includes('psico') || e.includes('neuro') || e.includes('tcc') || e.includes('terapia')) return 'psicologia';
  if (e.includes('fono') || e.includes('fonoaudio')) return 'fonoaudiologia';
  if (e.includes('nutri')) return 'nutricao';
  return 'medico';
}

interface ProntuarioProps {
  onNavigate?: (page: string) => void;
}

export function Prontuario({ onNavigate }: ProntuarioProps = {}) {
  const { user } = useAuth();
  const perfil = (user as any)?.perfil as string | null | undefined;
  const profissionalVinculadoId = (user as any)?.profissionalVinculadoId as number | null | undefined;
  // Apenas administrador e profissional podem aceder ao prontuário
  const podeAceder = !perfil || perfil === 'administrador' || perfil === 'profissional';
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [activeTab, setActiveTab] = useState('novo');
  const [tipoProntuario, setTipoProntuario] = useState<'medico' | 'fisioterapia' | 'psicologia' | 'fonoaudiologia' | 'nutricao'>('medico');
  const [tipoRegistro, setTipoRegistro] = useState<'anamnese' | 'continuidade'>('continuidade');

  // Buscar dados do profissional vinculado para obter a especialidade (para perfil profissional)
  const { data: meuProfissional } = trpc.profissionais.getById.useQuery(
    { id: profissionalVinculadoId || 0 },
    { enabled: !!profissionalVinculadoId && perfil === 'profissional' }
  );

  // Contexto de navegação da Agenda
  const {
    pacienteId: pacienteIdFromAgenda,
    atendimentoId: atendimentoIdFromAgenda,
    clearProntuarioTarget,
  } = useProntuarioContext();

  // Carregar pacientes cadastrados
  const { data: pacientesComAgendamentos = [], isLoading } = trpc.pacientes.getCadastrados.useQuery();
  
  // Carregar agendamentos do paciente selecionado
  const [pacienteIdSelecionado, setPacienteIdSelecionado] = useState<number | null>(null);
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<number | null>(null);
  // Data escolhida pelo profissional para o prontuário
  const [dataProntuarioEscolhida, setDataProntuarioEscolhida] = useState<string>('');
  const { data: agendamentosPaciente = [] } = trpc.pacientes.getAgendamentos.useQuery(
    { pacienteId: pacienteIdSelecionado || 0 },
    { enabled: !!pacienteIdSelecionado }
  );

  // Estados para filtro de histórico
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [mostrarFiltro, setMostrarFiltro] = useState(false);

  // Normalizar data de um agendamento para string YYYY-MM-DD
  // Normaliza a data de um agendamento para YYYY-MM-DD sem desvio de fuso horário.
  // O MySQL retorna campos DATE como objetos Date com hora T00:00:00.000Z (UTC).
  // Converter via toLocaleDateString('sv-SE', {timeZone: 'America/Sao_Paulo'}) daria o dia anterior
  // (ex: 2026-08-04T00:00:00.000Z → 2026-08-03 em UTC-3).
  // A solução correta é sempre extrair os primeiros 10 caracteres do ISO string.
  const normalizeAgendamentoData = (rawData: any): string => {
    if (!rawData) return '';
    // String YYYY-MM-DD — já está correto
    if (typeof rawData === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawData)) return rawData;
    // String ISO com timestamp (ex: '2026-08-04T00:00:00.000Z') — extrair apenas a data
    if (typeof rawData === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(rawData)) return rawData.substring(0, 10);
    // Objeto Date (superjson deserializa Date do MySQL como Date object)
    // NÃO usar toLocaleDateString pois converte UTC→local e dá dia errado
    // Usar toISOString() e extrair os primeiros 10 chars
    if (rawData instanceof Date) return rawData.toISOString().substring(0, 10);
    // Fallback: converter para string e extrair
    const str = String(rawData);
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return str.substring(0, 10);
    return str.substring(0, 10);
  };

  // Agendamentos na data escolhida pelo profissional
  const agendamentosNaData = dataProntuarioEscolhida
    ? agendamentosPaciente.filter(a => normalizeAgendamentoData((a as any).data) === dataProntuarioEscolhida)
    : [];

  // Agendamento actualmente selecionado:
  // 1. Se há data escolhida e um selectedAgendamentoId válido nessa data, usar esse
  // 2. Se há data escolhida e apenas 1 agendamento nessa data, usar esse automaticamente
  // 3. Fallback para o primeiro agendamento do paciente
  const agendamento = selectedAgendamentoId
    ? (agendamentosPaciente.find(a => (a as any).id === selectedAgendamentoId) || agendamentosPaciente[0])
    : (agendamentosNaData.length === 1 ? agendamentosNaData[0] : agendamentosPaciente[0]);

  // Buscar profissional do atendimento selecionado (para admin — define o tipo de prontuário automaticamente)
  const profissionalIdDoAtendimento = (agendamento as any)?.profissionalId as number | undefined;
  const { data: profissionalDoAtendimento } = trpc.profissionais.getById.useQuery(
    { id: profissionalIdDoAtendimento || 0 },
    { enabled: !!profissionalIdDoAtendimento && perfil !== 'profissional' }
  );
  
  // Carregar dados completos do paciente seleccionado
  const { data: dadosPaciente } = trpc.pacientes.getById.useQuery(
    { id: pacienteIdSelecionado || 0 },
    { enabled: !!pacienteIdSelecionado }
  );

  // Carregar contratos terapêuticos do paciente
  const { data: contratosTerapeuticos = [] } = trpc.contratos.list.useQuery(
    { pacienteId: pacienteIdSelecionado || 0 },
    { enabled: !!pacienteIdSelecionado }
  );

  // Controlo de visibilidade dos painéis
  const [showDadosPaciente, setShowDadosPaciente] = useState(false);
  const [showContratos, setShowContratos] = useState(false);

  // Carregar histórico de prontuários
  const { data: historicoProntuariosApi = [] } = trpc.prontuarios.getHistoricoPaciente.useQuery(
    { pacienteId: pacienteIdSelecionado || 0 },
    { enabled: !!pacienteIdSelecionado }
  );

  // Carregar assinaturas SADT do paciente selecionado
  const { data: assinaturasSadt = [] } = trpc.assinaturas.listarPorPaciente.useQuery(
    { pacienteId: pacienteIdSelecionado || 0 },
    { enabled: !!pacienteIdSelecionado && activeTab === 'guia-assinada' }
  );
  
  // Estado do modal de visualização do prontuário
  const [prontuarioVisualizarId, setProntuarioVisualizarId] = useState<number | null>(null);
  const { data: prontuarioDetalhe } = trpc.prontuarios.getById.useQuery(
    { prontuarioId: prontuarioVisualizarId || 0 },
    { enabled: !!prontuarioVisualizarId }
  );

  // Verificar se é admin/master
  const isMaster = perfil === 'administrador' || (user as any)?.role === 'admin';

  // Estado de confirmação de exclusão
  const [prontuarioExcluirId, setProntuarioExcluirId] = useState<number | null>(null);

  const indicadorAssinaturaProntuario = {
    perfil: isMaster ? "administrador" : perfil,
    atendimentoSelecionado: Boolean(agendamento && (dataProntuarioEscolhida || selectedAgendamentoId)),
    assinaturaPaciente: (agendamento as any)?.assinaturaPaciente,
    prontuarioFeito: (agendamento as any)?.prontuarioFeito,
  };
  const assinaturaProntuarioPendente = deveExibirAssinaturaPendenteProntuario(indicadorAssinaturaProntuario);
  const abaAtalhoProntuario = obterAbaAtalhoProntuario(indicadorAssinaturaProntuario);
  const profissionalPrecisaSelecionarAtendimento = Boolean(
    perfil === 'profissional'
    && pacienteIdSelecionado
    && !dataProntuarioEscolhida
    && !selectedAgendamentoId,
  );
  const prontuarioFechadoPorAssinatura = deveFecharProntuarioDoProfissional({
    perfil,
    pacienteSelecionado: Boolean(pacienteIdSelecionado),
    atendimentoSelecionado: profissionalPrecisaSelecionarAtendimento ? null : (agendamento as any),
  });

  const abrirEditorProntuarioPendente = () => {
    if (!abaAtalhoProntuario) return;
    setActiveTab(abaAtalhoProntuario);
    window.setTimeout(() => {
      document.getElementById("editor-prontuario-pendente")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  // Mutation para salvar prontuário
  const utils = trpc.useUtils();

  // Mutation para excluir prontuário (somente master)
  const deleteProntuarioMutation = trpc.prontuarios.delete.useMutation({
    onSuccess: () => {
      toast.success('Prontuário excluído com sucesso!');
      setProntuarioExcluirId(null);
      setProntuarioVisualizarId(null);
      if (pacienteIdSelecionado) {
        utils.prontuarios.getHistoricoPaciente.invalidate({ pacienteId: pacienteIdSelecionado });
      }
    },
    onError: (err) => {
      toast.error('Erro ao excluir prontuário: ' + err.message);
    },
  });

  const saveProntuarioMutation = trpc.prontuarios.save.useMutation({
    onSuccess: () => {
      toast.success('Prontuário salvo com sucesso! Redirecionando para o Repasse...', { duration: 3000 });
      setActiveTab('historico');
      if (pacienteIdSelecionado) {
        utils.prontuarios.getHistoricoPaciente.invalidate({ pacienteId: pacienteIdSelecionado });
      }
      // Redirecionar automaticamente para o Repasse após 2 segundos
      if (onNavigate) {
        setTimeout(() => onNavigate('repasse'), 2000);
      }
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar prontuário: ${error.message}`);
    },
  });
  
  const exportarPDFMutation = trpc.prontuarios.exportarPDF.useMutation({
    onSuccess: (data) => {
      const binaryString = atob(data.pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('PDF exportado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao exportar PDF: ${error.message}`);
    },
  });
  
  // Definir tipo de prontuário automaticamente com base na especialidade do profissional logado (perfil profissional)
  useEffect(() => {
    if (meuProfissional?.especialidade) {
      setTipoProntuario(especialidadeParaTipo(meuProfissional.especialidade));
    }
  }, [meuProfissional]);

  // Definir tipo de prontuário com base no profissional do atendimento selecionado (para admin)
  useEffect(() => {
    if (profissionalDoAtendimento?.especialidade && perfil !== 'profissional') {
      setTipoProntuario(especialidadeParaTipo(profissionalDoAtendimento.especialidade));
    }
  }, [profissionalDoAtendimento, perfil]);

  // Pré-seleccionar paciente quando vem da Agenda
  useEffect(() => {
    if (pacienteIdFromAgenda && pacientesComAgendamentos.length > 0) {
      const paciente = pacientesComAgendamentos.find(p => p.id === pacienteIdFromAgenda);
      if (paciente) {
        setSelectedPaciente(paciente.id.toString());
        setPacienteIdSelecionado(paciente.id);
        setSelectedAgendamentoId(null);
        if (!atendimentoIdFromAgenda) {
          clearProntuarioTarget();
        }
      }
    }
  }, [pacienteIdFromAgenda, atendimentoIdFromAgenda, pacientesComAgendamentos, clearProntuarioTarget]);

  // A Agenda informa o atendimento exato. Para o profissional, usar esse alvo é
  // essencial: ele determina a sessão assinada que libera o prontuário.
  useEffect(() => {
    if (!pacienteIdFromAgenda || !atendimentoIdFromAgenda || pacienteIdSelecionado !== pacienteIdFromAgenda) {
      return;
    }

    const alvoDaAgenda = resolverAtendimentoAlvoDaAgenda(
      agendamentosPaciente as any[],
      atendimentoIdFromAgenda,
    );
    if (!alvoDaAgenda) return;

    setSelectedAgendamentoId(alvoDaAgenda.atendimento.id);
    setDataProntuarioEscolhida(alvoDaAgenda.data);
    clearProntuarioTarget();
  }, [
    pacienteIdFromAgenda,
    atendimentoIdFromAgenda,
    pacienteIdSelecionado,
    agendamentosPaciente,
    clearProntuarioTarget,
  ]);

  // Pré-preencher data e hora quando o agendamento selecionado mudar
  // IMPORTANTE: usar dataProntuarioEscolhida como fonte da data (já é YYYY-MM-DD do input do utilizador)
  // NÃO usar agendamento.data pois pode ter desvio de fuso ao converter Date object
  useEffect(() => {
    if (agendamento) {
      // A data correta é sempre a que o utilizador escolheu no input (dataProntuarioEscolhida)
      // O agendamento.data é usado apenas para confirmar o vínculo, não para extrair a data
      const horaStr = (agendamento as any).hora || '';
      setProntuario(prev => ({
        ...prev,
        // Usar dataProntuarioEscolhida se disponível (fonte mais confiável — vem do input do utilizador)
        // Fallback: extrair da string YYYY-MM-DD do agendamento
        dataAtendimento: dataProntuarioEscolhida || (() => {
          const rawData = (agendamento as any).data;
          if (!rawData) return '';
          // Backend já envia string YYYY-MM-DD — usar directamente
          if (typeof rawData === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawData)) return rawData;
          // ISO string com T — extrair antes do T (sem conversão de fuso)
          if (typeof rawData === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(rawData)) return rawData.substring(0, 10);
          // Date object — usar toISOString (UTC) e extrair
          if (rawData instanceof Date) return rawData.toISOString().substring(0, 10);
          return String(rawData).substring(0, 10);
        })(),
        horaAtendimento: horaStr,
      }));
    }
  }, [agendamento?.id]);

  // Atualizar paciente selecionado quando mudar
  const handleSelectPaciente = (pacienteId: string) => {
    const paciente = pacientesComAgendamentos.find(p => p.id.toString() === pacienteId);
    if (paciente) {
      setSelectedPaciente(pacienteId);
      setPacienteIdSelecionado(paciente.id);
      setSelectedAgendamentoId(null);
      setDataProntuarioEscolhida('');
    }
  };

  // Quando o profissional escolhe uma data, resolver o atendimento vinculado
  const handleEscolherDataProntuario = (novaData: string) => {
    setDataProntuarioEscolhida(novaData);
    setSelectedAgendamentoId(null); // limpar seleção manual ao trocar data
    // Preencher data e hora no formulário
    const agendamentosNessa = agendamentosPaciente.filter(
      a => normalizeAgendamentoData((a as any).data) === novaData
    );
    if (agendamentosNessa.length === 1) {
      // Apenas 1 atendimento nessa data — preencher hora automaticamente
      const hora = (agendamentosNessa[0] as any).hora || '';
      setProntuario(prev => ({ ...prev, dataAtendimento: novaData, horaAtendimento: hora }));
    } else {
      // Múltiplos ou nenhum — preencher só a data, hora fica em branco
      setProntuario(prev => ({ ...prev, dataAtendimento: novaData, horaAtendimento: '' }));
    }
  };

  // Quando o profissional escolhe um atendimento específico (múltiplos na mesma data)
  const handleEscolherAtendimento = (atendimentoId: string) => {
    const id = parseInt(atendimentoId);
    const at = agendamentosPaciente.find(a => (a as any).id === id);
    if (at) {
      setSelectedAgendamentoId(id);
      const hora = (at as any).hora || '';
      setProntuario(prev => ({ ...prev, horaAtendimento: hora }));
    }
  };

  // Dados do prontuário conforme CFM
  const [prontuario, setProntuario] = useState({
    // Identificação
    dataAtendimento: '',
    horaAtendimento: '',
    profissional: '',
    local: 'Consultório',
    
    // Anamnese
    queixaPrincipal: '',
    historiaDoencaAtual: '',
    historicoPatologico: '',
    historicoFamiliar: '',
    medicamentosEmUso: '',
    alergias: '',
    
    // Exame Físico
    pressaoArterial: '',
    frequenciaCardiaca: '',
    temperatura: '',
    peso: '',
    altura: '',
    imc: '',
    exameGeral: '',
    exameEspecifico: '',
    
    // Avaliação e Conduta
    hipoteseDiagnostica: '',
    cid10: '',
    conduta: '',
    prescricao: '',
    examesSolicitados: '',
    procedimentosRealizados: '',
    
    // Seguimento
    orientacoes: '',
    dataRetorno: '',
    observacoes: '',
  });

  const historicoProntuarios = [
    {
      id: 1,
      data: '28/12/2025',
      hora: '09:00',
      profissional: 'Dr. João Silva',
      tipo: 'Consulta',
      cid: 'I10 - Hipertensão Essencial',
      status: 'Finalizado'
    },
    {
      id: 2,
      data: '15/11/2025',
      hora: '14:30',
      profissional: 'Dr. João Silva',
      tipo: 'Retorno',
      cid: 'I10 - Hipertensão Essencial',
      status: 'Finalizado'
    },
    {
      id: 3,
      data: '20/10/2025',
      hora: '10:00',
      profissional: 'Dr. João Silva',
      tipo: 'Consulta',
      cid: 'I10 - Hipertensão Essencial',
      status: 'Finalizado'
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setProntuario(prev => ({ ...prev, [field]: value }));
    
    // Calcular IMC automaticamente
    if (field === 'peso' || field === 'altura') {
      const peso = field === 'peso' ? parseFloat(value) : parseFloat(prontuario.peso);
      const altura = field === 'altura' ? parseFloat(value) : parseFloat(prontuario.altura);
      
      if (peso && altura) {
        const imc = (peso / (altura * altura)).toFixed(2);
        setProntuario(prev => ({ ...prev, imc }));
      }
    }
  };

  const handleSalvar = async () => {
    if (prontuarioFechadoPorAssinatura) {
      toast.error('Prontuário fechado: aguarde a assinatura do paciente para este atendimento.');
      return;
    }
    if (!pacienteIdSelecionado) {
      toast.error('Selecione um paciente');
      return;
    }

    if (!dataProntuarioEscolhida) {
      toast.error('Selecione a data do atendimento.');
      return;
    }

    // Validar que há um atendimento vinculado à data escolhida
    if (agendamentosNaData.length === 0) {
      toast.error('Nenhum agendamento encontrado para este paciente na data selecionada. Verifique a data.');
      return;
    }

    // Se há múltiplos atendimentos na data, exigir seleção do horário
    if (agendamentosNaData.length > 1 && !selectedAgendamentoId) {
      toast.error('Há mais de um atendimento nesta data. Selecione o horário correto.');
      return;
    }
    
    if (!prontuario.dataAtendimento || !prontuario.horaAtendimento) {
      toast.error('Preencha data e hora do atendimento');
      return;
    }
    
    if (!agendamento) {
      toast.error('Nenhum agendamento encontrado. Selecione um agendamento.');
      return;
    }
    
    try {
      // Usar o profissionalId do atendimento (para profissional logado, usar o vinculado)
      const profissionalId = profissionalVinculadoId || (agendamento as any).profissionalId || 1;
      
      await saveProntuarioMutation.mutateAsync({
        pacienteId: pacienteIdSelecionado,
        profissionalId: profissionalId,
        atendimentoId: agendamento.id,
        tipoRegistro,
        queixa: prontuario.queixaPrincipal,
        diagnostico: prontuario.hipoteseDiagnostica,
        tratamento: prontuario.conduta,
        observacoes: prontuario.observacoes,
      });
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      toast.error('Erro ao salvar prontuário. Tente novamente.');
    }
  };

  const handleFinalizar = () => {
    if (prontuarioFechadoPorAssinatura) {
      toast.error('Prontuário fechado: aguarde a assinatura do paciente para este atendimento.');
      return;
    }
    void handleSalvar();
  };

  // Bloquear acesso para perfis sem permissão
  if (!podeAceder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Acesso Restrito</h2>
        <p className="text-gray-500 text-center max-w-sm">
          O Prontuário Eletrônico é acessível apenas para profissionais de saúde e administradores.
          Entre em contacto com o administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Prontuário Eletrônico</h1>
          <p className="text-gray-600">Registro de atendimento conforme normativas dos Conselhos de Classe</p>
          {perfil === 'profissional' && (
            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
              <Shield className="w-3 h-3" />
              Visualizando apenas pacientes com guia SADT assinada
            </span>
          )}
        </div>
      </div>

      {/* Tipo de Atendimento / Especialidade */}
      <div className="bg-white border rounded-lg p-4">
        <Label className="mb-3 block">Tipo de Atendimento / Especialidade</Label>

        {/* Profissional: exibe apenas a especialidade vinculada ao seu cadastro (não pode alterar) */}
        {perfil === 'profissional' && meuProfissional ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Brain className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-semibold text-blue-900">{meuProfissional.especialidade}</div>
                <div className="text-xs text-blue-600">Especialidade vinculada ao seu cadastro</div>
              </div>
            </div>
          </div>
        ) : (
          /* Administrador: botões de seleção, com pré-seleção automática pela especialidade do profissional do atendimento */
          <div className="space-y-3">
            {profissionalDoAtendimento && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <Brain className="w-4 h-4 text-green-600 shrink-0" />
                <span className="text-green-800">Especialidade do profissional do atendimento: <strong>{profissionalDoAtendimento.especialidade}</strong> — selecionada automaticamente</span>
              </div>
            )}
            <div className="grid grid-cols-5 gap-3">
              <Button
                variant={tipoProntuario === 'medico' ? 'default' : 'outline'}
                onClick={() => setTipoProntuario('medico')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Shield className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm">Médico</div>
                  <div className="text-xs text-gray-500">CFM</div>
                </div>
              </Button>
              <Button
                variant={tipoProntuario === 'fisioterapia' ? 'default' : 'outline'}
                onClick={() => setTipoProntuario('fisioterapia')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Activity className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm">Fisioterapia</div>
                  <div className="text-xs text-gray-500">COFFITO</div>
                </div>
              </Button>
              <Button
                variant={tipoProntuario === 'psicologia' ? 'default' : 'outline'}
                onClick={() => setTipoProntuario('psicologia')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Brain className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm">Psicologia</div>
                  <div className="text-xs text-gray-500">CFP</div>
                </div>
              </Button>
              <Button
                variant={tipoProntuario === 'fonoaudiologia' ? 'default' : 'outline'}
                onClick={() => setTipoProntuario('fonoaudiologia')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Mic className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm">Fonoaudiologia</div>
                  <div className="text-xs text-gray-500">CFFa</div>
                </div>
              </Button>
              <Button
                variant={tipoProntuario === 'nutricao' ? 'default' : 'outline'}
                onClick={() => setTipoProntuario('nutricao')}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Apple className="w-6 h-6" />
                <div className="text-center">
                  <div className="text-sm">Nutrição</div>
                  <div className="text-xs text-gray-500">CFN</div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Seletor de Paciente */}
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Select value={selectedPaciente} onValueChange={handleSelectPaciente} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    isLoading
                      ? 'Carregando pacientes...'
                      : perfil === 'profissional'
                        ? 'Selecione o paciente (guia assinada)'
                        : 'Selecione o paciente'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {pacientesComAgendamentos.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      {perfil === 'profissional'
                        ? 'Nenhum paciente com guia SADT assinada'
                        : 'Nenhum paciente cadastrado'}
                    </div>
                  ) : (
                    pacientesComAgendamentos.map(paciente => (
                      <SelectItem key={paciente.id} value={paciente.id.toString()}>
                        {paciente.nome} - {paciente.email || 'Sem email'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de Data do Atendimento */}
            {pacienteIdSelecionado && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Data do Atendimento *
                </Label>
                <Input
                  type="date"
                  value={dataProntuarioEscolhida}
                  onChange={(e) => handleEscolherDataProntuario(e.target.value)}
                  max={getHojeBrasilia()}
                />
                {dataProntuarioEscolhida && agendamentosNaData.length === 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Nenhum agendamento encontrado nesta data para este paciente.
                  </p>
                )}
                {dataProntuarioEscolhida && agendamentosNaData.length === 1 && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Atendimento às {(agendamentosNaData[0] as any).hora || '—'} vinculado automaticamente.
                  </p>
                )}
              </div>
            )}

            {/* Seletor de Horário (quando há múltiplos atendimentos na mesma data) */}
            {pacienteIdSelecionado && dataProntuarioEscolhida && agendamentosNaData.length > 1 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Horário do Atendimento *
                </Label>
                <Select
                  value={selectedAgendamentoId?.toString() || ''}
                  onValueChange={handleEscolherAtendimento}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {agendamentosNaData.map(at => (
                      <SelectItem key={(at as any).id} value={(at as any).id.toString()}>
                        {(at as any).hora || 'Sem horário'} — {(at as any).tipo || 'Consulta'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600">
                  {agendamentosNaData.length} atendimentos nesta data. Selecione o horário correto.
                </p>
              </div>
            )}
          </div>
          {assinaturaProntuarioPendente && (
            <div
              role="alert"
              className="mx-4 mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900"
            >
              <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Paciente assinou a guia — prontuário pendente</p>
                <p className="mt-1 text-sm text-amber-800">
                  A assinatura foi confirmada para este atendimento. Preencha e salve o prontuário para concluir o registro.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={abrirEditorProntuarioPendente}
                  className="mt-3 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Abrir editor do prontuário
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Painel: Dados do Paciente */}
        {selectedPaciente && dadosPaciente && (
          <div className="border-b">
            <button
              onClick={() => setShowDadosPaciente(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <User className="w-4 h-4 text-blue-600" />
                Dados do Paciente
              </div>
              {showDadosPaciente ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
            {showDadosPaciente && (
              <div className="p-4 bg-slate-50/50 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Nome</div>
                    <div className="font-medium text-gray-800">{(dadosPaciente as any)?.nome || '—'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Data de Nascimento</div>
                    <div className="font-medium text-gray-800">
                      {(dadosPaciente as any)?.dataNascimento
                        ? formatDateBR((dadosPaciente as any).dataNascimento)
                        : '—'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">CPF</div>
                    <div className="font-medium text-gray-800">{(dadosPaciente as any)?.cpf || '—'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Telefone / WhatsApp</div>
                    <div className="font-medium text-gray-800">{(dadosPaciente as any)?.telefone || (dadosPaciente as any)?.whatsapp || '—'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">E-mail</div>
                    <div className="font-medium text-gray-800">{(dadosPaciente as any)?.email || '—'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-gray-500">Endereço</div>
                    <div className="font-medium text-gray-800">
                      {[(dadosPaciente as any)?.endereco, (dadosPaciente as any)?.cidade, (dadosPaciente as any)?.estado].filter(Boolean).join(', ') || '—'}
                    </div>
                  </div>
                </div>
                {(dadosPaciente as any)?.pedidoMedicoUrl && (
                  <div className="col-span-2 md:col-span-3 flex items-center gap-2 pt-1 border-t">
                    <FileCheck className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600">Pedido médico anexado</span>
                    <a href={(dadosPaciente as any).pedidoMedicoUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline ml-1">
                      Visualizar
                    </a>
                    {(dadosPaciente as any)?.dataVencimentoPedido && (
                      <span className="text-xs text-gray-500 ml-2">
                        Vence em: {formatDateBR((dadosPaciente as any).dataVencimentoPedido)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Painel: Contratos Terapêuticos */}
        {selectedPaciente && (
          <div className="border-b">
            <button
              onClick={() => setShowContratos(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <FileCheck className="w-4 h-4 text-green-600" />
                Contratos Terapêuticos
                {(contratosTerapeuticos as any[]).length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-green-200 text-green-800 text-xs">
                    {(contratosTerapeuticos as any[]).length}
                  </span>
                )}
              </div>
              {showContratos ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />}
            </button>
            {showContratos && (
              <div className="p-4 bg-green-50/30">
                {(contratosTerapeuticos as any[]).length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nenhum contrato terapêutico registado para este paciente.</p>
                ) : (
                  <div className="space-y-3">
                    {(contratosTerapeuticos as any[]).map((contrato: any) => (
                      <div key={contrato.id} className="bg-white border border-green-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-800">{contrato.titulo || `Contrato #${contrato.id}`}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Criado em: {contrato.createdAt ? formatDateBR(contrato.createdAt) : '—'}
                            </div>
                            {contrato.descricao && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{contrato.descricao}</p>
                            )}
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                            contrato.status === 'assinado' ? 'bg-green-100 text-green-700' :
                            contrato.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {contrato.status || 'Rascunho'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {selectedPaciente && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start border-b rounded-none px-4 sticky top-0 z-10 bg-white shadow-sm">
              <TabsTrigger value="novo">Novo Atendimento</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="guia-assinada" className="flex items-center gap-1">
                <FileSignature className="w-4 h-4" />
                Guia Assinada
              </TabsTrigger>
              <TabsTrigger value="anexos" className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" />
                Anexos
              </TabsTrigger>
            </TabsList>

            <TabsContent id="editor-prontuario-pendente" value="novo" className="p-6 space-y-6">
              {prontuarioFechadoPorAssinatura ? (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-10 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <FileSignature className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-amber-950">
                    {profissionalPrecisaSelecionarAtendimento ? 'Selecione o atendimento' : 'Prontuário fechado'}
                  </h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-amber-900">
                    {profissionalPrecisaSelecionarAtendimento
                      ? 'Escolha a data e, quando aplicável, o horário do atendimento. O prontuário somente será aberto para uma sessão com assinatura válida.'
                      : 'O paciente ainda não assinou a guia deste atendimento. O preenchimento e a conclusão serão liberados automaticamente após a assinatura válida.'}
                  </p>
                  {!profissionalPrecisaSelecionarAtendimento && (
                    <p className="mt-3 text-sm font-medium text-amber-950">
                      Atendimento: {dataProntuarioEscolhida || normalizeAgendamentoData((agendamento as any)?.data)} às {(agendamento as any)?.hora || '—'}
                    </p>
                  )}
                </div>
              ) : (
                <>
                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <div className="min-w-0 space-y-6">
                    <section className="rounded-xl border border-[#a7ad79] bg-[#f7f8ef] p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#505b2f]">Tipo de registro clínico</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            Escolha antes de preencher. Esta classificação ficará visível no histórico do paciente.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-white p-1.5 shadow-sm">
                          <Button
                            type="button"
                            variant="ghost"
                            aria-pressed={tipoRegistro === 'anamnese'}
                            onClick={() => setTipoRegistro('anamnese')}
                            className={tipoRegistro === 'anamnese'
                              ? 'bg-[#727d42] text-white hover:bg-[#626d37]'
                              : 'text-[#566033] hover:bg-[#edf0dd] hover:text-[#48522a]'}
                          >
                            Anamnese
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            aria-pressed={tipoRegistro === 'continuidade'}
                            onClick={() => setTipoRegistro('continuidade')}
                            className={tipoRegistro === 'continuidade'
                              ? 'bg-[#727d42] text-white hover:bg-[#626d37]'
                              : 'text-[#566033] hover:bg-[#edf0dd] hover:text-[#48522a]'}
                          >
                            Continuidade
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 border-t border-[#d9dfb9] pt-3 text-sm text-[#4c552f]">
                        {tipoRegistro === 'anamnese'
                          ? 'Use para a avaliação inicial e o levantamento clínico do paciente.'
                          : 'Use para registrar a evolução, intervenções e os próximos passos da sessão.'}
                      </p>
                    </section>
              {/* Renderizar prontuário específico baseado no tipo */}
              {tipoProntuario === 'fisioterapia' && <ProntuarioFisioterapia onSave={async (dados) => {
                if (!pacienteIdSelecionado) { toast.error('Selecione um paciente'); return; }
                if (!dataProntuarioEscolhida) { toast.error('Selecione a data do atendimento.'); return; }
                if (agendamentosNaData.length === 0) { toast.error('Nenhum agendamento encontrado nesta data.'); return; }
                if (agendamentosNaData.length > 1 && !selectedAgendamentoId) { toast.error('Selecione o horário do atendimento.'); return; }
                if (!agendamento) { toast.error('Nenhum agendamento encontrado.'); return; }
                const profissionalId = profissionalVinculadoId || (agendamento as any).profissionalId || 1;
                await saveProntuarioMutation.mutateAsync({ pacienteId: pacienteIdSelecionado, profissionalId, atendimentoId: agendamento.id, tipoRegistro, ...dados });
              }} isSaving={saveProntuarioMutation.isPending} />}
              {tipoProntuario === 'psicologia' && <ProntuarioPsicologia tipoRegistro={tipoRegistro} onSave={async (dados) => {
                if (!pacienteIdSelecionado) { toast.error('Selecione um paciente'); return; }
                if (!dataProntuarioEscolhida) { toast.error('Selecione a data do atendimento.'); return; }
                if (agendamentosNaData.length === 0) { toast.error('Nenhum agendamento encontrado nesta data.'); return; }
                if (agendamentosNaData.length > 1 && !selectedAgendamentoId) { toast.error('Selecione o horário do atendimento.'); return; }
                if (!agendamento) { toast.error('Nenhum agendamento encontrado.'); return; }
                const profissionalId = profissionalVinculadoId || (agendamento as any).profissionalId || 1;
                await saveProntuarioMutation.mutateAsync({ pacienteId: pacienteIdSelecionado, profissionalId, atendimentoId: agendamento.id, tipoRegistro, ...dados });
              }} isSaving={saveProntuarioMutation.isPending} />}
              {tipoProntuario === 'fonoaudiologia' && <ProntuarioFonoaudiologia onSave={async (dados) => {
                if (!pacienteIdSelecionado) { toast.error('Selecione um paciente'); return; }
                if (!dataProntuarioEscolhida) { toast.error('Selecione a data do atendimento.'); return; }
                if (agendamentosNaData.length === 0) { toast.error('Nenhum agendamento encontrado nesta data.'); return; }
                if (agendamentosNaData.length > 1 && !selectedAgendamentoId) { toast.error('Selecione o horário do atendimento.'); return; }
                if (!agendamento) { toast.error('Nenhum agendamento encontrado.'); return; }
                const profissionalId = profissionalVinculadoId || (agendamento as any).profissionalId || 1;
                await saveProntuarioMutation.mutateAsync({ pacienteId: pacienteIdSelecionado, profissionalId, atendimentoId: agendamento.id, tipoRegistro, ...dados });
              }} isSaving={saveProntuarioMutation.isPending} />}
              {tipoProntuario === 'nutricao' && <ProntuarioNutricao onSave={async (dados) => {
                if (!pacienteIdSelecionado) { toast.error('Selecione um paciente'); return; }
                if (!dataProntuarioEscolhida) { toast.error('Selecione a data do atendimento.'); return; }
                if (agendamentosNaData.length === 0) { toast.error('Nenhum agendamento encontrado nesta data.'); return; }
                if (agendamentosNaData.length > 1 && !selectedAgendamentoId) { toast.error('Selecione o horário do atendimento.'); return; }
                if (!agendamento) { toast.error('Nenhum agendamento encontrado.'); return; }
                const profissionalId = profissionalVinculadoId || (agendamento as any).profissionalId || 1;
                await saveProntuarioMutation.mutateAsync({ pacienteId: pacienteIdSelecionado, profissionalId, atendimentoId: agendamento.id, tipoRegistro, ...dados });
              }} isSaving={saveProntuarioMutation.isPending} />}
              
              {tipoProntuario === 'medico' && (
                <>
              {/* Identificação do Atendimento */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Identificação do Atendimento
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Data *
                      {agendamento && dataProntuarioEscolhida && (
                        <span className="text-xs text-green-600 font-normal">(vinculada ao atendimento)</span>
                      )}
                    </Label>
                    <Input
                      type="date"
                      value={prontuario.dataAtendimento}
                      onChange={(e) => handleInputChange('dataAtendimento', e.target.value)}
                      readOnly={!!agendamento && !!dataProntuarioEscolhida}
                      className={agendamento && dataProntuarioEscolhida ? 'bg-green-50 border-green-200 cursor-not-allowed' : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Hora *
                      {agendamento && dataProntuarioEscolhida && (
                        <span className="text-xs text-green-600 font-normal">(vinculada)</span>
                      )}
                    </Label>
                    <Input
                      type="time"
                      value={prontuario.horaAtendimento}
                      onChange={(e) => handleInputChange('horaAtendimento', e.target.value)}
                      readOnly={!!agendamento && !!dataProntuarioEscolhida}
                      className={agendamento && dataProntuarioEscolhida ? 'bg-green-50 border-green-200 cursor-not-allowed' : ''}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Profissional</Label>
                    <Select
                      value={prontuario.profissional}
                      onValueChange={(value) => handleInputChange('profissional', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. João Silva">Dr. João Silva - CRM 123456</SelectItem>
                        <SelectItem value="Dra. Maria Santos">Dra. Maria Santos - CRM 234567</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Select
                      value={prontuario.local}
                      onValueChange={(value) => handleInputChange('local', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consultório">Consultório</SelectItem>
                        <SelectItem value="Domicílio">Domicílio</SelectItem>
                        <SelectItem value="Hospital">Hospital</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Anamnese */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Anamnese
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Queixa Principal *</Label>
                    <Textarea
                      placeholder="Descreva a queixa principal do paciente..."
                      value={prontuario.queixaPrincipal}
                      onChange={(e) => handleInputChange('queixaPrincipal', e.target.value)}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>História da Doença Atual *</Label>
                    <Textarea
                      placeholder="Descreva a evolução da doença..."
                      value={prontuario.historiaDoencaAtual}
                      onChange={(e) => handleInputChange('historiaDoencaAtual', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Histórico Patológico Prévio</Label>
                      <Textarea
                        placeholder="Doenças prévias, cirurgias, internações..."
                        value={prontuario.historicoPatologico}
                        onChange={(e) => handleInputChange('historicoPatologico', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Histórico Familiar</Label>
                      <Textarea
                        placeholder="Doenças na família..."
                        value={prontuario.historicoFamiliar}
                        onChange={(e) => handleInputChange('historicoFamiliar', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Medicamentos em Uso</Label>
                      <Textarea
                        placeholder="Liste os medicamentos atuais..."
                        value={prontuario.medicamentosEmUso}
                        onChange={(e) => handleInputChange('medicamentosEmUso', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alergias</Label>
                      <Textarea
                        placeholder="Alergias medicamentosas ou outras..."
                        value={prontuario.alergias}
                        onChange={(e) => handleInputChange('alergias', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exame Físico */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Exame Físico
                </h3>
                <div className="grid grid-cols-6 gap-4">
                  <div className="space-y-2">
                    <Label>PA (mmHg)</Label>
                    <Input
                      placeholder="120/80"
                      value={prontuario.pressaoArterial}
                      onChange={(e) => handleInputChange('pressaoArterial', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>FC (bpm)</Label>
                    <Input
                      placeholder="72"
                      value={prontuario.frequenciaCardiaca}
                      onChange={(e) => handleInputChange('frequenciaCardiaca', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Temp. (°C)</Label>
                    <Input
                      placeholder="36.5"
                      value={prontuario.temperatura}
                      onChange={(e) => handleInputChange('temperatura', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso (kg)</Label>
                    <Input
                      placeholder="70"
                      value={prontuario.peso}
                      onChange={(e) => handleInputChange('peso', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Altura (m)</Label>
                    <Input
                      placeholder="1.75"
                      value={prontuario.altura}
                      onChange={(e) => handleInputChange('altura', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>IMC</Label>
                    <Input
                      value={prontuario.imc}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Exame Físico Geral</Label>
                  <Textarea
                    placeholder="Descreva o estado geral, nível de consciência, hidratação, etc..."
                    value={prontuario.exameGeral}
                    onChange={(e) => handleInputChange('exameGeral', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exame Físico Específico</Label>
                  <Textarea
                    placeholder="Descreva o exame por sistemas (cardiovascular, respiratório, etc)..."
                    value={prontuario.exameEspecifico}
                    onChange={(e) => handleInputChange('exameEspecifico', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Avaliação e Conduta */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Avaliação e Conduta
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hipótese Diagnóstica *</Label>
                    <Textarea
                      placeholder="Diagnóstico clínico..."
                      value={prontuario.hipoteseDiagnostica}
                      onChange={(e) => handleInputChange('hipoteseDiagnostica', e.target.value)}
                      rows={2}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CID-10 *</Label>
                    <Input
                      placeholder="Ex: I10"
                      value={prontuario.cid10}
                      onChange={(e) => handleInputChange('cid10', e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">Digite o código CID-10</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Conduta Terapêutica *</Label>
                  <Textarea
                    placeholder="Plano de tratamento..."
                    value={prontuario.conduta}
                    onChange={(e) => handleInputChange('conduta', e.target.value)}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prescrição Médica</Label>
                  <Textarea
                    placeholder="Medicamentos prescritos com posologia..."
                    value={prontuario.prescricao}
                    onChange={(e) => handleInputChange('prescricao', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Exames Solicitados</Label>
                    <Textarea
                      placeholder="Exames complementares solicitados..."
                      value={prontuario.examesSolicitados}
                      onChange={(e) => handleInputChange('examesSolicitados', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Procedimentos Realizados</Label>
                    <Textarea
                      placeholder="Procedimentos executados na consulta..."
                      value={prontuario.procedimentosRealizados}
                      onChange={(e) => handleInputChange('procedimentosRealizados', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Seguimento */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Seguimento
                </h3>
                <div className="space-y-2">
                  <Label>Orientações ao Paciente</Label>
                  <Textarea
                    placeholder="Orientações, cuidados, sinais de alerta..."
                    value={prontuario.orientacoes}
                    onChange={(e) => handleInputChange('orientacoes', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Retorno</Label>
                    <Input
                      type="date"
                      value={prontuario.dataRetorno}
                      onChange={(e) => handleInputChange('dataRetorno', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Observações Gerais</Label>
                    <Input
                      placeholder="Anotações adicionais..."
                      value={prontuario.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Informativo CFM */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 text-blue-900">
                    <p><strong>Resolução CFM nº 1.638/2002 e CFM nº 1.821/2007</strong></p>
                    <p>Este prontuário atende às normas do Conselho Federal de Medicina para registro de atendimento médico. 
                    Todos os dados são sigilosos e protegidos pelo sigilo médico.</p>
                    <p className="mt-2"><strong>Campos obrigatórios:</strong> Data, Hora, Queixa Principal, História da Doença Atual, 
                    Hipótese Diagnóstica, CID-10 e Conduta.</p>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex justify-between items-center pt-6 border-t">
                <div className="text-sm text-gray-600">
                  * Campos obrigatórios conforme CFM
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSalvar}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Rascunho
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleFinalizar}>
                    Finalizar e Enviar para Faturamento
                  </Button>
                </div>
              </div>
                </>
              )}
                  </div>
                  <HistoricoLateral
                    historico={historicoProntuariosApi as any[]}
                    onVisualizar={setProntuarioVisualizarId}
                  />
                </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="historico" className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3>Histórico de Atendimentos</h3>
                  {pacienteIdSelecionado && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setMostrarFiltro(!mostrarFiltro)}
                        variant="outline"
                        size="sm"
                      >
                        Filtrar por Data
                      </Button>
                      <Button
                        onClick={() => {
                          const dataInicioParsed = dataInicio ? new Date(dataInicio) : undefined;
                          const dataFimParsed = dataFim ? new Date(dataFim) : undefined;
                          exportarPDFMutation.mutate({ 
                            pacienteId: pacienteIdSelecionado,
                            dataInicio: dataInicioParsed,
                            dataFim: dataFimParsed
                          });
                        }}
                        disabled={exportarPDFMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {exportarPDFMutation.isPending ? 'Exportando...' : 'Exportar PDF'}
                      </Button>
                    </div>
                  )}
                </div>
                {mostrarFiltro && pacienteIdSelecionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm">Filtrar por Período</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="dataInicio" className="text-sm">Data Início</Label>
                        <Input
                          id="dataInicio"
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dataFim" className="text-sm">Data Fim</Label>
                        <Input
                          id="dataFim"
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setDataInicio('');
                          setDataFim('');
                          setMostrarFiltro(false);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Limpar Filtro
                      </Button>
                      <Button
                        onClick={() => setMostrarFiltro(false)}
                        size="sm"
                      >
                        Aplicar
                      </Button>
                    </div>
                  </div>
                )}
                {historicoProntuariosApi.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    Nenhum prontuário encontrado para este paciente
                  </div>
                ) : (
                  historicoProntuariosApi.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm text-gray-600">
                            {item.dataAtendimento ? formatDateBR(item.dataAtendimento) : '—'} às {item.horaAtendimento || '—'}
                          </span>
                          {item.tipoAtendimento && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.tipoAtendimento}</span>
                          )}
                          <span className={item.tipoRegistro === 'anamnese'
                            ? 'rounded bg-[#e0e6bb] px-2 py-1 text-xs font-medium text-[#4e592e]'
                            : 'rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600'}
                          >
                            {item.tipoRegistro === 'anamnese' ? 'Anamnese' : 'Continuidade de sessão'}
                          </span>
                          {item.atendimentoStatus && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item.atendimentoStatus}</span>
                          )}
                          {item.statusAtraso && item.statusAtraso !== 'noTempo' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">{item.statusAtraso === 'atrasado' ? 'Em atraso' : item.statusAtraso}</span>
                          )}
                        </div>
                        {item.profissionalNome && (
                          <p className="font-medium mb-1">{item.profissionalNome}</p>
                        )}
                        {item.queixa && (
                          <p className="text-sm text-gray-600 line-clamp-2">{item.queixa}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setProntuarioVisualizarId(item.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        {isMaster && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => setProntuarioExcluirId(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </TabsContent>

            {/* Modal de Confirmação de Exclusão */}
            {prontuarioExcluirId && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setProntuarioExcluirId(null)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Excluir Prontuário</h3>
                      <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-6">Tem certeza que deseja excluir permanentemente este prontuário? Todos os dados registrados serão perdidos.</p>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setProntuarioExcluirId(null)}>Cancelar</Button>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteProntuarioMutation.mutate({ prontuarioId: prontuarioExcluirId })} disabled={deleteProntuarioMutation.isPending}>
                      {deleteProntuarioMutation.isPending ? 'Excluindo...' : 'Sim, excluir'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de Visualização do Prontuário */}
            {prontuarioVisualizarId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setProntuarioVisualizarId(null)}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="font-bold text-gray-900 text-lg">Detalhes do Prontuário</h3>
                    <button onClick={() => setProntuarioVisualizarId(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                      ×
                    </button>
                  </div>
                  {!prontuarioDetalhe ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
                    </div>
                  ) : (
                    <div className="px-6 py-4 space-y-4">
                      {/* Campos preenchidos pelo profissional */}
                      {(prontuarioDetalhe as any).queixa && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Queixa Principal</p>
                          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{(prontuarioDetalhe as any).queixa}</p>
                        </div>
                      )}
                      {(prontuarioDetalhe as any).diagnostico && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Diagnóstico</p>
                          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{(prontuarioDetalhe as any).diagnostico}</p>
                        </div>
                      )}
                      {(prontuarioDetalhe as any).tratamento && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tratamento / Plano Terapêutico</p>
                          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{(prontuarioDetalhe as any).tratamento}</p>
                        </div>
                      )}
                      {(prontuarioDetalhe as any).observacoes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Observações</p>
                          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{(prontuarioDetalhe as any).observacoes}</p>
                        </div>
                      )}
                      {!(prontuarioDetalhe as any).queixa && !(prontuarioDetalhe as any).diagnostico && !(prontuarioDetalhe as any).tratamento && !(prontuarioDetalhe as any).observacoes && (
                        <p className="text-sm text-gray-500 text-center py-6">Nenhum campo preenchido neste prontuário.</p>
                      )}
                    </div>
                  )}
                  <div className="px-6 py-4 border-t flex justify-between items-center">
                    {isMaster && prontuarioVisualizarId && (
                      <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setProntuarioExcluirId(prontuarioVisualizarId)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Prontuário
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setProntuarioVisualizarId(null)}>Fechar</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Aba de Guia Assinada */}
            <TabsContent value="guia-assinada" className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold">Guias Assinadas pelo Paciente</h3>
                  <p className="text-sm text-gray-500">Assinaturas digitais das sessões realizadas — SHA-256 verificado</p>
                </div>
              </div>

              {assinaturasSadt.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma assinatura encontrada para este paciente.</p>
                  <p className="text-xs mt-1">As assinaturas aparecem aqui após o paciente assinar via link enviado pelo WhatsApp.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(assinaturasSadt as any[]).map((ass) => (
                    <div key={ass.id} className={`border rounded-lg p-4 ${
                      ass.status === 'assinado' ? 'border-green-200 bg-green-50' :
                      ass.status === 'expirado' ? 'border-gray-200 bg-gray-50' :
                      ass.status === 'cancelado' ? 'border-red-200 bg-red-50' :
                      'border-yellow-200 bg-yellow-50'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Cabeçalho */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {ass.status === 'assinado' ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                            ) : ass.status === 'expirado' ? (
                              <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                            ) : ass.status === 'cancelado' ? (
                              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                            ) : (
                              <PenLine className="w-5 h-5 text-yellow-500 shrink-0" />
                            )}
                            <span className="font-semibold">
                              {ass.numeroSessao}ª Sessão — {ass.dataSessao ? formatDateBR(ass.dataSessao) : '—'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ass.status === 'assinado' ? 'bg-green-100 text-green-700' :
                              ass.status === 'expirado' ? 'bg-gray-100 text-gray-600' :
                              ass.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {ass.status === 'assinado' ? 'Assinado' :
                               ass.status === 'expirado' ? 'Expirado' :
                               ass.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                            </span>
                          </div>

                          {/* Procedimento */}
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Procedimento:</span> {ass.procedimento}
                          </p>

                          {/* Data da assinatura */}
                          {ass.dataAssinatura && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Assinado em:</span>{' '}
                              {new Date(ass.dataAssinatura).toLocaleString('pt-BR')}
                            </p>
                          )}

                          {/* Motivo de recusa */}
                          {ass.motivoRecusa && (
                            <div className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                              <span className="font-medium text-orange-800">Motivo da recusa:</span>{' '}
                              <span className="text-orange-700">{ass.motivoRecusa}</span>
                            </div>
                          )}

                          {/* Hash SHA-256 */}
                          {ass.assinaturaHash && (
                            <p className="text-xs text-gray-400 font-mono break-all">
                              SHA-256: {ass.assinaturaHash}
                            </p>
                          )}
                        </div>

                        {/* Imagem da assinatura + PDF */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {ass.assinaturaDataUrl && (
                            <div className="border rounded bg-white p-1">
                              <img
                                src={ass.assinaturaDataUrl}
                                alt="Assinatura digital"
                                className="w-32 h-16 object-contain"
                              />
                            </div>
                          )}
                          {ass.pdfUrl && (
                            <a
                              href={ass.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Aba de Anexos */}
            <TabsContent value="anexos" className="p-0">
              <div className="h-[calc(100vh-280px)] overflow-y-auto p-6">
                <AnexosPaciente pacienteId={selectedPaciente ? parseInt(selectedPaciente) : 0} />
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!selectedPaciente && (
          <div className="p-12 text-center text-gray-500">
            Selecione um paciente para iniciar o prontuário eletrônico
          </div>
        )}
      </div>

      <IntegracaoHelp page="prontuario" />
    </div>
  );
}

function HistoricoLateral({
  historico,
  onVisualizar,
}: {
  historico: Array<Record<string, any>>;
  onVisualizar: (id: number) => void;
}) {
  return (
    <aside
      aria-label="Histórico do paciente"
      className="overflow-hidden rounded-xl border border-[#a7ad79] bg-white shadow-sm xl:sticky xl:top-5 xl:max-h-[calc(100vh-2rem)]"
    >
      <div className="border-b border-[#d8dfb8] bg-[#707b42] px-4 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#eef1dc]">Paciente</p>
            <h3 className="mt-1 text-base font-semibold">Histórico de prontuários</h3>
          </div>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">
            {historico.length}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#f7f8eb]">
          Consulte os registros anteriores sem sair do atendimento atual.
        </p>
      </div>

      <div className="max-h-[31rem] space-y-2 overflow-y-auto p-3 xl:max-h-[calc(100vh-12rem)]">
        {historico.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#c9d095] bg-[#fafbf4] p-4 text-sm leading-6 text-slate-600">
            Ainda não há prontuários finalizados para este paciente.
          </div>
        ) : (
          historico.slice(0, 12).map((item) => {
            const eAnamnese = item.tipoRegistro === 'anamnese';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onVisualizar(item.id)}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-[#a7ad79] hover:bg-[#f7f8ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#717b42]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.dataAtendimento ? formatDateBR(item.dataAtendimento) : 'Data não informada'}
                      <span className="font-normal text-slate-500"> · {item.horaAtendimento || '—'}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{item.profissionalNome || 'Profissional não informado'}</p>
                  </div>
                  <span className={eAnamnese
                    ? 'shrink-0 rounded-full bg-[#e0e6bb] px-2 py-0.5 text-[11px] font-semibold text-[#4e592e]'
                    : 'shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600'}
                  >
                    {eAnamnese ? 'Anamnese' : 'Sessão'}
                  </span>
                </div>
                {item.queixa && (
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{item.queixa}</p>
                )}
              </button>
            );
          })
        )}
      </div>
      {historico.length > 12 && (
        <p className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-500">
          Mostrando os 12 registros mais recentes.
        </p>
      )}
    </aside>
  );
}
