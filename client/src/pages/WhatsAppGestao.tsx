import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  QrCode,
  AlertCircle,
  Loader2,
  MessageSquare,
  Send,
  CheckCircle2,
  Pencil,
  X,
  Phone,
  ClipboardList,
} from "lucide-react";

export default function WhatsAppGestao() {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [polling, setPolling] = useState(false);
  const [testPhone, setTestPhone] = useState("5592996016639");
  const [novoNumero, setNovoNumero] = useState("");
  const [editandoNumero, setEditandoNumero] = useState(false);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState('');
  const [convenioSelecionado, setConvenioSelecionado] = useState('');

  const configQuery = trpc.whatsapp.getConfig.useQuery();
  const updateNumeroMutation = trpc.whatsapp.updateNumero.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Número actualizado para ${data.numero}. Reconecte o WhatsApp para activar.`);
        configQuery.refetch();
        setEditandoNumero(false);
        setNovoNumero("");
      }
    },
    onError: (e) => toast.error("Erro ao actualizar número: " + e.message),
  });

  const statusQuery = trpc.whatsapp.getStatus.useQuery(undefined, {
    refetchInterval: polling ? 5000 : false,
  });

  const createMutation = trpc.whatsapp.createInstance.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setPolling(true);
        statusQuery.refetch();
        fetchQRCode();
      } else {
        toast.error(data.error || "Erro ao criar instância");
      }
    },
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("WhatsApp desconectado com sucesso.");
      setPolling(false);
      setQrBase64(null);
      statusQuery.refetch();
    },
  });

  const sendTestMutation = trpc.whatsapp.sendText.useMutation({
    onSuccess: (data: { success: boolean }) => {
      if (data.success) {
        toast.success("Mensagem de teste enviada com sucesso!");
      } else {
        toast.error("Erro ao enviar. Verifique a conexão.");
      }
    },
  });

  const status = statusQuery.data;
  const isConnected = status?.connected;
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const filtrosEnvioValidos = Boolean(profissionalSelecionado && convenioSelecionado);
  const previaAnamnese = trpc.anamnese.previsualizarEnvioLoteWhatsapp.useQuery(
    { profissionalId: Number(profissionalSelecionado), convenioId: Number(convenioSelecionado) },
    { enabled: filtrosEnvioValidos, retry: false },
  );
  const enviarLoteAnamnese = trpc.anamnese.enviarLoteWhatsapp.useMutation({
    onSuccess: (resultado) => {
      if (resultado.enviados === resultado.total) {
        toast.success(`${resultado.enviados} links de anamnese enviados pelo WhatsApp`);
      } else {
        toast.warning(`${resultado.enviados} de ${resultado.total} links foram enviados. ${resultado.falhas.length} falharam.`);
      }
      previaAnamnese.refetch();
    },
    onError: (erro) => toast.error(`Não foi possível enviar os links: ${erro.message}`),
  });

  // Iniciar polling e carregar QR quando estado for "connecting"
  useEffect(() => {
    if (status?.status === "connecting" || status?.status === "close") {
      setPolling(true);
      if (!qrBase64) {
        fetchQRCode();
      }
    } else if (status?.status === "open") {
      setPolling(false);
      setQrBase64(null);
    }
  }, [status?.status]);

  const getQRCodeMutation = trpc.whatsapp.getQRCode.useQuery(undefined, { enabled: false });

  const fetchQRCode = async () => {
    setLoadingQR(true);
    try {
      const result = await getQRCodeMutation.refetch();
      const qr = result?.data?.qrcode;
      if (qr?.base64) {
        const b64 = qr.base64;
        setQrBase64(b64.startsWith("data:") ? b64 : `data:image/png;base64,${b64}`);
      } else {
        toast.error("QR Code não disponível. Tente novamente em alguns segundos.");
      }
    } catch (e: any) {
      toast.error("Erro ao carregar QR Code: " + e.message);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleConnect = () => {
    if (status?.status === "not_created") {
      createMutation.mutate();
    } else {
      setPolling(true);
      fetchQRCode();
      statusQuery.refetch();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-sm text-muted-foreground">Gestão da conexão WhatsApp via Evolution API</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              Estado da Conexão
            </span>
            <Badge
              variant={isConnected ? "default" : "secondary"}
              className={isConnected ? "bg-green-500 text-white" : ""}
            >
              {statusQuery.isLoading
                ? "A verificar..."
                : isConnected
                ? "Conectado"
                : status?.status === "connecting"
                ? "A conectar..."
                : "Desconectado"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Instância:</span>
              <span className="ml-2 font-medium">{configQuery.data?.instancia || 'mifatureclinic'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Número activo:</span>
              <span className="ml-2 font-medium">{configQuery.data?.numero || '5592996016639'}</span>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {!isConnected && (
              <Button
                onClick={handleConnect}
                disabled={createMutation.isPending || loadingQR}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createMutation.isPending || loadingQR ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4 mr-2" />
                )}
                {status?.status === "not_created" ? "Configurar WhatsApp" : "Gerar QR Code"}
              </Button>
            )}

            {isConnected && (
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {disconnectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4 mr-2" />
                )}
                Desconectar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => statusQuery.refetch()}
              disabled={statusQuery.isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${statusQuery.isFetching ? "animate-spin" : ""}`} />
              Actualizar Estado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Card */}
      {!isConnected && qrBase64 && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <QrCode className="w-5 h-5" />
              Escanear QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                Abra o WhatsApp no telemóvel <strong>92 99601-6639</strong> → Dispositivos vinculados → Vincular dispositivo → Escaneie o QR Code abaixo.
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-xl border-2 border-green-200 shadow-sm">
                <img
                  src={qrBase64}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchQRCode}
                disabled={loadingQR}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingQR ? "animate-spin" : ""}`} />
                Actualizar QR Code
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              O QR Code expira em 60 segundos. Se expirar, clique em "Actualizar QR Code".
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conectado — funcionalidades activas */}
      {isConnected && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              Funcionalidades Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-green-800">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                Confirmações de agendamento automáticas
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                Envio de link de assinatura SADT
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                Lembretes automáticos 24h antes da consulta
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                Envio do PDF comprovante de assinatura
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-teal-800">
            <ClipboardList className="w-5 h-5" />
            Enviar links de Anamnese
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione o profissional e o convênio. Apenas pacientes com atendimento correspondente e telefone cadastrado entrarão na prévia.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium text-foreground">
              Profissional
              <select
                value={profissionalSelecionado}
                onChange={(event) => setProfissionalSelecionado(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
              >
                <option value="">Selecione o profissional</option>
                {profissionais.map((profissional: any) => <option key={profissional.id} value={profissional.id}>{profissional.nome}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-foreground">
              Convênio
              <select
                value={convenioSelecionado}
                onChange={(event) => setConvenioSelecionado(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-normal"
              >
                <option value="">Selecione o convênio</option>
                {convenios.map((convenio: any) => <option key={convenio.id} value={convenio.id}>{convenio.nome}</option>)}
              </select>
            </label>
          </div>

          {filtrosEnvioValidos && (
            <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
              {previaAnamnese.isLoading ? <p className="flex items-center gap-2 text-sm text-teal-800"><Loader2 className="h-4 w-4 animate-spin" /> Calculando pacientes elegíveis...</p> : previaAnamnese.error ? <p className="text-sm text-red-700">{previaAnamnese.error.message}</p> : <>
                <p className="font-medium text-teal-950">{previaAnamnese.data?.total || 0} paciente(s) elegível(is)</p>
                {(previaAnamnese.data?.pacientes?.length || 0) > 0 && <p className="mt-1 text-sm text-teal-800">{previaAnamnese.data!.pacientes.slice(0, 12).map((paciente) => paciente.nome).join(', ')}{(previaAnamnese.data?.total || 0) > 12 ? '…' : ''}</p>}
                {(previaAnamnese.data?.total || 0) === 0 && <p className="mt-1 text-sm text-teal-800">Nenhum paciente com telefone foi localizado para essa combinação.</p>}
              </>}
            </div>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-teal-700 hover:bg-teal-800" disabled={!isConnected || !previaAnamnese.data?.total || enviarLoteAnamnese.isPending}>
                {enviarLoteAnamnese.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Enviar links para {previaAnamnese.data?.total || 0} paciente(s)
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar envio de links de anamnese</AlertDialogTitle>
                <AlertDialogDescription>
                  Serão enviados {previaAnamnese.data?.total || 0} links individuais pelo WhatsApp. Cada link expira em 7 dias e a mensagem não contém informações clínicas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => enviarLoteAnamnese.mutate({ profissionalId: Number(profissionalSelecionado), convenioId: Number(convenioSelecionado), confirmar: true })} className="bg-teal-700 hover:bg-teal-800">Confirmar envio</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          {!isConnected && <p className="text-xs text-amber-700">Conecte o WhatsApp antes de enviar os links.</p>}
        </CardContent>
      </Card>

      {/* Configurar Número */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Número WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 border rounded-lg text-sm bg-muted/30 font-mono">
              {configQuery.data?.numero || '5592996016639'}
            </div>
            {!editandoNumero ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNovoNumero(configQuery.data?.numero || '');
                  setEditandoNumero(true);
                }}
              >
                <Pencil className="w-4 h-4 mr-1" />
                Trocar
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditandoNumero(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {editandoNumero && (
            <div className="space-y-2">
              <input
                type="text"
                value={novoNumero}
                onChange={(e) => setNovoNumero(e.target.value)}
                placeholder="Novo número com DDI (ex: 5592996016639)"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateNumeroMutation.mutate({ numero: novoNumero })}
                  disabled={updateNumeroMutation.isPending || novoNumero.length < 10}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updateNumeroMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : null}
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditandoNumero(false)}
                >
                  Cancelar
                </Button>
              </div>
              <p className="text-xs text-amber-600">
                ⚠️ Após trocar o número, desconecte e reconecte o WhatsApp para activar o novo número.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teste de envio */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Teste de Envio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Número com DDI (ex: 5592996016639)"
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background"
              />
              <Button
                onClick={() =>
                  sendTestMutation.mutate({
                    phone: testPhone,
                    text: "✅ Teste de conexão MiFatureClinic — WhatsApp conectado com sucesso!",
                  })
                }
                disabled={sendTestMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {sendTestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie uma mensagem de teste para confirmar que a conexão está funcional.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
