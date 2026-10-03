import { Fragment, useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { FileCode, Download, Building2, Package, Save, ShieldCheck, Trash2, List, ChevronDown, ChevronUp } from 'lucide-react';
import { ResultadoValidacaoTISS, type ResultadoValidacao } from '../components/ResultadoValidacaoTISS';
import { PagamentosRepasse } from '../components/PagamentosRepasse';
import { filtrarLotesPorConvenio, formatarDataGuiaTiss } from '@shared/lotesFaturamento';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function FaturamentoTISS() {
  const utils = trpc.useUtils();
  const { data: prestador } = trpc.faturamentoTISS.getPrestador.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const { data: guias = [] } = trpc.guias.list.useQuery();
  const { data: pacientes = [] } = trpc.pacientes.list.useQuery();
  const { data: lotes = [] } = trpc.faturamentoTISS.listLotes.useQuery();
  const loteDirecionadoId = Number(new URLSearchParams(window.location.search).get('loteId') || 0) || null;
  const loteDirecionado = loteDirecionadoId
    ? (lotes as any[]).find((lote: any) => lote.id === loteDirecionadoId)
    : null;
  const [convenioFiltroLotes, setConvenioFiltroLotes] = useState('todos');
  const [loteAbertoId, setLoteAbertoId] = useState<number | null>(loteDirecionadoId);
  const { data: loteDetalhe, isLoading: loteDetalheCarregando } = trpc.faturamentoTISS.getLoteComGuias.useQuery(
    { loteId: loteAbertoId ?? 0 },
    { enabled: !!loteAbertoId },
  );

  const [prestadorForm, setPrestadorForm] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '', cnes: '', codigoPrestadorNaOperadora: '',
  });
  const [convenioId, setConvenioId] = useState<string>('');
  const [numeroLote, setNumeroLote] = useState<string>(String(Date.now()).slice(-6));
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [validacao, setValidacao] = useState<ResultadoValidacao | null>(null);
  const [loteValidando, setLoteValidando] = useState<number | null>(null);
  const [loteParaExcluir, setLoteParaExcluir] = useState<any | null>(null);

  // Preencher formulário do prestador quando dados carregam (em useEffect para evitar setState em render)
  const prestadorCarregado = prestador as any;
  useEffect(() => {
    if (prestadorCarregado && prestadorCarregado.razaoSocial) {
      setPrestadorForm({
        razaoSocial: prestadorCarregado.razaoSocial || '',
        nomeFantasia: prestadorCarregado.nomeFantasia || '',
        cnpj: prestadorCarregado.cnpj || '',
        cnes: prestadorCarregado.cnes || '',
        codigoPrestadorNaOperadora: prestadorCarregado.codigoPrestadorNaOperadora || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestadorCarregado?.razaoSocial, prestadorCarregado?.cnpj]);

  useEffect(() => {
    if (!loteDirecionado?.id) return;
    document.getElementById(`lote-${loteDirecionado.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [loteDirecionado?.id]);

  const salvarPrestador = trpc.faturamentoTISS.salvarPrestador.useMutation({
    onSuccess: () => { toast.success('Dados do prestador salvos'); utils.faturamentoTISS.getPrestador.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const gerarLote = trpc.faturamentoTISS.gerarLote.useMutation({
    onSuccess: (res) => {
      const v = res.validacao as ResultadoValidacao | undefined;
      if (v && !v.valid) {
        toast.warning(`Lote ${res.numeroLote} gerado, mas o XML tem ${v.errors.length} erro(s) de validação`);
      } else {
        toast.success(`Lote ${res.numeroLote} gerado e validado com ${res.quantidadeGuias} guia(s)`);
      }
      if (v) setValidacao(v);
      utils.faturamentoTISS.listLotes.invalidate();
      utils.guias.list.invalidate();
      baixarXML(res.xml, `lote_${res.numeroLote}_tiss.xml`);
      setSelecionadas([]);
      setNumeroLote(String(Date.now()).slice(-6));
    },
    onError: (e) => toast.error(e.message),
  });

  const excluirLote = trpc.faturamentoTISS.excluirLote.useMutation({
    onSuccess: (res) => {
      toast.success(`Lote ${res.numeroLote} excluído. ${res.quantidadeGuiasLiberadas} guia(s) foram liberadas para novo lote.`);
      setLoteParaExcluir(null);
      utils.faturamentoTISS.listLotes.invalidate();
      utils.guias.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  async function handleValidarLote(loteId: number) {
    setLoteValidando(loteId);
    try {
      const res = await utils.faturamentoTISS.validarLote.fetch({ loteId });
      setValidacao(res as ResultadoValidacao);
      if ((res as ResultadoValidacao).valid) {
        toast.success('XML do lote validado sem erros');
      } else {
        toast.warning(`XML do lote possui ${(res as ResultadoValidacao).errors.length} erro(s)`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao validar lote');
    } finally {
      setLoteValidando(null);
    }
  }

  const guiasConvenio = convenioId
    ? guias.filter((g: any) => g.convenioId === parseInt(convenioId) && !g.loteId)
    : [];

  function baixarXML(xml: string, filename: string) {
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBaixarLote(loteId: number) {
    try {
      const res = await utils.faturamentoTISS.getXmlDoLote.fetch({ loteId });
      baixarXML(res.xml, res.filename);
      toast.success('Novo XML corrigido gerado para download');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao gerar XML');
    }
  }

  const valorSelecionado = guiasConvenio
    .filter((g: any) => selecionadas.includes(g.id))
    .reduce((s: number, g: any) => s + parseFloat(g.valor), 0);
  const lotesExibidos = filtrarLotesPorConvenio(lotes as any[], convenioFiltroLotes);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FileCode className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faturamento TISS</h1>
          <p className="text-sm text-muted-foreground">Geração de lotes e XML no padrão ANS <span className="font-semibold text-primary">4.02.00</span> (Guia SP/SADT)</p>
        </div>
      </div>

      <PagamentosRepasse modo="master" />

      {/* Dados do Prestador */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="w-5 h-5 text-primary" /> Dados do Prestador (Contratado)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Razão Social *</Label>
            <Input value={prestadorForm.razaoSocial} onChange={(e) => setPrestadorForm({ ...prestadorForm, razaoSocial: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Nome Fantasia</Label>
            <Input value={prestadorForm.nomeFantasia} onChange={(e) => setPrestadorForm({ ...prestadorForm, nomeFantasia: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>CNPJ *</Label>
            <Input value={prestadorForm.cnpj} onChange={(e) => setPrestadorForm({ ...prestadorForm, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
          </div>
          <div className="space-y-1">
            <Label>CNES</Label>
            <Input value={prestadorForm.cnes} onChange={(e) => setPrestadorForm({ ...prestadorForm, cnes: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Código na Operadora</Label>
            <Input value={prestadorForm.codigoPrestadorNaOperadora} onChange={(e) => setPrestadorForm({ ...prestadorForm, codigoPrestadorNaOperadora: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button
              onClick={() => salvarPrestador.mutate(prestadorForm)}
              disabled={!prestadorForm.razaoSocial || !prestadorForm.cnpj || salvarPrestador.isPending}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" /> Salvar Prestador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gerar Lote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Package className="w-5 h-5 text-primary" /> Gerar Lote de Faturamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Convênio / Operadora *</Label>
              <Select value={convenioId} onValueChange={(v) => { setConvenioId(v); setSelecionadas([]); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a operadora" /></SelectTrigger>
                <SelectContent>
                  {convenios.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Número do Lote *</Label>
              <Input value={numeroLote} onChange={(e) => setNumeroLote(e.target.value)} />
            </div>
          </div>

          {convenioId && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 w-10"></th>
                    <th className="px-3 py-2 text-left font-semibold">Guia</th>
                    <th className="px-3 py-2 text-left font-semibold">Paciente</th>
                    <th className="px-3 py-2 text-left font-semibold">Procedimento</th>
                    <th className="px-3 py-2 text-right font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {guiasConvenio.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Nenhuma guia disponível para faturar nesta operadora.</td></tr>
                  )}
                  {guiasConvenio.map((g: any) => (
                    <tr key={g.id} className="border-t hover:bg-muted/40">
                      <td className="px-3 py-2">
                        <Checkbox
                          checked={selecionadas.includes(g.id)}
                          onCheckedChange={(ck) => {
                            setSelecionadas((prev) => ck ? [...prev, g.id] : prev.filter((id) => id !== g.id));
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">{g.numeroGuia}</td>
                      <td className="px-3 py-2">{pacientes.find((p: any) => p.id === g.pacienteId)?.nome || '-'}</td>
                      <td className="px-3 py-2">{g.procedimento}</td>
                      <td className="px-3 py-2 text-right">R$ {parseFloat(g.valor).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selecionadas.length} guia(s) selecionada(s) — Total: <span className="font-semibold text-foreground">R$ {valorSelecionado.toFixed(2)}</span>
            </div>
            <Button
              onClick={() => gerarLote.mutate({ convenioId: parseInt(convenioId), guiaIds: selecionadas, numeroLote })}
              disabled={!convenioId || selecionadas.length === 0 || !numeroLote || gerarLote.isPending}
            >
              <FileCode className="w-4 h-4 mr-2" /> {gerarLote.isPending ? 'Gerando...' : 'Gerar Lote e Baixar XML'}
            </Button>
          </div>

          {validacao && (
            <div className="mt-2">
              <ResultadoValidacaoTISS resultado={validacao} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lotes Gerados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lotes Gerados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Filtrar lotes por convênio</p>
              <p className="text-xs text-muted-foreground">Mostra somente os lotes da operadora selecionada.</p>
            </div>
            <Select value={convenioFiltroLotes} onValueChange={setConvenioFiltroLotes}>
              <SelectTrigger className="w-full sm:w-[280px]" aria-label="Filtrar lotes por convênio">
                <SelectValue placeholder="Todos os convênios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os convênios</SelectItem>
                {convenios.map((c: any) => (
                  <SelectItem key={`filtro-lote-${c.id}`} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loteDirecionado && (
            <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4" aria-label="Informações do lote selecionado">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                <Package className="h-4 w-4" /> Lote aberto a partir do Pré-faturamento
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
                <div><span className="block text-xs text-muted-foreground">Número</span><strong>{loteDirecionado.numeroLote}</strong></div>
                <div><span className="block text-xs text-muted-foreground">Status</span><strong className="capitalize">{loteDirecionado.status}</strong></div>
                <div><span className="block text-xs text-muted-foreground">Guias</span><strong>{loteDirecionado.quantidadeGuias ?? 0}</strong></div>
                <div><span className="block text-xs text-muted-foreground">Valor total</span><strong>R$ {parseFloat(loteDirecionado.valorTotalLote || '0').toFixed(2)}</strong></div>
                <div><span className="block text-xs text-muted-foreground">Gerado em</span><strong>{loteDirecionado.createdAt ? new Date(loteDirecionado.createdAt).toLocaleString('pt-BR') : '-'}</strong></div>
              </div>
            </div>
          )}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Nº Lote</th>
                  <th className="px-3 py-2 text-left font-semibold">Convênio</th>
                  <th className="px-3 py-2 text-left font-semibold">Guias</th>
                  <th className="px-3 py-2 text-right font-semibold">Valor</th>
                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                  <th className="px-3 py-2 text-left font-semibold">Data</th>
                  <th className="px-3 py-2 text-center font-semibold">Detalhes</th>
                  <th className="px-3 py-2 text-center font-semibold">Validar</th>
                  <th className="px-3 py-2 text-center font-semibold">XML</th>
                  <th className="px-3 py-2 text-center font-semibold">Excluir</th>
                </tr>
              </thead>
              <tbody>
                {lotesExibidos.length === 0 && (
                  <tr><td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">Nenhum lote encontrado para o filtro selecionado.</td></tr>
                )}
                {lotesExibidos.map((l: any) => (
                  <Fragment key={l.id}>
                  <tr id={`lote-${l.id}`} key={l.id} className={`border-t hover:bg-muted/40 ${l.id === loteDirecionadoId ? 'bg-primary/10 ring-1 ring-inset ring-primary/30' : ''}`}>
                    <td className="px-3 py-2 font-medium">{l.numeroLote}</td>
                    <td className="px-3 py-2">{l.convenioNome || convenios.find((c: any) => c.id === l.convenioId)?.nome || '-'}</td>
                    <td className="px-3 py-2">{l.quantidadeGuias}</td>
                    <td className="px-3 py-2 text-right">R$ {parseFloat(l.valorTotalLote || '0').toFixed(2)}</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{l.status}</span></td>
                    <td className="px-3 py-2">{l.createdAt ? new Date(l.createdAt).toLocaleString('pt-BR') : '-'}</td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoteAbertoId((atual) => atual === l.id ? null : l.id)}
                        aria-expanded={loteAbertoId === l.id}
                        aria-controls={`guias-lote-${l.id}`}
                        title={loteAbertoId === l.id ? 'Fechar guias do lote' : 'Abrir guias enviadas no lote'}
                      >
                        {loteAbertoId === l.id ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                        {loteAbertoId === l.id ? 'Fechar' : 'Abrir'}
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleValidarLote(l.id)} disabled={loteValidando === l.id} className="text-emerald-600" title="Validar XML contra o esquema ANS">
                        <ShieldCheck className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBaixarLote(l.id)}
                        className="text-primary"
                        title="Gerar novo XML corrigido"
                        aria-label={`Gerar novo XML corrigido do lote ${l.numeroLote}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLoteParaExcluir(l)}
                        disabled={!['aberto', 'gerado'].includes(l.status)}
                        className="text-destructive hover:text-destructive"
                        title={['aberto', 'gerado'].includes(l.status) ? 'Excluir lote gerado' : 'Lotes enviados ou processados não podem ser excluídos'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                  {loteAbertoId === l.id && (
                    <tr id={`guias-lote-${l.id}`} className="border-t bg-muted/20">
                      <td colSpan={10} className="p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                          <List className="h-4 w-4" /> Guias enviadas no lote {l.numeroLote}
                        </div>
                        {loteDetalheCarregando && <p className="text-sm text-muted-foreground">Carregando guias do lote...</p>}
                        {!loteDetalheCarregando && loteDetalhe?.guias?.length === 0 && (
                          <p className="text-sm text-muted-foreground">Nenhuma guia está vinculada a este lote.</p>
                        )}
                        {!loteDetalheCarregando && loteDetalhe?.guias && loteDetalhe.guias.length > 0 && (
                          <div className="overflow-x-auto rounded-md border bg-background">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/60">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold">Guia</th>
                                  <th className="px-3 py-2 text-left font-semibold">Paciente</th>
                                  <th className="px-3 py-2 text-left font-semibold">Data de emissão</th>
                                  <th className="px-3 py-2 text-left font-semibold">Procedimento</th>
                                  <th className="px-3 py-2 text-right font-semibold">Valor</th>
                                  <th className="px-3 py-2 text-left font-semibold">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loteDetalhe.guias.map((guia: any) => (
                                  <tr key={guia.id} className="border-t">
                                    <td className="px-3 py-2 font-medium">{guia.numeroGuia}</td>
                                    <td className="px-3 py-2">{guia.pacienteNome || '-'}</td>
                                    <td className="px-3 py-2">{formatarDataGuiaTiss(guia.dataEmissao)}</td>
                                    <td className="px-3 py-2">{guia.procedimento || '-'}</td>
                                    <td className="px-3 py-2 text-right">R$ {parseFloat(guia.valor || '0').toFixed(2)}</td>
                                    <td className="px-3 py-2"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{guia.status}</span></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!loteParaExcluir} onOpenChange={(open) => !open && setLoteParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lote {loteParaExcluir?.numeroLote}?</AlertDialogTitle>
            <AlertDialogDescription>
              O lote e a referência do XML serão removidos. As {loteParaExcluir?.quantidadeGuias || 0} guia(s) vinculadas voltarão ao status emitida para novo faturamento. Guias e registros financeiros não serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluirLote.isPending}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => loteParaExcluir && excluirLote.mutate({ loteId: loteParaExcluir.id })}
              disabled={excluirLote.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {excluirLote.isPending ? 'Excluindo...' : 'Excluir lote'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
