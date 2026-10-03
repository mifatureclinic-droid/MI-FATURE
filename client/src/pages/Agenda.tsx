import { resolverEstadoBadgeAssinatura } from "@shared/estadoBadgeAssinatura";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight,
  AlertCircle, MoreVertical, Trash2, Edit3, User, CheckCircle,
  AlertTriangle, FileSignature, MessageCircle, Send, FilePlus,
  Stethoscope, RefreshCw, X, Lock, Search, ChevronDown, Check, Repeat2, Eye, Hourglass, CreditCard
} from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AgendamentoModal } from '../components/AgendamentoModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import {
  format, startOfMonth, endOfMonth,
  startOfWeek, isSameDay, isSameMonth, isToday, getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { trpc } from '../lib/trpc';
import { getHojeBrasilia, formatDateBR, toSafeISODate } from '../lib/utils';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useProntuarioContext } from '../contexts/ProntuarioContext';
import { ClipboardList, Pencil } from 'lucide-react';
import { GuiaSadtAssinaturaModal } from '../components/GuiaSadtAssinaturaModal';
import { AbaPagamentoAtendimento } from '../components/AbaPagamentoAtendimento';
import { permitePagamentoNoBalcao } from '@shared/pagamentoBalcao';
import { criarAtualizacaoReagendamentoIndividual } from '@shared/reagendamentoIndividual';
import { podeExibirAcoesAdministrativas } from '@shared/acoesPorPerfil';
import { criarLinkWhatsAppAgenda } from '@shared/whatsappAgenda';
import { podeUsarWhatsAppNaAgenda } from '@shared/permissoesWhatsappAgenda';
import { mesclarHorariosDaAgenda } from '@shared/horariosAgenda';
import { chaveDataAgenda, horarioAgendaValido, normalizarDataAgenda } from '@shared/dataAgenda';
import { deveInicializarFiltroProfissionais, obterIdsIniciaisDaAgenda, obterIdsParaConsultaDaAgenda, obterIdsVisiveisDaAgenda } from '@shared/filtroProfissionais';
import { encontrarGuiaDaSerie, encontrarGuiaDaSerieAtualizada } from '@shared/reutilizacaoGuiaSerie';
import { CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO, obterGuiaUnicaParaPrefaturamento } from '@shared/navegacaoPrefaturamento';
import { MENSAGEM_ASSINATURA_EM_GUIA_FISICA, convenioUsaAssinaturaEmGuiaFisica } from '@shared/assinaturaGuiaFisica';
import { selecionarGuiaParaAssinatura } from '@shared/guiaAssinaturaAtendimento';
import { TIPOS_ATENDIMENTO_DISPONIVEIS } from '@shared/tiposAtendimento';
import { opcoesDuracaoParaProfissional, profissionalRecebeDuasUnidadesPorHora } from '@shared/duracaoRepasseProfissional';
import { deslocarDataAgenda } from '@shared/navegacaoDataAgenda';
import { deveExibirPendenciaProntuarioNaAgenda } from '@shared/pendenciaProntuarioAgenda';
import { obterDatasVisiveisDaAgenda } from '@shared/filtroDatasAgenda';
import { filtrarPacientesDaAgenda } from '@shared/pacientesAgenda';
import { obterDatasIniciaisDaRecepcaoAgenda } from '@shared/datasIniciaisRecepcaoAgenda';
import { resolverNomePacienteAgenda } from '@shared/nomePacienteAgenda';
import { deveCriarGuiaParaSerie } from '@shared/modoCriacaoGuia';

interface AgendaProps {
  onNavigate?: (page: string) => void;
}

const DIAS_SEMANA_ABREV = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Mini-calendário mensal estilo agenda virtual */
function MiniCalendario({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const firstDay = startOfMonth(viewMonth);
  const lastDay = endOfMonth(viewMonth);
  const startPad = getDay(firstDay); // 0=dom
  const totalDays = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));

  return (
    <div className="select-none">
      {/* Cabeçalho mês */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-100 transition"
          onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        </button>
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
          {format(viewMonth, 'MMMM yyyy', { locale: ptBR })}
        </span>
        <button
          type="button"
          className="p-1 rounded hover:bg-gray-100 transition"
          onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
        >
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 mb-1">
        {DIAS_SEMANA_ABREV.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-gray-400">{d}</div>
        ))}
      </div>

      {/* Células */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const sel = isSameDay(date, selectedDate);
          const today = isToday(date);
          const sameMonth = isSameMonth(date, viewMonth);
          return (
            <button
              type="button"
              key={i}
              onClick={() => onSelectDate(date)}
              className={`
                w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[11px] font-medium transition
                ${sel ? 'bg-teal-500 text-white' : today ? 'border border-teal-400 text-teal-600' : ''}
                ${!sel && sameMonth ? 'hover:bg-gray-100 text-gray-700' : ''}
                ${!sameMonth ? 'text-gray-300' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Agenda({ onNavigate }: AgendaProps) {
  const { data: meData } = trpc.auth.me.useQuery();
  const mePerfil = (meData as any)?.perfil as string | undefined;
  const meRole = (meData as any)?.role as string | undefined;
  const meProfissionalVinculadoId = (meData as any)?.profissionalVinculadoId as number | null | undefined;
  const exibirAcoesAdministrativas = podeExibirAcoesAdministrativas({ perfil: mePerfil, role: meRole, profissionalVinculadoId: meProfissionalVinculadoId });
  const podeUsarWhatsApp = podeUsarWhatsAppNaAgenda({ perfil: mePerfil, role: meRole });

  // Datas independentes por profissional (mapa profissionalId → Date)
  const [selectedDates, setSelectedDates] = useState<Record<number, Date>>({});

  // Data estável de hoje (evita new Date() a cada render que pode causar re-renders infinitos)
  const [today] = useState(() => new Date());
  // Retorna a data seleccionada para um profissional (padrão: hoje)
  const getDateForProf = (profId: number): Date => {
    const selectedDate = selectedDates[profId];
    return selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime()) ? selectedDate : today;
  };

  // Actualiza a data de um profissional específico
  const setDateForProf = (profId: number, date: Date) => {
    if (!Number.isInteger(profId) || !(date instanceof Date) || Number.isNaN(date.getTime())) return;
    setSelectedDates(prev => ({ ...prev, [profId]: date }));
  };

  const navegarDataDoProfissional = (profId: number, deslocamento: number) => {
    setDateForProf(profId, deslocarDataAgenda(getDateForProf(profId), deslocamento));
  };

  // Profissionais seleccionados (até 4 colunas)
  const [selectedProfIds, setSelectedProfIds] = useState<number[]>([]);
  const [limpezaProfissionaisManual, setLimpezaProfissionaisManual] = useState(false);
  const [datasIniciaisDaRecepcaoAplicadas, setDatasIniciaisDaRecepcaoAplicadas] = useState(false);

  // Busca de pacientes
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [showBuscaDropdown, setShowBuscaDropdown] = useState(false);
  const buscaRef = useRef<HTMLDivElement>(null);

  // Busca de profissionais
  const [buscaProfissional, setBuscaProfissional] = useState('');
  const [showProfDropdown, setShowProfDropdown] = useState(false);
  const [activeProfissionalId, setActiveProfissionalId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string; profissionalId?: number } | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);

  // Modais de acções
  const [showReagendar, setShowReagendar] = useState(false);
  const [showMudarProf, setShowMudarProf] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [novaHora, setNovaHora] = useState('');
  const [novoProfissional, setNovoProfissional] = useState('');
  const [showHistorico, setShowHistorico] = useState(false);
  const [atendimentoHistorico, setAtendimentoHistorico] = useState<any>(null);
  const [showGuiaAssinada, setShowGuiaAssinada] = useState(false);
  const [guiaAssinadaSelecionada, setGuiaAssinadaSelecionada] = useState<{
    pacienteId: number;
    guiaId: number;
    profissionalId: number;
  } | null>(null);
  const [showGuiaSadtAssinar, setShowGuiaSadtAssinar] = useState(false);
  const [atendimentoParaAssinar, setAtendimentoParaAssinar] = useState<any>(null);

  // Modal de confirmação de exclusão de série
  const [showDeleteSerieModal, setShowDeleteSerieModal] = useState(false);
  const [deleteSerieAtendimento, setDeleteSerieAtendimento] = useState<any>(null);
  const [deleteSerieCount, setDeleteSerieCount] = useState(0);

  // Modal de confirmação de duração em série
  const [showDuracaoSerieModal, setShowDuracaoSerieModal] = useState(false);
  const [duracaoSerieAtendimento, setDuracaoSerieAtendimento] = useState<any>(null);
  const [duracaoSeriePendente, setDuracaoSeriePendente] = useState<number>(60);
  // Modal Passar em Série
  const [showPassarEmSerie, setShowPassarEmSerie] = useState(false);
  const [serieFrequencia, setSerieFrequencia] = useState<'semanal' | 'quinzenal' | 'mensal'>('semanal');
  const [serieQuantidade, setSerieQuantidade] = useState(4);
  const [serieDataInicio, setSerieDataInicio] = useState(''); // data ISO yyyy-MM-dd escolhida pelo usuário

  // Modal de seleção de datas para link de assinatura
  const [showModalDatasAssinatura, setShowModalDatasAssinatura] = useState(false);
  const [datasAssinaturaSelecionadas, setDatasAssinaturaSelecionadas] = useState<string[]>([]);
  const [atendimentoParaLinkAssinatura, setAtendimentoParaLinkAssinatura] = useState<any>(null);
  const [novaDataAssinatura, setNovaDataAssinatura] = useState('');
  // Pré-visualização da mensagem WhatsApp
  const [etapaModal, setEtapaModal] = useState<'datas' | 'preview'>('datas');
  const [mensagemPreview, setMensagemPreview] = useState('');
  const [showCriarGuia, setShowCriarGuia] = useState(false);
  const [criarGuiaAtendimento, setCriarGuiaAtendimento] = useState<any>(null);
  const [guiaForm, setGuiaForm] = useState({
    numeroGuia: '',
    procedimento: '',
    valor: '',
    dataEmissao: getHojeBrasilia(),
    status: 'rascunho' as const,
    autorizacaoId: '',
  });
  const [vincularGuiaASerie, setVincularGuiaASerie] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filtroSerie, setFiltroSerie] = useState<'todos' | 'serie' | 'avulso'>('todos');
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [editData, setEditData] = useState<{
    tipo: string; descricao: string; convenioId: string; procedimentoConvenioId: string; status: string;
  }>({ tipo: '', descricao: '', convenioId: '', procedimentoConvenioId: '', status: 'agendado' });

  const { setProntuarioTarget } = useProntuarioContext();
  const utils = trpc.useUtils();

  const {
    data: profissionais = [],
    isLoading: carregandoProfissionais,
    isError: erroProfissionais,
    refetch: recarregarProfissionais,
  } = trpc.profissionais.list.useQuery(undefined, {
    retry: 3,
    retryDelay: 700,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });

  const idsProfissionaisParaConsulta = useMemo(
    () => obterIdsParaConsultaDaAgenda({
      perfil: mePerfil,
      idsSelecionados: selectedProfIds,
      profissionalVinculadoId: meProfissionalVinculadoId,
    }),
    [mePerfil, selectedProfIds, meProfissionalVinculadoId],
  );

  const dataSelecionadaMaster = useMemo(() => {
    const profissionalBase = idsProfissionaisParaConsulta[0];
    return profissionalBase ? getDateForProf(profissionalBase) : today;
  }, [selectedDates, idsProfissionaisParaConsulta, today]);

  const setDataParaAgendaMaster = (data: Date) => {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) return;
    const profissionaisAlvo = idsProfissionaisParaConsulta.length > 0
      ? idsProfissionaisParaConsulta
      : obterIdsIniciaisDaAgenda(profissionais as Array<{ id?: unknown }>);

    setSelectedDates((atuais) => ({
      ...atuais,
      ...Object.fromEntries(profissionaisAlvo.map((profissionalId) => [profissionalId, data])),
    }));
  };

  const alterarDataMasterPeloCampo = (valor: string) => {
    if (!valor) return;
    const [ano, mes, dia] = valor.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia, 12);
    if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) return;
    setDataParaAgendaMaster(data);
  };

  const datasVisiveisAgenda = useMemo(
    () => obterDatasVisiveisDaAgenda(selectedDates, idsProfissionaisParaConsulta, today),
    [selectedDates, idsProfissionaisParaConsulta, today],
  );
  const entradaAtendimentosAgenda = useMemo(
    () => ({ datas: datasVisiveisAgenda }),
    [datasVisiveisAgenda],
  );

  const { data: atendimentos = [], refetch: refetchAtendimentos } = trpc.atendimentos.list.useQuery(entradaAtendimentosAgenda, {
    // Carrega a competência inteira das datas mostradas. A Agenda continua
    // exibindo um dia por coluna, mas as trocas de dia no mesmo mês não
    // esvaziam a lista nem provocam uma nova consulta para cada data.
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
  });
  const { data: nomeClinicaData } = trpc.faturamentoTISS.getNomeClinica.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const { data: procedimentosConvenio = [] } = trpc.procedimentos.getProcedimentosPorConvenio.useQuery(
    { convenioId: editData.convenioId ? parseInt(editData.convenioId) : 0 },
    { enabled: !!editData.convenioId }
  );
  // Procedimentos do convênio para o modal de Pré-faturamento
  const { data: procedimentosGuia = [] } = trpc.procedimentos.getProcedimentosPorConvenio.useQuery(
    { convenioId: criarGuiaAtendimento?.convenioId || 0 },
    { enabled: !!criarGuiaAtendimento?.convenioId }
  );
  // A Agenda precisa somente de identificação e contato. Não carregamos o
  // cadastro completo aqui para não bloquear profissionais e atendimentos no
  // mesmo lote HTTP inicial.
  const { data: pacientes = [] } = trpc.pacientes.listParaAgenda.useQuery();
  const { data: liberacoes = [] } = trpc.liberacoes.list.useQuery();
  const { data: guias = [] } = trpc.guias.list.useQuery();
  const parametrosAlertas = useMemo(
    () => ({
      mesReferencia: format(dataSelecionadaMaster, 'yyyy-MM'),
      profissionalIds: idsProfissionaisParaConsulta.length > 0 ? idsProfissionaisParaConsulta : undefined,
    }),
    [dataSelecionadaMaster, idsProfissionaisParaConsulta],
  );
  const { data: alertas = [] } = trpc.alertas.getAtendimentosAtrasados.useQuery(parametrosAlertas);
  const { data: todosHorarios = [] } = trpc.profissionais.getAllHorarios.useQuery();
  const { data: coresAtendimento = [] } = trpc.coresAtendimento.listar.useQuery();

  // Mapa: tipo -> { cor, corTexto }
  const coresMap = useMemo(() => {
    const map: Record<string, { cor: string; corTexto: string }> = {};
    for (const c of coresAtendimento as any[]) {
      map[c.tipo] = { cor: c.cor, corTexto: c.corTexto };
    }
    return map;
  }, [coresAtendimento]);

  // Mapa: profissionalId -> array de horários por dia da semana
  const horariosPorProfissional = useMemo(() => {
    const map: Record<number, Array<{ diaSemana: number; horaInicio: string; horaFim: string; ativo: number }>> = {};
    for (const h of todosHorarios as any[]) {
      if (!map[h.profissionalId]) map[h.profissionalId] = [];
      map[h.profissionalId].push(h);
    }
    return map;
  }, [todosHorarios]);

  // Verifica se um profissional trabalha em determinado dia da semana
  const profTrabalhaNodia = (profId: number, date: Date): boolean => {
    const horarios = horariosPorProfissional[profId];
    if (!horarios || horarios.length === 0) return true; // sem restrição cadastrada
    const diaSemana = date.getDay(); // 0=Dom, 1=Seg...
    return horarios.some(h => h.diaSemana === diaSemana && h.ativo !== 0);
  };

  // Verifica se um slot de horário está dentro de QUALQUER intervalo do expediente do profissional para a data
  const slotDentroDoExpediente = (profId: number, date: Date, slot: string): boolean => {
    const horarios = horariosPorProfissional[profId];
    if (!horarios || horarios.length === 0) return true; // sem restrição
    const diaSemana = date.getDay();
    const intervalos = horarios.filter(h => h.diaSemana === diaSemana && h.ativo !== 0);
    if (intervalos.length === 0) return false;
    // Slot está dentro do expediente se cabe em QUALQUER intervalo do dia
    return intervalos.some(h => slot >= h.horaInicio && slot < h.horaFim);
  };
  const { data: historico = [] } = trpc.historicoAlteracoes.getByAtendimento.useQuery(
    { atendimentoId: atendimentoHistorico?.id || 0 },
    { enabled: showHistorico && !!atendimentoHistorico?.id }
  );

  // Somente uma série persistida representa um conjunto de sessões. Nunca
  // inferir série por horário/dia, pois um novo agendamento é outro conjunto.
  const atendimentosSerieSet = useMemo(() => {
    const serieIds = new Set<number>();
    const atendimentosArr = atendimentos as any[];
    // 1. Atendimentos com serieId: agrupar e marcar todos que têm pelo menos 2 na série
    const porSerieId = new Map<string, number[]>();
    for (const a of atendimentosArr) {
      if (a.serieId) {
        const arr = porSerieId.get(a.serieId) || [];
        arr.push(a.id);
        porSerieId.set(a.serieId, arr);
      }
    }
    Array.from(porSerieId.values()).forEach((ids: number[]) => {
      if (ids.length > 1) ids.forEach((id: number) => serieIds.add(id));
    });
    return serieIds;
  }, [atendimentos]);

  // Calcula índice e total de sessões para cada atendimento em série
  const serieInfoMap = useMemo(() => {
    const map = new Map<number, { indice: number; total: number }>();
    const atendimentosArr = atendimentos as any[];
    
    // 1. Atendimentos com serieId
    const porSerieId = new Map<string, number[]>();
    for (const a of atendimentosArr) {
      if (a.serieId) {
        const arr = porSerieId.get(a.serieId) || [];
        arr.push(a.id);
        porSerieId.set(a.serieId, arr);
      }
    }
    Array.from(porSerieId.values()).forEach((ids: number[]) => {
      if (ids.length > 1) {
        const idsOrdenados = ids.sort((a, b) => {
          const dataA = normalizarDataAgenda(atendimentosArr.find(x => x.id === a)?.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const dataB = normalizarDataAgenda(atendimentosArr.find(x => x.id === b)?.data)?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return dataA - dataB;
        });
        idsOrdenados.forEach((id, idx) => {
          map.set(id, { indice: idx + 1, total: idsOrdenados.length });
        });
      }
    });
    
    return map;
  }, [atendimentos]);

  const { data: guiaAssinadaData, isLoading: loadingGuiaAssinada } = trpc.assinaturasGuias.getGuiaAssinada.useQuery(
    guiaAssinadaSelecionada ?? { pacienteId: 0, guiaId: 0, profissionalId: 0 },
    { enabled: showGuiaAssinada && guiaAssinadaSelecionada !== null }
  );

  // Seleção automática apenas na primeira carga. A seleção não depende da
  // consulta de atendimentos, pois ela própria já usa os profissionais/datas
  // selecionados e poderia manter a Agenda vazia em um ciclo de inicialização.
  useEffect(() => {
    if (!deveInicializarFiltroProfissionais({
      perfil: mePerfil,
      quantidadeProfissionais: profissionais.length,
      quantidadeSelecionados: selectedProfIds.length,
      limpezaManual: limpezaProfissionaisManual,
    })) return;
    setSelectedProfIds(obterIdsIniciaisDaAgenda(profissionais as Array<{ id?: unknown }>));
  }, [profissionais, mePerfil, selectedProfIds.length, limpezaProfissionaisManual]);

  // A recepção precisa abrir diretamente onde há pacientes. Sem esta escolha,
  // uma conta pode cair no dia atual de um profissional sem consultas e parecer
  // que toda a Agenda está vazia.
  useEffect(() => {
    const perfilNormalizado = mePerfil?.trim().toLocaleLowerCase('pt-BR');
    const ehRecepcao = perfilNormalizado === 'recepcao'
      || perfilNormalizado === 'recepção'
      || perfilNormalizado === 'recepcionista';
    if (
      !ehRecepcao
      || datasIniciaisDaRecepcaoAplicadas
      || selectedProfIds.length === 0
      || atendimentos.length === 0
    ) return;

    const datasComPacientes = obterDatasIniciaisDaRecepcaoAgenda(
      selectedProfIds,
      atendimentos as Array<{ profissionalId: number; data: string | Date | null; status?: string | null }>,
      today,
    );
    if (Object.keys(datasComPacientes).length === 0) return;

    setSelectedDates((anteriores) => ({ ...anteriores, ...datasComPacientes }));
    setDatasIniciaisDaRecepcaoAplicadas(true);
  }, [atendimentos, datasIniciaisDaRecepcaoAplicadas, mePerfil, selectedProfIds, today]);

  const horarios = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00', '23:30',
  ];

  // Hora atual para indicador de linha vermelha
  const [horaAtual, setHoraAtual] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setHoraAtual(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calcula se a hora atual está dentro de um slot de 30min
  const isSlotAtual = (horario: string) => {
    const [hSlot, mSlot] = horario.split(':').map(Number);
    const [hAtual, mAtual] = horaAtual.split(':').map(Number);
    const minSlot = hSlot * 60 + mSlot;
    const minAtual = hAtual * 60 + mAtual;
    return minAtual >= minSlot && minAtual < minSlot + 30;
  };

  // Percentual dentro do slot para posicionar a linha vermelha
  const getLinhaPercent = (horario: string) => {
    const [hSlot, mSlot] = horario.split(':').map(Number);
    const [hAtual, mAtual] = horaAtual.split(':').map(Number);
    const minSlot = hSlot * 60 + mSlot;
    const minAtual = hAtual * 60 + mAtual;
    return Math.min(100, Math.max(0, ((minAtual - minSlot) / 30) * 100));
  };

  const abrirWhatsAppDaAgenda = (pacienteId: number) => {
    const paciente = (pacientes as any[]).find((item: any) => item.id === pacienteId);
    const link = criarLinkWhatsAppAgenda(paciente?.whatsapp || paciente?.telefone);
    if (!link) {
      toast.error('Este paciente não possui WhatsApp ou telefone válido cadastrado.');
      return;
    }
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const passarEmSerieMutation = trpc.atendimentos.passarEmSerie.useMutation({
    onSuccess: (data) => {
      toast.success(`Série criada! ${data.criados} atendimentos agendados.`);
      setShowPassarEmSerie(false);
      refetchAtendimentos();
    },
    onError: () => toast.error('Erro ao criar série'),
  });
  const createLiberacao = trpc.liberacoes.create.useMutation();

  const deleteAtendimentoMutation = trpc.atendimentos.delete.useMutation({
    onSuccess: () => { toast.success('Atendimento excluído!'); setShowActionsMenu(null); refetchAtendimentos(); },
    onError: () => toast.error('Erro ao excluir atendimento'),
  });

  const updateAtendimentoMutation = trpc.atendimentos.update.useMutation({
    onSuccess: () => {
      toast.success('Atendimento atualizado!');
      setShowReagendar(false); setShowMudarProf(false); setAtendimentoSelecionado(null);
      refetchAtendimentos();
    },
    onError: () => toast.error('Erro ao atualizar atendimento'),
  });

  const gerarLinkConfirmacaoMutation = trpc.confirmacaoAtendimento.gerarLink.useMutation({
    onSuccess: (data) => {
      const paciente = pacientes.find((p: any) => p.id === atendimentoSelecionado?.pacienteId) as any;
      const whatsapp = paciente?.whatsapp?.replace(/\D/g, '');
      const nome = paciente?.nome || 'Paciente';
      const dataAtend = atendimentoSelecionado?.data ? formatDateBR(atendimentoSelecionado.data) : '';
      const hora = atendimentoSelecionado?.hora || '';
      const mensagem = `Olá ${nome}! 😊\n\nLembramos que você tem uma consulta marcada para *${dataAtend}* às *${hora}*.\n\nPor favor, confirme a sua presença clicando no link abaixo:\n${data.url}\n\nCaso não possa comparecer, clique em "Não poderei comparecer" no link acima.\n\nAtenciosamente,\nClínica MIFATURE`;
      if (whatsapp) {
        window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank');
      } else {
        navigator.clipboard.writeText(data.url).catch(() => {});
        toast.success('Link copiado! (Paciente sem WhatsApp cadastrado)');
      }
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao gerar link'),
  });

  const gerarLinkAssinaturaGuiaMutation = trpc.assinaturaGuiaWhatsApp.gerarLink.useMutation({
    onSuccess: (data) => {
      const paciente = (pacientes as any[]).find((p: any) => p.id === atendimentoParaLinkAssinatura?.pacienteId) as any;
      const whatsapp = paciente?.whatsapp?.replace(/\D/g, '');
      // Usar mensagem personalizada se disponivel, substituindo o placeholder pelo link real
      const mensagemFinal = mensagemPreview
        ? mensagemPreview.replace('[link será gerado automaticamente]', data.url)
        : `Olá ${paciente?.nome || 'Paciente'}!\n\nAcesse o link abaixo para assinar as suas sessões:\n${data.url}\n\nObrigado!`;
      if (whatsapp) {
        window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagemFinal)}`, '_blank');
      } else {
        navigator.clipboard.writeText(data.url).catch(() => {});
        toast.success('Link copiado! (Paciente sem WhatsApp cadastrado)');
      }
      setDatasAssinaturaSelecionadas([]);
      setMensagemPreview('');
      // Recarrega os atendimentos para obter o status da sessão criada.
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao gerar link'),
  });

  const updateDuracaoMutation = trpc.atendimentos.updateDuracao.useMutation({
    onSuccess: () => {
      toast.success('Duração atualizada!');
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao atualizar duração'),
  });

  const updateDuracaoSerieMutation = trpc.atendimentos.updateDuracaoSerie.useMutation({
    onSuccess: (data) => {
      toast.success(`Duração atualizada em toda a série! (${data.atualizados} atendimentos)`);
      setShowDuracaoSerieModal(false);
      setDuracaoSerieAtendimento(null);
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao atualizar duração da série'),
  });

  const countSerieDuracao = trpc.atendimentos.countSerie.useQuery(
    { id: duracaoSerieAtendimento?.id ?? 0 },
    { enabled: showDuracaoSerieModal && !!duracaoSerieAtendimento, refetchOnWindowFocus: false }
  );

  const deleteSerieCompletaMutation = trpc.atendimentos.deleteSerieCompleta.useMutation({
    onSuccess: () => {
      toast.success('Série completa excluída!');
      setShowDeleteSerieModal(false);
      setDeleteSerieAtendimento(null);
      refetchAtendimentos();
    },
    onError: () => toast.error('Erro ao excluir série completa'),
  });
  const deleteSerieAtendimentoMutation = trpc.atendimentos.deleteSerie.useMutation({
    onSuccess: () => {
      toast.success('Série excluída com sucesso!');
      setShowDeleteSerieModal(false);
      setDeleteSerieAtendimento(null);
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao excluir série'),
  });

  const countSerieQuery = trpc.atendimentos.countSerie.useQuery(
    { id: deleteSerieAtendimento?.id ?? 0 },
    { enabled: !!deleteSerieAtendimento, refetchOnWindowFocus: false }
  );

  const reagendarSerieMutation = trpc.atendimentos.reagendarSerie.useMutation({
    onSuccess: (data) => {
      toast.success(`Série reagendada! ${data.atualizados} atendimentos atualizados.`);
      setShowReagendar(false);
      setAtendimentoSelecionado(null);
      setNovaData('');
      setNovaHora('');
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao reagendar série'),
  });

  const mudarProfissionalSerieMutation = trpc.atendimentos.mudarProfissionalSerie.useMutation({
    onSuccess: () => {
      toast.success('Profissional alterado em toda a série!');
      setShowMudarProf(false);
      setAtendimentoSelecionado(null);
      setNovoProfissional('');
      refetchAtendimentos();
    },
    onError: (e) => toast.error(e.message || 'Erro ao mudar profissional na série'),
  });

  const countSerieReagendar = trpc.atendimentos.countSerie.useQuery(
    { id: atendimentoSelecionado?.id ?? 0 },
    { enabled: showReagendar && !!atendimentoSelecionado, refetchOnWindowFocus: false }
  );

  const countSerieProfissional = trpc.atendimentos.countSerie.useQuery(
    { id: atendimentoSelecionado?.id ?? 0 },
    { enabled: showMudarProf && !!atendimentoSelecionado, refetchOnWindowFocus: false }
  );

  const abrirGuiaCriadaNoPrefaturamento = (guiaId: number | null) => {
    if (guiaId == null || typeof window === 'undefined') return;
    window.sessionStorage.setItem(CHAVE_GUIA_PREFATURAMENTO_DIRECIONADO, String(guiaId));
    onNavigate?.('guias');
  };

  const createGuiaMutation = trpc.guias.create.useMutation({
    onSuccess: async (resultado) => {
      toast.success(resultado.reutilizada ? 'Guia SADT existente localizada. Abrindo o pré-faturamento.' : 'Guia SADT criada! Abrindo o pré-faturamento.');
      setShowCriarGuia(false); setCriarGuiaAtendimento(null);
      setVincularGuiaASerie(false);
      setGuiaForm({ numeroGuia: '', procedimento: '', valor: '', dataEmissao: getHojeBrasilia(), status: 'rascunho', autorizacaoId: '' });
      await Promise.all([refetchAtendimentos(), utils.guias.list.invalidate()]);
      abrirGuiaCriadaNoPrefaturamento(resultado.guiaId ?? null);
    },
    onError: (e) => toast.error(e.message || 'Erro ao criar guia'),
  });

  const criarGuiasPorSerieMutation = trpc.guias.criarGuiasPorSerie.useMutation({
    onSuccess: async (result) => {
      if (result.guiasCriadas.length > 0) {
        toast.success(`${result.guiasCriadas.length} guia(s) criada(s) para a série!`);
      }
      if (result.guiasReutilizadas.length > 0) {
        toast.success(`${result.guiasReutilizadas.length} guia(s) existente(s) reutilizada(s) e vinculada(s) à série!`);
      }
      if (result.erros.length > 0) {
        result.erros.forEach((e: string) => toast.warning(e));
      }
      setShowCriarGuia(false); setCriarGuiaAtendimento(null);
      setVincularGuiaASerie(false);
      setGuiaForm({ numeroGuia: '', procedimento: '', valor: '', dataEmissao: getHojeBrasilia(), status: 'rascunho', autorizacaoId: '' });
      await Promise.all([refetchAtendimentos(), utils.guias.list.invalidate()]);
      abrirGuiaCriadaNoPrefaturamento(obterGuiaUnicaParaPrefaturamento([
        result.guiasCriadas,
        result.guiasReutilizadas,
      ]));
    },
    onError: (e) => toast.error(e.message || 'Erro ao criar guias por série'),
  });

  // Helpers
  const getProfissionalNome = (id: number) => profissionais.find((p: any) => p.id === id)?.nome || 'N/A';
  const getPacienteNome = (id: number, pacienteNome?: string | null) => resolverNomePacienteAgenda({
    pacienteId: id,
    pacienteNome,
    pacientes: pacientes as any[],
  });
  const getConvenioNome = (id: number) => (convenios as any[]).find((c: any) => c.id === id)?.nome || '';
  const opcoesDuracaoAtendimentoSelecionado = opcoesDuracaoParaProfissional(getProfissionalNome(atendimentoSelecionado?.profissionalId));

  const getAtendimentoParaSlot = (profId: number, horario: string) => {
    const dataStr = format(getDateForProf(profId), 'yyyy-MM-dd');
    return (atendimentos as any[]).filter(a => {
      const aDataStr = chaveDataAgenda(a.data);
      if (!aDataStr || !horarioAgendaValido(a.hora) || aDataStr !== dataStr || a.profissionalId !== profId) return false;
      // Preservar o horário real do atendimento como início do cartão.
      if (a.hora === horario) return true;
      const duracao = a.duracao || 30;
      const [aH, aM] = a.hora.slice(0, 5).split(':').map(Number);
      const [sH, sM] = horario.split(':').map(Number);
      const inicioMin = aH * 60 + aM;
      const slotMin = sH * 60 + sM;
      return slotMin > inicioMin && slotMin < inicioMin + duracao;
    });
  };

  // Retorna style inline com cor personalizada por tipo (se configurada)
  // Status falta/cancelado/reagendado SEMPRE têm prioridade sobre a cor do tipo
  const getCardStyle = (tipo: string | null | undefined, status: string, isReagendado?: boolean): React.CSSProperties => {
    // Status especiais têm prioridade absoluta — não aplicar cor do tipo
    if (isReagendado || status === 'falta' || status === 'cancelado') return {};
    // Status realizado=verde e agendado=azul sempre têm prioridade sobre a cor do tipo
    if (status === 'realizado') return { backgroundColor: '#f0fdf4', borderLeftColor: '#22c55e' };
    if (status === 'agendado') return { backgroundColor: '#eff6ff', borderLeftColor: '#3b82f6' };
    if (tipo && coresMap[tipo]) {
      const { cor, corTexto } = coresMap[tipo];
      return { backgroundColor: cor + '22', borderLeftColor: cor, color: corTexto === '#ffffff' ? undefined : corTexto };
    }
    return {};
  };

  const getStatusColor = (status: string, isReagendado?: boolean) => {
    if (isReagendado) return 'bg-orange-100 border-l-4 border-orange-400 text-orange-800';
    switch (status) {
      case 'agendado': return 'bg-blue-50 border-l-4 border-blue-500 text-blue-900';
      case 'realizado': return 'bg-green-50 border-l-4 border-green-500 text-green-900';
      case 'cancelado': return 'bg-purple-50 border-l-4 border-purple-400 text-purple-900';
      case 'falta': return 'bg-red-50 border-l-4 border-red-500 text-red-900';
      default: return 'bg-gray-50 border-l-4 border-gray-300 text-gray-700';
    }
  };

  const getStatusLabel = (status: string, isReagendado?: boolean) => {
    if (isReagendado) return 'Reagendou';
    switch (status) {
      case 'agendado': return 'Aguardando';
      case 'realizado': return 'Atendido';
      case 'cancelado': return 'Cancelado';
      case 'falta': return 'Faltou';
      default: return status;
    }
  };

  const getAtendimentoLabel = (a: any) => ({
    foiReagendado: a.reagendadoPara !== null && a.reagendadoPara !== undefined,
    ehReagendamento: a.atendimentoAnteriorId !== null && a.atendimentoAnteriorId !== undefined,
  });

  const isProntuarioAtrasado = (a: any) => {
    if (!a.dataLimiteProntuario) return false;
    return new Date() > new Date(a.dataLimiteProntuario) && !a.liberadoPorMaster;
  };

  const handleSlotClick = (profId: number, horario: string) => {
    const atends = getAtendimentoParaSlot(profId, horario);
    if (atends.length === 0) {
      if (mePerfil === 'profissional') return;
      const profDate = getDateForProf(profId);
      setSelectedSlot({ date: profDate, time: horario, profissionalId: profId });
      setIsModalOpen(true);
    }
  };

  const toggleProfissional = (id: number) => {
    if (mePerfil === 'profissional') return;
    const estavaSelecionado = selectedProfIds.includes(id);
    const proximaQuantidade = estavaSelecionado ? selectedProfIds.length - 1 : selectedProfIds.length + 1;
    if (!estavaSelecionado && selectedProfIds.length >= 4) {
      toast.error('Você pode visualizar até 4 profissionais por vez');
      return;
    }
    setLimpezaProfissionaisManual(proximaQuantidade === 0);
    setSelectedProfIds(prev => estavaSelecionado ? prev.filter(p => p !== id) : [...prev, id]);
    setActiveProfissionalId(id);
    // Não fecha o dropdown — usuário pode continuar selecionando
  };

  const limparSelecaoProfissionais = () => {
    setSelectedProfIds([]);
    setActiveProfissionalId(null);
    setBuscaProfissional('');
    setShowProfDropdown(false);
    setLimpezaProfissionaisManual(true);
  };

  // Filtro de pacientes para busca
  const pacientesFiltrados = useMemo(() => {
    return filtrarPacientesDaAgenda(pacientes as any[], buscaPaciente);
  }, [buscaPaciente, pacientes]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (buscaRef.current && !buscaRef.current.contains(e.target as Node)) {
        setShowBuscaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navegar para data do próximo agendamento do paciente
  const handleSelecionarPacienteBusca = (paciente: any) => {
    setBuscaPaciente(paciente.nome);
    setShowBuscaDropdown(false);
    // Encontrar próximo atendimento do paciente
    const hoje = new Date();
    const atendsPaciente = (atendimentos as any[])
      .filter((a: any) => a.pacienteId === paciente.id)
      .map((a: any) => ({ ...a, dataObj: normalizarDataAgenda(a.data) }))
      .filter((a: any) => a.dataObj && Number.isInteger(a.profissionalId))
      .sort((a: any, b: any) => a.dataObj - b.dataObj);
    const proximo = atendsPaciente.find((a: any) => a.dataObj >= hoje) || atendsPaciente[atendsPaciente.length - 1];
    if (proximo) {
      // Actualizar a data do profissional correspondente
      setDateForProf(proximo.profissionalId, proximo.dataObj);
      // Seleccionar o profissional do atendimento se não estiver visível
      if (!selectedProfIds.includes(proximo.profissionalId)) {
        setSelectedProfIds(prev => {
          if (prev.length >= 4) return [proximo.profissionalId];
          return [...prev.filter(id => id !== proximo.profissionalId), proximo.profissionalId];
        });
      }
    }
  };

  // Dados do profissional vinculado (para saudação)
  const meuProfissionalData = useMemo(() => {
    if (mePerfil !== 'profissional' || !meProfissionalVinculadoId) return null;
    return (profissionais as any[]).find((p: any) => p.id === meProfissionalVinculadoId) || null;
  }, [profissionais, mePerfil, meProfissionalVinculadoId]);

  // Total de atendimentos de hoje para o profissional vinculado
  const totalAtendimentosHoje = useMemo(() => {
    if (mePerfil !== 'profissional' || !meProfissionalVinculadoId) return 0;
    const hojeStr = format(today, 'yyyy-MM-dd');
    return (atendimentos as any[]).filter((a: any) => {
      if (a.profissionalId !== meProfissionalVinculadoId) return false;
      if (a.status === 'cancelado') return false;
      const dataStr = chaveDataAgenda(a.data);
      return dataStr === hojeStr;
    }).length;
  }, [atendimentos, mePerfil, meProfissionalVinculadoId, today]);

  // Saudação baseada no horário
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // Profissionais a exibir nas colunas
  const profissionaisExibidos = useMemo(() => {
    if (mePerfil === 'profissional' && meProfissionalVinculadoId) {
      return profissionais.filter((p: any) => p.id === meProfissionalVinculadoId);
    }
    const idsVisiveis = obterIdsVisiveisDaAgenda(
      profissionais as Array<{ id?: unknown }>,
      selectedProfIds,
      limpezaProfissionaisManual,
    );
    return profissionais.filter((p: any) => idsVisiveis.includes(p.id));
  }, [profissionais, selectedProfIds, limpezaProfissionaisManual, mePerfil, meProfissionalVinculadoId]);

  const horariosExibidos = useMemo(() => {
    const slotsComAtendimento = (atendimentos as any[])
      .filter((atendimento: any) => {
        // Cancelados continuam visíveis na Agenda para preservar o histórico
        // do horário; apenas registros com horário inválido ficam fora da grade.
        if (!horarioAgendaValido(atendimento.hora)) return false;
        return profissionaisExibidos.some((profissional: any) => {
          if (profissional.id !== atendimento.profissionalId) return false;
          const dataDoAtendimento = chaveDataAgenda(atendimento.data);
          return dataDoAtendimento === format(getDateForProf(profissional.id), 'yyyy-MM-dd');
        });
      })
      .map((atendimento: any) => atendimento.hora);

    return mesclarHorariosDaAgenda(horarios, slotsComAtendimento);
  }, [atendimentos, profissionaisExibidos, selectedDates, today]);

  // dayName/dateLabel agora são calculados por coluna — mantemos helper genérico
  const getDayName = (date: Date) => format(date, 'EEEE', { locale: ptBR });

  return (
    <>
    <div className="flex flex-col h-full bg-gray-50 min-h-screen w-full">
      {/* Alertas de Prontuários Atrasados - Apenas para Profissional e Master */}
      {alertas.length > 0 && (mePerfil === 'profissional' || mePerfil === 'master') && (
        <div className="mx-4 mt-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Você tem <strong>{alertas.length}</strong> prontuário(s) fora do prazo de 72 horas.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Saudação personalizada para profissional */}
      {mePerfil === 'profissional' && meuProfissionalData && (
        <div className="mx-4 mt-4 px-5 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-700 font-bold text-sm">
                {(meuProfissionalData.nome || '').charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-teal-900 text-sm">
                {saudacao}, {meuProfissionalData.nome}!
              </p>
              <p className="text-xs text-teal-700">
                {totalAtendimentosHoje === 1
                  ? 'Você tem 1 atendimento hoje.'
                  : totalAtendimentosHoje > 1
                  ? `Você tem ${totalAtendimentosHoje} atendimentos hoje.`
                  : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-teal-600 font-medium">{format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>
      )}

      {/* Barra superior — linha única horizontal, fixa ao topo durante scroll */}
      <div className="items-center bg-white border-b shadow-sm w-full sticky top-0 z-30" style={{display:'flex', flexWrap:'nowrap', gap:'12px', padding:'8px 16px', minHeight:'52px', minWidth:'100%', boxSizing:'border-box', justifyContent: 'space-between'}}>
        {/* Título e Seletor de Profissionais */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <CalendarIcon className="w-5 h-5 text-teal-600" />
          <span className="font-bold text-gray-800 text-base whitespace-nowrap">Agenda Médica</span>
          
          {/* Dropdown de profissionais no header */}
          {mePerfil !== 'profissional' && (
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowProfDropdown(!showProfDropdown)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition text-sm font-medium whitespace-nowrap ${
                    selectedProfIds.length > 0
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                <span>Profissional</span>
                <span className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${
                  selectedProfIds.length > 0 ? 'bg-white text-teal-700' : 'bg-gray-600 text-white'
                }`}>
                  {selectedProfIds.length}
                </span>
                <ChevronDown className="w-4 h-4" />
                </button>
                {showProfDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <input
                      type="text"
                      placeholder="Buscar profissional..."
                      value={buscaProfissional}
                      onChange={e => setBuscaProfissional(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-400"
                    />
                  </div>
                  {/* Botões de atalho */}
                  <div className="flex gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
                    <button
                      onClick={limparSelecaoProfissionais}
                      className="flex-1 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded px-2 py-1.5 transition flex items-center justify-center gap-1"
                    >
                      <X className="w-3 h-3" /> Limpar seleção
                    </button>
                    <button
                      onClick={() => {
                        setLimpezaProfissionaisManual(false);
                        setSelectedProfIds(obterIdsIniciaisDaAgenda(profissionais as Array<{ id?: unknown }>));
                      }}
                      className="flex-1 text-xs font-medium text-teal-700 bg-white hover:bg-teal-50 border border-teal-200 rounded px-2 py-1.5 transition"
                    >
                      Selecionar 4
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {profissionais
                      .filter((p: any) => p.nome.toLowerCase().includes(buscaProfissional.toLowerCase()) || (p.especialidade?.toLowerCase().includes(buscaProfissional.toLowerCase())))
                      .map((prof: any) => (
                        <button
                          key={prof.id}
                          onClick={() => toggleProfissional(prof.id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition flex items-center gap-3 ${
                            selectedProfIds.includes(prof.id)
                              ? 'bg-teal-50 hover:bg-teal-100'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProfIds.includes(prof.id)
                              ? 'bg-teal-600 border-teal-600'
                              : 'border-gray-300'
                          }`}>
                            {selectedProfIds.includes(prof.id) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm text-gray-800">{prof.nome}</div>
                            {prof.especialidade && (
                              <div className="text-xs text-gray-500">{prof.especialidade}</div>
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              </div>
              {selectedProfIds.length > 0 && (
                <button
                  onClick={limparSelecaoProfissionais}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition"
                  title="Limpar seleção"
                  aria-label="Limpar seleção de profissionais"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

        </div>

        {/* Botão Nova Consulta — sempre visível no lado direito */}
        {mePerfil !== 'profissional' && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex-shrink-0 bg-teal-600 hover:bg-teal-700 text-white text-sm h-8 px-3 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova Consulta
          </Button>
        )}
      </div>

      {/* Corpo principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Área da agenda */}
        <div className="flex-1 overflow-auto">
          {carregandoProfissionais ? (
            <div className="flex h-full items-center justify-center text-gray-500" role="status" aria-live="polite">
              <div className="text-center">
                <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-teal-600" />
                <p className="text-sm font-medium">Carregando profissionais e pacientes…</p>
              </div>
            </div>
          ) : profissionaisExibidos.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                <p className="text-lg font-medium text-gray-400">
                  {erroProfissionais ? 'Não foi possível carregar os profissionais' : 'Nenhum profissional selecionado'}
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  {erroProfissionais ? 'Verifique a conexão e tente novamente.' : 'Selecione até 4 profissionais na barra superior'}
                </p>
                {erroProfissionais && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 border-teal-300 text-teal-800 hover:bg-teal-50"
                    onClick={() => recarregarProfissionais()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar novamente
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="min-w-max">
              {/* Filtro de assinatura */}
              {/* Cabeçalho das colunas */}
              <div
                className="grid sticky top-0 z-10 bg-white border-b shadow-sm"
                style={{ gridTemplateColumns: `80px repeat(${profissionaisExibidos.length}, minmax(220px, 1fr))` }}
              >
                {/* Célula vazia (horário) */}
                <div className="p-3 border-r bg-gray-50" />
                {/* Cabeçalho de cada profissional com mini-calendário independente */}
                {profissionaisExibidos.map((prof: any) => {
                  const profDate = getDateForProf(prof.id);
                  const atendsDia = (atendimentos as any[]).filter(a => {
                    // Usar getUTC* para datas vindas do MySQL (UTC meia-noite)
                    let aDataStr: string;
                    if (typeof a.data === 'string') {
                      aDataStr = a.data.slice(0, 10);
                    } else if (a.data instanceof Date) {
                      const y = a.data.getUTCFullYear();
                      const m = String(a.data.getUTCMonth() + 1).padStart(2, '0');
                      const d = String(a.data.getUTCDate()).padStart(2, '0');
                      aDataStr = `${y}-${m}-${d}`;
                    } else {
                      aDataStr = String(a.data).slice(0, 10);
                    }
                    return aDataStr === format(profDate, 'yyyy-MM-dd') && a.profissionalId === prof.id;
                  });
                  // Calcular slots vagos e ocupados dentro do expediente do profissional
                  const slotsExpediente = horarios.filter(h => slotDentroDoExpediente(prof.id, profDate, h));
                  // Um slot é ocupado se tiver pelo menos um atendimento com hora === slot (slot de início)
                  const slotsOcupados = slotsExpediente.filter(h =>
                    (atendimentos as any[]).some(a => {
                      let aDataStr: string;
                      if (typeof a.data === 'string') { aDataStr = a.data.slice(0, 10); }
                      else if (a.data instanceof Date) {
                        aDataStr = `${a.data.getUTCFullYear()}-${String(a.data.getUTCMonth()+1).padStart(2,'0')}-${String(a.data.getUTCDate()).padStart(2,'0')}`;
                      } else { aDataStr = String(a.data).slice(0, 10); }
                      return aDataStr === format(profDate, 'yyyy-MM-dd') && a.profissionalId === prof.id && a.hora === h;
                    })
                  ).length;
                  const slotsVagos = slotsExpediente.length - slotsOcupados;
                  const isActive = activeProfissionalId === prof.id;
                  const profTrabalha = profTrabalhaNodia(prof.id, profDate);
                  return (
                    <div key={prof.id} className={`border-r last:border-r-0 transition-colors ${isActive ? 'bg-blue-50' : profTrabalha ? 'bg-white' : 'bg-gray-50'}`} style={{minWidth: 220}}>
                      {/* Nome e especialidade */}
                      <div className={`px-4 pt-3 pb-2 border-b transition-colors ${isActive ? 'border-blue-200 bg-blue-50' : profTrabalha ? 'border-gray-100 bg-white' : 'border-gray-200 bg-gray-50'} text-center`}>
                        {isActive && <div className="text-xs font-semibold text-blue-600 mb-1">● ATIVO</div>}
                        {!profTrabalha && (
                          <div className="text-[10px] font-semibold text-red-400 mb-1 flex items-center justify-center gap-1">
                            <Lock className="w-3 h-3" /> Não atende neste dia
                          </div>
                        )}
                        <div className="font-bold text-[#3d5a3e] text-sm truncate">{prof.nome}</div>
                        {prof.especialidade && (
                          <div className="text-xs text-gray-400 truncate">{prof.especialidade}</div>
                        )}
                        <div className="mt-1 flex items-center justify-center gap-2">
                          <span className="text-xs font-medium" style={{color:'#b5933a'}}>
                            {atendsDia.length} consulta{atendsDia.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">{getDayName(profDate)}</span>
                        </div>
                        {/* Indicador de vagos/ocupados */}
                        {slotsExpediente.length > 0 && (
                          <div className="mt-1.5 flex items-center justify-center gap-2 text-[10px] font-medium">
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
                              {slotsVagos} vago{slotsVagos !== 1 ? 's' : ''}
                            </span>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
                              {slotsOcupados} ocupado{slotsOcupados !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {/* Data seleccionada para este profissional */}
                        <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                          <button
                            type="button"
                            aria-label={`Ver data anterior de ${prof.nome}`}
                            title="Data anterior"
                            className="rounded p-0.5 text-teal-700 hover:bg-teal-50 hover:text-teal-900"
                            onClick={() => navegarDataDoProfissional(prof.id, -1)}
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <span className="capitalize">{format(profDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                          <button
                            type="button"
                            aria-label={`Ver próxima data de ${prof.nome}`}
                            title="Próxima data"
                            className="rounded p-0.5 text-teal-700 hover:bg-teal-50 hover:text-teal-900"
                            onClick={() => navegarDataDoProfissional(prof.id, 1)}
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {/* Botão Hoje por coluna */}
                        {!isToday(profDate) && (
                          <button
                            type="button"
                            className="mt-1 text-[10px] text-teal-600 hover:underline font-medium flex items-center gap-0.5 mx-auto"
                            onClick={() => setDateForProf(prof.id, new Date())}
                          >
                            <RefreshCw className="w-2.5 h-2.5" /> Hoje
                          </button>
                        )}
                      </div>
                      {/* Mini-calendário independente por coluna */}
                      <div className="px-4 py-3">
                        <MiniCalendario
                          selectedDate={profDate}
                          onSelectDate={(d) => setDateForProf(prof.id, d)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Grade de horários - todos os slots do expediente + hora atual */}
              {horariosExibidos.filter((horario) => {
                // Sempre mostrar o slot da hora atual
                if (isSlotAtual(horario)) return true;
                // Mostrar se houver atendimento em algum profissional neste slot
                if (profissionaisExibidos.some((prof: any) => getAtendimentoParaSlot(prof.id, horario).length > 0)) return true;
                // Mostrar se o slot está dentro do expediente de pelo menos um profissional exibido
                return profissionaisExibidos.some((prof: any) => slotDentroDoExpediente(prof.id, getDateForProf(prof.id), horario));
              }).map((horario) => {
                const slotAtual = isSlotAtual(horario);
                const linhaPercent = slotAtual ? getLinhaPercent(horario) : null;
                return (
                <div
                  key={horario}
                  className={`grid border-b transition-colors relative ${slotAtual ? 'bg-red-50/20' : 'hover:bg-gray-50/50'}`}
                  style={{ gridTemplateColumns: `80px repeat(${profissionaisExibidos.length}, minmax(220px, 1fr))`, minHeight: '72px' }}
                >
                  {/* Linha vermelha da hora atual atravessando todas as colunas */}
                  {slotAtual && linhaPercent !== null && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${linhaPercent}%` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 ml-[72px] flex-shrink-0" />
                        <div className="flex-1 h-[2px] bg-red-400 opacity-70" />
                      </div>
                    </div>
                  )}
                  {/* Coluna de horário */}
                  <div className={`p-2 border-r flex items-start justify-end pr-3 pt-3 ${slotAtual ? 'bg-red-50' : 'bg-white'}`}>
                    <div className="text-right">
                      <span className={`text-xs font-bold ${slotAtual ? 'text-red-600' : 'text-gray-600'}`}>{horario}</span>
                      {slotAtual && <div className="text-[9px] text-red-400 font-medium">agora</div>}
                    </div>
                  </div>

                  {/* Células por profissional */}
                  {profissionaisExibidos.map((prof: any) => {
                    const profDate = getDateForProf(prof.id);
                    const dentroExpediente = slotDentroDoExpediente(prof.id, profDate, horario);
                    const atends = getAtendimentoParaSlot(prof.id, horario);
                    const isEmpty = atends.length === 0;

                    // Slot fora do expediente — mostrar como bloqueado
                    if (!dentroExpediente) {
                      return (
                        <div
                          key={prof.id}
                          className="border-r last:border-r-0 min-h-[64px] p-1 relative bg-gray-50/80"
                        >
                          <div className="h-full min-h-[56px] flex items-center justify-center">
                            <span className="text-[10px] text-gray-300 select-none">—</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={prof.id}
                        className={`border-r last:border-r-0 min-h-[64px] p-1 relative transition-colors
                          ${isEmpty && mePerfil !== 'profissional'
                            ? 'bg-emerald-50/60 hover:bg-emerald-100/70 cursor-pointer group'
                            : isEmpty ? 'bg-emerald-50/30' : ''}`}
                        onClick={() => isEmpty && mePerfil !== 'profissional' && handleSlotClick(prof.id, horario)}
                      >
                        {isEmpty ? (
                          /* Slot vago — fundo verde claro + indicador + botão ao hover */
                          mePerfil !== 'profissional' ? (
                            <div className="h-full min-h-[56px] flex flex-col items-center justify-center gap-1">
                              {/* Indicador fixo de vago */}
                              <span className="text-[10px] text-emerald-400 font-medium select-none group-hover:hidden">Vago</span>
                              {/* Botão de agendar ao hover */}
                              <button
                                className="hidden group-hover:flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all"
                                onClick={(e) => { e.stopPropagation(); handleSlotClick(prof.id, horario); }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Agendar
                              </button>
                            </div>
                          ) : null
                        ) : (
                          /* Atendimentos no slot */
                         <div className="space-y-1">
                            {atends.map((atendimento: any) => {
                              const { foiReagendado } = getAtendimentoLabel(atendimento);
                              // Verificar se este slot é o de INÍCIO do atendimento
                              // Se a.hora === horario, é o slot de início; caso contrário, é continuação
                              const isSlotInicio = atendimento.hora === horario;

                              // Slot de CONTINUAÇÃO: não exibir nada
                              if (!isSlotInicio) {
                                return null;
                              }

                              // Slot de INÍCIO: exibir card completo com nome e detalhes
                              return (
                                <div
                                  key={atendimento.id}
                                  className={`rounded-lg p-2 text-xs relative group cursor-pointer transition-shadow hover:shadow-md ${(atendimento.status === 'realizado' || atendimento.status === 'agendado' || !coresMap[atendimento.tipo] || foiReagendado || atendimento.status === 'falta' || atendimento.status === 'cancelado') ? getStatusColor(atendimento.status, foiReagendado) : 'border-l-4'}`}
                                  style={getCardStyle(atendimento.tipo, atendimento.status, foiReagendado)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Recepção: abre menu de opções ao clicar no card
                                    if (mePerfil === 'recepcao' || mePerfil === 'recepção' || mePerfil === 'recepcionista') {
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                      if (showActionsMenu === atendimento.id) {
                                        setShowActionsMenu(null); setMenuPosition(null);
                                      } else {
                                        setShowActionsMenu(atendimento.id);
                                        // Altura estimada do menu (~420px com todos os itens)
                                        const menuH = 420;
                                        const spaceBelow = window.innerHeight - rect.bottom - 8;
                                        const top = spaceBelow >= menuH
                                          ? rect.bottom + 4
                                          : Math.max(8, rect.top - menuH - 4);
                                        setMenuPosition({ top, left: Math.max(4, Math.min(rect.right - 288, window.innerWidth - 296)) });
                                        setAtendimentoSelecionado(atendimento);
                                      }
                                      return;
                                    }
                                    // Demais perfis: navega para prontuário
                                    setProntuarioTarget(atendimento.pacienteId, atendimento.id);
                                    onNavigate?.('prontuario');
                                  }}
                                >
                                  {/* Nome do paciente — apenas no slot de início */}
                                  <div className="flex items-center gap-1 min-w-0 pr-5">
                                    <span className="font-bold text-[12px] truncate leading-tight" title={getPacienteNome(atendimento.pacienteId, atendimento.pacienteNome)}>
                                      {getPacienteNome(atendimento.pacienteId, atendimento.pacienteNome)}
                                    </span>
                                    {podeUsarWhatsApp && <button
                                      type="button"
                                      className="shrink-0 rounded p-0.5 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                                      title="Abrir conversa no WhatsApp"
                                      aria-label={`Abrir WhatsApp de ${getPacienteNome(atendimento.pacienteId, atendimento.pacienteNome)}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirWhatsAppDaAgenda(atendimento.pacienteId);
                                      }}
                                    >
                                      <MessageCircle className="w-3.5 h-3.5" />
                                    </button>}
                                  </div>

                                  {/* Badge de guia assinada — destaque para profissional preencher prontuário */}
                                  {/* Badge verde quando prontuário já foi preenchido */}
                                  {mePerfil === 'profissional' && atendimento.prontuarioFeito === 1 && (
                                    <div className="mt-0.5 flex items-center gap-1 bg-green-100 border border-green-300 text-green-700 rounded px-1.5 py-0.5 text-[10px] font-semibold w-full">
                                      <CheckCircle className="w-3 h-3 shrink-0" />
                                      <span className="truncate">Prontuário realizado</span>
                                    </div>
                                  )}

                                  {mePerfil === 'profissional' && atendimento.prontuarioFeito !== 1 && (() => {
                                    const nomeConvProntu = getConvenioNome(atendimento.convenioId).toLowerCase();
                                    const isIsentoAssinatura = nomeConvProntu.includes('mediservice') || nomeConvProntu.includes('proasa');
                                    // Verificar se foi assinado no mesmo dia do agendamento
                                    const temAssinatura = atendimento.assinadoPaciente === 1 || atendimento.assinadoPaciente === true;
                                    if (!temAssinatura && !isIsentoAssinatura) return null;
                                    return (
                                    <button
                                      className="mt-0.5 flex items-center gap-1 bg-purple-100 border border-purple-300 text-purple-700 rounded px-1.5 py-0.5 text-[10px] font-semibold hover:bg-purple-200 transition-colors w-full"
                                      title={isIsentoAssinatura ? "Clique para preencher o prontuário" : "Guia assinada — clique para preencher o prontuário"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProntuarioTarget(atendimento.pacienteId, atendimento.id);
                                        onNavigate?.('prontuario');
                                      }}
                                    >
                                      <FileSignature className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{isIsentoAssinatura ? 'Preencher prontuário' : 'Guia assinada — preencher prontuário'}</span>
                                    </button>
                                    );
                                  })()}

                                  {/* Tipo e convênio */}
                                  <div className="text-[11px] opacity-80 truncate leading-tight mt-0.5">
                                    {atendimento.tipo && <span>{atendimento.tipo}</span>}
                                    {atendimento.convenioId && (
                                      <span className="ml-1 opacity-70">| {getConvenioNome(atendimento.convenioId)}</span>
                                    )}
                                    {atendimento.duracao && (
                                      <span className="ml-1 opacity-70">| {atendimento.duracao >= 60 ? '1h' : `${atendimento.duracao}min`}</span>
                                    )}
                                  </div>

                                  {/* Status label */}
                                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                                    <span className="text-[10px] font-semibold opacity-70">
                                      {getStatusLabel(atendimento.status, foiReagendado)}
                                    </span>
                                    {/* Indicadores */}
                                    {(mePerfil === 'administrador' || mePerfil === 'master' || mePerfil === 'profissional') && (
                                      atendimento.prontuarioFeito ? (
                                        <span title="Prontuário preenchido"><CheckCircle className="w-3 h-3 text-green-600" /></span>
                                      ) : deveExibirPendenciaProntuarioNaAgenda(atendimento, today) ? (
                                        <span title="Prontuário pendente" className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-100 border border-orange-300 rounded px-1 py-0.5 leading-none whitespace-nowrap">
                                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Prontuário pendente
                                        </span>
                                      ) : null
                                    )}
                                    {(atendimento as any).confirmacaoStatus === 'confirmado' && (
                                      <span title="Paciente confirmou"><CheckCircle className="w-3 h-3 text-emerald-600" /></span>
                                    )}
                                    {(atendimento as any).confirmacaoStatus === 'cancelado' && (
                                      <span title="Paciente cancelou"><AlertTriangle className="w-3 h-3 text-red-500" /></span>
                                    )}
                                    {(atendimento as any).procedimentoConvenioId && (
                                      <span title="Procedimento TUSS vinculado"><Stethoscope className="w-3 h-3 text-blue-500" /></span>
                                    )}
                                    {atendimentosSerieSet.has(atendimento.id) && (() => {
                                      const serieInfo = serieInfoMap.get(atendimento.id);
                                      return (
                                        <button
                                          type="button"
                                          title="Clique para cancelar a série"
                                          className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-100 border border-purple-300 rounded px-1 py-0.5 leading-none whitespace-nowrap hover:bg-purple-200 transition-colors cursor-pointer"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteSerieAtendimento(atendimento);
                                            setShowDeleteSerieModal(true);
                                            const totalSerie = serieInfo?.total || 0;
                                            setDeleteSerieCount(totalSerie);
                                          }}
                                        >
                                          <Repeat2 className="w-2.5 h-2.5 shrink-0" /> Série {serieInfo ? `${serieInfo.indice}/${serieInfo.total}` : ''}
                                        </button>
                                      );
                                    })()}
                                    {/* Mostra a guia e o estado da assinatura da própria sessão. */}
                                    {(() => {
                                      const guiaIdVinculada = encontrarGuiaDaSerie(
                                        atendimento as any,
                                        atendimentos as any[],
                                        guias as any[],
                                      );
                                      const estadoAssinatura = resolverEstadoBadgeAssinatura({
                                        assinadoPaciente: atendimento.assinadoPaciente,
                                        assinaturaPendente: (atendimento as any).assinaturaPendente,
                                        guiaId: guiaIdVinculada,
                                      });

                                      return (
                                        <>
                                          {guiaIdVinculada != null && (
                                            <span
                                              title={`Guia SADT vinculada à série #${guiaIdVinculada}`}
                                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 rounded px-1 py-0.5 leading-none whitespace-nowrap"
                                            >
                                              <FilePlus className="w-2.5 h-2.5 shrink-0" /> Guia #{guiaIdVinculada}
                                            </span>
                                          )}
                                          {estadoAssinatura === 'assinado' && guiaIdVinculada != null && (
                                            <button
                                              type="button"
                                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-purple-700 bg-purple-100 border border-purple-300 rounded px-1 py-0.5 leading-none whitespace-nowrap hover:bg-purple-200 transition-colors"
                                              title="Guia assinada pelo paciente — abrir comprovante"
                                              aria-label="Guia assinada pelo paciente — abrir comprovante"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setGuiaAssinadaSelecionada({
                                                  pacienteId: atendimento.pacienteId,
                                                  guiaId: guiaIdVinculada,
                                                  profissionalId: atendimento.profissionalId,
                                                });
                                                setShowGuiaAssinada(true);
                                              }}
                                            >
                                              <FileSignature className="w-2.5 h-2.5 shrink-0" /> Guia assinada
                                            </button>
                                          )}
                                          {estadoAssinatura === 'pendente' && (
                                            <span
                                              title="Link de assinatura disponível — aguardando assinatura do paciente"
                                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-orange-700 bg-orange-100 border border-orange-300 rounded px-1 py-0.5 leading-none whitespace-nowrap"
                                            >
                                              <Hourglass className="w-2.5 h-2.5 shrink-0" /> Guia pendente de assinatura
                                            </span>
                                          )}
                                        </>
                                      );
                                    })()}
                                    {/* Etiqueta de status de pagamento — convênios com recebimento no balcão */}
                                    {(() => {
                                      const nomeConvCard = getConvenioNome(atendimento.convenioId).toLowerCase();
                                      const isConvPagavel = permitePagamentoNoBalcao(nomeConvCard);
                                      if (!isConvPagavel) return null;
                                      const isPago = !!(atendimento as any).pagamentoParticularId;
                                      return isPago ? (
                                        <span title="Pagamento registrado" className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded px-1 py-0.5 leading-none whitespace-nowrap">
                                          <CreditCard className="w-2.5 h-2.5 shrink-0" /> Pago
                                        </span>
                                      ) : (
                                        <span title="Pagamento pendente" className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded px-1 py-0.5 leading-none whitespace-nowrap animate-pulse">
                                          <AlertCircle className="w-2.5 h-2.5 shrink-0" /> Pendente
                                        </span>
                                      );
                                    })()}
                                  </div>

                                  {/* Botão de menu — não exibido para profissionais */}
                                  {exibirAcoesAdministrativas && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition bg-white/80 hover:bg-white rounded p-0.5 h-auto w-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                      if (showActionsMenu === atendimento.id) {
                                        setShowActionsMenu(null); setMenuPosition(null);
                                      } else {
                                        setShowActionsMenu(atendimento.id);
                                        // Altura estimada do menu (~420px com todos os itens)
                                        const menuH = 420;
                                        const spaceBelow = window.innerHeight - rect.bottom - 8;
                                        const top = spaceBelow >= menuH
                                          ? rect.bottom + 4
                                          : Math.max(8, rect.top - menuH - 4);
                                        setMenuPosition({ top, left: Math.max(4, Math.min(rect.right - 288, window.innerWidth - 296)) });
                                        setAtendimentoSelecionado(atendimento);
                                      }
                                    }}
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 bg-white border-t px-4 py-2">
        <span className="font-semibold text-gray-700">Legenda:</span>
        {[
          { color: 'bg-blue-500', label: 'Aguardando atendimento' },
          { color: 'bg-green-500', label: 'Atendido' },
          { color: 'bg-red-500', label: 'Faltou' },
          { color: 'bg-orange-400', label: 'Reagendou' },
          { color: 'bg-purple-400', label: 'Cancelado' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
            <span>{label}</span>
          </span>
        ))}
        <span className="border-l border-gray-300 h-4 mx-1" />
        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-600" /> Prontuário OK</span>
        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-orange-500" /> Prontuário pendente</span>
        <span className="flex items-center gap-1"><FileSignature className="w-3 h-3 text-purple-600" /> Guia assinada</span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-300 rounded px-1 py-0.5"><FilePlus className="w-2.5 h-2.5" /> Pré-faturamento criado</span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded px-1 py-0.5"><CreditCard className="w-2.5 h-2.5" /> Pago (Particular/Vale Saúde)</span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded px-1 py-0.5"><AlertCircle className="w-2.5 h-2.5" /> Pendente (Particular/Vale Saúde)</span>
      </div>

      {/* ==================== MODAIS ==================== */}

      <AgendamentoModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedSlot(null); }}
        selectedSlot={selectedSlot}
        onSuccess={(profissionalId) => {
          refetchAtendimentos();
          // Garantir que o profissional do novo agendamento esteja visível na grade
          if (profissionalId) {
            setSelectedProfIds(prev => prev.includes(profissionalId) ? prev : [...prev, profissionalId]);
          }
        }}
      />

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) setAtendimentoSelecionado(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Pencil className="w-5 h-5" /> Editar Agendamento
            </DialogTitle>
          </DialogHeader>
          {atendimentoSelecionado && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">{getPacienteNome(atendimentoSelecionado.pacienteId)}</p>
                <p className="text-gray-500">{getProfissionalNome(atendimentoSelecionado.profissionalId)} • {atendimentoSelecionado.data ? formatDateBR(atendimentoSelecionado.data) : ''} às {atendimentoSelecionado.hora}</p>
              </div>
              <div>
                <Label>Status</Label>
                <select value={editData.status} onChange={(e) => setEditData(d => ({ ...d, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1">
                  <option value="agendado">Aguardando atendimento</option>
                  <option value="realizado">Atendido</option>
                  <option value="falta">Faltou</option>
                  <option value="cancelado">Não chegou / Cancelado</option>
                </select>
              </div>
              <div>
                <Label>Tipo / Especialidade</Label>
                <select value={editData.tipo} onChange={(e) => setEditData(d => ({ ...d, tipo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1">
                  <option value="">Selecione o tipo...</option>
                  {TIPOS_ATENDIMENTO_DISPONIVEIS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Convênio</Label>
                <select value={editData.convenioId} onChange={(e) => setEditData(d => ({ ...d, convenioId: e.target.value, procedimentoConvenioId: '' }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1">
                  <option value="">Selecione o convênio...</option>
                  {(convenios as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <Label>Procedimento</Label>
                <select value={editData.procedimentoConvenioId} onChange={(e) => setEditData(d => ({ ...d, procedimentoConvenioId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1" disabled={!editData.convenioId}>
                  <option value="">{!editData.convenioId ? 'Selecione o convênio primeiro' : 'Selecione o procedimento...'}</option>
                  {(procedimentosConvenio as any[]).map((p: any) => (
                    <option key={p.id} value={p.id}>{(p.codigoConvenio || p.codigoANS) ? `${p.codigoConvenio || p.codigoANS} — ` : ''}{p.descricaoConvenio || p.descricaoANS || 'Procedimento'}{p.valor ? ` (R$ ${Number(p.valor).toFixed(2)})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={editData.descricao} onChange={(e) => setEditData(d => ({ ...d, descricao: e.target.value }))} placeholder="Observações..." rows={2} className="mt-1" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={async () => {
                  if (!atendimentoSelecionado) return;
                  try {
                    await updateAtendimentoMutation.mutateAsync({
                      id: atendimentoSelecionado.id,
                      data: {
                        status: editData.status as any,
                        tipo: editData.tipo || undefined,
                        descricao: editData.descricao || undefined,
                        convenioId: editData.convenioId ? parseInt(editData.convenioId) : undefined,
                        procedimentoConvenioId: editData.procedimentoConvenioId ? parseInt(editData.procedimentoConvenioId) : undefined,
                      },
                    });
                    setShowEditModal(false);
                  } catch (err: any) {
                    toast.error('Erro: ' + err.message);
                  }
                }}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Pagamento Particular / Vale Saúde */}
      {showPagamentoModal && atendimentoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPagamentoModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <AbaPagamentoAtendimento
              atendimentoId={atendimentoSelecionado.id}
              pacienteId={atendimentoSelecionado.pacienteId}
              profissionalId={atendimentoSelecionado.profissionalId}
              pacienteNome={(pacientes as any[]).find((p: any) => p.id === atendimentoSelecionado.pacienteId)?.nome || 'Paciente'}
              convenioNome={(convenios as any[]).find((c: any) => c.id === atendimentoSelecionado.convenioId)?.nome}
              isVisible={true}
              onClose={() => { setShowPagamentoModal(false); refetchAtendimentos(); }}
            />
          </div>
        </div>
      )}

      {/* Modal de Reagendamento */}
      <Dialog open={showReagendar} onOpenChange={setShowReagendar}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reagendar Atendimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data</Label>
              <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Nova Hora</Label>
              <select value={novaHora} onChange={(e) => setNovaHora(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1">
                <option value="">Selecione...</option>
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {countSerieReagendar.data && countSerieReagendar.data.total > 1 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Este atendimento faz parte de uma série com <strong>{countSerieReagendar.data.total} atendimentos</strong> futuros.
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              {countSerieReagendar.data && countSerieReagendar.data.total > 1 && (
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={reagendarSerieMutation.isPending}
                  onClick={() => {
                    if (!novaData && !novaHora) { toast.error('Preencha a nova data ou hora'); return; }
                    if (!atendimentoSelecionado) return;
                    reagendarSerieMutation.mutate({
                      id: atendimentoSelecionado.id,
                      novaHora: novaHora || atendimentoSelecionado.hora,
                      novaData: novaData || undefined,
                    });
                  }}
                >
                  {reagendarSerieMutation.isPending ? 'Reagendando...' : `Reagendar toda a série (${countSerieReagendar.data.total})`}
                </Button>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowReagendar(false)}>Cancelar</Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={updateAtendimentoMutation.isPending}
                  onClick={() => {
                    if (!atendimentoSelecionado) return;
                    const dados = criarAtualizacaoReagendamentoIndividual(novaData, novaHora);
                    if (Object.keys(dados).length === 0) {
                      toast.error('Informe uma nova data ou horário');
                      return;
                    }
                    // Atualiza exclusivamente o ID escolhido: não cria outro registro,
                    // não cancela a sessão original e não modifica a série.
                    updateAtendimentoMutation.mutate({ id: atendimentoSelecionado.id, data: dados });
                  }}
                >
                  {updateAtendimentoMutation.isPending ? 'Reagendando...' : 'Reagendar apenas este'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Mudar Profissional */}
      <Dialog open={showMudarProf} onOpenChange={setShowMudarProf}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Mudar Profissional</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Novo Profissional</Label>
              <select value={novoProfissional} onChange={(e) => setNovoProfissional(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1">
                <option value="">Selecione...</option>
                {profissionais.map((p: any) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>
            {countSerieProfissional.data && countSerieProfissional.data.total > 1 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Este atendimento faz parte de uma série com <strong>{countSerieProfissional.data.total} atendimentos</strong> futuros.
              </p>
            )}
            <div className="flex flex-col gap-2 pt-2">
              {countSerieProfissional.data && countSerieProfissional.data.total > 1 && (
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={mudarProfissionalSerieMutation.isPending}
                  onClick={() => {
                    if (!novoProfissional) { toast.error('Selecione um profissional'); return; }
                    if (!atendimentoSelecionado) return;
                    mudarProfissionalSerieMutation.mutate({
                      id: atendimentoSelecionado.id,
                      novoProfissionalId: parseInt(novoProfissional),
                    });
                  }}
                >
                  {mudarProfissionalSerieMutation.isPending ? 'Alterando...' : `Mudar em toda a série (${countSerieProfissional.data.total})`}
                </Button>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowMudarProf(false)}>Cancelar</Button>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                  if (novoProfissional && atendimentoSelecionado) {
                    updateAtendimentoMutation.mutate({ id: atendimentoSelecionado.id, data: { profissionalId: parseInt(novoProfissional) } });
                    setNovoProfissional('');
                  } else { toast.error('Selecione um profissional'); }
                }}>Mudar apenas este</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Histórico de Alterações</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {historico && historico.length > 0 ? (historico as any[]).map((item: any) => (
              <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                <p className="font-semibold text-sm">{item.tipoAlteracao.toUpperCase()}</p>
                <p className="text-sm text-gray-600">{item.descricao}</p>
                <p className="text-xs text-gray-400 mt-1">{item.usuarioNome || 'Sistema'} — {new Date(item.dataHora).toLocaleString('pt-BR')}</p>
                {item.valorAnterior && <p className="text-xs text-gray-500">De: {item.valorAnterior} → Para: {item.valorNovo}</p>}
              </div>
            )) : <p className="text-center text-gray-500 py-4">Nenhuma alteração registrada</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Guia Assinada */}
      <Dialog open={showGuiaAssinada} onOpenChange={(open) => { setShowGuiaAssinada(open); if (!open) setGuiaAssinadaSelecionada(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <FileSignature className="w-5 h-5" /> Guia SADT — Documento Assinado
            </DialogTitle>
          </DialogHeader>
          {loadingGuiaAssinada && <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>}
          {!loadingGuiaAssinada && !guiaAssinadaData && <div className="text-center py-12 text-gray-500"><FileSignature className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>Nenhuma guia assinada encontrada.</p></div>}
          {!loadingGuiaAssinada && guiaAssinadaData && (() => {
            const { guia, profissional, convenio, assinaturas } = guiaAssinadaData as any;
            return (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-bold text-purple-800">Guia Nº {guia.numeroGuia}</h3>
                  <p className="text-sm text-purple-600">{guia.procedimento}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-500 mb-1">Convênio</p><p className="font-semibold">{convenio.nome}</p></div>
                  <div className="bg-gray-50 rounded p-3"><p className="text-xs text-gray-500 mb-1">Profissional</p><p className="font-semibold">{profissional.nome}</p></div>
                </div>
                {assinaturas?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Assinaturas ({assinaturas.length} sessão{assinaturas.length !== 1 ? 'ões' : ''})</h4>
                    {(assinaturas as any[]).map((ass: any) => (
                      <div key={ass.id} className="border rounded-lg p-3 mb-2">
                        <p className="font-semibold text-purple-700 text-sm">{ass.sessaoNumero}ª Sessão</p>
                        <p className="text-xs text-gray-400">{ass.dataAssinatura ? new Date(ass.dataAssinatura).toLocaleString('pt-BR') : '-'}</p>
                        {ass.assinaturaPacienteUrl && <img src={ass.assinaturaPacienteUrl} alt="Assinatura" className="max-h-20 mt-2 border rounded" />}
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-green-50 border border-green-200 rounded p-3 flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="w-4 h-4" /> Documento assinado digitalmente. Hash SHA-256 validado.
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Modal de Assinatura SADT */}
      {atendimentoParaAssinar && (
        <GuiaSadtAssinaturaModal
          open={showGuiaSadtAssinar}
          onClose={() => { setShowGuiaSadtAssinar(false); setAtendimentoParaAssinar(null); }}
          pacienteId={atendimentoParaAssinar.pacienteId}
          pacienteNome={getPacienteNome(atendimentoParaAssinar.pacienteId)}
          guiaId={atendimentoParaAssinar.guiaId}
          atendimentoId={atendimentoParaAssinar.id}
          profissionalId={atendimentoParaAssinar.profissionalId}
          atendimentoData={atendimentoParaAssinar.data ? formatDateBR(atendimentoParaAssinar.data) : undefined}
          onAssinado={() => refetchAtendimentos()}
        />
      )}

      {/* Modal de Criar Guia SADT */}
      <Dialog open={showCriarGuia} onOpenChange={(open) => { setShowCriarGuia(open); if (!open) { setCriarGuiaAtendimento(null); setVincularGuiaASerie(false); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FilePlus className="w-5 h-5 text-indigo-600" /> Pré-faturamento / Criar Guia SADT</DialogTitle>
          </DialogHeader>
          {criarGuiaAtendimento && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-indigo-800">{getPacienteNome(criarGuiaAtendimento.pacienteId)}</p>
                <p className="text-indigo-600 text-xs">{criarGuiaAtendimento.data ? formatDateBR(criarGuiaAtendimento.data) : ''} às {criarGuiaAtendimento.hora} | {getConvenioNome(criarGuiaAtendimento.convenioId)}</p>
                {(criarGuiaAtendimento as any).serieId && (() => {
                  const totalSerie = (atendimentos as any[]).filter((a: any) => a.serieId === (criarGuiaAtendimento as any).serieId).length;
                  return (
                    <label className="mt-2 flex items-start gap-2 bg-purple-50 border border-purple-200 rounded px-2 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vincularGuiaASerie}
                        onChange={(event) => setVincularGuiaASerie(event.target.checked)}
                        className="mt-0.5 h-3.5 w-3.5 accent-purple-600"
                      />
                      <span className="text-xs text-purple-700">
                        <strong>Vincular a toda a série ({totalSerie} sessão(ões))</strong>
                        <br />Desmarcado: cria uma guia individual somente para este atendimento.
                      </span>
                    </label>
                  );
                })()}
              </div>
              {/* Aviso se profissional não está vinculado ao atendimento */}
              {!criarGuiaAtendimento.profissionalId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                  ⚠️ Este atendimento não tem profissional vinculado. Selecione abaixo.
                </div>
              )}
              {/* Seletor de profissional (visível quando não há profissional no atendimento) */}
              {!criarGuiaAtendimento.profissionalId && (
                <div>
                  <Label>Profissional *</Label>
                  <Select value={guiaForm.autorizacaoId} onValueChange={v => setGuiaForm(p => ({ ...p, autorizacaoId: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                    <SelectContent>
                      {(profissionais as any[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Número da Guia</Label><Input placeholder="Gerado automaticamente" value={guiaForm.numeroGuia} onChange={e => setGuiaForm(p => ({ ...p, numeroGuia: e.target.value }))} className="mt-1" /></div>
                <div><Label>Data de Autorização *</Label><Input type="date" value={guiaForm.dataEmissao} onChange={e => setGuiaForm(p => ({ ...p, dataEmissao: e.target.value }))} className="mt-1" /></div>
              </div>
              <div>
                <Label>Procedimento *</Label>
                {(procedimentosGuia as any[]).length > 0 ? (
                  <Select value={guiaForm.procedimento} onValueChange={v => {
                    const proc = (procedimentosGuia as any[]).find((p: any) => p.descricaoConvenio === v);
                    setGuiaForm(p => ({
                      ...p,
                      procedimento: v,
                      valor: proc?.valor ? String(parseFloat(proc.valor).toFixed(2)) : p.valor,
                    }));
                  }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                    <SelectContent>
                      {(procedimentosGuia as any[]).map((proc: any) => (
                        <SelectItem key={proc.id} value={proc.descricaoConvenio}>
                          {proc.descricaoConvenio}{proc.valor ? ` — R$ ${parseFloat(proc.valor).toFixed(2)}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={guiaForm.procedimento} onValueChange={v => setGuiaForm(p => ({ ...p, procedimento: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_ATENDIMENTO_DISPONIVEIS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" min="0" placeholder="0,00" value={guiaForm.valor} onChange={e => setGuiaForm(p => ({ ...p, valor: e.target.value }))} className="mt-1" /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={guiaForm.status} onValueChange={v => setGuiaForm(p => ({ ...p, status: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="aprovada">Aprovada</SelectItem>
                      <SelectItem value="paga">Paga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowCriarGuia(false); setCriarGuiaAtendimento(null); }}>Cancelar</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!guiaForm.procedimento || !guiaForm.valor || createGuiaMutation.isPending || (!criarGuiaAtendimento.profissionalId && !guiaForm.autorizacaoId)}
                  onClick={() => {
                    const profId = criarGuiaAtendimento.profissionalId || parseInt(guiaForm.autorizacaoId);
                    if (!profId || isNaN(profId)) { toast.error('Selecione um profissional'); return; }
                    const serieId = (criarGuiaAtendimento as any).serieId;
                    if (deveCriarGuiaParaSerie(vincularGuiaASerie, serieId)) {
                      // Vínculo por série ocorre somente após confirmação explícita.
                      const atendimentosDaSerie = (atendimentos as any[]).filter((a: any) => a.serieId === serieId);
                      const atendimentoIds = atendimentosDaSerie.map((a: any) => a.id);
                      const paciente = (pacientes as any[]).find((p: any) => p.id === criarGuiaAtendimento.pacienteId);
                      criarGuiasPorSerieMutation.mutate({
                        pacienteId: criarGuiaAtendimento.pacienteId,
                        profissionalId: profId,
                        convenioId: criarGuiaAtendimento.convenioId,
                        seriesAtendimentos: [{
                          serieId,
                          serieNumero: 1,
                          atendimentoIds,
                          procedimento: guiaForm.procedimento,
                          valor: guiaForm.valor,
                          dataEmissao: guiaForm.dataEmissao,
                          numeroCarteira: (paciente as any)?.numeroCarteira || undefined,
                        }],
                      });
                    } else {
                      // Guia individual: somente o atendimento selecionado é vinculado.
                      const numGuia = guiaForm.numeroGuia || `G${Date.now()}`;
                      createGuiaMutation.mutate({ numeroGuia: numGuia, pacienteId: criarGuiaAtendimento.pacienteId, profissionalId: profId, convenioId: criarGuiaAtendimento.convenioId, atendimentoId: criarGuiaAtendimento.id, procedimento: guiaForm.procedimento, valor: guiaForm.valor, dataEmissao: guiaForm.dataEmissao, status: guiaForm.status });
                    }
                  }}>
                  {(createGuiaMutation.isPending || criarGuiasPorSerieMutation.isPending) ? 'Criando...' : 'Criar Guia SADT / Pré-faturamento'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Menu de ações em camada fixa estável */}
      {showActionsMenu !== null && menuPosition && atendimentoSelecionado && (
        <>
          <div className="fixed bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] w-72 overflow-y-auto" style={{ top: menuPosition.top, left: menuPosition.left, maxHeight: `calc(100vh - ${menuPosition.top + 8}px)` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-600 truncate max-w-[170px]">{atendimentoSelecionado.pacienteNome || 'Ações'}</span>
              <button onClick={() => { setShowActionsMenu(null); setMenuPosition(null); }} className="ml-2 text-gray-400 hover:text-gray-700 rounded-full p-0.5 hover:bg-gray-200 transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
            </div>
            {exibirAcoesAdministrativas && (<>
            <button className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-indigo-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" onClick={() => {
              const pac = (pacientes as any[]).find((p: any) => p.id === atendimentoSelecionado.pacienteId);
              setEditData({ tipo: atendimentoSelecionado.tipo || '', descricao: atendimentoSelecionado.descricao || '', convenioId: atendimentoSelecionado.convenioId?.toString() || pac?.convenioId?.toString() || '', procedimentoConvenioId: atendimentoSelecionado.procedimentoConvenioId?.toString() || '', status: atendimentoSelecionado.status || 'agendado' });
              setShowEditModal(true); setShowActionsMenu(null); setMenuPosition(null);
            }}><Pencil className="w-4 h-4" /> Editar Agendamento</button>
            </>)}
            <button className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-green-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" onClick={() => { setProntuarioTarget(atendimentoSelecionado.pacienteId, atendimentoSelecionado.id); setShowActionsMenu(null); setMenuPosition(null); onNavigate?.('prontuario'); }}><ClipboardList className="w-4 h-4" /> Ir para prontuário</button>
            {exibirAcoesAdministrativas && (<>
            {(() => {
              const nomeConvPag = (convenios as any[]).find((c: any) => c.id === atendimentoSelecionado?.convenioId)?.nome?.toLowerCase() || '';
              const isParticularOuVale = permitePagamentoNoBalcao(nomeConvPag);
              const temAcessoPagamento = mePerfil === 'master' || mePerfil === 'administrador' || mePerfil === 'recepcao' || mePerfil === 'recepção' || mePerfil === 'recepcionista';
              return isParticularOuVale && temAcessoPagamento ? (
                <button className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" onClick={() => { setShowPagamentoModal(true); setShowActionsMenu(null); setMenuPosition(null); }}>
                  <CreditCard className="w-4 h-4" /> Registrar Pagamento
                </button>
              ) : null;
            })()}
            <button className="w-full text-left px-4 py-2.5 hover:bg-purple-50 text-purple-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" onClick={async () => {
              let guiaIdDaSerie: number | null = null;
              try {
                guiaIdDaSerie = await encontrarGuiaDaSerieAtualizada(
                  atendimentoSelecionado as any,
                  atendimentos as any[],
                  () => utils.guias.list.fetch() as Promise<any[]>,
                );
              } catch {
                toast.error('Não foi possível confirmar a guia existente. Atualize a Agenda antes de tentar novamente.');
                setShowActionsMenu(null); setMenuPosition(null);
                return;
              }
              if (guiaIdDaSerie == null) {
                toast.warning('Nenhuma guia foi localizada para esta série. Abra o Pré-faturamento para criar a primeira guia.');
                setShowActionsMenu(null); setMenuPosition(null);
                return;
              }
              setAtendimentoParaAssinar({ ...atendimentoSelecionado, guiaId: guiaIdDaSerie });
              setShowGuiaSadtAssinar(true);
              setShowActionsMenu(null); setMenuPosition(null);
            }}><FileSignature className="w-4 h-4" /> Guia SADT / Assinar</button>
            {exibirAcoesAdministrativas && (
              <>
                {/* Pré-faturamento: por padrão sempre cria uma guia individual. */}
                <button
                  className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 font-medium whitespace-nowrap hover:bg-indigo-50 text-indigo-700"
                  onClick={async () => {
                    let valorAuto = '';
                    let procedimentoAuto = atendimentoSelecionado?.tipo || '';
                    if (atendimentoSelecionado?.convenioId && atendimentoSelecionado?.procedimentoConvenioId) {
                      try {
                        const procs = await utils.procedimentos.getProcedimentosPorConvenio.fetch({ convenioId: atendimentoSelecionado.convenioId });
                        const procVinculado = (procs as any[]).find((p: any) => p.id === atendimentoSelecionado.procedimentoConvenioId);
                        if (procVinculado) {
                          procedimentoAuto = procVinculado.descricaoConvenio || atendimentoSelecionado.tipo || '';
                          valorAuto = procVinculado.valor ? String(parseFloat(procVinculado.valor).toFixed(2)) : '';
                        }
                      } catch {}
                    }
                    setCriarGuiaAtendimento(atendimentoSelecionado);
                    setVincularGuiaASerie(false);
                    setGuiaForm(p => ({ ...p, procedimento: procedimentoAuto, valor: valorAuto, dataEmissao: atendimentoSelecionado?.data ? toSafeISODate(atendimentoSelecionado.data) : getHojeBrasilia() }));
                    setShowCriarGuia(true); setShowActionsMenu(null); setMenuPosition(null);
                  }}
                >
                  <FilePlus className="w-4 h-4" />
                  Criar Guia Individual
                </button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-green-50 text-green-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" disabled={gerarLinkAssinaturaGuiaMutation.isPending} onClick={async () => {
                  const convenioNome = getConvenioNome(atendimentoSelecionado?.convenioId);
                  if (convenioUsaAssinaturaEmGuiaFisica(convenioNome)) {
                    toast.info(MENSAGEM_ASSINATURA_EM_GUIA_FISICA);
                    setShowActionsMenu(null); setMenuPosition(null);
                    return;
                  }
                  const gs = await utils.guias.list.fetch();
                  // Priorizar a guia já vinculada ao atendimento. O fallback exige o
                  // mesmo paciente, profissional e convênio para não escolher uma
                  // guia histórica de outra operadora.
                  const guia = atendimentoSelecionado
                    ? selecionarGuiaParaAssinatura(atendimentoSelecionado as any, gs as any[])
                    : undefined;
                  if (!guia) { toast.error('Nenhuma guia SADT encontrada. Crie a guia primeiro.'); return; }
                  // Pré-preencher com a data do atendimento actual (usar offset local para evitar problema de UTC-1 dia)
                  const toLocalDateStr = (d: Date) => {
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                  };
                  const dataAtend = atendimentoSelecionado?.data
                    ? (typeof atendimentoSelecionado.data === 'string'
                        ? atendimentoSelecionado.data.split('T')[0]
                        : toLocalDateStr(new Date(atendimentoSelecionado.data)))
                    : toLocalDateStr(new Date());
                  setAtendimentoParaLinkAssinatura({ ...atendimentoSelecionado, guiaId: guia.id });
                  setDatasAssinaturaSelecionadas([dataAtend].sort((a, b) => a.localeCompare(b)));
                  setNovaDataAssinatura('');
                  setShowModalDatasAssinatura(true);
                  setShowActionsMenu(null); setMenuPosition(null);
                }}><MessageCircle className="w-4 h-4" /> Enviar Assinatura (WA)</button>
                <button className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-blue-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" disabled={gerarLinkConfirmacaoMutation.isPending} onClick={() => { gerarLinkConfirmacaoMutation.mutate({ atendimentoId: atendimentoSelecionado.id }); setShowActionsMenu(null); setMenuPosition(null); }}><Send className="w-4 h-4" /> Lembrete Confirmação (WA)</button>
              </>
            )}
            <div className="border-t my-1" />
            {/* Alterar Duração */}
            <div className="px-3 pt-1.5 pb-0.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" /> Duração ({atendimentoSelecionado?.duracao || 30} min)
            </div>
            {profissionalRecebeDuasUnidadesPorHora(getProfissionalNome(atendimentoSelecionado?.profissionalId || 0)) && (
              <p className="px-4 pb-1 text-[11px] text-blue-700">1 hora equivale a 2 unidades de repasse.</p>
            )}
            {opcoesDuracaoAtendimentoSelecionado.map(value => {
              const opt = { value, label: value === 60 ? '1 hora' : `${value} minutos` };
              return (
              <button
                key={opt.value}
                className={`w-full text-left px-4 py-2 hover:bg-orange-50 text-sm flex items-center gap-2 ${
                  (atendimentoSelecionado?.duracao || 30) === opt.value
                    ? 'text-orange-700 font-semibold bg-orange-50'
                    : 'text-gray-700'
                }`}
                disabled={updateDuracaoMutation.isPending}
                onClick={() => {
                  setShowActionsMenu(null); setMenuPosition(null);
                  if (atendimentosSerieSet.has(atendimentoSelecionado.id)) {
                    setDuracaoSerieAtendimento(atendimentoSelecionado);
                    setDuracaoSeriePendente(opt.value);
                    setShowDuracaoSerieModal(true);
                  } else {
                    updateDuracaoMutation.mutate({ id: atendimentoSelecionado.id, duracao: opt.value });
                  }
                }}
              >
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {opt.label}
                {(atendimentoSelecionado?.duracao || 30) === opt.value && <Check className="w-3 h-3 ml-auto text-orange-600" />}
              </button>
              );
            })}
            <div className="border-t my-1" />
            <button className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2" onClick={() => { setShowReagendar(true); setShowActionsMenu(null); setMenuPosition(null); }}><Edit3 className="w-4 h-4" /> Reagendar</button>
            <button className="w-full text-left px-4 py-2.5 hover:bg-teal-50 text-teal-700 text-sm flex items-center gap-2 font-medium whitespace-nowrap" onClick={() => { setSerieFrequencia('semanal'); setSerieQuantidade(4); setSerieDataInicio(atendimentoSelecionado?.data ? toSafeISODate(atendimentoSelecionado.data) : ''); setShowPassarEmSerie(true); setShowActionsMenu(null); setMenuPosition(null); }}><Repeat2 className="w-4 h-4" /> Passar em Série</button>
            <button className="w-full text-left px-4 py-2.5 hover:bg-gray-100 text-gray-700 text-sm flex items-center gap-2" onClick={() => { setShowMudarProf(true); setShowActionsMenu(null); setMenuPosition(null); }}><User className="w-4 h-4" /> Mudar Profissional</button>
            <button className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-blue-600 text-sm flex items-center gap-2" onClick={() => { setAtendimentoHistorico(atendimentoSelecionado); setShowHistorico(true); setShowActionsMenu(null); setMenuPosition(null); }}><AlertCircle className="w-4 h-4" /> Ver Histórico</button>
            <div className="border-t my-1" />
            <button className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 text-sm flex items-center gap-2" onClick={() => {
              setDeleteSerieAtendimento(atendimentoSelecionado);
              setShowActionsMenu(null);
              setMenuPosition(null);
              setShowDeleteSerieModal(true);
            }}><Trash2 className="w-4 h-4" /> Excluir</button>
            </>)}
          </div>
        </>
      )}
    </div>



    {/* ─── Modal de Confirmação de Duração em Série ────────────────────────────── */}
    {showDuracaoSerieModal && duracaoSerieAtendimento && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-800">Alterar Duração</h2>
            </div>
            <button onClick={() => { setShowDuracaoSerieModal(false); setDuracaoSerieAtendimento(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-gray-600 mb-3">
              Alterar para <span className="font-semibold text-orange-700">{duracaoSeriePendente >= 60 ? `${duracaoSeriePendente / 60}h` : `${duracaoSeriePendente} min`}</span> o atendimento de{' '}
              <span className="font-semibold text-gray-800">{getPacienteNome(duracaoSerieAtendimento.pacienteId)}</span>.
            </p>
            {countSerieDuracao.data && countSerieDuracao.data.total > 1 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-3 text-xs text-orange-800">
                <Repeat2 className="w-3.5 h-3.5 inline mr-1" />
                Este atendimento faz parte de uma série com <strong>{countSerieDuracao.data.total}</strong> consultas futuras.
              </div>
            )}
          </div>
          <div className="px-5 pb-5 flex flex-col gap-2">
            <button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={updateDuracaoSerieMutation.isPending}
              onClick={() => updateDuracaoSerieMutation.mutate({ id: duracaoSerieAtendimento.id, duracao: duracaoSeriePendente })}
            >
              <Repeat2 className="w-4 h-4" />
              {updateDuracaoSerieMutation.isPending ? 'Atualizando...' : `Alterar toda a série (${countSerieDuracao.data?.total ?? '...'})`}
            </button>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={updateDuracaoMutation.isPending}
              onClick={() => {
                updateDuracaoMutation.mutate({ id: duracaoSerieAtendimento.id, duracao: duracaoSeriePendente });
                setShowDuracaoSerieModal(false);
                setDuracaoSerieAtendimento(null);
              }}
            >
              <Clock className="w-4 h-4" />
              {updateDuracaoMutation.isPending ? 'Atualizando...' : 'Alterar apenas este'}
            </button>
            <button
              className="w-full border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg py-2 text-sm"
              onClick={() => { setShowDuracaoSerieModal(false); setDuracaoSerieAtendimento(null); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ─── Modal de Confirmação de Exclusão de Série ───────────────────────────── */}
    {showDeleteSerieModal && deleteSerieAtendimento && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-semibold text-gray-800">Excluir Atendimento</h2>
            </div>
            <button onClick={() => { setShowDeleteSerieModal(false); setDeleteSerieAtendimento(null); }} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600">
              Este atendimento faz parte de uma série recorrente de
              {' '}<span className="font-semibold text-gray-800">{getPacienteNome(deleteSerieAtendimento.pacienteId)}</span>.
              {' '}Como deseja proceder?
            </p>
            {countSerieQuery.data && countSerieQuery.data.total > 1 && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Esta série possui <strong>{countSerieQuery.data.total} atendimentos futuros</strong> (a partir desta data).
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 px-5 pb-5">
            <button
              className="w-full py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              onClick={() => {
                deleteAtendimentoMutation.mutate({ id: deleteSerieAtendimento.id });
                setShowDeleteSerieModal(false);
                setDeleteSerieAtendimento(null);
              }}
              disabled={deleteAtendimentoMutation.isPending}
            >
              {deleteAtendimentoMutation.isPending ? 'Excluindo...' : 'Excluir apenas este'}
            </button>
            <button
              className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-colors"
              onClick={() => deleteSerieAtendimentoMutation.mutate({ id: deleteSerieAtendimento.id })}
              disabled={deleteSerieAtendimentoMutation.isPending}
            >
              {deleteSerieAtendimentoMutation.isPending ? 'Excluindo...' : `Excluir este e os futuros${countSerieQuery.data ? ` (${countSerieQuery.data.total})` : ''}`}
            </button>
            <button
              className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
              onClick={() => deleteSerieCompletaMutation.mutate({ id: deleteSerieAtendimento.id })}
              disabled={deleteSerieCompletaMutation.isPending}
            >
              {deleteSerieCompletaMutation.isPending ? 'Excluindo...' : 'Excluir toda a série (passados e futuros)'}
            </button>
            <button
              className="w-full py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm transition-colors"
              onClick={() => { setShowDeleteSerieModal(false); setDeleteSerieAtendimento(null); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ─── Modal de Seleção de Datas + Pré-visualização da Mensagem WhatsApp ─────────── */}
    {showModalDatasAssinatura && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header com indicador de etapa */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-base font-semibold text-gray-800">
                {etapaModal === 'datas' ? 'Datas para Assinatura' : 'Pré-visualizar Mensagem'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Indicador de etapa */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${etapaModal === 'datas' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>1</span>
                <span className="w-4 h-px bg-gray-300" />
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${etapaModal === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
              </div>
              <button onClick={() => { setShowModalDatasAssinatura(false); setEtapaModal('datas'); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Etapa 1: Seleção de Datas */}
          {etapaModal === 'datas' && (
            <>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">
                  Adicione as datas de atendimento que o paciente deverá confirmar ao assinar o link.
                </p>
                {/* Lista de datas já adicionadas */}
                <div className="space-y-2">
                  {datasAssinaturaSelecionadas.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Nenhuma data adicionada ainda.</p>
                  )}
                  {datasAssinaturaSelecionadas.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-green-800">
                        {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setDatasAssinaturaSelecionadas(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Adicionar nova data */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={novaDataAssinatura}
                    onChange={e => setNovaDataAssinatura(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    onClick={() => {
                      if (!novaDataAssinatura) return;
                      if (datasAssinaturaSelecionadas.includes(novaDataAssinatura)) {
                        toast.error('Esta data já foi adicionada.');
                        return;
                      }
                      setDatasAssinaturaSelecionadas(prev => [...prev, novaDataAssinatura].sort((a, b) => a.localeCompare(b)));
                      setNovaDataAssinatura('');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
                {/* Aviso de datas futuras */}
                {datasAssinaturaSelecionadas.some(d => d > new Date().toISOString().slice(0, 10)) && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Atenção:</strong> Uma ou mais datas são futuras. Confirme se pretende incluir atendimentos futuros.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => { setShowModalDatasAssinatura(false); setEtapaModal('datas'); }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={datasAssinaturaSelecionadas.length === 0}
                  onClick={() => {
                    const pacienteNome = (pacientes as any[]).find((p: any) => p.id === atendimentoParaLinkAssinatura?.pacienteId)?.nome || 'Paciente';
                    const profissionalNome = getProfissionalNome(atendimentoParaLinkAssinatura?.profissionalId);
                    const convenioNome = getConvenioNome(atendimentoParaLinkAssinatura?.convenioId);
                    const tipoAtend = atendimentoParaLinkAssinatura?.tipo || 'atendimento';
                    const datasFormatadas = datasAssinaturaSelecionadas
                      .map(d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }))
                      .join(', ');
                    const convenioTexto = convenioNome ? ` (Convênio: ${convenioNome})` : '';
                    const nomeClinica = nomeClinicaData?.nome || 'Clínica';
                    const msg = `Olá, ${pacienteNome}!

Solicito que assine digitalmente as suas sessões de ${tipoAtend}${convenioTexto} com ${profissionalNome}.

Datas: ${datasFormatadas}

Acesse o link abaixo para assinar:
[link será gerado automaticamente]

${nomeClinica}`;
                    setMensagemPreview(msg);
                    setEtapaModal('preview');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Pré-visualizar Mensagem
                </button>
              </div>
            </>
          )}

          {/* Etapa 2: Pré-visualização editável */}
          {etapaModal === 'preview' && (
            <>
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-500">
                  Revise e edite a mensagem antes de enviar. O link real será inserido automaticamente ao gerar.
                </p>
                {/* Informações do envio */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <User className="w-3.5 h-3.5" />
                    <span><strong>Paciente:</strong> {(pacientes as any[]).find((p: any) => p.id === atendimentoParaLinkAssinatura?.pacienteId)?.nome || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span><strong>Profissional:</strong> {getProfissionalNome(atendimentoParaLinkAssinatura?.profissionalId)}</span>
                  </div>
                  {getConvenioNome(atendimentoParaLinkAssinatura?.convenioId) && (
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <FileSignature className="w-3.5 h-3.5" />
                      <span><strong>Convênio:</strong> {getConvenioNome(atendimentoParaLinkAssinatura?.convenioId)}</span>
                    </div>
                  )}
                </div>
                {/* Campo editável */}
                <textarea
                  value={mensagemPreview}
                  onChange={e => setMensagemPreview(e.target.value)}
                  rows={9}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
                <p className="text-xs text-gray-400">
                  O texto "[link será gerado automaticamente]" será substituído pelo link real ao enviar.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setEtapaModal('datas')}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  disabled={gerarLinkAssinaturaGuiaMutation.isPending}
                  onClick={() => {
                    if (!atendimentoParaLinkAssinatura) return;
                    const convenioNome = getConvenioNome(atendimentoParaLinkAssinatura.convenioId);
                    if (convenioUsaAssinaturaEmGuiaFisica(convenioNome)) {
                      toast.info(MENSAGEM_ASSINATURA_EM_GUIA_FISICA);
                      setShowModalDatasAssinatura(false);
                      setEtapaModal('datas');
                      return;
                    }
                    gerarLinkAssinaturaGuiaMutation.mutate({
                      guiaId: atendimentoParaLinkAssinatura.guiaId,
                      pacienteId: atendimentoParaLinkAssinatura.pacienteId,
                      atendimentoId: atendimentoParaLinkAssinatura.id,
                      datasAtendimento: datasAssinaturaSelecionadas,
                      mensagemPersonalizada: mensagemPreview,
                    });
                    setShowModalDatasAssinatura(false);
                    setEtapaModal('datas');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {gerarLinkAssinaturaGuiaMutation.isPending
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> A gerar...</>
                    : <><Send className="w-4 h-4" /> Gerar e Enviar Link</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )}
          {/* Modal Passar em Série */}
      <Dialog open={showPassarEmSerie} onOpenChange={setShowPassarEmSerie}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700">
              <Repeat2 className="w-5 h-5" /> Passar em Série
            </DialogTitle>
          </DialogHeader>
          {atendimentoSelecionado && (
            <div className="space-y-5">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800">
                <p className="font-semibold">{(pacientes as any[]).find((p: any) => p.id === atendimentoSelecionado.pacienteId)?.nome || 'Paciente'}</p>
                <p className="text-xs text-teal-600 mt-0.5">
                  Atendimento base: {atendimentoSelecionado.data ? formatDateBR(atendimentoSelecionado.data) : ''} às {atendimentoSelecionado.hora}
                </p>
              </div>
              {/* Seletor de data de início da série */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de início da série</label>
                <input
                  type="date"
                  value={serieDataInicio}
                  onChange={e => setSerieDataInicio(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-400 mt-1">As sessões serão criadas semanalmente a partir desta data.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['semanal', 'quinzenal', 'mensal'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setSerieFrequencia(f)}
                      className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition ${
                        serieFrequencia === f
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de sessões adicionais: <span className="text-teal-700 font-bold">{serieQuantidade}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={serieFrequencia === 'mensal' ? 24 : 52}
                  value={serieQuantidade}
                  onChange={e => setSerieQuantidade(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>{serieFrequencia === 'mensal' ? 24 : 52}</span>
                </div>
              </div>
              {/* Preview das datas */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Prévia das datas ({serieQuantidade} sessões)</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {Array.from({ length: Math.min(serieQuantidade, 10) }, (_, i) => {
                    // Usar serieDataInicio se preenchida, caso contrário usar data do atendimento base
                    const baseStr = serieDataInicio || (atendimentoSelecionado.data ? toSafeISODate(atendimentoSelecionado.data) : '');
                    const base = baseStr ? new Date(baseStr + 'T12:00:00') : new Date(atendimentoSelecionado.data);
                    const d = new Date(base);
                    if (serieFrequencia === 'semanal') d.setDate(d.getDate() + 7 * (i + 1));
                    else if (serieFrequencia === 'quinzenal') d.setDate(d.getDate() + 14 * (i + 1));
                    else d.setMonth(d.getMonth() + (i + 1));
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                        <span>{d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} às {atendimentoSelecionado.hora}</span>
                      </div>
                    );
                  })}
                  {serieQuantidade > 10 && (
                    <p className="text-xs text-gray-400 text-center py-1">... e mais {serieQuantidade - 10} sessões</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowPassarEmSerie(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  disabled={passarEmSerieMutation.isPending}
                  onClick={() => passarEmSerieMutation.mutate({
                    atendimentoId: atendimentoSelecionado.id,
                    frequencia: serieFrequencia,
                    quantidade: serieQuantidade,
                    dataInicio: serieDataInicio || undefined,
                  })}
                  className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition disabled:opacity-50"
                >
                  {passarEmSerieMutation.isPending ? 'Criando...' : `Criar Série (${serieQuantidade} sessões)`}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export default Agenda;
