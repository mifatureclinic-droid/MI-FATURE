import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Liberacoes() {
  const { user } = useAuth();
  const [selectedLiberacao, setSelectedLiberacao] = useState<any>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);

  // Buscar dados
  const liberacoesQuery = trpc.liberacoes.list.useQuery();
  const atendimentosQuery = trpc.atendimentos.list.useQuery();
  const pacientesQuery = trpc.pacientes.list.useQuery();
  const profissionaisQuery = trpc.profissionais.list.useQuery();

  // Mutations
  const approveLiberacao = trpc.liberacoes.approve.useMutation();
  const rejectLiberacao = trpc.liberacoes.reject.useMutation();

  // Verificar se é master
  const isMaster = user?.role === 'admin';

  if (!isMaster) {
    return (
      <div className="p-6">
        <Alert className="bg-red-100 border-red-300">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Apenas administradores podem acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Filtrar liberações pendentes
  const liberacoesPendentes = useMemo(() => {
    return liberacoesQuery.data?.filter(l => l.status === 'pendente') || [];
  }, [liberacoesQuery.data]);

  // Filtrar liberações aprovadas
  const liberacoesAprovadas = useMemo(() => {
    return liberacoesQuery.data?.filter(l => l.status === 'aprovada') || [];
  }, [liberacoesQuery.data]);

  // Filtrar liberações rejeitadas
  const liberacoesRejeitadas = useMemo(() => {
    return liberacoesQuery.data?.filter(l => l.status === 'rejeitada') || [];
  }, [liberacoesQuery.data]);

  const getPacienteNome = (atendimentoId: number) => {
    const atendimento = atendimentosQuery.data?.find(a => a.id === atendimentoId);
    if (!atendimento) return "Paciente";
    return pacientesQuery.data?.find(p => p.id === atendimento.pacienteId)?.nome || "Paciente";
  };

  const getProfissionalNome = (profissionalId: number) => {
    return profissionaisQuery.data?.find(p => p.id === profissionalId)?.nome || "Profissional";
  };

  const getAtendimentoData = (atendimentoId: number) => {
    return atendimentosQuery.data?.find(a => a.id === atendimentoId);
  };

  const handleApprove = async (liberacaoId: number) => {
    try {
      await approveLiberacao.mutateAsync({ liberacaoId });
      toast.success("Liberação aprovada com sucesso!");
      liberacoesQuery.refetch();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleReject = async (liberacaoId: number) => {
    try {
      await rejectLiberacao.mutateAsync({ liberacaoId });
      toast.success("Liberação rejeitada!");
      liberacoesQuery.refetch();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleDetalhes = (liberacao: any) => {
    setSelectedLiberacao(liberacao);
    setShowDetalhesModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Liberações</h1>
        <p className="text-gray-600 mt-2">Aprove ou rejeite solicitações de liberação de prontuários atrasados</p>
      </div>

      {/* Liberações Pendentes */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-600" />
          <h2 className="text-xl font-semibold text-yellow-600">
            Pendentes ({liberacoesPendentes.length})
          </h2>
        </div>

        {liberacoesPendentes.length === 0 ? (
          <p className="text-gray-500">Nenhuma solicitação pendente</p>
        ) : (
          <div className="grid gap-3">
            {liberacoesPendentes.map(liberacao => (
              <div
                key={liberacao.id}
                className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {getPacienteNome(liberacao.atendimentoId)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Profissional: {getProfissionalNome(liberacao.profissionalId)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Motivo: {liberacao.motivo}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Solicitado em: {new Date(liberacao.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDetalhes(liberacao)}
                    >
                      Detalhes
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(liberacao.id)}
                      disabled={approveLiberacao.isPending}
                    >
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(liberacao.id)}
                      disabled={rejectLiberacao.isPending}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liberações Aprovadas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-green-600">
            Aprovadas ({liberacoesAprovadas.length})
          </h2>
        </div>

        {liberacoesAprovadas.length === 0 ? (
          <p className="text-gray-500">Nenhuma liberação aprovada</p>
        ) : (
          <div className="grid gap-3">
            {liberacoesAprovadas.map(liberacao => (
              <div
                key={liberacao.id}
                className="p-4 border border-green-200 bg-green-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {getPacienteNome(liberacao.atendimentoId)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Profissional: {getProfissionalNome(liberacao.profissionalId)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Aprovado em: {new Date(liberacao.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetalhes(liberacao)}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liberações Rejeitadas */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-semibold text-red-600">
            Rejeitadas ({liberacoesRejeitadas.length})
          </h2>
        </div>

        {liberacoesRejeitadas.length === 0 ? (
          <p className="text-gray-500">Nenhuma liberação rejeitada</p>
        ) : (
          <div className="grid gap-3">
            {liberacoesRejeitadas.map(liberacao => (
              <div
                key={liberacao.id}
                className="p-4 border border-red-200 bg-red-50 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {getPacienteNome(liberacao.atendimentoId)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Profissional: {getProfissionalNome(liberacao.profissionalId)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Rejeitado em: {new Date(liberacao.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDetalhes(liberacao)}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação de Liberação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a solicitação
            </DialogDescription>
          </DialogHeader>

          {selectedLiberacao && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paciente</label>
                  <p className="mt-1 text-gray-900">
                    {getPacienteNome(selectedLiberacao.atendimentoId)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profissional</label>
                  <p className="mt-1 text-gray-900">
                    {getProfissionalNome(selectedLiberacao.profissionalId)}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data do Atendimento</label>
                <p className="mt-1 text-gray-900">
                  {getAtendimentoData(selectedLiberacao.atendimentoId)?.data
                    ? new Date(getAtendimentoData(selectedLiberacao.atendimentoId)?.data as string | Date).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Motivo da Solicitação</label>
                <p className="mt-1 text-gray-900">{selectedLiberacao.motivo}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedLiberacao.status === 'pendente'
                      ? 'bg-yellow-100 text-yellow-800'
                      : selectedLiberacao.status === 'aprovada'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedLiberacao.status.charAt(0).toUpperCase() + selectedLiberacao.status.slice(1)}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="block font-medium">Solicitado em</label>
                  <p>{new Date(selectedLiberacao.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="block font-medium">Última atualização</label>
                  <p>{new Date(selectedLiberacao.updatedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {selectedLiberacao.status === 'pendente' && (
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleReject(selectedLiberacao.id);
                      setShowDetalhesModal(false);
                    }}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedLiberacao.id);
                      setShowDetalhesModal(false);
                    }}
                  >
                    Aprovar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
