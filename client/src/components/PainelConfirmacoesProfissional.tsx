import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LeafSkeleton } from './LeafLoader';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateBR } from '@/lib/utils';

/**
 * Painel que exibe confirmações de presença dos pacientes para o profissional
 * Só é exibido para usuários com perfil profissional e profissional vinculado
 */
export function PainelConfirmacoesProfissional() {
  const [filtro, setFiltro] = useState<'todos' | 'confirmados' | 'nao-confirmados' | 'pendentes'>('todos');
  const { user } = useAuth();

  // Só busca dados se o usuário tiver profissional vinculado
  const temProfissionalVinculado = !!(user as any)?.profissionalVinculadoId;

  const { data: stats, isLoading: statsLoading } = trpc.profissionalConfirmacoes.getEstatisticas.useQuery(
    undefined,
    { enabled: temProfissionalVinculado }
  );
  const { data: pendentes, isLoading: pendentesLoading } = trpc.profissionalConfirmacoes.getPendentes.useQuery(
    undefined,
    { enabled: temProfissionalVinculado }
  );

  // Usuários sem profissional vinculado (admin, secretaria) não veem este painel
  if (!temProfissionalVinculado) {
    return null;
  }

  if (statsLoading || pendentesLoading) {
    return <LeafSkeleton />;
  }

  if (!stats) {
    return (
      <Card className="border-green-200 dark:border-green-800">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Nenhuma confirmação disponível</p>
        </CardContent>
      </Card>
    );
  }

  const filteredData = pendentes?.filter((item) => {
    if (filtro === 'confirmados') return item.confirmacaoAtendimento === 1;
    if (filtro === 'nao-confirmados') return item.confirmacaoAtendimento === 0;
    if (filtro === 'pendentes') return item.confirmacaoAtendimento === null;
    return true;
  }) || [];

  return (
    <div className="space-y-4">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="cursor-pointer border-green-200 dark:border-green-800 hover:shadow-lg transition-shadow"
          onClick={() => setFiltro('confirmados')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmados}</div>
            <p className="text-xs text-muted-foreground mt-1">Pacientes confirmados</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-shadow"
          onClick={() => setFiltro('pendentes')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Aguardando confirmação</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer border-red-200 dark:border-red-800 hover:shadow-lg transition-shadow"
          onClick={() => setFiltro('nao-confirmados')}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Não Confirmados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.naoConfirmados}</div>
            <p className="text-xs text-muted-foreground mt-1">Pacientes não confirmaram</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filtro === 'todos'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todos ({(stats.confirmados + stats.naoConfirmados + stats.pendentes)})
        </button>
        <button
          onClick={() => setFiltro('confirmados')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filtro === 'confirmados'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Confirmados
        </button>
        <button
          onClick={() => setFiltro('pendentes')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filtro === 'pendentes'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Pendentes
        </button>
        <button
          onClick={() => setFiltro('nao-confirmados')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filtro === 'nao-confirmados'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Não Confirmados
        </button>
      </div>

      {/* Lista de confirmações */}
      <Card className="border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg">Detalhes das Confirmações</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma confirmação neste filtro</p>
          ) : (
            <div className="space-y-3">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-green-100 dark:border-green-900 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.pacienteName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateBR(item.data)} às {item.hora}
                    </p>
                    {item.pacienteWhatsapp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        WhatsApp: {item.pacienteWhatsapp}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {item.tipo}
                    </Badge>

                    {item.confirmacaoAtendimento === 1 ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Confirmado</span>
                      </div>
                    ) : item.confirmacaoAtendimento === 0 ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Não Confirmado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">Pendente</span>
                      </div>
                    )}
                  </div>

                  {item.dataConfirmacao && (
                    <p className="text-xs text-muted-foreground ml-4">
                      {new Date(item.dataConfirmacao).toLocaleTimeString('pt-BR')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
