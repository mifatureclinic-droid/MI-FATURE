import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCheck, Bell, BellOff, CheckCircle2, XCircle, PenLine, Settings } from "lucide-react";
import { toast } from "sonner";

type TipoFiltro = "todos" | "confirmacao" | "cancelamento" | "assinatura" | "sistema";

const TIPO_CONFIG: Record<string, { label: string; icon: React.ReactNode; cor: string; badge: string }> = {
  confirmacao: {
    label: "Confirmações",
    icon: <CheckCircle2 className="w-4 h-4" />,
    cor: "text-green-600",
    badge: "bg-green-100 text-green-700 border-green-200",
  },
  cancelamento: {
    label: "Cancelamentos",
    icon: <XCircle className="w-4 h-4" />,
    cor: "text-red-600",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  assinatura: {
    label: "Assinaturas",
    icon: <PenLine className="w-4 h-4" />,
    cor: "text-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
  sistema: {
    label: "Sistema",
    icon: <Settings className="w-4 h-4" />,
    cor: "text-gray-600",
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

function formatarData(ts: any): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function Notificacoes() {
  const [filtro, setFiltro] = useState<TipoFiltro>("todos");
  const [apenasNaoLidas, setApenasNaoLidas] = useState(false);

  const utils = trpc.useUtils();

  const { data: notifs = [], isLoading, refetch } = trpc.notificacoes.list.useQuery({
    tipo: filtro,
    apenasNaoLidas,
  });

  const { data: totalNaoLidas = 0 } = trpc.notificacoes.contarNaoLidas.useQuery();

  const marcarLidaMutation = trpc.notificacoes.marcarLida.useMutation({
    onSuccess: () => {
      utils.notificacoes.list.invalidate();
      utils.notificacoes.contarNaoLidas.invalidate();
    },
  });

  const marcarTodasMutation = trpc.notificacoes.marcarTodasLidas.useMutation({
    onSuccess: () => {
      utils.notificacoes.list.invalidate();
      utils.notificacoes.contarNaoLidas.invalidate();
      toast.success("Todas as notificações marcadas como lidas");
    },
  });

  // Contagens por tipo
  const contagens = {
    todos: notifs.length,
    confirmacao: notifs.filter(n => n.tipo === "confirmacao").length,
    cancelamento: notifs.filter(n => n.tipo === "cancelamento").length,
    assinatura: notifs.filter(n => n.tipo === "assinatura").length,
    sistema: notifs.filter(n => n.tipo === "sistema").length,
  };

  const naoLidasPorTipo = {
    todos: notifs.filter(n => !n.lida).length,
    confirmacao: notifs.filter(n => n.tipo === "confirmacao" && !n.lida).length,
    cancelamento: notifs.filter(n => n.tipo === "cancelamento" && !n.lida).length,
    assinatura: notifs.filter(n => n.tipo === "assinatura" && !n.lida).length,
    sistema: notifs.filter(n => n.tipo === "sistema" && !n.lida).length,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
            <p className="text-sm text-gray-500">
              {totalNaoLidas > 0
                ? `${totalNaoLidas} não lida${totalNaoLidas > 1 ? "s" : ""}`
                : "Todas as notificações lidas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApenasNaoLidas(v => !v)}
            className={apenasNaoLidas ? "border-green-500 text-green-700 bg-green-50" : ""}
          >
            {apenasNaoLidas ? <BellOff className="w-4 h-4 mr-1" /> : <Bell className="w-4 h-4 mr-1" />}
            {apenasNaoLidas ? "Mostrar todas" : "Só não lidas"}
          </Button>
          {totalNaoLidas > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarTodasMutation.mutate()}
              disabled={marcarTodasMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["confirmacao", "cancelamento", "assinatura", "sistema"] as const).map(tipo => {
          const cfg = TIPO_CONFIG[tipo];
          return (
            <Card
              key={tipo}
              className={`cursor-pointer transition-all border-2 ${filtro === tipo ? "border-green-500 shadow-md" : "border-transparent hover:border-gray-200"}`}
              onClick={() => setFiltro(tipo)}
            >
              <CardContent className="p-4">
                <div className={`flex items-center gap-2 mb-1 ${cfg.cor}`}>
                  {cfg.icon}
                  <span className="text-xs font-medium">{cfg.label}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-gray-800">{contagens[tipo]}</span>
                  {naoLidasPorTipo[tipo] > 0 && (
                    <Badge className={`text-xs ${cfg.badge} border`}>
                      {naoLidasPorTipo[tipo]} nova{naoLidasPorTipo[tipo] > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs de filtro */}
      <Tabs value={filtro} onValueChange={v => setFiltro(v as TipoFiltro)}>
        <TabsList className="w-full justify-start gap-1 h-auto flex-wrap bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="todos" className="text-xs px-3 py-1.5">
            Todas
            {naoLidasPorTipo.todos > 0 && (
              <Badge className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0">{naoLidasPorTipo.todos}</Badge>
            )}
          </TabsTrigger>
          {(["confirmacao", "cancelamento", "assinatura", "sistema"] as const).map(tipo => (
            <TabsTrigger key={tipo} value={tipo} className="text-xs px-3 py-1.5">
              {TIPO_CONFIG[tipo].label}
              {naoLidasPorTipo[tipo] > 0 && (
                <Badge className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0">{naoLidasPorTipo[tipo]}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Lista de notificações */}
        <TabsContent value={filtro} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : notifs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhuma notificação encontrada</p>
                <p className="text-sm text-gray-400 mt-1">
                  {apenasNaoLidas ? "Não há notificações não lidas nesta categoria." : "Nenhum evento registado ainda."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifs.map(notif => {
                const cfg = TIPO_CONFIG[notif.tipo] ?? TIPO_CONFIG.sistema;
                const naoLida = !notif.lida;
                return (
                  <Card
                    key={notif.id}
                    className={`transition-all ${naoLida ? "border-l-4 border-l-green-500 bg-green-50/30" : "bg-white"}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Ícone do tipo */}
                          <div className={`mt-0.5 flex-shrink-0 ${cfg.cor}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-semibold text-sm ${naoLida ? "text-gray-900" : "text-gray-700"}`}>
                                {notif.titulo}
                              </span>
                              <Badge className={`text-xs border ${cfg.badge}`}>{cfg.label}</Badge>
                              {naoLida && (
                                <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">Nova</Badge>
                              )}
                            </div>
                            {notif.conteudo && (
                              <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
                                {notif.conteudo}
                              </pre>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{formatarData(notif.createdAt)}</p>
                          </div>
                        </div>
                        {naoLida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                            onClick={() => marcarLidaMutation.mutate({ id: notif.id })}
                            disabled={marcarLidaMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
