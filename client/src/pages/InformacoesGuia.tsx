import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Clipboard, FileKey, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { exibirHashIntegridade, statusAssinaturaSadt } from "@shared/historicoAssinaturasGuia";

function formatarData(valor: Date | string | null | undefined) {
  if (!valor) return "Não informada";
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleString("pt-BR", { timeZone: "America/Manaus" });
}

function BlocoHash({ hash }: { hash: string | null | undefined }) {
  const valor = exibirHashIntegridade(hash);
  const copiar = async () => {
    if (!hash) return;
    await navigator.clipboard?.writeText(hash);
    toast.success("Hash copiado");
  };
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
        <span>Hash de integridade SHA-256</span>
        {hash && <button onClick={copiar} className="inline-flex items-center gap-1 text-blue-700 hover:underline"><Clipboard className="h-3.5 w-3.5" /> Copiar</button>}
      </div>
      <code className="block break-all text-xs leading-5 text-slate-600">{valor}</code>
    </div>
  );
}

export function InformacoesGuia() {
  const [location, navigate] = useLocation();
  const guiaId = Number(new URLSearchParams(location.split("?")[1] || "").get("guiaId"));
  const { data, isLoading, error } = trpc.assinaturasGuias.historicoCompleto.useQuery(
    { guiaId },
    { enabled: Number.isInteger(guiaId) && guiaId > 0 },
  );

  const voltar = () => navigate("/guias");
  if (!Number.isInteger(guiaId) || guiaId <= 0) {
    return <div className="p-6"><Button variant="outline" onClick={voltar}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Guias</Button><p className="mt-4 text-sm text-red-600">Guia não informada.</p></div>;
  }

  if (isLoading) return <div className="p-6 text-sm text-slate-500">Carregando informações da guia...</div>;
  if (error || !data) return <div className="p-6"><Button variant="outline" onClick={voltar}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Guias</Button><p className="mt-4 text-sm text-red-600">Não foi possível carregar as informações desta guia.</p></div>;

  const { guia, paciente, profissional, convenio, assinaturasGuias, assinaturasSadt } = data;
  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Guia SADT</p>
          <h1 className="text-2xl font-bold text-slate-900">Informações e hashes de integridade</h1>
          <p className="mt-1 text-sm text-slate-600">Histórico completo das assinaturas vinculadas à guia.</p>
        </div>
        <Button variant="outline" onClick={voltar}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Guias</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileKey className="h-5 w-5 text-violet-700" />Identificação da guia</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><span className="text-slate-500">Número da guia</span><p className="font-semibold">{guia.numeroGuia}</p></div>
          <div><span className="text-slate-500">Paciente</span><p className="font-semibold">{paciente?.nome || "Não informado"}</p></div>
          <div><span className="text-slate-500">Profissional</span><p className="font-semibold">{profissional?.nome || "Não informado"}</p></div>
          <div><span className="text-slate-500">Convênio</span><p className="font-semibold">{convenio?.nome || "Não informado"}</p></div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-700" /><h2 className="text-lg font-bold text-slate-900">Sessões assinadas</h2><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{assinaturasGuias.length}</span></div>
        {assinaturasGuias.length === 0 ? <Card><CardContent className="p-5 text-sm text-slate-500">Não há sessões assinadas vinculadas a esta guia.</CardContent></Card> : assinaturasGuias.map((assinatura: any) => (
          <Card key={assinatura.id} className="overflow-hidden">
            <CardHeader className="bg-green-50 py-3"><CardTitle className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><CheckCircle2 className="h-4 w-4 text-green-700" />{assinatura.sessaoNumero}ª sessão <span className="font-normal text-slate-600">Assinada em {formatarData(assinatura.dataAssinatura)}</span></CardTitle></CardHeader>
            <CardContent className="space-y-3 p-4">
              {assinatura.datasAtendimento && <p className="text-sm text-slate-600"><strong>Data(s) de atendimento:</strong> {assinatura.datasAtendimento}</p>}
              {assinatura.assinaturaPacienteUrl && <img src={assinatura.assinaturaPacienteUrl} alt={`Assinatura da ${assinatura.sessaoNumero}ª sessão`} className="max-h-24 max-w-xs rounded border bg-white p-1" />}
              <BlocoHash hash={assinatura.hashAssinatura} />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><FileKey className="h-5 w-5 text-blue-700" /><h2 className="text-lg font-bold text-slate-900">Registros SADT</h2><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{assinaturasSadt.length}</span></div>
        {assinaturasSadt.length === 0 ? <Card><CardContent className="p-5 text-sm text-slate-500">Não há registros SADT adicionais nesta guia.</CardContent></Card> : assinaturasSadt.map((assinatura: any) => (
          <Card key={assinatura.id}><CardContent className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{assinatura.numeroSessao}ª sessão SADT</strong><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{statusAssinaturaSadt(assinatura.status)}</span></div><p className="text-sm text-slate-600">Sessão: {formatarData(assinatura.dataSessao)} · Assinatura: {formatarData(assinatura.dataAssinatura)}</p><BlocoHash hash={assinatura.assinaturaHash} /></CardContent></Card>
        ))}
      </section>
    </div>
  );
}
