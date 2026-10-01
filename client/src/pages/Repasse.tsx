import { useState, useMemo } from 'react';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { toast } from 'sonner';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { prepararDadosExportacaoRepasse } from '@shared/relatorioRepasseExportacao';
import { PagamentosRepasse } from '../components/PagamentosRepasse';
import {
  CheckCircle, XCircle, Clock, AlertTriangle,
  DollarSign, TrendingDown, TrendingUp, Filter, RefreshCw, Calendar,
  FileSignature, ExternalLink, Lock, FileSpreadsheet, FileText
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatData(data: string | Date | null | undefined): string {
  if (!data) return '—';
  try {
    const str = typeof data === 'string' ? data : data.toISOString().split('T')[0];
    const normalized = str.length > 10 ? str : str + 'T00:00:00';
    return format(parseISO(normalized), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return String(data);
  }
}

// Datas padrão: início e fim do mês actual
function defaultDataInicio() {
  return format(startOfMonth(new Date()), 'yyyy-MM-dd');
}
function defaultDataFim() {
  return format(endOfMonth(new Date()), 'yyyy-MM-dd');
}

// ─── Componente principal ───────────────────────────────────────────────────

export function Repasse() {
  const { user } = useAuth();
  const isProfissional = user?.perfil === 'profissional';
  // No portal, o usuário master é persistido com o perfil administrativo.
  const isMaster = user?.perfil === 'administrador';

  // Filtros
  const [filtroConvenioId, setFiltroConvenioId] = useState<number | undefined>(undefined);
  const [filtroProfissionalId, setFiltroProfissionalId] = useState<number | undefined>(undefined);
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>(defaultDataInicio());
  const [filtroDataFim, setFiltroDataFim] = useState<string>(defaultDataFim());

  // Modal de confirmação de glosa
  const [modalGlosaOpen, setModalGlosaOpen] = useState(false);
  const [glosaTarget, setGlosaTarget] = useState<{ guiaId: number; pacienteNome: string } | null>(null);

  const utils = trpc.useUtils();

  // Dados auxiliares para os filtros
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery(undefined, { enabled: isMaster });

  // Dados de repasse com filtros aplicados no servidor
  const { data: linhas = [], isLoading, refetch } = trpc.repasse.listarPorPaciente.useQuery({
    convenioId: filtroConvenioId,
    profissionalId: isMaster ? filtroProfissionalId : undefined,
    dataInicio: filtroDataInicio || undefined,
    dataFim: filtroDataFim || undefined,
  }, {
    // Valores de guia, procedimento e unidades podem ser ajustados enquanto a
    // tela fica aberta. Reconsulta para não manter o repasse em cache antigo.
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  // Mutations (apenas admin e recepção podem marcar recebido/glosa)
  const marcarRecebido = trpc.repasse.marcarRecebido.useMutation({
    onSuccess: () => {
      toast.success('Guia marcada como recebida');
      utils.repasse.listarPorPaciente.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const registarGlosa = trpc.repasse.registarGlosa.useMutation({
    onSuccess: () => {
      toast.success('Glosa registada com sucesso');
      setModalGlosaOpen(false);
      setGlosaTarget(null);
      utils.repasse.listarPorPaciente.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // ─── Totalizadores ──────────────────────────────────────────────────────
  const totais = useMemo(() => {
    const recebidos = linhas.filter(l => l.statusRecebimento === 'recebido');
    const glosados = linhas.filter(l => l.statusRecebimento === 'glosa');
    const pendentes = linhas.filter(l => l.statusRecebimento === 'pendente');
    return {
      totalAtendimentos: linhas.length,
      recebidos: recebidos.length,
      glosados: glosados.length,
      pendentes: pendentes.length,
      valorBrutoTotal: linhas.reduce((s, l) => s + l.valorBruto, 0),
      valorRepasseTotal: linhas.reduce((s, l) => s + l.valorRepasse, 0),
      valorGlosaTotal: glosados.reduce((s, l) => s + l.valorGlosa, 0),
    };
  }, [linhas]);

  // ─── Período formatado para exibição ────────────────────────────────────
  const periodoLabel = useMemo(() => {
    if (!filtroDataInicio && !filtroDataFim) return 'Todos os períodos';
    if (filtroDataInicio && filtroDataFim) {
      return `${formatData(filtroDataInicio)} a ${formatData(filtroDataFim)}`;
    }
    if (filtroDataInicio) return `A partir de ${formatData(filtroDataInicio)}`;
    return `Até ${formatData(filtroDataFim)}`;
  }, [filtroDataInicio, filtroDataFim]);

  const nomeArquivoBase = `repasse-${filtroDataInicio || 'inicio'}-${filtroDataFim || 'fim'}`;

  const exportarExcel = () => {
    if (linhas.length === 0) return toast.error('Não há dados de repasse para exportar.');
    const { registros, totais } = prepararDadosExportacaoRepasse(linhas as any);
    const planilha = XLSX.utils.json_to_sheet(registros);
    XLSX.utils.sheet_add_aoa(planilha, [
      [],
      ['Resumo', '', '', '', 'Valor Bruto (R$)', 'Repasse (R$)', 'Glosa (R$)', ''],
      ['Totais', '', '', '', totais.valorBruto, totais.valorRepasse, totais.valorGlosa, ''],
    ], { origin: -1 });
    planilha['!cols'] = [
      { wch: 28 }, { wch: 26 }, { wch: 24 }, { wch: 14 },
      { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    ];
    const livro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(livro, planilha, 'Repasse');
    XLSX.writeFile(livro, `${nomeArquivoBase}.xlsx`);
    toast.success('Planilha de repasse exportada com sucesso.');
  };

  const exportarPdf = () => {
    if (linhas.length === 0) return toast.error('Não há dados de repasse para exportar.');
    const { registros, totais } = prepararDadosExportacaoRepasse(linhas as any);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    pdf.setFontSize(14);
    pdf.text('Relatório de Repasse aos Profissionais', 14, 14);
    pdf.setFontSize(9);
    pdf.text(`Período: ${periodoLabel}`, 14, 20);
    autoTable(pdf, {
      startY: 24,
      head: [['Paciente', 'Profissional', 'Convênio', 'Data', 'Bruto', 'Repasse', 'Glosa', 'Status']],
      body: registros.map(registro => [
        registro.Paciente, registro.Profissional, registro.Convênio, registro.Data,
        formatBRL(Number(registro['Valor Bruto (R$)'])),
        formatBRL(Number(registro['Repasse (R$)'])),
        formatBRL(Number(registro['Glosa (R$)'])), registro.Status,
      ]),
      foot: [[
        `Total (${registros.length})`, '', '', '', formatBRL(totais.valorBruto),
        formatBRL(totais.valorRepasse), formatBRL(totais.valorGlosa), '',
      ]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 64, 175] },
      footStyles: { fillColor: [71, 85, 105] },
    });
    pdf.save(`${nomeArquivoBase}.pdf`);
    toast.success('Relatório de repasse em PDF exportado com sucesso.');
  };

  if (isProfissional) {
    return (
      <div className="p-6">
        <PagamentosRepasse modo="profissional" />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isProfissional ? 'Meu Repasse' : 'Repasse aos Profissionais'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isProfissional
              ? 'Visualize os seus atendimentos com prontuário preenchido e o status de recebimento.'
              : 'Apenas atendimentos com prontuário preenchido entram na base de repasse.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isMaster && <>
            <Button variant="outline" size="sm" onClick={exportarExcel} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportarPdf} className="gap-2">
              <FileText className="w-4 h-4" /> PDF
            </Button>
          </>}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Data início */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Data início
            </Label>
            <Input
              type="date"
              value={filtroDataInicio}
              onChange={e => setFiltroDataInicio(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Data fim */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Data fim
            </Label>
            <Input
              type="date"
              value={filtroDataFim}
              onChange={e => setFiltroDataFim(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Convênio */}
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Convênio</Label>
            <Select
              value={filtroConvenioId?.toString() ?? 'todos'}
              onValueChange={v => setFiltroConvenioId(v === 'todos' ? undefined : Number(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {convenios.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isMaster && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Profissional</Label>
              <Select
                value={filtroProfissionalId?.toString() ?? 'todos'}
                onValueChange={v => setFiltroProfissionalId(v === 'todos' ? undefined : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {profissionais.filter((p: any) => p.ativo !== 0).map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Indicador do período seleccionado */}
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Período: <span className="font-medium text-foreground">{periodoLabel}</span>
        </p>
      </div>

      {/* Totalizadores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Atendimentos</p>
          <p className="text-2xl font-bold">{totais.totalAtendimentos}</p>
          <p className="text-xs text-muted-foreground">com prontuário</p>
        </div>
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Valor Bruto</p>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totais.valorBrutoTotal)}</p>
          <p className="text-xs text-muted-foreground">total das guias</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 space-y-1">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Repasse Total</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatBRL(totais.valorRepasseTotal)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">{totais.recebidos} recebidos</p>
        </div>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-1">
          <p className="text-xs text-red-700 dark:text-red-300">Total Glosado</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatBRL(totais.valorGlosaTotal)}</p>
          <p className="text-xs text-red-600 dark:text-red-400">{totais.glosados} glosas</p>
        </div>
      </div>

      {/* Tabela de atendimentos por paciente */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold">Atendimentos por Paciente</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Recebido
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-500" /> Glosa
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> Pendente
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">A carregar...</div>
        ) : linhas.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <DollarSign className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento com prontuário preenchido para os filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Paciente</th>
                  {/* Profissional só aparece para admin/recepção */}
                  {!isProfissional && (
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Profissional</th>
                  )}
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Convênio</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Valor Bruto</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Repasse</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Glosa</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Guia Assinada</th>
                  <th className="text-center px-4 py-2 font-medium text-muted-foreground">Status</th>
                  {/* Acções só para admin/recepção */}
                  {!isProfissional && (
                    <th className="text-center px-4 py-2 font-medium text-muted-foreground">Acções</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {linhas.map((linha) => (
                  <tr key={linha.atendimentoId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{linha.pacienteNome}</td>
                    {!isProfissional && (
                      <td className="px-4 py-3 text-muted-foreground">{linha.profissionalNome}</td>
                    )}
                    <td className="px-4 py-3 text-muted-foreground">{linha.convenioNome}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatData(linha.data as any)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {linha.valorBruto > 0
                        ? <div className="flex flex-col items-end gap-0.5"><span>{formatBRL(linha.valorBruto)}</span>{(linha as any).isPacoteNeuro && <span className="text-[10px] font-sans text-violet-700 dark:text-violet-300">Pacote ÷ {(linha as any).totalAtendimentosDaSerie} sessões da série</span>}{(linha as any).unidadesRepasse > 1 && <span className="text-[10px] font-sans text-blue-700 dark:text-blue-300">{(linha as any).unidadesRepasse} un. de 30 min</span>}</div>
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400">
                      {linha.valorRepasse > 0
                        ? formatBRL(linha.valorRepasse)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600 dark:text-red-400">
                      {linha.valorGlosa > 0
                        ? formatBRL(linha.valorGlosa)
                        : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                     {(linha as any).guiaAssinada ? (
                       <div className="flex flex-col items-center gap-0.5">
                          {(linha as any).isConvenioIsentoAssinatura ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium">
                              <FileSignature className="w-3.5 h-3.5" />
                              Isento
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                              <FileSignature className="w-3.5 h-3.5" />
                              Assinada
                            </span>
                          )}
                          {(linha as any).guiaAssinadaData && (
                            <span className="text-xs text-muted-foreground">
                              {new Date((linha as any).guiaAssinadaData).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {(linha as any).guiaAssinadaPdfUrl && (
                            <a
                              href={(linha as any).guiaAssinadaPdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-xs text-blue-600 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={linha.statusRecebimento} />
                    </td>
                    {/* Acções apenas para admin e recepção */}
                    {!isProfissional && (
                      <td className="px-4 py-3 text-center">
                        {linha.guiaId && linha.statusRecebimento === 'pendente' && (
                          <div className="flex items-center justify-center gap-1">
                            <TooltipProvider delayDuration={200}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {/* Wrapper necessário para o tooltip funcionar em botão desabilitado */}
                                  <span className="inline-flex">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className={
                                        (linha as any).guiaAssinada
                                          ? 'h-7 px-2 text-xs gap-1 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                                          : 'h-7 px-2 text-xs gap-1 text-muted-foreground border-muted-foreground/30 cursor-not-allowed opacity-50'
                                      }
                                      onClick={() => {
                                        if (!(linha as any).guiaAssinada) return;
                                        marcarRecebido.mutate({ guiaId: linha.guiaId! });
                                      }}
                                      disabled={marcarRecebido.isPending || !(linha as any).guiaAssinada}
                                    >
                                      {(linha as any).guiaAssinada
                                        ? <TrendingUp className="w-3 h-3" />
                                        : <Lock className="w-3 h-3" />}
                                      Recebido
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px] text-center">
                                 {(linha as any).guiaAssinada
                                   ? 'Marcar guia como recebida'
                                    : (linha as any).isConvenioIsentoAssinatura
                                      ? 'Marcar guia como recebida (convênio isento de assinatura)'
                                      : 'Guia não assinada pelo paciente. O repasse só pode ser marcado como recebido após a assinatura digital da guia SADT.'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs gap-1 text-red-700 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                              onClick={() => {
                                setGlosaTarget({ guiaId: linha.guiaId!, pacienteNome: linha.pacienteNome });
                                setModalGlosaOpen(true);
                              }}
                            >
                              <TrendingDown className="w-3 h-3" />
                              Glosa
                            </Button>
                          </div>
                        )}
                        {!linha.guiaId && (
                          <span className="text-xs text-muted-foreground italic">Sem guia</span>
                        )}
                        {linha.guiaId && linha.statusRecebimento !== 'pendente' && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

              {/* Rodapé com totais */}
              <tfoot className="bg-muted/50 border-t-2 border-border">
                <tr>
                  <td colSpan={isProfissional ? 3 : 4} className="px-4 py-3 font-semibold text-sm">
                    Total — {linhas.length} atendimento{linhas.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono">
                    {formatBRL(totais.valorBrutoTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-emerald-700 dark:text-emerald-400">
                    {formatBRL(totais.valorRepasseTotal)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold font-mono text-red-600 dark:text-red-400">
                    {formatBRL(totais.valorGlosaTotal)}
                  </td>
                  <td colSpan={isProfissional ? 1 : 2} className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {totais.recebidos} recebidos · {totais.glosados} glosas · {totais.pendentes} pendentes
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmação de glosa */}
      <Dialog open={modalGlosaOpen} onOpenChange={setModalGlosaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Registar Glosa
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <p className="text-sm text-muted-foreground">
              Tem a certeza que deseja registar uma glosa para o paciente{' '}
              <strong>{glosaTarget?.pacienteNome}</strong>?
            </p>
            <p className="text-xs text-muted-foreground bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-2">
              Esta acção marca a guia como glosada e exclui o valor do repasse do profissional.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setModalGlosaOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => glosaTarget && registarGlosa.mutate({ guiaId: glosaTarget.guiaId })}
              disabled={registarGlosa.isPending}
            >
              {registarGlosa.isPending ? 'A registar...' : 'Confirmar Glosa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Badge de status ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'recebido' | 'glosa' | 'pendente' }) {
  if (status === 'recebido') {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 gap-1">
        <CheckCircle className="w-3 h-3" />
        Recebido
      </Badge>
    );
  }
  if (status === 'glosa') {
    return (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 gap-1">
        <AlertTriangle className="w-3 h-3" />
        Glosa
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 gap-1">
      <Clock className="w-3 h-3" />
      Pendente
    </Badge>
  );
}
