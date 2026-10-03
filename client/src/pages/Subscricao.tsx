import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, CreditCard, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: { label: "Activa", color: "text-green-600", icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
  trialing: { label: "Período de Teste", color: "text-blue-600", icon: <Clock className="w-5 h-5 text-blue-500" /> },
  past_due: { label: "Pagamento em Atraso", color: "text-yellow-600", icon: <Clock className="w-5 h-5 text-yellow-500" /> },
  canceled: { label: "Cancelada", color: "text-red-600", icon: <XCircle className="w-5 h-5 text-red-500" /> },
  incomplete: { label: "Incompleta", color: "text-gray-500", icon: <Clock className="w-5 h-5 text-gray-400" /> },
};

const PLANO_LABELS: Record<string, string> = {
  starter: "MiFatureClinic Starter",
  clinica: "MiFatureClinic Clínica",
  premium: "MiFatureClinic Premium",
};

export default function Subscricao() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success") === "true";

  const { data: subscricao, isLoading, refetch } = trpc.stripe.getSubscricao.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createPortal = trpc.stripe.createPortalSession.useMutation({
    onSuccess: ({ url }) => {
      if (url) window.open(url, "_blank");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao abrir o portal de billing.");
    },
  });

  useEffect(() => {
    if (success) {
      toast.success("Subscrição activada com sucesso! Bem-vindo ao MiFatureClinic.");
      refetch();
    }
  }, [success]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const statusInfo = subscricao ? STATUS_LABELS[subscricao.status] : null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">A Minha Subscrição</h1>
        <p className="text-gray-500 mb-8">Gerencie o seu plano MiFatureClinic</p>

        {subscricao ? (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {PLANO_LABELS[subscricao.plano] || subscricao.plano}
                </CardTitle>
                {statusInfo && (
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1.5 px-3 py-1 ${statusInfo.color} border-current`}
                  >
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscricao.stripeSubscriptionId && (
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                  <span className="font-medium">ID da Subscrição:</span>{" "}
                  <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                    {subscricao.stripeSubscriptionId}
                  </code>
                </div>
              )}

              <Button
                onClick={() =>
                  createPortal.mutate({ origin: window.location.origin })
                }
                disabled={createPortal.isPending}
                className="w-full bg-green-700 hover:bg-green-800 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {createPortal.isPending ? "A abrir..." : "Gerir Subscrição / Faturação"}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-xs text-center text-gray-400">
                Será redirecionado para o portal seguro da Stripe para gerir pagamentos, cancelar ou alterar o plano.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Sem subscrição activa</h2>
              <p className="text-gray-500 mb-6">
                Escolha um plano MiFatureClinic para começar a gerir o faturamento da sua clínica.
              </p>
              <Button
                onClick={() => {
                  navigate("/");
                  setTimeout(() => {
                    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }}
                className="bg-green-700 hover:bg-green-800 text-white"
              >
                Ver Planos Disponíveis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
