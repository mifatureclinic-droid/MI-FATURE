import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Search, RefreshCw, User, Clock, Activity } from "lucide-react";

const ACOES_LABELS: Record<string, { label: string; color: string }> = {
  CRIAR_ATENDIMENTO: { label: "Criar Agendamento", color: "bg-green-100 text-green-800" },
  EXCLUIR_ATENDIMENTO: { label: "Excluir Agendamento", color: "bg-red-100 text-red-800" },
  ATUALIZAR_ATENDIMENTO: { label: "Atualizar Agendamento", color: "bg-blue-100 text-blue-800" },
  CRIAR_SERIE: { label: "Criar Série", color: "bg-purple-100 text-purple-800" },
  EXCLUIR_PRONTUARIO: { label: "Excluir Prontuário", color: "bg-red-100 text-red-800" },
  CRIAR_PACIENTE: { label: "Criar Paciente", color: "bg-green-100 text-green-800" },
  ATUALIZAR_PACIENTE: { label: "Atualizar Paciente", color: "bg-blue-100 text-blue-800" },
};

const ENTIDADES_LABELS: Record<string, string> = {
  atendimento: "Agendamento",
  prontuario: "Prontuário",
  paciente: "Paciente",
};

const PERFIS_LABELS: Record<string, string> = {
  administrador: "Admin",
  recepcionista: "Recepção",
  profissional: "Profissional",
};

function formatarDataHora(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function LogAuditoria() {
  const [busca, setBusca] = useState("");
  const [filtroEntidade, setFiltroEntidade] = useState("todas");
  const [filtroAcao, setFiltroAcao] = useState("todas");
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const { data: logs = [], isLoading, refetch } = trpc.auditoria.list.useQuery({
    limit: LIMIT,
    offset,
    entidade: filtroEntidade !== "todas" ? filtroEntidade : undefined,
    acao: filtroAcao !== "todas" ? filtroAcao : undefined,
    usuarioNome: busca.trim() || undefined,
  });

  const logsFiltrados = logs.filter(log => {
    if (!busca.trim()) return true;
    const buscaLower = busca.toLowerCase();
    return (
      (log.usuarioNome || "").toLowerCase().includes(buscaLower) ||
      (log.descricao || "").toLowerCase().includes(buscaLower) ||
      (log.acao || "").toLowerCase().includes(buscaLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log de Auditoria</h1>
          <p className="text-sm text-gray-500">
            Rastreabilidade de todas as ações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuário ou descrição..."
                value={busca}
                onChange={(e) => { setBusca(e.target.value); setOffset(0); }}
                className="pl-9"
              />
            </div>
            <Select value={filtroEntidade} onValueChange={(v) => { setFiltroEntidade(v); setOffset(0); }}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as entidades</SelectItem>
                <SelectItem value="atendimento">Agendamento</SelectItem>
                <SelectItem value="prontuario">Prontuário</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroAcao} onValueChange={(v) => { setFiltroAcao(v); setOffset(0); }}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as ações</SelectItem>
                {Object.entries(ACOES_LABELS).map(([key, val]) => (
                  <SelectItem key={key} value={key}>{val.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()} title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {isLoading ? "Carregando..." : `${logsFiltrados.length} registro(s)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Carregando logs...
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Shield className="h-10 w-10 mb-2 opacity-30" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Data/Hora</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Perfil</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Ação</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Entidade</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((log, idx) => {
                    const acaoInfo = ACOES_LABELS[log.acao] || { label: log.acao, color: "bg-gray-100 text-gray-700" };
                    return (
                      <tr
                        key={log.id}
                        className={`border-b hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs">{formatarDataHora(log.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-gray-800">
                              {log.usuarioNome || `ID ${log.usuarioId}` || "Sistema"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.usuarioPerfil ? (
                            <Badge variant="outline" className="text-xs">
                              {PERFIS_LABELS[log.usuarioPerfil] || log.usuarioPerfil}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${acaoInfo.color}`}>
                            {acaoInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">
                              {ENTIDADES_LABELS[log.entidade] || log.entidade}
                            </span>
                            {log.entidadeId && (
                              <span className="text-gray-400 text-xs">#{log.entidadeId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-gray-600 text-xs truncate" title={log.descricao || ""}>
                            {log.descricao || "-"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {!isLoading && logs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Exibindo {offset + 1}–{offset + logsFiltrados.length} de {logs.length >= LIMIT ? `${offset + logs.length}+` : offset + logs.length} registros
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={logs.length < LIMIT}
              onClick={() => setOffset(offset + LIMIT)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
