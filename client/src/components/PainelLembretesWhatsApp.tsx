import { useState } from 'react';
import { MessageCircle, Clock, Send, CheckCircle2, XCircle, Calendar, User, Stethoscope } from 'lucide-react';
import { trpc } from '../lib/trpc';

type StatusFiltro = 'pendentes' | 'enviados' | 'confirmados' | 'nao_confirmados';

const statusConfig: Record<StatusFiltro, { label: string; color: string; bgColor: string; iconColor: string; icon: typeof Clock }> = {
  pendentes: {
    label: 'Pendentes',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
    iconColor: 'bg-amber-100 text-amber-600',
    icon: Clock,
  },
  enviados: {
    label: 'Enviados',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
    iconColor: 'bg-blue-100 text-blue-600',
    icon: Send,
  },
  confirmados: {
    label: 'Confirmados',
    color: 'text-green-700',
    bgColor: 'bg-green-50 border-green-200',
    iconColor: 'bg-green-100 text-green-600',
    icon: CheckCircle2,
  },
  nao_confirmados: {
    label: 'Não Confirmados',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
    iconColor: 'bg-red-100 text-red-600',
    icon: XCircle,
  },
};

export function PainelLembretesWhatsApp() {
  const [statusSelecionado, setStatusSelecionado] = useState<StatusFiltro>('pendentes');

  const { data: estatisticas, isLoading: loadingStats } = trpc.lembretesStats.getEstatisticas.useQuery();
  const { data: detalhes = [], isLoading: loadingDetalhes } = trpc.lembretesStats.getDetalhes.useQuery({
    status: statusSelecionado,
  });

  const cards: { key: StatusFiltro; value: number }[] = [
    { key: 'pendentes', value: estatisticas?.totalPendentes ?? 0 },
    { key: 'enviados', value: estatisticas?.totalEnviados ?? 0 },
    { key: 'confirmados', value: estatisticas?.totalConfirmados ?? 0 },
    { key: 'nao_confirmados', value: estatisticas?.totalNaoConfirmados ?? 0 },
  ];

  const formatarData = (data: Date | string) => {
    const d = typeof data === 'string' ? new Date(data) : data;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-medium">Lembretes de WhatsApp</h2>
            <p className="text-sm text-gray-500">Status dos lembretes de consulta e confirmações</p>
          </div>
        </div>
        {!loadingStats && estatisticas && (
          <div className="text-right">
            <p className="text-2xl font-semibold text-green-600">{estatisticas.taxaConfirmacao}%</p>
            <p className="text-xs text-gray-500">Taxa de confirmação</p>
          </div>
        )}
      </div>

      {/* Cards de status (clicáveis) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(({ key, value }) => {
          const config = statusConfig[key];
          const Icon = config.icon;
          const ativo = statusSelecionado === key;
          return (
            <button
              key={key}
              onClick={() => setStatusSelecionado(key)}
              className={`text-left border rounded-lg p-4 transition-all active:scale-[0.98] ${
                ativo ? `${config.bgColor} ring-2 ring-offset-1 ring-current ${config.color}` : 'bg-white hover:bg-gray-50'
              }`}
              style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', transitionDuration: '160ms' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{config.label}</p>
                  <p className="text-2xl font-semibold">{loadingStats ? '—' : value}</p>
                </div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${config.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Lista de detalhes */}
      <div className="border rounded-lg overflow-hidden">
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${statusConfig[statusSelecionado].bgColor}`}>
          {(() => {
            const Icon = statusConfig[statusSelecionado].icon;
            return <Icon className={`w-4 h-4 ${statusConfig[statusSelecionado].color}`} />;
          })()}
          <span className={`text-sm font-medium ${statusConfig[statusSelecionado].color}`}>
            {statusConfig[statusSelecionado].label} — {detalhes.length} atendimento(s)
          </span>
        </div>

        {loadingDetalhes ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : detalhes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum atendimento nesta categoria.
          </div>
        ) : (
          <div className="divide-y max-h-80 overflow-y-auto">
            {detalhes.map((item: any) => (
              <div key={item.atendimento.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <p className="font-medium truncate">{item.paciente.nome}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {item.profissional.nome}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatarData(item.atendimento.data)} às {item.atendimento.hora}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  {item.paciente.whatsapp ? (
                    <span className="text-xs text-gray-500">{item.paciente.whatsapp}</span>
                  ) : (
                    <span className="text-xs text-amber-500">Sem WhatsApp</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
