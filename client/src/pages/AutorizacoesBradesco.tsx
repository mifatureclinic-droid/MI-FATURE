import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Bot, CheckCircle2, Clock3, FilePlus2, KeyRound, Loader2, RefreshCw, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { buildBradescoReturnPayload, isBradescoReturnReady, type BradescoReturnForm } from "@/lib/bradescoReturn";

type Status = "pendente_documentacao" | "pendente" | "aguardando_acao_humana" | "enviado_portal" | "liberada" | "autorizado" | "negado" | "erro" | "cancelado";

const STATUS: Record<Status, { label: string; className: string }> = {
  pendente_documentacao: { label: "Documentação pendente", className: "bg-amber-100 text-amber-900 border-amber-200" },
  pendente: { label: "Pronta para revisão", className: "bg-sky-100 text-sky-900 border-sky-200" },
  aguardando_acao_humana: { label: "Aguardando CAPTCHA", className: "bg-violet-100 text-violet-900 border-violet-200" },
  enviado_portal: { label: "Enviada ao portal", className: "bg-blue-100 text-blue-900 border-blue-200" },
  liberada: { label: "Liberada — conferir dados", className: "bg-teal-100 text-teal-900 border-teal-200" },
  autorizado: { label: "Autorizada", className: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  negado: { label: "Negada", className: "bg-red-100 text-red-900 border-red-200" },
  erro: { label: "Erro", className: "bg-orange-100 text-orange-900 border-orange-200" },
  cancelado: { label: "Cancelada", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

const blankCredential = { cpfResponsavel: "", cnpjPrestador: "", nomePrestador: "", senhaLogin: "" };
const emptyResultForm: BradescoReturnForm = { status: "autorizado", protocoloBradesco: "", numeroAutorizacaoBradesco: "", senhaAutorizacaoBradesco: "", dataAutorizacao: new Date().toISOString().slice(0, 10), validadeAutorizacao: "", sessoesAutorizadas: "", motivoNegacao: "" };

export default function AutorizacoesBradesco() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<Status | "todas">("todas");
  const [showCredential, setShowCredential] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showResult, setShowResult] = useState<number | null>(null);
  const [showLog, setShowLog] = useState<number | null>(null);
  const [credential, setCredential] = useState(blankCredential);
  const [selectedGuide, setSelectedGuide] = useState("");
  const [periodoGuias, setPeriodoGuias] = useState({ inicio: "2026-09-01", fim: "2026-09-30" });
  const [newForm, setNewForm] = useState({ codigoTUSS: "", cid10: "F41", quantidadeSessoes: "1", dataInicio: "", dataFim: "", pedidoMedicoUrl: "", pedidoMedicoNomeArquivo: "" });
  const [resultForm, setResultForm] = useState<BradescoReturnForm>(emptyResultForm);

  const { data: stats } = trpc.bradesco.estatisticas.useQuery();
  const { data: rows, isLoading } = trpc.bradesco.listar.useQuery({ status: filter === "todas" ? undefined : filter, limit: 100 });
  const { data: credentials } = trpc.bradesco.getCredenciais.useQuery();
  const { data: guides } = trpc.bradesco.guiasDisponiveis.useQuery(periodoGuias);
  const guideId = Number(selectedGuide || 0);
  const { data: prepared } = trpc.bradesco.prepararGuia.useQuery({ guiaId: guideId }, { enabled: guideId > 0 });

  useEffect(() => {
    if (!prepared) return;
    setNewForm((current) => ({
      ...current,
      codigoTUSS: prepared.guia.codigoTUSS || current.codigoTUSS,
      cid10: prepared.guia.cid10 || current.cid10,
      quantidadeSessoes: String(prepared.guia.quantidadeSessoes || current.quantidadeSessoes),
    }));
  }, [prepared]);

  const pilotRequirements = prepared ? [
    !prepared.paciente.numeroCarteira && "carteirinha",
    !prepared.paciente.nomeMedicoSolicitante && "nome do médico solicitante",
    !prepared.paciente.crmMedicoSolicitante && "CRM/conselho do solicitante",
    !prepared.paciente.ufMedicoSolicitante && "UF do solicitante",
    !prepared.paciente.cbosMedicoSolicitante && "CBOS do solicitante",
    !/^\d{8}$/.test(newForm.codigoTUSS) && "código TUSS de 8 dígitos",
    !newForm.dataInicio && "início da série",
    !newForm.dataFim && "fim da série",
    !newForm.pedidoMedicoUrl && "encaminhamento médico anexado",
  ].filter((item): item is string => Boolean(item)) : [];

  const refresh = () => Promise.all([utils.bradesco.listar.invalidate(), utils.bradesco.estatisticas.invalidate(), utils.bradesco.guiasDisponiveis.invalidate()]);
  const saveCredential = trpc.bradesco.salvarCredenciais.useMutation({
    onSuccess: () => { toast.success("Credenciais guardadas com segurança."); setCredential(blankCredential); setShowCredential(false); utils.bradesco.getCredenciais.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const createAuthorization = trpc.bradesco.criarDaGuia.useMutation({
    onSuccess: (data) => { toast.success(data.status === "pendente" ? "Solicitação preparada para revisão." : "Guia criada com pendência de encaminhamento."); setShowNew(false); setSelectedGuide(""); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const assist = trpc.bradesco.sinalizarExecucaoAssistida.useMutation({
    onSuccess: () => { toast.success("Solicitação marcada para execução assistida. O CAPTCHA continuará exigindo validação humana."); refresh(); },
    onError: (error) => toast.error(error.message),
  });
  const saveResult = trpc.bradesco.registrarResultado.useMutation({
    onSuccess: () => { toast.success("Resultado vinculado à guia de série."); setShowResult(null); refresh(); },
    onError: (error) => toast.error(error.message),
  });

  const openResult = (row: { id: number; status: string; protocoloBradesco?: string | null; senhaAutorizacaoBradesco?: string | null }) => {
    setResultForm({
      ...emptyResultForm,
      status: row.status === "enviado_portal" ? "enviado_portal" : row.status === "liberada" ? "liberada" : row.status === "negado" ? "negado" : "autorizado",
      protocoloBradesco: row.protocoloBradesco || "",
      senhaAutorizacaoBradesco: row.senhaAutorizacaoBradesco || "",
    });
    setShowResult(row.id);
  };

  const selectGuide = (value: string) => {
    setSelectedGuide(value);
    const guide = guides?.find((item) => String(item.id) === value);
    setNewForm((current) => ({ ...current, codigoTUSS: "", cid10: guide?.cid10 || "F41", quantidadeSessoes: String(guide?.totalSessoes || 1), dataInicio: guide?.dataEmissao ? new Date(guide.dataEmissao).toISOString().slice(0, 10) : "" }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 text-white p-6 shadow-xl">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/10 p-3"><Bot className="h-7 w-7 text-cyan-200" /></div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Autorizações Bradesco</h1>
              <p className="mt-1 max-w-2xl text-sm text-blue-100">Fila segura para preparar pedidos SADT, conferir encaminhamentos e registrar a resposta da operadora na guia de série.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setShowCredential(true)}><KeyRound className="mr-2 h-4 w-4" />Credenciais</Button>
            <Button className="bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => setShowNew(true)}><FilePlus2 className="mr-2 h-4 w-4" />Preparar guia</Button>
          </div>
        </div>
        <div className="mt-5 flex gap-2 rounded-lg border border-amber-300/30 bg-amber-100/10 p-3 text-xs text-amber-100">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{credentials?.[0]?.modoExecucao === "assistido_sob_demanda" ? "Modo ativo: assistido sob demanda. Nunca há envio invisível; CAPTCHA, troca de senha e confirmação final continuam sob validação humana." : "Configure as credenciais para ativar o modo assistido sob demanda. CAPTCHA, troca de senha e confirmação final continuam sob validação humana."}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Na fila" value={stats?.pendente ?? 0} tone="sky" />
        <Metric label="Com pendência" value={stats?.pendenteDocumentacao ?? 0} tone="amber" />
        <Metric label="Aguardando ação" value={stats?.aguardandoAcaoHumana ?? 0} tone="violet" />
        <Metric label="Liberadas" value={stats?.liberada ?? 0} tone="sky" />
        <Metric label="Autorizadas" value={stats?.autorizado ?? 0} tone="emerald" />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Fila de solicitações</CardTitle><CardDescription>Dados vindos das guias de série. Revise CID, TUSS e anexo antes de solicitar no portal.</CardDescription></div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value) => setFilter(value as Status | "todas")}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todos os status</SelectItem>{Object.entries(STATUS).map(([key, item]) => <SelectItem key={key} value={key}>{item.label}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" size="icon" aria-label="Atualizar fila" onClick={() => refresh()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div> : !rows?.length ? <div className="py-16 text-center text-sm text-slate-500">Nenhuma solicitação nesta fila. Prepare uma guia Bradesco para iniciar.</div> :
            <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Paciente / guia</th><th className="px-5 py-3">TUSS e CID</th><th className="px-5 py-3">Série</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.id} className="hover:bg-slate-50/80"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{row.nomePaciente}</div><div className="text-xs text-slate-500">Guia #{row.guiaId} · carteira {row.numeroCarteira || "não cadastrada"}</div></td><td className="px-5 py-4"><div className="font-mono text-xs text-slate-800">{row.codigoTUSS}</div><div className="text-xs text-slate-500">CID {row.cid10}</div></td><td className="px-5 py-4 text-slate-700">{row.quantidadeSessoes} sessões</td><td className="px-5 py-4"><Badge variant="outline" className={STATUS[row.status as Status].className}>{STATUS[row.status as Status].label}</Badge></td><td className="px-5 py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" aria-label="Ver registro de execução" onClick={() => setShowLog(row.id)}><Clock3 className="h-4 w-4" /></Button>{row.status === "pendente" && <Button size="sm" variant="outline" disabled={assist.isPending} onClick={() => assist.mutate({ autorizacaoId: row.id })}><Send className="mr-1.5 h-3.5 w-3.5" />Solicitar</Button>}{["aguardando_acao_humana", "enviado_portal", "liberada", "pendente"].includes(row.status) && <Button size="sm" onClick={() => openResult(row)}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Registrar retorno</Button>}</div></td></tr>)}</tbody></table></div>}
        </CardContent>
      </Card>

      <Dialog open={showLog !== null} onOpenChange={(open) => !open && setShowLog(null)}><DialogContent><DialogHeader><DialogTitle>Registro da solicitação</DialogTitle><DialogDescription>Histórico interno das ações feitas nesta solicitação.</DialogDescription></DialogHeader><pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">{rows?.find((row) => row.id === showLog)?.logExecucao || "Nenhum registro disponível."}</pre><DialogFooter><Button variant="outline" onClick={() => setShowLog(null)}>Fechar</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={showCredential} onOpenChange={setShowCredential}><DialogContent><DialogHeader><DialogTitle>Credenciais do portal Bradesco</DialogTitle><DialogDescription>A senha é cifrada no servidor e não volta para a tela. Somente administradores podem alterar esse acesso.</DialogDescription></DialogHeader><div className="grid gap-3 py-2"><Field label="CPF do responsável"><Input value={credential.cpfResponsavel} onChange={(e) => setCredential({ ...credential, cpfResponsavel: e.target.value })} /></Field><Field label="CNPJ do prestador"><Input value={credential.cnpjPrestador} onChange={(e) => setCredential({ ...credential, cnpjPrestador: e.target.value })} /></Field><Field label="Nome do prestador"><Input value={credential.nomePrestador} onChange={(e) => setCredential({ ...credential, nomePrestador: e.target.value })} /></Field><Field label="Senha"><Input type="password" autoComplete="new-password" value={credential.senhaLogin} onChange={(e) => setCredential({ ...credential, senhaLogin: e.target.value })} /></Field>{credentials?.length ? <p className="text-xs text-emerald-700">Uma credencial ativa já está configurada. Salvar substitui a senha guardada.</p> : null}</div><DialogFooter><Button disabled={saveCredential.isPending} onClick={() => saveCredential.mutate(credential)}>Guardar com segurança</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Preparar autorização a partir de guia</DialogTitle><DialogDescription>Somente guias de setembro de 2026 podem entrar no piloto. As guias de agosto permanecem protegidas.</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-sky-100 bg-sky-50/70 p-3"><Field label="Mostrar guias a partir de"><Input type="date" value={periodoGuias.inicio} onChange={(e) => { setSelectedGuide(""); setPeriodoGuias({ ...periodoGuias, inicio: e.target.value }); }} /></Field><Field label="Até"><Input type="date" value={periodoGuias.fim} onChange={(e) => { setSelectedGuide(""); setPeriodoGuias({ ...periodoGuias, fim: e.target.value }); }} /></Field></div>
            <Field label="Guia Bradesco"><Select value={selectedGuide} onValueChange={selectGuide}><SelectTrigger><SelectValue placeholder="Selecione uma guia em rascunho" /></SelectTrigger><SelectContent>{guides?.map((guide) => <SelectItem key={guide.id} value={String(guide.id)}>{guide.nomePaciente} · {guide.numeroGuia} · {guide.totalSessoes || 1} sessões</SelectItem>)}</SelectContent></Select></Field>
            <div className="grid grid-cols-2 gap-3"><Field label="Código TUSS (8 dígitos)"><Input inputMode="numeric" placeholder="Ex.: 50000470" value={newForm.codigoTUSS} onChange={(e) => setNewForm({ ...newForm, codigoTUSS: e.target.value.replace(/\D/g, "").slice(0, 8) })} /></Field><Field label="CID-10"><Input value={newForm.cid10} onChange={(e) => setNewForm({ ...newForm, cid10: e.target.value.toUpperCase() })} /></Field></div>
            <div className="grid grid-cols-3 gap-3"><Field label="Sessões"><Input type="number" min="1" value={newForm.quantidadeSessoes} onChange={(e) => setNewForm({ ...newForm, quantidadeSessoes: e.target.value })} /></Field><Field label="Início"><Input type="date" value={newForm.dataInicio} onChange={(e) => setNewForm({ ...newForm, dataInicio: e.target.value })} /></Field><Field label="Fim"><Input type="date" value={newForm.dataFim} onChange={(e) => setNewForm({ ...newForm, dataFim: e.target.value })} /></Field></div>
            <Field label="Encaminhamento da pasta do paciente">{prepared?.anexos.length ? <Select value={newForm.pedidoMedicoUrl || "sem-anexo"} onValueChange={(value) => { const selected = prepared.anexos.find((anexo) => anexo.fileUrl === value); setNewForm({ ...newForm, pedidoMedicoUrl: value === "sem-anexo" ? "" : value, pedidoMedicoNomeArquivo: selected?.nome || "" }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sem-anexo">Sem anexo — não liberar ao piloto</SelectItem>{prepared.anexos.map((anexo) => <SelectItem key={anexo.id} value={anexo.fileUrl}>{anexo.nome} ({anexo.categoria || "outros"})</SelectItem>)}</SelectContent></Select> : <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Anexe o encaminhamento na pasta do paciente antes de iniciar o piloto.</div>}</Field>
            {prepared && <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">Paciente: <strong>{prepared.paciente.nome}</strong> · Carteira: <strong>{prepared.paciente.numeroCarteira || "não informada"}</strong> · Solicitante: <strong>{prepared.paciente.nomeMedicoSolicitante || "revisar"}</strong></div>}
            {prepared && pilotRequirements.length > 0 && <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertCircle className="h-4 w-4 shrink-0" /><span>Para liberar ao piloto, complete: <strong>{pilotRequirements.join(", ")}.</strong></span></div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button><Button disabled={!selectedGuide || pilotRequirements.length > 0 || createAuthorization.isPending} onClick={() => createAuthorization.mutate({ guiaId: guideId, codigoTUSS: newForm.codigoTUSS, cid10: newForm.cid10 || "F41", quantidadeSessoes: Number(newForm.quantidadeSessoes), dataInicio: newForm.dataInicio, dataFim: newForm.dataFim, pedidoMedicoUrl: newForm.pedidoMedicoUrl, pedidoMedicoNomeArquivo: newForm.pedidoMedicoNomeArquivo })}>Preparar solicitação</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult !== null} onOpenChange={(open) => !open && setShowResult(null)}><DialogContent><DialogHeader><DialogTitle>Registrar retorno do Bradesco</DialogTitle><DialogDescription>{resultForm.status === "enviado_portal" ? "Registre o protocolo retornado pelo portal. A guia fica marcada como enviada e aguarda a análise da operadora." : resultForm.status === "liberada" ? "Registre a liberação que o portal exibiu. A senha e a data são vinculadas à guia; validade e sessões só serão gravadas se forem oficialmente retornadas." : "Ao registrar como autorizada, a senha, validade e quantidade são vinculadas automaticamente à guia de série."}</DialogDescription></DialogHeader><div className="grid gap-3 py-2"><Field label="Situação"><Select value={resultForm.status} onValueChange={(value) => setResultForm({ ...resultForm, status: value as BradescoReturnForm["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="enviado_portal">Solicitação enviada</SelectItem><SelectItem value="liberada">Liberada — dados a complementar</SelectItem><SelectItem value="autorizado">Autorizada</SelectItem><SelectItem value="negado">Negada</SelectItem></SelectContent></Select></Field><Field label="Protocolo"><Input value={resultForm.protocoloBradesco} onChange={(e) => setResultForm({ ...resultForm, protocoloBradesco: e.target.value })} /></Field>{["enviado_portal", "liberada"].includes(resultForm.status) && <Field label={resultForm.status === "liberada" ? "Senha retornada pelo portal" : "Senha retornada pelo portal (opcional)"}><Input value={resultForm.senhaAutorizacaoBradesco} onChange={(e) => setResultForm({ ...resultForm, senhaAutorizacaoBradesco: e.target.value })} /></Field>}{resultForm.status === "liberada" && <Field label="Data da liberação"><Input type="date" value={resultForm.dataAutorizacao} onChange={(e) => setResultForm({ ...resultForm, dataAutorizacao: e.target.value })} /></Field>}{resultForm.status === "autorizado" && <><div className="grid grid-cols-2 gap-3"><Field label="Número da autorização"><Input value={resultForm.numeroAutorizacaoBradesco} onChange={(e) => setResultForm({ ...resultForm, numeroAutorizacaoBradesco: e.target.value })} /></Field><Field label="Senha"><Input value={resultForm.senhaAutorizacaoBradesco} onChange={(e) => setResultForm({ ...resultForm, senhaAutorizacaoBradesco: e.target.value })} /></Field></div><div className="grid grid-cols-3 gap-3"><Field label="Data"><Input type="date" value={resultForm.dataAutorizacao} onChange={(e) => setResultForm({ ...resultForm, dataAutorizacao: e.target.value })} /></Field><Field label="Validade"><Input type="date" value={resultForm.validadeAutorizacao} onChange={(e) => setResultForm({ ...resultForm, validadeAutorizacao: e.target.value })} /></Field><Field label="Sessões"><Input type="number" value={resultForm.sessoesAutorizadas} onChange={(e) => setResultForm({ ...resultForm, sessoesAutorizadas: e.target.value })} /></Field></div></>}{resultForm.status === "negado" && <Field label="Motivo"><Input value={resultForm.motivoNegacao} onChange={(e) => setResultForm({ ...resultForm, motivoNegacao: e.target.value })} /></Field>}</div><DialogFooter><Button disabled={saveResult.isPending || !isBradescoReturnReady(resultForm)} onClick={() => showResult && saveResult.mutate(buildBradescoReturnPayload(showResult, resultForm))}>Guardar resultado</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "sky" | "amber" | "violet" | "emerald" }) {
  const color = { sky: "border-sky-200 bg-sky-50 text-sky-900", amber: "border-amber-200 bg-amber-50 text-amber-900", violet: "border-violet-200 bg-violet-50 text-violet-900", emerald: "border-emerald-200 bg-emerald-50 text-emerald-900" }[tone];
  return <Card className={color}><CardContent className="p-4"><div className="text-2xl font-bold">{value}</div><div className="mt-1 text-xs font-medium opacity-75">{label}</div></CardContent></Card>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>; }
