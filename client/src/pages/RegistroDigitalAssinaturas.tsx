import { useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, FileKey, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { exibirHashIntegridade, statusAssinaturaSadt } from "@shared/historicoAssinaturasGuia";

function formatarDataRegistro(valor: Date | string | null | undefined) {
  if (!valor) return "Não informada";
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? String(valor)
    : data.toLocaleString("pt-BR", { timeZone: "America/Manaus" });
}

export function RegistroDigitalAssinaturas() {
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
  if (isLoading) return <div className="p-6 text-sm text-slate-500">Carregando registro digital...</div>;
  if (error || !data) return <div className="p-6"><Button variant="outline" onClick={voltar}><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Guias</Button><p className="mt-4 text-sm text-red-600">Não foi possível carregar o registro digital desta guia.</p></div>;

  const { guia, paciente, profissional, convenio, assinaturasGuias, assinaturasSadt } = data;
  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6 print:max-w-none print:p-0">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 print:border-slate-400 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Guia SADT · Campo 67</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Registro Digital de Assinaturas</h1>
          <p className="mt-1 text-sm text-slate-600">Evidências técnicas de autoria, data/hora e integridade das assinaturas vinculadas à guia.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" onClick={voltar}><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir registro</Button>
        </div>
      </div>

      <Card className="border-slate-300 print:shadow-none">
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileKey className="h-5 w-5 text-slate-700" />Identificação do documento</CardTitle></CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <p><span className="text-slate-500">Número da guia:</span><br /><strong>{guia.numeroGuia}</strong></p>
          <p><span className="text-slate-500">Identificador interno:</span><br /><strong>GUIA-{guia.id}</strong></p>
          <p><span className="text-slate-500">Paciente:</span><br /><strong>{paciente?.nome || "Não informado"}</strong></p>
          <p><span className="text-slate-500">Convênio:</span><br /><strong>{convenio?.nome || "Não informado"}</strong></p>
          <p><span className="text-slate-500">Profissional:</span><br /><strong>{profissional?.nome || "Não informado"}</strong></p>
          <p><span className="text-slate-500">Procedimento:</span><br /><strong>{guia.procedimento || "Não informado"}</strong></p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-700" /><h2 className="text-lg font-bold text-slate-900">Assinaturas registradas</h2></div>
        {assinaturasGuias.length === 0 ? (
          <Card><CardContent className="p-5 text-sm text-slate-500">Não há assinaturas digitais vinculadas a esta guia.</CardContent></Card>
        ) : assinaturasGuias.map((assinatura: any) => (
          <Card key={assinatura.id} className="border-slate-300 break-inside-avoid print:shadow-none">
            <CardHeader className="bg-slate-50 py-3"><CardTitle className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-700" />Registro da {assinatura.sessaoNumero}ª sessão</CardTitle></CardHeader>
            <CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Data e hora da assinatura:</span> <strong>{formatarDataRegistro(assinatura.dataAssinatura)}</strong></p>
                {assinatura.datasAtendimento && <p><span className="text-slate-500">Data(s) de atendimento:</span> <strong>{assinatura.datasAtendimento}</strong></p>}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Hash SHA-256 de integridade</p>
                  <code className="break-all text-xs leading-5 text-slate-700">{exibirHashIntegridade(assinatura.hashAssinatura)}</code>
                </div>
              </div>
              {assinatura.assinaturaPacienteUrl && <div className="rounded border border-slate-200 bg-white p-2"><img src={assinatura.assinaturaPacienteUrl} alt={`Assinatura digital da ${assinatura.sessaoNumero}ª sessão`} className="max-h-28 max-w-xs" /></div>}
            </CardContent>
          </Card>
        ))}
      </section>

      {assinaturasSadt.length > 0 && <section className="space-y-3 break-inside-avoid"><h2 className="text-lg font-bold text-slate-900">Registros complementares SADT</h2>{assinaturasSadt.map((assinatura: any) => <Card key={assinatura.id} className="border-slate-300 print:shadow-none"><CardContent className="space-y-2 p-4 text-sm"><p><strong>{assinatura.numeroSessao}ª sessão SADT</strong> · {statusAssinaturaSadt(assinatura.status)}</p><p className="text-slate-600">Sessão: {formatarDataRegistro(assinatura.dataSessao)} · Assinatura: {formatarDataRegistro(assinatura.dataAssinatura)}</p><code className="block break-all rounded bg-slate-50 p-2 text-xs text-slate-700">{exibirHashIntegridade(assinatura.assinaturaHash)}</code></CardContent></Card>)}</section>}

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 print:border-slate-300 print:bg-white print:text-slate-700">
        <strong>Nota de integridade:</strong> este registro consolida as evidências técnicas armazenadas pelo sistema para o campo 67, incluindo imagem da assinatura, data/hora e hash SHA-256. A análise de validade jurídica em situação concreta depende da legislação aplicável e, quando necessário, de orientação jurídica profissional.
      </div>
    </div>
  );
}
