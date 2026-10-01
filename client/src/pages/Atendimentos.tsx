import { Button } from '../components/ui/button';
import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import { FileText, Search, Filter, AlertTriangle, CheckCircle, Clock, ClipboardList, ChevronLeft, ChevronRight, CreditCard, FileSignature } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../_core/hooks/useAuth';
import { useProntuarioContext } from '../contexts/ProntuarioContext';
import { format, addDays, subDays, isToday } from 'date-fns';
import { formatDateBR } from '../lib/utils';
import { ehProfissionalNoMenu } from '@shared/acoesPorPerfil';
import { ptBR } from 'date-fns/locale';
import { AbaPagamentoAtendimento } from '../components/AbaPagamentoAtendimento';
import { ehConvenioParticular } from '@shared/repasseParticular';

interface AtendimentosProps {
  onNavigate?: (page: string) => void;
}

export function Atendimentos({ onNavigate }: AtendimentosProps) {
  const { user } = useAuth();
  const perfil = (user as any)?.perfil as string | undefined;
  const isMaster = (user as any)?.role === 'admin';
  const isProfissional = ehProfissionalNoMenu({
    perfil,
    role: (user as any)?.role,
    profissionalVinculadoId: (user as any)?.profissionalVinculadoId,
  });

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroDia, setFiltroDia] = useState<Date>(new Date());
  const [modoFiltro, setModoFiltro] = useState<'dia' | 'todos'>('dia');
  const [abaPagamentoAberta, setAbaPagamentoAberta] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);

  // Verificar se é master ou recepção
  const isRecepção = perfil === 'recepção' || perfil === 'recepcao';
  const canAccessPagamentos = isMaster || isRecepção;

  const { setProntuarioTarget } = useProntuarioContext();

  const { data: atendimentos = [], isLoading: loadingAtendimentos } = trpc.atendimentos.list.useQuery();
  const { data: pacientes = [] } = trpc.pacientes.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();

  const getPacienteNome = (id: number) => {
    const p = (pacientes as any[]).find((p: any) => p.id === id);
    return p?.nome || `Paciente #${id}`;
  };

  const getProfissionalNome = (id: number) => {
    const p = (profissionais as any[]).find((p: any) => p.id === id);
    return p?.nome || `Profissional #${id}`;
  };

  const getConvenioNome = (id: number) => {
    const c = (convenios as any[]).find((c: any) => c.id === id);
    return c?.nome || 'Particular';
  };

  const isParticular = (convenioId: number) => {
    const c = (convenios as any[]).find((c: any) => c.id === convenioId);
    return ehConvenioParticular(c?.nome);
  };

  // Verifica se o prontuário está atrasado (passou do prazo de 72h e não foi preenchido)
  const isProntuarioAtrasado = (atendimento: any): boolean => {
    if (atendimento.prontuarioFeito) return false;
    if (!atendimento.dataLimiteProntuario) return false;
    const agora = new Date();
    const dataLimite = new Date(atendimento.dataLimiteProntuario);
    return agora > dataLimite && !atendimento.liberadoPorMaster;
  };

  // Verifica se o prontuário está pendente (dentro do prazo, mas ainda não preenchido)
  const isProntuarioPendente = (atendimento: any): boolean => {
    if (atendimento.prontuarioFeito) return false;
    if (atendimento.status !== 'realizado') return false;
    if (!atendimento.dataLimiteProntuario) return false;
    const agora = new Date();
    const dataLimite = new Date(atendimento.dataLimiteProntuario);
    return agora <= dataLimite;
  };

  const atendimentosFiltrados = useMemo(() => {
    return (atendimentos as any[]).filter((a: any) => {
      const nomePaciente = getPacienteNome(a.pacienteId).toLowerCase();
      const nomeProfissional = getProfissionalNome(a.profissionalId).toLowerCase();
      const nomeConvenio = getConvenioNome(a.convenioId).toLowerCase();

      const matchBusca = busca === '' ||
        nomePaciente.includes(busca.toLowerCase()) ||
        nomeProfissional.includes(busca.toLowerCase()) ||
        nomeConvenio.includes(busca.toLowerCase()) ||
        (a.tipo || '').toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === 'todos' || a.status === filtroStatus;

      // Filtro por dia
      let matchDia = true;
      if (modoFiltro === 'dia') {
        const dataAtend = typeof a.data === 'string' ? a.data.split('T')[0] : format(new Date(a.data), 'yyyy-MM-dd');
        const diaFiltro = format(filtroDia, 'yyyy-MM-dd');
        matchDia = dataAtend === diaFiltro;
      }

      return matchBusca && matchStatus && matchDia;
    }).sort((a: any, b: any) => {
      const getDataStr = (d: any) => {
        if (!d) return '1970-01-01';
        if (typeof d === 'string') return d.split('T')[0];
        try { return format(new Date(d), 'yyyy-MM-dd'); } catch { return '1970-01-01'; }
      };
      const da = new Date(`${getDataStr(a.data)}T${a.hora || '00:00'}`).getTime();
      const db = new Date(`${getDataStr(b.data)}T${b.hora || '00:00'}`).getTime();
      return modoFiltro === 'dia' ? da - db : db - da;
    });
  }, [atendimentos, pacientes, profissionais, convenios, busca, filtroStatus, modoFiltro, filtroDia]);

  // Contagem de prontuários atrasados (para o profissional)
  const totalAtrasados = useMemo(() => {
    if (!isProfissional) return 0;
    return (atendimentos as any[]).filter((a: any) => isProntuarioAtrasado(a)).length;
  }, [atendimentos, isProfissional]);

  const statusColor = (status: string, reagendado?: boolean) => {
    if (reagendado) return 'bg-orange-100 text-orange-700';
    switch (status) {
      case 'realizado': return 'bg-green-100 text-green-700';
      case 'agendado': return 'bg-blue-100 text-blue-700';
      case 'cancelado': return 'bg-red-100 text-red-700';
      case 'falta': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statusLabel = (status: string, reagendado?: boolean) => {
    if (reagendado) return 'Reagendou';
    switch (status) {
      case 'realizado': return 'Atendido';
      case 'agendado': return 'Aguardando atendimento';
      case 'cancelado': return 'Não chegou / Cancelado';
      case 'falta': return 'Faltou';
      default: return status;
    }
  };

  const formatarData = (data: any) => {
    if (!data) return '-';
    try {
      return formatDateBR(data);
    } catch { return '-'; }
  };

  const handleIrParaProntuario = (atendimento: any) => {
    setProntuarioTarget(atendimento.pacienteId, atendimento.id);
    onNavigate?.('prontuario');
  };

  const diaLabel = isToday(filtroDia)
    ? 'Hoje'
    : format(filtroDia, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="p-6 space-y-5">
      {/* Alerta de prontuários atrasados para profissional */}
      {isProfissional && totalAtrasados > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              {totalAtrasados} prontuário{totalAtrasados !== 1 ? 's' : ''} fora do prazo
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Prontuários não preenchidos dentro de 72h ficam bloqueados. Solicite liberação ao administrador.
            </p>
          </div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isProfissional ? 'Meus Atendimentos' : 'Atendimentos'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isProfissional
              ? 'Clique em "Preencher" para registar o prontuário do paciente'
              : 'Registo de todos os atendimentos'}
          </p>
        </div>

        {/* Navegação por dia */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setModoFiltro('dia'); setFiltroDia(d => subDays(d, 1)); }}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <button
            onClick={() => setModoFiltro(m => m === 'dia' ? 'todos' : 'dia')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-w-[160px] text-center ${
              modoFiltro === 'dia'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {modoFiltro === 'dia' ? diaLabel : 'Todos os dias'}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setModoFiltro('dia'); setFiltroDia(d => addDays(d, 1)); }}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          {modoFiltro === 'dia' && !isToday(filtroDia) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltroDia(new Date())}
              className="text-xs h-8"
            >
              Hoje
            </Button>
          )}
        </div>
      </div>

      {/* Filtros de busca */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por paciente, profissional..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
          >
            <option value="todos">Todos os status</option>
            <option value="agendado">Aguardando atendimento</option>
            <option value="realizado">Atendido</option>
            <option value="falta">Faltou</option>
            <option value="cancelado">Não chegou / Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {loadingAtendimentos ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">A carregar atendimentos...</p>
            </div>
          </div>
        ) : atendimentosFiltrados.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum atendimento encontrado</p>
              {modoFiltro === 'dia' ? (
                <p className="text-xs mt-1">Sem atendimentos para {diaLabel.toLowerCase()}</p>
              ) : (
                <p className="text-xs mt-1">Tente ajustar os filtros de busca</p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Data/Hora</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                    {!isProfissional && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Profissional</th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Convênio</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    {isProfissional && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Assinatura</th>
                    )}
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prontuário</th>
                    {!isProfissional && (
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acções</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {atendimentosFiltrados.map((atendimento: any) => {
                    const atrasado = isProntuarioAtrasado(atendimento);
                    const pendente = isProntuarioPendente(atendimento);
                    const feito = !!atendimento.prontuarioFeito;
                    const assinaturaConfirmada = atendimento.assinadoPaciente === true || atendimento.assinadoPaciente === 1;
                    const prontuarioPendenteComAssinatura = isProfissional && assinaturaConfirmada && !feito;

                    return (
                      <tr key={atendimento.id} className={`hover:bg-gray-50 transition-colors ${atrasado ? 'bg-red-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">{formatarData(atendimento.data)}</div>
                            <div className="text-gray-500 text-xs">{atendimento.hora || '-'}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-gray-800">{getPacienteNome(atendimento.pacienteId)}</div>
                        </td>
                        {!isProfissional && (
                          <td className="px-5 py-4 text-sm text-gray-600">
                            {getProfissionalNome(atendimento.profissionalId)}
                          </td>
                        )}
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            isParticular(atendimento.convenioId)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {getConvenioNome(atendimento.convenioId)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          {atendimento.tipo || '-'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(atendimento.status, !!(atendimento.reagendadoPara))}`}>
                            {statusLabel(atendimento.status, !!(atendimento.reagendadoPara))}
                          </span>
                        </td>
                        {isProfissional && (
                          <td className="px-5 py-4">
                            {assinaturaConfirmada ? (
                              <div className="flex flex-col items-start gap-1">
                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs gap-1 border-0">
                                  <FileSignature className="w-3 h-3" />
                                  Assinada
                                </Badge>
                                {prontuarioPendenteComAssinatura && (
                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs gap-1 border-0">
                                    <Clock className="w-3 h-3" />
                                    Prontuário pendente
                                  </Badge>
                                )}
                              </div>
                            ) : atendimento.assinaturaPendente ? (
                              <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs gap-1 border-0">
                                <Clock className="w-3 h-3" />
                                Assinatura pendente
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                        )}
                        {/* Tag de prontuário */}
                        <td className="px-5 py-4">
                          {feito ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs gap-1 border-0">
                              <CheckCircle className="w-3 h-3" />
                              Preenchido
                            </Badge>
                          ) : atrasado ? (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs gap-1 border-0">
                              <AlertTriangle className="w-3 h-3" />
                              Atrasado
                            </Badge>
                          ) : pendente ? (
                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs gap-1 border-0">
                              <Clock className="w-3 h-3" />
                              Pendente
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        {!isProfissional && (
                          <td className="px-5 py-4 space-x-2 flex">
                            {/* Botão de prontuário para atendimentos realizados */}
                            {atendimento.status === 'realizado' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleIrParaProntuario(atendimento)}
                                className={`text-xs gap-1.5 ${
                                  atrasado
                                    ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                    : feito
                                    ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                }`}
                              >
                                <ClipboardList className="w-3.5 h-3.5" />
                                Ir para Prontuário
                              </Button>
                            )}
                            
                            {/* Botão de pagamento para master e recepção */}
                            {canAccessPagamentos && isParticular(atendimento.convenioId) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setAtendimentoSelecionado(atendimento);
                                  setAbaPagamentoAberta(true);
                                }}
                                className="text-xs gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Pagamento
                              </Button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t text-xs text-gray-500 flex items-center justify-between">
              <span>
                {atendimentosFiltrados.length} atendimento{atendimentosFiltrados.length !== 1 ? 's' : ''}
                {modoFiltro === 'dia' ? ` em ${diaLabel}` : ' no total'}
              </span>
              {isProfissional && totalAtrasados > 0 && (
                <span className="text-red-600 font-medium">
                  {totalAtrasados} com prontuário atrasado
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal de Pagamento */}
      {abaPagamentoAberta && atendimentoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AbaPagamentoAtendimento
              atendimentoId={atendimentoSelecionado.id}
              pacienteId={atendimentoSelecionado.pacienteId}
              profissionalId={atendimentoSelecionado.profissionalId}
              pacienteNome={getPacienteNome(atendimentoSelecionado.pacienteId)}
              convenioNome={getConvenioNome(atendimentoSelecionado.convenioId)}
              isVisible={true}
              onClose={() => {
                setAbaPagamentoAberta(false);
                setAtendimentoSelecionado(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
