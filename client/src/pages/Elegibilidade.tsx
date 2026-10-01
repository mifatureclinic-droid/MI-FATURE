import { useState, useMemo } from 'react';
import {
  Search, CheckCircle, XCircle, AlertCircle, Loader2,
  ShieldCheck, Calendar, CreditCard, User, Building2, RefreshCw,
  Users, PlayCircle, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { trpc } from '../lib/trpc';
import { getHojeBrasilia } from '../lib/utils';

/* ─────────────────────────── tipos ─────────────────────────── */
type StatusEleg = 'elegivel' | 'nao_elegivel' | 'sem_cadastro' | 'carteira_expirada';

type ResultadoConvenio = {
  convenioId: number;
  convenioNome: string;
  registroANS: string | null;
  status: StatusEleg;
  motivo: string;
  numeroCarteira: string | null;
  validadeCarteira: string | null;
  plano: string | null;
};

type ResultadoPaciente = {
  pacienteId: number;
  pacienteNome: string;
  hora: string;
  profissionalNome: string;
  statusGeral: 'elegivel' | 'atencao' | 'bloqueado';
  resultados: ResultadoConvenio[];
  expandido: boolean;
};

/* ─────────────────────────── helpers ─────────────────────────── */
function calcularElegibilidade(paciente: any, convenios: any[]): ResultadoConvenio[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return convenios
    .filter(c => c.ativo)
    .map(convenio => {
      const temConvenio = paciente.convenioId === convenio.id;

      if (!temConvenio) {
        return {
          convenioId: convenio.id,
          convenioNome: convenio.nome,
          registroANS: convenio.registroANS || null,
          status: 'sem_cadastro' as const,
          motivo: 'Paciente não possui cadastro neste convênio',
          numeroCarteira: null,
          validadeCarteira: null,
          plano: null,
        };
      }

      const numeroCarteira = paciente.numeroCarteira || null;
      const validadeCarteira = paciente.validadeCarteira;
      const plano = convenio.planos || null;

      if (!numeroCarteira) {
        return {
          convenioId: convenio.id,
          convenioNome: convenio.nome,
          registroANS: convenio.registroANS || null,
          status: 'nao_elegivel' as const,
          motivo: 'Número de carteirinha não cadastrado',
          numeroCarteira: null,
          validadeCarteira: null,
          plano,
        };
      }

      if (validadeCarteira) {
        const validade = new Date(validadeCarteira);
        validade.setHours(0, 0, 0, 0);
        if (validade < hoje) {
          return {
            convenioId: convenio.id,
            convenioNome: convenio.nome,
            registroANS: convenio.registroANS || null,
            status: 'carteira_expirada' as const,
            motivo: `Carteirinha vencida em ${validade.toLocaleDateString('pt-BR')}`,
            numeroCarteira,
            validadeCarteira: validade.toLocaleDateString('pt-BR'),
            plano,
          };
        }
      }

      return {
        convenioId: convenio.id,
        convenioNome: convenio.nome,
        registroANS: convenio.registroANS || null,
        status: 'elegivel' as const,
        motivo: validadeCarteira
          ? `Válida até ${new Date(validadeCarteira).toLocaleDateString('pt-BR')}`
          : 'Carteirinha sem data de vencimento cadastrada',
        numeroCarteira,
        validadeCarteira: validadeCarteira
          ? new Date(validadeCarteira).toLocaleDateString('pt-BR')
          : null,
        plano,
      };
    });
}

function statusGeralPaciente(resultados: ResultadoConvenio[]): 'elegivel' | 'atencao' | 'bloqueado' {
  const doConvenio = resultados.filter(r => r.status !== 'sem_cadastro');
  if (doConvenio.length === 0) return 'bloqueado';
  if (doConvenio.some(r => r.status === 'elegivel')) return 'elegivel';
  if (doConvenio.some(r => r.status === 'carteira_expirada')) return 'atencao';
  return 'bloqueado';
}

/* ─────────────────────────── configs visuais ─────────────────────────── */
const statusConfig = {
  elegivel: {
    label: 'Elegível',
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
  },
  nao_elegivel: {
    label: 'Não Elegível',
    icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
  },
  carteira_expirada: {
    label: 'Carteira Expirada',
    icon: AlertCircle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
  sem_cadastro: {
    label: 'Sem Cadastro',
    icon: AlertCircle,
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-600',
  },
};

const geralConfig = {
  elegivel: { label: 'Elegível', bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  atencao: { label: 'Atenção', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  bloqueado: { label: 'Bloqueado', bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};

/* ═══════════════════════════ COMPONENTE PRINCIPAL ═══════════════════════════ */
export function Elegibilidade() {
  const [aba, setAba] = useState<'individual' | 'lote'>('individual');

  const { data: pacientes = [], isLoading: loadingPacientes } = trpc.pacientes.list.useQuery();
  const { data: convenios = [], isLoading: loadingConvenios } = trpc.convenios.list.useQuery();
  const { data: atendimentos = [], isLoading: loadingAtend } = trpc.atendimentos.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();

  const loading = loadingPacientes || loadingConvenios || loadingAtend;

  /* ── atendimentos de hoje ── */
  const hoje = useMemo(() => getHojeBrasilia(), []);

  const atendimentosHoje = useMemo(() =>
    atendimentos.filter((a: any) => {
      const dataAtend = a.data instanceof Date
        ? a.data.toISOString().split('T')[0]
        : String(a.data).split('T')[0];
      return dataAtend === hoje && a.status === 'agendado';
    }).sort((a: any, b: any) => (a.hora || '').localeCompare(b.hora || '')),
    [atendimentos, hoje]
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2.5 rounded-xl">
          <ShieldCheck className="w-6 h-6 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificação de Elegibilidade</h1>
          <p className="text-sm text-gray-500">Consulta automática em todos os convênios cadastrados</p>
        </div>
      </div>

      {/* Separadores */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAba('individual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            aba === 'individual'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="w-4 h-4" />
          Individual
        </button>
        <button
          onClick={() => setAba('lote')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            aba === 'lote'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Verificar em Lote
          {atendimentosHoje.length > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
              {atendimentosHoje.length}
            </span>
          )}
        </button>
      </div>

      {/* Conteúdo das abas */}
      {aba === 'individual' ? (
        <AbaIndividual
          pacientes={pacientes}
          convenios={convenios}
          loading={loading}
        />
      ) : (
        <AbaLote
          atendimentosHoje={atendimentosHoje}
          pacientes={pacientes}
          convenios={convenios}
          profissionais={profissionais}
          loading={loading}
          hoje={hoje}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════ ABA INDIVIDUAL ═══════════════════════════ */
function AbaIndividual({ pacientes, convenios, loading }: {
  pacientes: any[];
  convenios: any[];
  loading: boolean;
}) {
  const [busca, setBusca] = useState('');
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null);
  const [verificado, setVerificado] = useState(false);
  const [resultados, setResultados] = useState<ResultadoConvenio[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');

  const pacientesFiltrados = useMemo(() => {
    if (!busca.trim()) return [];
    const termo = busca.toLowerCase();
    return pacientes.filter(p =>
      (p.nome || '').toLowerCase().includes(termo) ||
      (p.cpf || '').includes(termo)
    ).slice(0, 8);
  }, [busca, pacientes]);

  const handleSelecionarPaciente = (paciente: any) => {
    setPacienteSelecionado(paciente);
    setBusca(paciente.nome);
    setVerificado(false);
    setResultados([]);
  };

  const handleVerificar = () => {
    if (!pacienteSelecionado) return;
    const res = calcularElegibilidade(pacienteSelecionado, convenios);
    setResultados(res);
    setVerificado(true);
  };

  const handleLimpar = () => {
    setBusca('');
    setPacienteSelecionado(null);
    setVerificado(false);
    setResultados([]);
    setFiltroStatus('todos');
  };

  const resultadosFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return resultados;
    return resultados.filter(r => r.status === filtroStatus);
  }, [resultados, filtroStatus]);

  const resumo = useMemo(() => ({
    total: resultados.length,
    elegiveis: resultados.filter(r => r.status === 'elegivel').length,
    expirados: resultados.filter(r => r.status === 'carteira_expirada').length,
    semCadastro: resultados.filter(r => r.status === 'sem_cadastro').length,
  }), [resultados]);

  return (
    <div className="space-y-6">
      {/* Painel de busca */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-500" />
          Identificar Beneficiário
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={busca}
            onChange={e => {
              setBusca(e.target.value);
              if (pacienteSelecionado && e.target.value !== pacienteSelecionado.nome) {
                setPacienteSelecionado(null);
                setVerificado(false);
                setResultados([]);
              }
            }}
            placeholder="Buscar por nome ou CPF do paciente..."
            className="pl-9 pr-4"
          />
          {busca.trim() && !pacienteSelecionado && pacientesFiltrados.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {pacientesFiltrados.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelecionarPaciente(p)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-medium text-gray-900">{p.nome}</p>
                  <p className="text-xs text-gray-500">CPF: {p.cpf || 'não informado'}</p>
                </button>
              ))}
            </div>
          )}
          {busca.trim() && !pacienteSelecionado && pacientesFiltrados.length === 0 && !loading && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3">
              <p className="text-sm text-gray-500">Nenhum paciente encontrado.</p>
            </div>
          )}
        </div>

        {pacienteSelecionado && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-blue-200 rounded-full p-2">
                <User className="w-4 h-4 text-blue-800" />
              </div>
              <div>
                <p className="font-semibold text-blue-900">{pacienteSelecionado.nome}</p>
                <p className="text-xs text-blue-700">
                  CPF: {pacienteSelecionado.cpf || 'não informado'} &bull;{' '}
                  Nascimento: {pacienteSelecionado.dataNascimento
                    ? new Date(pacienteSelecionado.dataNascimento).toLocaleDateString('pt-BR')
                    : 'não informado'}
                </p>
              </div>
            </div>
            <button onClick={handleLimpar} className="text-xs text-blue-500 hover:text-blue-700 underline whitespace-nowrap">
              Limpar
            </button>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <Button
            onClick={handleVerificar}
            disabled={!pacienteSelecionado || loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</>
            ) : (
              <><ShieldCheck className="w-4 h-4" /> Verificar em Todos os Convênios</>
            )}
          </Button>
          {verificado && (
            <Button variant="outline" onClick={handleVerificar} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reverificar
            </Button>
          )}
        </div>
      </div>

      {verificado && resultados.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'todos', label: 'Total', value: resumo.total, bg: 'bg-white border-gray-200', text: 'text-gray-900' },
              { key: 'elegivel', label: 'Elegíveis', value: resumo.elegiveis, bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
              { key: 'carteira_expirada', label: 'Expirada', value: resumo.expirados, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
              { key: 'sem_cadastro', label: 'Sem Cadastro', value: resumo.semCadastro, bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
            ].map(card => (
              <button
                key={card.key}
                onClick={() => setFiltroStatus(card.key)}
                className={`p-4 rounded-xl border text-left transition-all ${card.bg} ${filtroStatus === card.key ? 'ring-2 ring-blue-400' : ''}`}
              >
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </button>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Resultado por Convênio</h3>
              <span className="text-xs text-gray-400">{resultadosFiltrados.length} convênio(s)</span>
            </div>
            <div className="divide-y divide-gray-100">
              {resultadosFiltrados.map(res => {
                const cfg = statusConfig[res.status];
                const Icon = cfg.icon;
                return (
                  <div key={res.convenioId} className={`flex items-start gap-4 px-5 py-4 ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${cfg.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{res.convenioNome}</span>
                        {res.registroANS && <span className="text-xs text-gray-400">ANS: {res.registroANS}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
                      </div>
                      <p className={`text-xs mt-1 ${cfg.text}`}>{res.motivo}</p>
                      {res.status !== 'sem_cadastro' && (
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          {res.numeroCarteira && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <CreditCard className="w-3 h-3" />{res.numeroCarteira}
                            </span>
                          )}
                          {res.validadeCarteira && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />Válida até {res.validadeCarteira}
                            </span>
                          )}
                          {res.plano && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <Building2 className="w-3 h-3" />{res.plano}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════ ABA LOTE ═══════════════════════════ */
function AbaLote({ atendimentosHoje, pacientes, convenios, profissionais, loading, hoje }: {
  atendimentosHoje: any[];
  pacientes: any[];
  convenios: any[];
  profissionais: any[];
  loading: boolean;
  hoje: string;
}) {
  const [processado, setProcessado] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoPaciente[]>([]);
  const [filtroGeral, setFiltroGeral] = useState<string>('todos');

  const dataHojeFormatada = useMemo(() => {
    const [ano, mes, dia] = hoje.split('-');
    return `${dia}/${mes}/${ano}`;
  }, [hoje]);

  const handleProcessar = () => {
    setProcessando(true);
    // Processar em microtasks para não bloquear a UI
    setTimeout(() => {
      const res: ResultadoPaciente[] = atendimentosHoje.map(atend => {
        const paciente = pacientes.find(p => p.id === atend.pacienteId);
        const profissional = profissionais.find(p => p.id === atend.profissionalId);

        if (!paciente) {
          return {
            pacienteId: atend.pacienteId,
            pacienteNome: `Paciente #${atend.pacienteId}`,
            hora: atend.hora || '--:--',
            profissionalNome: profissional?.nome || 'Profissional não encontrado',
            statusGeral: 'bloqueado' as const,
            resultados: [],
            expandido: false,
          };
        }

        const resultadosConvenio = calcularElegibilidade(paciente, convenios);
        const sg = statusGeralPaciente(resultadosConvenio);

        return {
          pacienteId: paciente.id,
          pacienteNome: paciente.nome,
          hora: atend.hora || '--:--',
          profissionalNome: profissional?.nome || 'Profissional não encontrado',
          statusGeral: sg,
          resultados: resultadosConvenio,
          expandido: false,
        };
      });

      setResultados(res);
      setProcessado(true);
      setProcessando(false);
    }, 300);
  };

  const toggleExpandir = (pacienteId: number) => {
    setResultados(prev =>
      prev.map(r => r.pacienteId === pacienteId ? { ...r, expandido: !r.expandido } : r)
    );
  };

  const resultadosFiltrados = useMemo(() => {
    if (filtroGeral === 'todos') return resultados;
    return resultados.filter(r => r.statusGeral === filtroGeral);
  }, [resultados, filtroGeral]);

  const resumo = useMemo(() => ({
    total: resultados.length,
    elegiveis: resultados.filter(r => r.statusGeral === 'elegivel').length,
    atencao: resultados.filter(r => r.statusGeral === 'atencao').length,
    bloqueados: resultados.filter(r => r.statusGeral === 'bloqueado').length,
  }), [resultados]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Painel de controlo */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Agenda do Dia — {dataHojeFormatada}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {atendimentosHoje.length > 0 ? `${atendimentosHoje.length} atendimento(s) agendado(s) com status "agendado"` : ''}
            </p>
          </div>
          <Button
            onClick={handleProcessar}
            disabled={atendimentosHoje.length === 0 || processando}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {processando ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
            ) : (
              <><PlayCircle className="w-4 h-4" /> {processado ? 'Reprocessar' : 'Processar Elegibilidade'}</>
            )}
          </Button>
        </div>

        {/* Lista prévia dos atendimentos */}
        {!processado && atendimentosHoje.length > 0 && (
          <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pacientes a verificar
            </div>
            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {atendimentosHoje.map((atend: any) => {
                const pac = pacientes.find(p => p.id === atend.pacienteId);
                const prof = profissionais.find((p: any) => p.id === atend.profissionalId);
                return (
                  <div key={atend.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 w-12">{atend.hora}</span>
                    <span className="text-sm text-gray-900 flex-1">{pac?.nome || `Paciente #${atend.pacienteId}`}</span>
                    <span className="text-xs text-gray-400">{prof?.nome || '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Resultados do lote */}
      {processado && resultados.length > 0 && (
        <>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'todos', label: 'Total', value: resumo.total, bg: 'bg-white border-gray-200', text: 'text-gray-900' },
              { key: 'elegivel', label: 'Elegíveis', value: resumo.elegiveis, bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
              { key: 'atencao', label: 'Atenção', value: resumo.atencao, bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
              { key: 'bloqueado', label: 'Bloqueados', value: resumo.bloqueados, bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
            ].map(card => (
              <button
                key={card.key}
                onClick={() => setFiltroGeral(card.key)}
                className={`p-4 rounded-xl border text-left transition-all ${card.bg} ${filtroGeral === card.key ? 'ring-2 ring-blue-400' : ''}`}
              >
                <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </button>
            ))}
          </div>

          {/* Lista de pacientes */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Resultado por Paciente</h3>
              <span className="text-xs text-gray-400">{resultadosFiltrados.length} paciente(s)</span>
            </div>
            <div className="divide-y divide-gray-100">
              {resultadosFiltrados.map(res => {
                const gcfg = geralConfig[res.statusGeral];
                const convenioDoP = convenios.find(c => c.id === pacientes.find(p => p.id === res.pacienteId)?.convenioId);
                return (
                  <div key={res.pacienteId}>
                    {/* Linha principal */}
                    <button
                      onClick={() => toggleExpandir(res.pacienteId)}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 w-16 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{res.hora}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{res.pacienteNome}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {res.profissionalNome}
                          {convenioDoP && ` · ${convenioDoP.nome}`}
                        </p>
                      </div>
                      <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${gcfg.bg} ${gcfg.text} flex-shrink-0`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${gcfg.dot}`} />
                        {gcfg.label}
                      </span>
                      {res.expandido
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      }
                    </button>

                    {/* Detalhe expandido */}
                    {res.expandido && res.resultados.length > 0 && (
                      <div className="px-5 pb-4 bg-gray-50 border-t border-gray-100">
                        <div className="mt-3 space-y-2">
                          {res.resultados.map(rc => {
                            const cfg = statusConfig[rc.status];
                            const Icon = cfg.icon;
                            return (
                              <div key={rc.convenioId} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${cfg.text}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-gray-800">{rc.convenioNome}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                                  </div>
                                  <p className={`text-xs mt-0.5 ${cfg.text}`}>{rc.motivo}</p>
                                  {rc.numeroCarteira && (
                                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                      <CreditCard className="w-3 h-3" />{rc.numeroCarteira}
                                      {rc.validadeCarteira && ` · válida até ${rc.validadeCarteira}`}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Verificação baseada nos dados cadastrados no sistema. Clique em cada paciente para ver o detalhe por convênio.
            </p>
          </div>
        </>
      )}

      {processado && resultados.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum resultado para exibir.</p>
        </div>
      )}
    </div>
  );
}
