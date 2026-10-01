import { useState, useMemo } from 'react';
import { Search, Eye, Calendar, Download, Printer, FileText, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { trpc } from '../lib/trpc';
import { formatDateBR, getHojeBrasilia } from '../lib/utils';
import { toast } from 'sonner';

interface LocalizarAgendamentosProps {
  onNavigate?: (page: string, params?: any) => void;
}

export function LocalizarAgendamentos({ onNavigate }: LocalizarAgendamentosProps) {
  const [busca, setBusca] = useState(() => {
    const nome = sessionStorage.getItem('localizar_paciente_nome') || '';
    sessionStorage.removeItem('localizar_paciente_nome');
    return nome;
  });
  const [dataReferencia, setDataReferencia] = useState(formatDateBR(getHojeBrasilia()));
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<any>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const { data: pacientes = [] } = trpc.pacientes.list.useQuery();
  const { data: atendimentos = [], refetch: refetchAtendimentos } = trpc.atendimentos.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();

  const deleteMutation = trpc.atendimentos.delete.useMutation({
    onSuccess: () => {
      toast.success('Agendamento excluído com sucesso');
      refetchAtendimentos();
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir agendamento'),
  });

  const deleteSeriesMutation = trpc.atendimentos.deleteSerieCompleta.useMutation({
    onSuccess: () => {
      toast.success('Série de agendamentos excluída com sucesso');
      refetchAtendimentos();
    },
    onError: (e: any) => toast.error(e.message || 'Erro ao excluir série'),
  });

  // Filtrar atendimentos por busca e data
  const atendimentosFiltrados = useMemo(() => {
    if (!busca || busca.length < 3) return [];
    if (!busca.trim()) return [];

    const buscaLower = busca.toLowerCase();
    const dataRef = new Date(dataReferencia + 'T00:00:00');
    const mesRef = dataRef.getMonth();
    const anoRef = dataRef.getFullYear();

    return (atendimentos as any[]).filter(a => {
      // Filtrar por data (mesmo mês/ano)
      const dataAten = new Date(a.data);
      if (dataAten.getMonth() !== mesRef || dataAten.getFullYear() !== anoRef) return false;

      // Buscar por nome do paciente ou número do protocolo
      const paciente = pacientes.find(p => p.id === a.pacienteId);
      const nomePaciente = paciente?.nome?.toLowerCase() || '';
      const protocolo = a.id?.toString() || '';

      return nomePaciente.includes(buscaLower) || protocolo.includes(buscaLower);
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [busca, dataReferencia, atendimentos, pacientes]);

  // Paginação
  const totalPaginas = Math.ceil(atendimentosFiltrados.length / itensPorPagina);
  const atendimentosPaginados = atendimentosFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const getPacienteNome = (pacienteId: number) => {
    return pacientes.find(p => p.id === pacienteId)?.nome || '—';
  };

  const getProfissionalNome = (profissionalId: number) => {
    return profissionais.find(p => p.id === profissionalId)?.nome || '—';
  };

  const getConvenioNome = (convenioId: number) => {
    return convenios.find(c => c.id === convenioId)?.nome || '—';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'agendado': 'Agendado',
      'realizado': 'Realizado',
      'cancelado': 'Cancelado',
      'falta': 'Faltou',
      'faltou_assinou': 'Faltou mas Assinou'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'realizado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
      case 'falta':
        return 'bg-red-100 text-red-800';
      case 'faltou_assinou':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const handleExportarExcel = () => {
    if (atendimentosFiltrados.length === 0) {
      toast.error('Nenhum agendamento para exportar');
      return;
    }

    const csv = [
      ['Data', 'Paciente', 'Profissional', 'Convênio', 'Status', 'Tipo', 'Hora'].join(','),
      ...atendimentosFiltrados.map(a => [
        formatDateBR(new Date(a.data)),
        getPacienteNome(a.pacienteId),
        getProfissionalNome(a.profissionalId),
        getConvenioNome(a.convenioId),
        getStatusLabel(a.status),
        a.tipo || '—',
        a.hora || '—'
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `agendamentos_${dataReferencia}.csv`);
    link.click();
    toast.success('Arquivo exportado com sucesso');
  };

  const handleImprimir = () => {
    if (atendimentosFiltrados.length === 0) {
      toast.error('Nenhum agendamento para imprimir');
      return;
    }

    const janela = window.open('', '', 'width=900,height=600');
    if (!janela) return;

    const html = `
      <html>
        <head>
          <title>Agendamentos - ${dataReferencia}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Agendamentos - ${dataReferencia}</h1>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Paciente</th>
                <th>Profissional</th>
                <th>Convênio</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              ${atendimentosFiltrados.map(a => `
                <tr>
                  <td>${formatDateBR(new Date(a.data))}</td>
                  <td>${getPacienteNome(a.pacienteId)}</td>
                  <td>${getProfissionalNome(a.profissionalId)}</td>
                  <td>${getConvenioNome(a.convenioId)}</td>
                  <td>${getStatusLabel(a.status)}</td>
                  <td>${a.tipo || '—'}</td>
                  <td>${a.hora || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    janela.document.write(html);
    janela.document.close();
    janela.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Localizar Agendamentos</h1>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="busca">Buscar por nome ou protocolo (mín. 3 caracteres)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="busca"
                placeholder="Nome do paciente ou número do protocolo"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                minLength={3}
              />
              <Button variant="default" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="dataRef">Data de referência</Label>
            <Input
              id="dataRef"
              type="date"
              value={dataReferencia}
              onChange={(e) => {
                setDataReferencia(e.target.value);
                setPaginaAtual(1);
              }}
              className="mt-2"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={handleExportarExcel} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button onClick={handleImprimir} variant="outline" className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {busca.length > 0 && busca.length < 3 && (
          <p className="text-sm text-orange-600">Informe ao menos 3 caracteres para buscar</p>
        )}
      </div>

      {/* Tabela de resultados */}
      {atendimentosPaginados.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Data</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Paciente</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Profissional</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Convênio</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Procedimento</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Guia</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Senha</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Faturada</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {atendimentosPaginados.map((a, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm">{formatDateBR(new Date(a.data))} {a.hora}</td>
                  <td className="px-6 py-3 text-sm">{getPacienteNome(a.pacienteId)}</td>
                  <td className="px-6 py-3 text-sm">{getProfissionalNome(a.profissionalId)}</td>
                  <td className="px-6 py-3 text-sm">{getConvenioNome(a.convenioId)}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{(a as any).tipo || '—'}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(a.status)}`}>
                      {getStatusLabel(a.status)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {(a as any).guiaId ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Criada</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Pendente</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{(a as any).senhaGuia || '—'}</td>
                  <td className="px-6 py-3 text-sm">
                    {(a as any).guiaFaturada ? (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Sim</span>
                    ) : (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Não</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAtendimentoSelecionado(a);
                          setShowDetalhes(true);
                        }}
                        title="Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNavigate?.('agenda')}
                        title="Ir para Agenda"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          const temSerie = !!(a as any).serieId;
                          if (temSerie) {
                            const opcao = window.confirm(
                              `Este agendamento faz parte de uma série.\n\nClique em OK para excluir TODA A SÉRIE.\nClique em Cancelar para excluir SOMENTE ESTE agendamento.`
                            );
                            if (opcao) {
                              deleteSeriesMutation.mutate({ id: a.id });
                            } else if (window.confirm(`Excluir somente o agendamento de ${getPacienteNome(a.pacienteId)}?`)) {
                              deleteMutation.mutate({ id: a.id });
                            }
                          } else if (confirm(`Tem certeza que deseja excluir o agendamento de ${getPacienteNome(a.pacienteId)}?`)) {
                            deleteMutation.mutate({ id: a.id });
                          }
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {(paginaAtual - 1) * itensPorPagina + 1} a {Math.min(paginaAtual * itensPorPagina, atendimentosFiltrados.length)} de {atendimentosFiltrados.length} resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                disabled={paginaAtual === 1}
              >
                Anterior
              </Button>
              <span className="px-3 py-2 text-sm">{paginaAtual} / {totalPaginas}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                Próximo
              </Button>
            </div>
          </div>
        </div>
      ) : busca.length >= 3 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Nenhum agendamento encontrado para "{busca}" em {dataReferencia}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Digite ao menos 3 caracteres para buscar agendamentos</p>
        </div>
      )}

      {/* Modal de detalhes */}
      {showDetalhes && atendimentoSelecionado && (
        <Dialog open={showDetalhes} onOpenChange={setShowDetalhes}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Agendamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-600">Paciente</p>
                <p className="text-sm">{getPacienteNome(atendimentoSelecionado.pacienteId)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Data e Hora</p>
                <p className="text-sm">{formatDateBR(new Date(atendimentoSelecionado.data))} às {atendimentoSelecionado.hora}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Profissional</p>
                <p className="text-sm">{getProfissionalNome(atendimentoSelecionado.profissionalId)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Convênio</p>
                <p className="text-sm">{getConvenioNome(atendimentoSelecionado.convenioId)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Status</p>
                <p className="text-sm">{getStatusLabel(atendimentoSelecionado.status)}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Tipo</p>
                <p className="text-sm">{atendimentoSelecionado.tipo || '—'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
