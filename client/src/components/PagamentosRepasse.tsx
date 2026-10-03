import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { CheckCircle2, Clock3, Download, Eye, FileUp, ReceiptText, RotateCcw, WalletCards } from 'lucide-react';
import { toast } from 'sonner';

type Modo = 'profissional' | 'master';
type LinhaRepasse = {
  atendimentoId: number;
  profissionalId: number;
  profissionalNome: string;
  pacienteNome: string;
  convenioNome: string;
  data: string | Date;
  valorBruto: number;
  valorRepasse: number;
  competenciaRepasse: string;
  statusRepasse: 'pendente' | 'pago';
};

function competenciaAtual() {
  return new Date().toISOString().slice(0, 7);
}

const MESES_COMPETENCIA = [
  ['01', 'Janeiro'], ['02', 'Fevereiro'], ['03', 'Março'], ['04', 'Abril'],
  ['05', 'Maio'], ['06', 'Junho'], ['07', 'Julho'], ['08', 'Agosto'],
  ['09', 'Setembro'], ['10', 'Outubro'], ['11', 'Novembro'], ['12', 'Dezembro'],
] as const;

function anosDeCompetencia() {
  const anoAtual = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, indice) => String(anoAtual + 1 - indice));
}

function fimDaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number);
  return `${competencia}-${String(new Date(Date.UTC(ano, mes, 0)).getUTCDate()).padStart(2, '0')}`;
}

function formatarBRL(valor: number) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(data: string | Date) {
  const valor = data instanceof Date ? data : new Date(`${String(data).slice(0, 10)}T12:00:00`);
  return Number.isNaN(valor.getTime()) ? String(data) : format(valor, 'dd/MM/yyyy', { locale: ptBR });
}

function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => reject(new Error('Não foi possível ler a nota fiscal.'));
    leitor.readAsDataURL(arquivo);
  });
}

export function PagamentosRepasse({ modo }: { modo: Modo }) {
  const { user } = useAuth();
  const isMaster = modo === 'master';
  const competenciaInicial = competenciaAtual();
  const [mesCompetencia, setMesCompetencia] = useState(() => competenciaInicial.slice(5, 7));
  const [anoCompetencia, setAnoCompetencia] = useState(() => competenciaInicial.slice(0, 4));
  const [profissionalId, setProfissionalId] = useState<number | undefined>(undefined);
  const [convenioId, setConvenioId] = useState<number | undefined>(undefined);
  const [aba, setAba] = useState<'pendente' | 'pago'>(isMaster ? 'pendente' : 'pago');
  const [notaEmVisualizacao, setNotaEmVisualizacao] = useState<{ nomeArquivo: string; arquivoUrl: string; mimeType: string } | null>(null);
  const inputNotaFiscalRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const competencia = `${anoCompetencia}-${mesCompetencia}`;
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery(undefined, { enabled: isMaster });
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const { data: linhas = [], isLoading } = trpc.repasse.listarPorPaciente.useQuery({
    profissionalId: isMaster ? profissionalId : undefined,
    convenioId,
    dataInicio: competencia ? `${competencia}-01` : undefined,
    dataFim: competencia ? fimDaCompetencia(competencia) : undefined,
  }, { refetchOnMount: 'always', refetchOnWindowFocus: true });
  const { data: notasFiscais = [] } = trpc.repasse.listarNotasFiscais.useQuery({
    competencia,
    profissionalId: isMaster ? profissionalId : undefined,
  }, { enabled: Boolean(competencia) });

  const definirStatus = trpc.repasse.definirStatusPagamento.useMutation({
    onSuccess: (resultado) => {
      toast.success(`${resultado.atualizados} atendimento(s) atualizado(s).`);
      utils.repasse.listarPorPaciente.invalidate();
      utils.repasse.listarNotasFiscais.invalidate();
    },
    onError: erro => toast.error(erro.message),
  });
  const importarNotaFiscal = trpc.repasse.importarNotaFiscal.useMutation({
    onSuccess: () => {
      toast.success('Nota fiscal importada para a competência selecionada.');
      utils.repasse.listarNotasFiscais.invalidate();
      utils.repasse.listarPorPaciente.invalidate();
      if (inputNotaFiscalRef.current) inputNotaFiscalRef.current.value = '';
    },
    onError: erro => toast.error(erro.message),
  });

  const linhasDaCompetencia = useMemo(
    () => (linhas as LinhaRepasse[]).filter(linha => linha.competenciaRepasse === competencia),
    [competencia, linhas],
  );
  const pendentes = useMemo(() => linhasDaCompetencia.filter(linha => linha.statusRepasse === 'pendente'), [linhasDaCompetencia]);
  const pagos = useMemo(() => linhasDaCompetencia.filter(linha => linha.statusRepasse === 'pago'), [linhasDaCompetencia]);
  // O profissional vê exclusivamente os próprios atendimentos da competência,
  // inclusive os que ainda aguardam a baixa do master. Assim ele identifica os
  // pacientes em processamento sem ganhar permissão para alterar o repasse.
  const linhasDaAba = isMaster ? (aba === 'pago' ? pagos : pendentes) : linhasDaCompetencia;
  const totalPago = useMemo(() => pagos.reduce((total, linha) => total + Number(linha.valorRepasse || 0), 0), [pagos]);
  const totalPendente = useMemo(() => pendentes.reduce((total, linha) => total + Number(linha.valorRepasse || 0), 0), [pendentes]);
  const totalDaCompetencia = useMemo(
    () => linhasDaCompetencia.reduce((total, linha) => total + Number(linha.valorRepasse || 0), 0),
    [linhasDaCompetencia],
  );
  const totalRecebidoPelaClinica = useMemo(
    () => pagos.reduce((total, linha) => total + Number(linha.valorBruto || 0), 0),
    [pagos],
  );
  const profissionalDaNota = isMaster ? profissionalId : user?.profissionalVinculadoId;

  const marcarTodosPendentesComoPagos = () => {
    if (pendentes.length === 0) return;
    const confirmado = window.confirm(`Confirmar baixa como pago de ${pendentes.length} atendimento(s) da competência ${competencia}?`);
    if (!confirmado) return;
    definirStatus.mutate({
      atendimentoIds: pendentes.map(linha => linha.atendimentoId),
      status: 'pago',
      competencia,
    });
  };

  const handleImportarNotaFiscal = async (arquivo?: File) => {
    if (!arquivo) return;
    if (!profissionalDaNota) {
      toast.error('Selecione o profissional antes de importar a nota fiscal.');
      if (inputNotaFiscalRef.current) inputNotaFiscalRef.current.value = '';
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(arquivo.type) || arquivo.size > 10 * 1024 * 1024) {
      toast.error('Envie um arquivo PDF, JPG ou PNG de até 10 MB.');
      return;
    }
    try {
      const base64Data = await arquivoParaBase64(arquivo);
      importarNotaFiscal.mutate({
        competencia,
        profissionalId: isMaster ? profissionalDaNota : undefined,
        nomeArquivo: arquivo.name,
        mimeType: arquivo.type,
        base64Data,
      });
    } catch (erro: any) {
      toast.error(erro?.message ?? 'Não foi possível importar a nota fiscal.');
    }
  };

  return (
    <section className="space-y-5" aria-label="Pagamentos de repasse">
      <div className="rounded-xl border border-olive-200 bg-gradient-to-r from-[#f5f6e8] to-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-[#596b2d]">
              <WalletCards className="h-5 w-5" />
              <h2 className="text-lg font-bold">Pagamentos de repasse</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isMaster ? 'Dê baixa por competência e acompanhe os comprovantes fiscais por profissional.' : 'Consulte os atendimentos, o total previsto e os pagamentos da competência selecionada.'}
            </p>
          </div>
          {isMaster && (
            <Button onClick={marcarTodosPendentesComoPagos} disabled={pendentes.length === 0 || definirStatus.isPending} className="gap-2 bg-[#596b2d] hover:bg-[#475523]">
              <CheckCircle2 className="h-4 w-4" />
              {definirStatus.isPending ? 'Registrando...' : `Dar baixa em ${pendentes.length} pendente(s)`}
            </Button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Mês de competência/atendimento</Label>
            <Select value={mesCompetencia} onValueChange={setMesCompetencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MESES_COMPETENCIA.map(([valor, rotulo]) => <SelectItem key={valor} value={valor}>{rotulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ano de pagamento</Label>
            <Select value={anoCompetencia} onValueChange={setAnoCompetencia}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {anosDeCompetencia().map(ano => <SelectItem key={ano} value={ano}>{ano}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {isMaster && (
            <div className="space-y-1">
              <Label className="text-xs">Profissional</Label>
              <Select value={profissionalId?.toString() ?? 'todos'} onValueChange={valor => setProfissionalId(valor === 'todos' ? undefined : Number(valor))}>
                <SelectTrigger><SelectValue placeholder="Todos os profissionais" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {profissionais.filter((profissional: any) => profissional.ativo !== 0).map((profissional: any) => (
                    <SelectItem key={profissional.id} value={String(profissional.id)}>{profissional.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Convênio</Label>
            <Select value={convenioId?.toString() ?? 'todos'} onValueChange={valor => setConvenioId(valor === 'todos' ? undefined : Number(valor))}>
              <SelectTrigger><SelectValue placeholder="Todos os convênios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os convênios</SelectItem>
                {convenios.filter((convenio: any) => convenio.ativo !== 0).map((convenio: any) => (
                  <SelectItem key={convenio.id} value={String(convenio.id)}>{convenio.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end gap-2">
              <input ref={inputNotaFiscalRef} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={evento => handleImportarNotaFiscal(evento.target.files?.[0])} />
              <Button variant="outline" className="gap-2 border-[#879856] text-[#596b2d] hover:bg-[#eef1dc]" onClick={() => inputNotaFiscalRef.current?.click()} disabled={importarNotaFiscal.isPending || !profissionalDaNota}>
                <FileUp className="h-4 w-4" />
                {importarNotaFiscal.isPending ? 'Importando...' : 'Importar nota fiscal'}
              </Button>
              {!isMaster && <p className="text-xs text-muted-foreground">Envie a sua nota fiscal referente à competência selecionada.</p>}
            </div>
        </div>
      </div>

      {notasFiscais.length > 0 && (
        <div className="rounded-lg border border-[#d7dfae] bg-[#fbfdf2] p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#596b2d]"><ReceiptText className="h-4 w-4" /> Notas fiscais da competência</div>
          <div className="flex flex-wrap gap-2">
            {notasFiscais.map((nota: any) => (
              <div key={nota.id} className="inline-flex overflow-hidden rounded-md border border-[#c6d18b] bg-white text-sm text-[#536625]">
                <button type="button" onClick={() => setNotaEmVisualizacao(nota)} className="inline-flex items-center gap-2 px-3 py-2 hover:bg-[#f0f4dc]" aria-label={`Visualizar nota fiscal ${nota.nomeArquivo}`}>
                  <Eye className="h-4 w-4" /> {nota.nomeArquivo}
                </button>
                <a href={nota.arquivoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center border-l border-[#c6d18b] px-2 py-2 hover:bg-[#f0f4dc]" aria-label={`Abrir nota fiscal ${nota.nomeArquivo} em nova aba`}>
                  <Download className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`grid gap-3 ${isMaster ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
        <div className="rounded-lg border border-[#9baa62] bg-[#f5f8e9] p-4 text-left">
          <div className="text-sm text-[#596b2d]">Total de repasse da competência</div>
          <p className="mt-1 text-xl font-bold">{formatarBRL(totalDaCompetencia)}</p>
          <p className="text-xs text-muted-foreground">{linhasDaCompetencia.length} atendimento(s) nos filtros selecionados</p>
        </div>
        {isMaster && <button type="button" onClick={() => setAba('pendente')} className={`rounded-lg border p-4 text-left transition-colors ${aba === 'pendente' ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'}`}>
            <div className="flex items-center gap-2 text-sm text-amber-800"><Clock3 className="h-4 w-4" /> Pendente de repasse</div>
            <p className="mt-1 text-xl font-bold">{formatarBRL(totalPendente)}</p>
            <p className="text-xs text-muted-foreground">{pendentes.length} atendimento(s)</p>
          </button>}
        <button type="button" onClick={() => setAba('pago')} className={`rounded-lg border p-4 text-left transition-colors ${aba === 'pago' ? 'border-[#9baa62] bg-[#f5f8e9]' : 'border-border bg-card'}`}>
          <div className="flex items-center gap-2 text-sm text-[#596b2d]"><CheckCircle2 className="h-4 w-4" /> Pago ao profissional</div>
          <p className="mt-1 text-xl font-bold">{formatarBRL(totalPago)}</p>
          <p className="text-xs text-muted-foreground">{pagos.length} atendimento(s)</p>
        </button>
        <div className="rounded-lg border border-[#c6d18b] bg-[#fbfdf2] p-4 text-left">
          <div className="text-sm text-[#596b2d]">Valor recebido pela clínica</div>
          <p className="mt-1 text-xl font-bold">{formatarBRL(totalRecebidoPelaClinica)}</p>
          <p className="text-xs text-muted-foreground">Valores dos convênios dos atendimentos pagos</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-4 py-3"><h3 className="font-semibold">{isMaster ? (aba === 'pago' ? 'Atendimentos pagos' : 'Atendimentos pendentes de repasse') : 'Atendimentos da competência'}</h3></div>
        {isLoading ? <p className="p-8 text-center text-sm text-muted-foreground">Carregando pagamentos...</p> : linhasDaAba.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Não há atendimentos {isMaster ? (aba === 'pago' ? 'pagos' : 'pendentes') : 'com prontuário concluído'} nesta competência.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 text-left font-medium">Paciente</th>{isMaster && <th className="px-4 py-3 text-left font-medium">Profissional</th>}<th className="px-4 py-3 text-left font-medium">Convênio</th><th className="px-4 py-3 text-left font-medium">Atendimento</th><th className="px-4 py-3 text-right font-medium">Recebido pela clínica</th><th className="px-4 py-3 text-right font-medium">Repasse</th><th className="px-4 py-3 text-center font-medium">Status</th>{isMaster && <th className="px-4 py-3 text-center font-medium">Ação</th>}</tr></thead>
              <tbody className="divide-y">
                {linhasDaAba.map(linha => <tr key={linha.atendimentoId} className="hover:bg-muted/30"><td className="px-4 py-3 font-medium">{linha.pacienteNome}</td>{isMaster && <td className="px-4 py-3">{linha.profissionalNome}</td>}<td className="px-4 py-3 text-muted-foreground">{linha.convenioNome}</td><td className="px-4 py-3">{formatarData(linha.data)}</td><td className="px-4 py-3 text-right font-mono">{formatarBRL(linha.valorBruto)}</td><td className="px-4 py-3 text-right font-mono">{formatarBRL(linha.valorRepasse)}</td><td className="px-4 py-3 text-center">{linha.statusRepasse === 'pago' ? <Badge className="bg-[#e6edc8] text-[#4f6026] hover:bg-[#e6edc8]">Pago</Badge> : <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Pendente</Badge>}</td>{isMaster && <td className="px-4 py-3 text-center">{linha.statusRepasse === 'pendente' ? <Button size="sm" onClick={() => definirStatus.mutate({ atendimentoIds: [linha.atendimentoId], competencia, status: 'pago' })} disabled={definirStatus.isPending} className="bg-[#596b2d] hover:bg-[#475523]">Marcar pago</Button> : <Button size="sm" variant="outline" onClick={() => definirStatus.mutate({ atendimentoIds: [linha.atendimentoId], competencia, status: 'pendente' })} disabled={definirStatus.isPending} className="gap-1"><RotateCcw className="h-3.5 w-3.5" /> Pendente</Button>}</td>}</tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(notaEmVisualizacao)} onOpenChange={aberto => { if (!aberto) setNotaEmVisualizacao(null); }}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-[#596b2d]" /> {notaEmVisualizacao?.nomeArquivo}</DialogTitle>
          </DialogHeader>
          {notaEmVisualizacao && (
            notaEmVisualizacao.mimeType === 'application/pdf'
              ? <iframe src={notaEmVisualizacao.arquivoUrl} title={`Nota fiscal ${notaEmVisualizacao.nomeArquivo}`} className="h-[70vh] w-full bg-muted" />
              : <div className="flex max-h-[70vh] justify-center overflow-auto bg-muted p-4"><img src={notaEmVisualizacao.arquivoUrl} alt={`Nota fiscal ${notaEmVisualizacao.nomeArquivo}`} className="max-h-[65vh] max-w-full object-contain" /></div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
