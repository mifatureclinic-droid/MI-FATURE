import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot,
  Plus,
  Play,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  Ban,
  Key,
  Zap,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StatusAutorizacao = "pendente" | "processando" | "autorizado" | "negado" | "erro" | "cancelado";

const STATUS_CONFIG: Record<StatusAutorizacao, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
  processando: { label: "Processando", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  autorizado: { label: "Autorizado", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle2 className="w-3 h-3" /> },
  negado: { label: "Negado", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="w-3 h-3" /> },
  erro: { label: "Erro", color: "bg-orange-100 text-orange-800 border-orange-200", icon: <AlertCircle className="w-3 h-3" /> },
  cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-600 border-gray-200", icon: <Ban className="w-3 h-3" /> },
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function GeapAutorizacoes() {
  const { user } = useAuth();
  const [filtroStatus, setFiltroStatus] = useState<StatusAutorizacao | "todos">("todos");
  const [modalCredencial, setModalCredencial] = useState(false);
  const [modalNovaAutorizacao, setModalNovaAutorizacao] = useState(false);
  const [modalLog, setModalLog] = useState<number | null>(null);
  const [autorizacaoSelecionada, setAutorizacaoSelecionada] = useState<number | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: estatisticas, refetch: refetchStats } = trpc.geap.getEstatisticas.useQuery();
  const { data: credenciais, refetch: refetchCreds } = trpc.geap.getCredenciais.useQuery();
  const { data: autorizacoes, refetch: refetchAutorizacoes, isLoading } = trpc.geap.listarAutorizacoes.useQuery({
    status: filtroStatus === "todos" ? undefined : filtroStatus,
    limit: 50,
  });
  const { data: logData } = trpc.geap.getLog.useQuery(
    { autorizacaoId: modalLog! },
    { enabled: modalLog !== null }
  );
  const { data: pacientesData } = trpc.pacientes.list.useQuery();
  const { data: conveniosData } = trpc.convenios.list.useQuery();

  // ── Mutations ──────────────────────────────────────────────────────────────

  const salvarCred = trpc.geap.salvarCredenciais.useMutation({
    onSuccess: () => {
      toast.success("Credenciais salvas com sucesso");
      setModalCredencial(false);
      refetchCreds();
    },
    onError: (e) => toast.error("Erro ao salvar: " + e.message),
  });

  const testarCred = trpc.geap.testarCredenciais.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.tokenCapturado ? "Login bem-sucedido! Token capturado." : "Login OK mas sem token.");
      } else {
        toast.error("Falha no login: " + (data.error || "Verifique as credenciais."));
      }
      refetchCreds();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const criarAutorizacao = trpc.geap.criarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Pedido criado com sucesso");
      setModalNovaAutorizacao(false);
      refetchAutorizacoes();
      refetchStats();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const executarRobo = trpc.geap.executarRobo.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setTimeout(() => { refetchAutorizacoes(); refetchStats(); }, 3000);
    },
    onError: (e) => toast.error("Erro ao iniciar robô: " + e.message),
  });

  const cancelarAutorizacao = trpc.geap.cancelarAutorizacao.useMutation({
    onSuccess: () => {
      toast.success("Autorização cancelada");
      refetchAutorizacoes();
      refetchStats();
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  // ── Formulários ────────────────────────────────────────────────────────────

  const [formCred, setFormCred] = useState({
    codigoPrestador: "3038084",
    nomePrestador: "CLIPSI PSICOLOGIA",
    cpfLogin: "",
    senhaLogin: "",
    convenioId: undefined as number | undefined,
  });

  const [formAutorizacao, setFormAutorizacao] = useState<{ pacienteId: number; convenioId: number; codigoTUSS: string; descricaoProcedimento: string; cid10: string; quantidadeSessoes: number; dataInicio: string; dataFim: string; tipoAtendimento: "ambulatorial" | "eletivo"; nomeMedicoSolicitante: string; crmMedicoSolicitante: string; ufMedicoSolicitante: string; cbosMedicoSolicitante: string; }>({
    pacienteId: 0,
    convenioId: 0,
    codigoTUSS: "",
    descricaoProcedimento: "",
    cid10: "",
    quantidadeSessoes: 1,
    dataInicio: "",
    dataFim: "",
    tipoAtendimento: "ambulatorial",
    nomeMedicoSolicitante: "",
    crmMedicoSolicitante: "",
    ufMedicoSolicitante: "",
    cbosMedicoSolicitante: "",
  });

  const [fileEncaminhamento, setFileEncaminhamento] = useState<File | null>(null);
  const [fileRelatorio, setFileRelatorio] = useState<File | null>(null);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Robô GEAP</h1>
            <p className="text-sm text-gray-500">Automação de autorizações de guias no portal da GEAP</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { refetchAutorizacoes(); refetchStats(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModalCredencial(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Credenciais GEAP
          </Button>
          <Button size="sm" onClick={() => setModalNovaAutorizacao(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Autorização
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(["pendente", "processando", "autorizado", "negado", "erro", "cancelado"] as StatusAutorizacao[]).map((s) => (
            <Card
              key={s}
              className={`cursor-pointer transition-all hover:shadow-md ${filtroStatus === s ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => setFiltroStatus(filtroStatus === s ? "todos" : s)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500 capitalize">{STATUS_CONFIG[s].label}</span>
                  {STATUS_CONFIG[s].icon}
                </div>
                <p className="text-2xl font-bold">{(estatisticas as Record<string, number>)[s] || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Aviso de credenciais */}
      {credenciais && credenciais.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Key className="w-5 h-5 text-yellow-600 shrink-0" />
            <div>
              <p className="font-medium text-yellow-800">Credenciais GEAP não configuradas</p>
              <p className="text-sm text-yellow-700">Configure as credenciais de acesso ao portal da GEAP para que o robô possa submeter autorizações.</p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => setModalCredencial(true)}>
              Configurar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Credenciais activas */}
      {credenciais && credenciais.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div>
              <p className="font-medium text-green-800">
                {credenciais[0].nomePrestador || credenciais[0].codigoPrestador} — Credenciais configuradas
              </p>
              <p className="text-sm text-green-700">
                CPF: {credenciais[0].cpfLogin.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                {credenciais[0].tokenExpiresAt && (
                  <span className="ml-2">
                    · Token válido até {new Date(credenciais[0].tokenExpiresAt).toLocaleString("pt-BR")}
                  </span>
                )}
              </p>
            </div>
            <div className="ml-auto flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => testarCred.mutate({ credencialId: credenciais[0].id })}
                disabled={testarCred.isPending}
              >
                {testarCred.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span className="ml-1">Testar Login</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModalCredencial(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de autorizações */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Autorizações
              {filtroStatus !== "todos" && (
                <Badge className={`ml-2 ${STATUS_CONFIG[filtroStatus].color}`}>
                  {STATUS_CONFIG[filtroStatus].label}
                </Badge>
              )}
            </CardTitle>
            {filtroStatus !== "todos" && (
              <Button variant="ghost" size="sm" onClick={() => setFiltroStatus("todos")}>
                Ver todas
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : !autorizacoes || autorizacoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhuma autorização encontrada</p>
              <p className="text-sm mt-1">Crie um novo pedido de autorização para começar</p>
              <Button className="mt-4" size="sm" onClick={() => setModalNovaAutorizacao(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Autorização
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 pr-4 font-medium">Paciente</th>
                    <th className="pb-3 pr-4 font-medium">Procedimento</th>
                    <th className="pb-3 pr-4 font-medium">Sessões</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Nº Autorização</th>
                    <th className="pb-3 pr-4 font-medium">Tentativas</th>
                    <th className="pb-3 font-medium">Acções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {autorizacoes.map((aut) => {
                    const status = aut.status as StatusAutorizacao;
                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pendente;
                    return (
                      <tr key={aut.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900">{aut.nomePaciente}</p>
                          {aut.numeroCarteira && (
                            <p className="text-xs text-gray-500">Carteira: {aut.numeroCarteira}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded inline-block">{aut.codigoTUSS}</p>
                          {aut.descricaoProcedimento && (
                            <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{aut.descricaoProcedimento}</p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-medium">{aut.quantidadeSessoes}</span>
                          {aut.cid10 && <span className="text-xs text-gray-500 ml-1">({aut.cid10})</span>}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${cfg.color}`}>
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {aut.numeroAutorizacaoGeap ? (
                            <span className="font-mono text-green-700 font-medium">{aut.numeroAutorizacaoGeap}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-gray-600">{aut.tentativas}</span>
                          {aut.ultimaTentativa && (
                            <p className="text-xs text-gray-400">
                              {new Date(aut.ultimaTentativa).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {(status === "pendente" || status === "erro") && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() => executarRobo.mutate({ autorizacaoId: aut.id })}
                                disabled={executarRobo.isPending}
                                title="Executar robô"
                              >
                                {executarRobo.isPending && autorizacaoSelecionada === aut.id
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Play className="w-3 h-3" />
                                }
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() => setModalLog(aut.id)}
                              title="Ver log"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            {(status === "pendente" || status === "erro") && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-500 hover:text-red-700"
                                onClick={() => cancelarAutorizacao.mutate({ autorizacaoId: aut.id })}
                                title="Cancelar"
                              >
                                <Ban className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
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

      {/* ── Modal: Credenciais GEAP ─────────────────────────────────────────── */}
      <Dialog open={modalCredencial} onOpenChange={setModalCredencial}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              Credenciais GEAP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código do Prestador</Label>
                <Input
                  value={formCred.codigoPrestador}
                  onChange={(e) => setFormCred({ ...formCred, codigoPrestador: e.target.value })}
                  placeholder="3038084"
                />
              </div>
              <div>
                <Label>Nome do Prestador</Label>
                <Input
                  value={formCred.nomePrestador}
                  onChange={(e) => setFormCred({ ...formCred, nomePrestador: e.target.value })}
                  placeholder="CLIPSI PSICOLOGIA"
                />
              </div>
            </div>
            <div>
              <Label>CPF de Login</Label>
              <Input
                value={formCred.cpfLogin}
                onChange={(e) => setFormCred({ ...formCred, cpfLogin: e.target.value })}
                placeholder="000.000.000-00"
              />
              <p className="text-xs text-gray-500 mt-1">CPF do responsável registado no portal GEAP</p>
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={formCred.senhaLogin}
                onChange={(e) => setFormCred({ ...formCred, senhaLogin: e.target.value })}
                placeholder="Senha do portal GEAP"
              />
              <p className="text-xs text-gray-500 mt-1">A senha é encriptada antes de ser guardada</p>
            </div>
            {conveniosData && (
              <div>
                <Label>Convênio GEAP (opcional)</Label>
                <Select
                  value={formCred.convenioId?.toString()}
                  onValueChange={(v) => setFormCred({ ...formCred, convenioId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    {(conveniosData as any[]).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalCredencial(false)}>Cancelar</Button>
            <Button
              onClick={() => salvarCred.mutate({
                id: credenciais?.[0]?.id,
                ...formCred,
              })}
              disabled={salvarCred.isPending || !formCred.cpfLogin || !formCred.senhaLogin}
            >
              {salvarCred.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Nova Autorização ─────────────────────────────────────────── */}
      <Dialog open={modalNovaAutorizacao} onOpenChange={setModalNovaAutorizacao}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Nova Autorização GEAP
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Paciente *</Label>
                <Select
                  value={formAutorizacao.pacienteId?.toString()}
                  onValueChange={(v) => setFormAutorizacao({ ...formAutorizacao, pacienteId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {(pacientesData as any[] || []).map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Convênio *</Label>
                <Select
                  value={formAutorizacao.convenioId?.toString()}
                  onValueChange={(v) => setFormAutorizacao({ ...formAutorizacao, convenioId: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    {(conveniosData as any[] || []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Código TUSS *</Label>
                <Input
                  value={formAutorizacao.codigoTUSS}
                  onChange={(e) => setFormAutorizacao({ ...formAutorizacao, codigoTUSS: e.target.value })}
                  placeholder="ex: 10101012"
                />
              </div>
              <div>
                <Label>CID-10</Label>
                <Input
                  value={formAutorizacao.cid10}
                  onChange={(e) => setFormAutorizacao({ ...formAutorizacao, cid10: e.target.value })}
                  placeholder="ex: F32.0"
                />
              </div>
            </div>
            <div>
              <Label>Descrição do Procedimento</Label>
              <Input
                value={formAutorizacao.descricaoProcedimento}
                onChange={(e) => setFormAutorizacao({ ...formAutorizacao, descricaoProcedimento: e.target.value })}
                placeholder="ex: Psicoterapia individual"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Atendimento *</Label>
                <Select
                  value={formAutorizacao.tipoAtendimento}
                  onValueChange={(v) => setFormAutorizacao({ ...formAutorizacao, tipoAtendimento: v as "ambulatorial" | "eletivo" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambulatorial">Ambulatorial</SelectItem>
                    <SelectItem value="eletivo">Eletivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="font-semibold text-sm mb-3">Dados do Médico Solicitante</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Médico *</Label>
                  <Input
                    value={formAutorizacao.nomeMedicoSolicitante}
                    onChange={(e) => setFormAutorizacao({ ...formAutorizacao, nomeMedicoSolicitante: e.target.value })}
                    placeholder="ex: Dr. João Silva"
                  />
                </div>
                <div>
                  <Label>CRM *</Label>
                  <Input
                    value={formAutorizacao.crmMedicoSolicitante}
                    onChange={(e) => setFormAutorizacao({ ...formAutorizacao, crmMedicoSolicitante: e.target.value })}
                    placeholder="ex: 123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label>UF *</Label>
                  <Input
                    value={formAutorizacao.ufMedicoSolicitante}
                    onChange={(e) => setFormAutorizacao({ ...formAutorizacao, ufMedicoSolicitante: e.target.value.toUpperCase() })}
                    placeholder="ex: SP"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label>CBOS *</Label>
                  <Input
                    value={formAutorizacao.cbosMedicoSolicitante}
                    onChange={(e) => setFormAutorizacao({ ...formAutorizacao, cbosMedicoSolicitante: e.target.value })}
                    placeholder="ex: 2251-05"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sessões *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formAutorizacao.quantidadeSessoes}
                  onChange={(e) => setFormAutorizacao({ ...formAutorizacao, quantidadeSessoes: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formAutorizacao.dataInicio}
                  onChange={(e) => setFormAutorizacao({ ...formAutorizacao, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={formAutorizacao.dataFim}
                  onChange={(e) => setFormAutorizacao({ ...formAutorizacao, dataFim: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNovaAutorizacao(false)}>Cancelar</Button>
            <Button
              onClick={() => criarAutorizacao.mutate(formAutorizacao)}
              disabled={criarAutorizacao.isPending || !formAutorizacao.pacienteId || !formAutorizacao.convenioId || !formAutorizacao.codigoTUSS}
            >
              {criarAutorizacao.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Log de Execução ──────────────────────────────────────────── */}
      <Dialog open={modalLog !== null} onOpenChange={(open) => !open && setModalLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log de Execução</DialogTitle>
          </DialogHeader>
          {logData ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[logData.status as StatusAutorizacao]?.color}`}>
                  {STATUS_CONFIG[logData.status as StatusAutorizacao]?.icon}
                  {STATUS_CONFIG[logData.status as StatusAutorizacao]?.label}
                </span>
                <span className="text-sm text-gray-500">Tentativas: {logData.tentativas}</span>
                {logData.ultimaTentativa && (
                  <span className="text-sm text-gray-500">
                    Última: {new Date(logData.ultimaTentativa).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
              {logData.motivoNegacao && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm font-medium text-red-800">Motivo:</p>
                  <p className="text-sm text-red-700 mt-1">{logData.motivoNegacao}</p>
                </div>
              )}
              {logData.logExecucao && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Log detalhado:</p>
                  <pre className="bg-gray-900 text-gray-100 text-xs p-4 rounded overflow-auto max-h-60 font-mono">
                    {logData.logExecucao}
                  </pre>
                </div>
              )}
              {!logData.motivoNegacao && !logData.logExecucao && (
                <p className="text-gray-500 text-sm">Nenhum log disponível ainda.</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalLog(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
