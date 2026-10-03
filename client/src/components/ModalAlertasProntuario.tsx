import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileWarning, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

/**
 * Modal obrigatório que alerta o profissional sobre prontuários pendentes
 * (atendimentos realizados sem prontuário preenchido).
 *
 * Regras:
 * - Aparece automaticamente ao entrar no sistema quando há alertas pendentes.
 * - Não pode ser fechado sem que o profissional clique em "Ciente" em cada alerta.
 * - Ao reconhecer, grava data/hora do reconhecimento no backend.
 * - Quando todos os alertas forem reconhecidos, o modal libera o fechamento.
 */
export function ModalAlertasProntuario() {
  const utils = trpc.useUtils();
  const [dispensadoNestaSessao, setDispensadoNestaSessao] = useState(false);
  const [reconhecendoId, setReconhecendoId] = useState<number | null>(null);

  const { data: alertas, isLoading } = trpc.alertasProntuario.listar.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const reconhecer = trpc.alertasProntuario.reconhecer.useMutation({
    onMutate: (vars) => {
      setReconhecendoId(vars.alertaId);
    },
    onSuccess: async () => {
      await utils.alertasProntuario.listar.invalidate();
      await utils.alertasProntuario.resumo.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Não foi possível registrar o reconhecimento.");
    },
    onSettled: () => {
      setReconhecendoId(null);
    },
  });

  // Apenas os alertas ainda com status "pendente" precisam de ação
  const pendentes = useMemo(
    () => (alertas ?? []).filter((a: any) => a.status === "pendente"),
    [alertas],
  );

  const reconhecidos = useMemo(
    () => (alertas ?? []).filter((a: any) => a.status === "reconhecido"),
    [alertas],
  );

  const totalRelevantes = pendentes.length + reconhecidos.length;

  // Não renderiza se: carregando, sem alertas relevantes, ou já dispensado
  const aberto = !isLoading && pendentes.length > 0 && !dispensadoNestaSessao;

  const formatarData = (valor: unknown) => {
    if (!valor) return "—";
    try {
      const d = new Date(valor as string);
      return d.toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  const handleReconhecer = (alertaId: number) => {
    reconhecer.mutate({ alertaId });
  };

  const handleReconhecerTodos = async () => {
    for (const a of pendentes) {
      try {
        await reconhecer.mutateAsync({ alertaId: a.id });
      } catch {
        // erro já tratado no onError
        break;
      }
    }
    toast.success("Todos os alertas foram reconhecidos.");
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        // Bloqueia o fechamento enquanto houver pendências não reconhecidas
        if (!open && pendentes.length > 0) {
          toast.warning(
            'Você precisa clicar em "Ciente" em todos os alertas antes de continuar.',
          );
          return;
        }
        if (!open) setDispensadoNestaSessao(true);
      }}
    >
      <DialogContent
        className="max-w-2xl border-amber-300"
        // Impede fechar por clique fora / ESC quando há pendências
        onPointerDownOutside={(e) => {
          if (pendentes.length > 0) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (pendentes.length > 0) e.preventDefault();
        }}
        // Remove o botão X padrão para reforçar obrigatoriedade
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl text-amber-900">
                Prontuários pendentes
              </DialogTitle>
              <DialogDescription className="text-amber-700">
                Você possui {pendentes.length}{" "}
                {pendentes.length === 1
                  ? "atendimento realizado sem prontuário"
                  : "atendimentos realizados sem prontuário"}
                . Registre ciência antes de prosseguir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span className="flex items-center gap-2">
            <FileWarning className="h-4 w-4" />
            Total de alertas: {totalRelevantes}
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Reconhecidos: {reconhecidos.length}
          </span>
        </div>

        <div className="mt-3 max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {pendentes.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum alerta pendente. Você pode fechar esta janela.
            </p>
          )}

          {pendentes.map((alerta: any) => (
            <div
              key={alerta.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-white p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {alerta.pacienteNome ?? "Paciente"}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatarData(alerta.atendimentoData)}
                    {alerta.atendimentoHora ? ` às ${alerta.atendimentoHora}` : ""}
                  </span>
                  {alerta.atendimentoTipo && (
                    <Badge variant="secondary" className="text-[10px]">
                      {alerta.atendimentoTipo}
                    </Badge>
                  )}
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-amber-600 hover:bg-amber-700"
                disabled={reconhecendoId === alerta.id || reconhecer.isPending}
                onClick={() => handleReconhecer(alerta.id)}
              >
                {reconhecendoId === alerta.id ? "Registrando..." : "Ciente"}
              </Button>
            </div>
          ))}
        </div>

        {pendentes.length > 1 && (
          <div className="mt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
              disabled={reconhecer.isPending}
              onClick={handleReconhecerTodos}
            >
              Reconhecer todos
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ModalAlertasProntuario;
