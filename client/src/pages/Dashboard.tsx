import { Activity, ClipboardCheck, Clock, FileCheck, Receipt, DollarSign, AlertTriangle, TrendingUp, CheckCircle, Users, Calendar } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';
import { FluxoAtendimentoInfo } from '../components/FluxoAtendimentoInfo';
import { PainelConfirmacoesProfissional } from '../components/PainelConfirmacoesProfissional';
import { trpc } from '@/lib/trpc';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Aguardando atendimento',
  realizado: 'Atendido',
  cancelado: 'Não chegou / Cancelado',
  falta: 'Faltou',
};

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-700',
  realizado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  falta: 'bg-yellow-100 text-yellow-700',
};

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();

  const totalAgendado = stats?.atendimentosPorStatus.find(s => s.status === 'agendado')?.total ?? 0;
  const totalRealizado = stats?.atendimentosPorStatus.find(s => s.status === 'realizado')?.total ?? 0;
  const totalCancelado = stats?.atendimentosPorStatus.find(s => s.status === 'cancelado')?.total ?? 0;
  const totalFalta = stats?.atendimentosPorStatus.find(s => s.status === 'falta')?.total ?? 0;

  const totalGuiasRascunho = stats?.guiasPorStatus.find(s => s.status === 'rascunho')?.total ?? 0;
  const totalGuiasEmitidas = stats?.guiasPorStatus.find(s => s.status === 'emitida')?.total ?? 0;
  const totalGuiasEnviadas = stats?.guiasPorStatus.find(s => s.status === 'enviada')?.total ?? 0;
  const totalGuiasPagas = stats?.guiasPorStatus.find(s => s.status === 'paga')?.total ?? 0;
  const totalGuiasGlosa = stats?.guiasPorStatus.find(s => s.status === 'glosa')?.total ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Dashboard MIFATURE</h1>
        <p className="text-gray-600">Sistema de Faturamento Automatizado para Clinicas</p>
      </div>

      {/* Indicadores Operacionais Reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Atendimentos"
          value={isLoading ? '...' : String(stats?.totalAtendimentos ?? 0)}
          icon={Calendar}
          subtitle="Todos os registros"
        />
        <StatsCard
          title="Atendimentos Hoje"
          value={isLoading ? '...' : String(stats?.atendimentosHoje ?? 0)}
          icon={Activity}
          subtitle="Agendados para hoje"
        />
        <StatsCard
          title="Atendimentos no Mes"
          value={isLoading ? '...' : String(stats?.atendimentosMes ?? 0)}
          icon={TrendingUp}
          subtitle="Mes corrente"
        />
        <StatsCard
          title="Total de Pacientes"
          value={isLoading ? '...' : String(stats?.totalPacientes ?? 0)}
          icon={Users}
          subtitle="Pacientes cadastrados"
        />
      </div>

      {/* Status de Atendimentos */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status dos Atendimentos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Aguardando atendimento"
            value={isLoading ? '...' : String(totalAgendado)}
            icon={Activity}
            subtitle="Consultas agendadas"
          />
          <StatsCard
            title="Atendido"
            value={isLoading ? '...' : String(totalRealizado)}
            icon={CheckCircle}
            subtitle="Atendimentos realizados"
          />
          <StatsCard
            title="Não chegou / Cancelado"
            value={isLoading ? '...' : String(totalCancelado)}
            icon={AlertTriangle}
            subtitle="Atendimentos cancelados"
          />
          <StatsCard
            title="Faltou"
            value={isLoading ? '...' : String(totalFalta)}
            icon={Clock}
            subtitle="Pacientes faltantes"
          />
        </div>
      </div>

      {/* Status das Guias SADT */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Status das Guias SADT</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            title="Rascunho"
            value={isLoading ? '...' : String(totalGuiasRascunho)}
            icon={FileCheck}
            subtitle="Guias em rascunho"
          />
          <StatsCard
            title="Emitidas"
            value={isLoading ? '...' : String(totalGuiasEmitidas)}
            icon={ClipboardCheck}
            subtitle="Guias emitidas"
          />
          <StatsCard
            title="Enviadas"
            value={isLoading ? '...' : String(totalGuiasEnviadas)}
            icon={Receipt}
            subtitle="Guias enviadas"
          />
          <button
            onClick={() => onNavigate('fechamento')}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <StatsCard
              title="Pagas"
              value={isLoading ? '...' : String(totalGuiasPagas)}
              icon={DollarSign}
              subtitle="Guias pagas"
            />
          </button>
          <StatsCard
            title="Glosas"
            value={isLoading ? '...' : String(totalGuiasGlosa)}
            icon={AlertTriangle}
            subtitle="Guias glosadas"
          />
        </div>
      </div>

      {/* Painel de Confirmacoes para Profissionais */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Confirmacoes de Presenca</h2>
        <PainelConfirmacoesProfissional />
      </div>

      <FluxoAtendimentoInfo />
    </div>
  );
}
