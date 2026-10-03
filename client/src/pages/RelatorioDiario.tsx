import { useState, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Printer, Download, Filter, RefreshCw, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, RotateCcw, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

const STATUS_LABELS: Record<string, string> = {
  agendado: 'Aguardando atendimento',
  realizado: 'Atendido',
  cancelado: 'Não chegou / Cancelado',
  falta: 'Faltou',
};

const STATUS_COLORS: Record<string, string> = {
  agendado: 'bg-blue-100 text-blue-800 border-blue-300',
  realizado: 'bg-green-100 text-green-800 border-green-300',
  cancelado: 'bg-red-100 text-red-800 border-red-300',
  falta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  reagendado: 'bg-orange-100 text-orange-800 border-orange-300',
};

function getStatusLabel(status: string, reagendadoPara?: number | null) {
  if (status === 'cancelado' && reagendadoPara) return 'Reagendou';
  return STATUS_LABELS[status] || status;
}

function getStatusClass(status: string, reagendadoPara?: number | null) {
  if (status === 'cancelado' && reagendadoPara) return STATUS_COLORS['reagendado'];
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

interface RelatorioDiarioProps {
  onNavigate?: (page: string) => void;
}

export function RelatorioDiario({ onNavigate }: RelatorioDiarioProps) {
  const hoje = format(new Date(), 'yyyy-MM-dd');
  const [data, setData] = useState(hoje);
  const [profissionalId, setProfissionalId] = useState<string>('todos');
  const [convenioId, setConvenioId] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const printRef = useRef<HTMLDivElement>(null);

  const { data: profissionais = [] } = trpc.profissionais.list.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();

  const queryInput = useMemo(() => ({
    data,
    profissionalId: profissionalId !== 'todos' ? parseInt(profissionalId) : undefined,
    convenioId: convenioId !== 'todos' ? parseInt(convenioId) : undefined,
    status: statusFiltro !== 'todos' ? statusFiltro as any : undefined,
  }), [data, profissionalId, convenioId, statusFiltro]);

  const { data: relatorio, isLoading, refetch } = trpc.relatorios.agendaDiaria.useQuery(queryInput);
  const { data: clinicaData } = trpc.faturamentoTISS.getNomeClinica.useQuery();

  const dataFormatada = useMemo(() => {
    try {
      return format(new Date(data + 'T12:00:00'), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return data;
    }
  }, [data]);

  const handleImprimir = () => {
    if (!relatorio) { alert('Aguarde o carregamento do relatório.'); return; }
    const atends = relatorio.atendimentos || [];
    const tots = relatorio.totais;
    const profNome = profissionalId !== 'todos'
      ? (profissionais as any[]).find((p: any) => p.id.toString() === profissionalId)?.nome || ''
      : 'Todos';
    const convNome = convenioId !== 'todos'
      ? (convenios as any[]).find((c: any) => c.id.toString() === convenioId)?.nome || ''
      : 'Todos';

    const linhas = atends.map((a: any, idx: number) => {
      const statusLabel = (a.status === 'cancelado' && a.reagendadoPara) ? 'Reagendou'
        : ({ agendado: 'Aguardando', realizado: 'Atendido', cancelado: 'Cancelado', falta: 'Faltou', faltou_assinou: 'Faltou/Assinou' } as any)[a.status] || a.status;
      const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
      return `<tr style="background:${bg};border-bottom:1px solid #e5e7eb">
        <td style="padding:6px 10px;font-family:monospace;font-weight:600">${a.hora || '—'}</td>
        <td style="padding:6px 10px;font-weight:500">${a.pacienteNome || '—'}</td>
        <td style="padding:6px 10px;font-size:11px;font-family:monospace">${(a as any).pacienteCarteirinha || '—'}</td>
        <td style="padding:6px 10px">${a.profissionalNome || '—'}</td>
        <td style="padding:6px 10px">${a.convenioNome || 'Particular'}</td>
        <td style="padding:6px 10px">${a.tipo || '—'}</td>
        <td style="padding:6px 10px"><span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${a.status==='realizado'?'#dcfce7':a.status==='cancelado'?'#fee2e2':a.status==='falta'?'#fef9c3':'#dbeafe'};color:${a.status==='realizado'?'#166534':a.status==='cancelado'?'#991b1b':a.status==='falta'?'#854d0e':'#1e40af'}">${statusLabel}</span></td>
        <td style="padding:6px 10px;text-align:center">${a.status==='realizado'?(a.prontuarioFeito?'✅':'⚠️'):'—'}</td>
        <td style="padding:6px 10px;text-align:center">${a.confirmacaoStatus==='confirmado'?'✅':a.confirmacaoStatus==='cancelado'?'❌':'—'}</td>
      </tr>`;
    }).join('');

    const clinicaNome = clinicaData?.nome || 'MIFATURE';
    const clinicaLogo = (clinicaData as any)?.logoUrl || null;
    const logoHtml = clinicaLogo
      ? `<img src="${clinicaLogo}" alt="Logo" style="height:56px;object-fit:contain;max-width:180px">`
      : `<div style="font-size:22px;font-weight:900;color:#1e3a5f;letter-spacing:-0.5px">${clinicaNome}</div>`;

    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
      <title>Relatório Diário — ${dataFormatada}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 0; padding: 20px; }
        .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 14px; }
        .header-left { display: flex; align-items: center; gap: 14px; }
        .header-title h1 { font-size: 16px; margin: 0 0 2px; color: #1e3a5f; font-weight: 700; }
        .header-title .sub { font-size: 11px; color: #6b7280; text-transform: capitalize; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; color: #6b7280; }
        .totais { display: flex; gap: 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 16px; }
        .tot { flex: 1; padding: 10px; text-align: center; border-right: 1px solid #e5e7eb; }
        .tot:last-child { border-right: none; }
        .tot-num { font-size: 22px; font-weight: 700; color: #1e3a5f; }
        .tot-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; }
        .footer { margin-top: 16px; font-size: 10px; color: #9ca3af; display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 8px; }
        @page { margin: 1.5cm; size: A4; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="header">
        <div class="header-left">
          ${logoHtml}
          <div class="header-title">
            <h1>Relatório Diário da Agenda</h1>
            <div class="sub">${dataFormatada}</div>
          </div>
        </div>
        <div style="text-align:right;font-size:10px;color:#6b7280">
          <div>Emitido em: <strong>${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</strong></div>
          <div>Profissional: <strong>${profNome}</strong></div>
          <div>Convênio: <strong>${convNome}</strong></div>
        </div>
      </div>
      <div class="meta">
        <span>${atends.length} atendimento(s) encontrado(s)</span>
      </div>
      ${tots ? `<div class="totais">
        <div class="tot"><div class="tot-num">${tots.total}</div><div class="tot-label">Total</div></div>
        <div class="tot"><div class="tot-num" style="color:#2563eb">${tots.agendado}</div><div class="tot-label">Aguardando</div></div>
        <div class="tot"><div class="tot-num" style="color:#16a34a">${tots.realizado}</div><div class="tot-label">Atendidos</div></div>
        <div class="tot"><div class="tot-num" style="color:#ca8a04">${tots.falta}</div><div class="tot-label">Faltou</div></div>
        <div class="tot"><div class="tot-num" style="color:#ea580c">${tots.reagendado}</div><div class="tot-label">Reagendou</div></div>
        <div class="tot"><div class="tot-num" style="color:#dc2626">${tots.cancelado}</div><div class="tot-label">Cancelados</div></div>
      </div>` : ''}
      ${atends.length === 0 ? '<p style="text-align:center;color:#9ca3af;padding:32px">Nenhum atendimento encontrado.</p>' : `
      <table>
        <thead><tr>
          <th>Horário</th><th>Paciente</th><th>Nº Carteirinha</th><th>Profissional</th>
          <th>Convênio</th><th>Tipo</th><th>Status</th><th style="text-align:center">Prontuário</th><th style="text-align:center">Confirmação</th>
        </tr></thead>
        <tbody>${linhas}</tbody>
      </table>`}
      <div class="footer">
        <span>MIFATURE — Sistema de Faturamento Médico</span>
        <span>${atends.length} registro(s)</span>
      </div>
      <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) { win.document.write(html); win.document.close(); }
  };

  const handleExportarExcel = () => {
    if (!relatorio) { alert('Aguarde o carregamento do relatório.'); return; }
    const atends = relatorio.atendimentos || [];
    const profNome = profissionalId !== 'todos'
      ? (profissionais as any[]).find((p: any) => p.id.toString() === profissionalId)?.nome || ''
      : 'Todos';
    const convNome = convenioId !== 'todos'
      ? (convenios as any[]).find((c: any) => c.id.toString() === convenioId)?.nome || ''
      : 'Todos';

    // Gerar CSV com separador ponto-e-vírgula (compatível com Excel BR)
    const bom = '\uFEFF'; // BOM para UTF-8
    const header = ['Horário', 'Paciente', 'Nº Carteirinha', 'Profissional', 'Convênio', 'Tipo', 'Status', 'Prontuário', 'Confirmação'];
    const rows = atends.map((a: any) => {
      const statusLabel = (a.status === 'cancelado' && a.reagendadoPara) ? 'Reagendou'
        : ({ agendado: 'Aguardando', realizado: 'Atendido', cancelado: 'Cancelado', falta: 'Faltou', faltou_assinou: 'Faltou/Assinou' } as any)[a.status] || a.status;
      const prontuario = a.status === 'realizado' ? (a.prontuarioFeito ? 'Preenchido' : 'Pendente') : '—';
      const confirmacao = a.confirmacaoStatus === 'confirmado' ? 'Confirmou' : a.confirmacaoStatus === 'cancelado' ? 'Cancelou' : '—';
      return [a.hora || '', a.pacienteNome || '', (a as any).pacienteCarteirinha || '', a.profissionalNome || '', a.convenioNome || 'Particular', a.tipo || '', statusLabel, prontuario, confirmacao]
        .map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(';');
    });

    const csv = bom + [
      `"Relatório Diário da Agenda — ${dataFormatada}"`,
      `"Profissional: ${profNome} | Convênio: ${convNome}"`,
      `"Emitido em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}"`,
      '',
      header.map((h: string) => `"${h}"`).join(';'),
      ...rows,
      '',
      `"Total: ${atends.length} atendimento(s)"`,
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-diario-${data}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const atendimentos = relatorio?.atendimentos || [];
  const totais = relatorio?.totais;

  return (
    <>
      {/* Estilos de impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #relatorio-print, #relatorio-print * { visibility: visible; }
          #relatorio-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      <div className="p-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório Diário da Agenda</h1>
            <p className="text-gray-500 mt-1">Visualize e exporte os atendimentos do dia com filtros avançados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Printer className="w-4 h-4" />
                  Exportar
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleImprimir} className="gap-2 cursor-pointer">
                  <Printer className="w-4 h-4 text-blue-600" />
                  Imprimir / PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportarExcel} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  Exportar Excel (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border rounded-xl p-4 shadow-sm no-print">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="font-semibold text-gray-700 text-sm">Filtros</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Data */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Data</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Profissional */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Profissional</label>
              <Select value={profissionalId} onValueChange={setProfissionalId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os profissionais</SelectItem>
                  {profissionais.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Convênio */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Convênio</label>
              <Select value={convenioId} onValueChange={setConvenioId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os convênios</SelectItem>
                  {(convenios as any[]).map((c: any) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="agendado">Aguardando atendimento</SelectItem>
                  <SelectItem value="realizado">Atendido</SelectItem>
                  <SelectItem value="falta">Faltou</SelectItem>
                  <SelectItem value="cancelado">Não chegou / Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Área de impressão */}
        <div id="relatorio-print" ref={printRef}>
          {/* Cabeçalho do relatório impresso */}
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">MIFATURE — Relatório Diário da Agenda</h2>
                  <p className="text-blue-100 text-sm mt-0.5 capitalize">{dataFormatada}</p>
                </div>
                <div className="text-right text-sm text-blue-100">
                  <div>Emitido em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</div>
                  {profissionalId !== 'todos' && (
                    <div>Profissional: {profissionais.find((p: any) => p.id.toString() === profissionalId)?.nome}</div>
                  )}
                  {convenioId !== 'todos' && (
                    <div>Convênio: {(convenios as any[]).find((c: any) => c.id.toString() === convenioId)?.nome}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Cards de totais */}
            {totais && (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-0 border-b">
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-gray-800">{totais.total}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total</div>
                </div>
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-blue-600">{totais.agendado}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Aguardando</div>
                </div>
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-green-600">{totais.realizado}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Atendidos</div>
                </div>
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-yellow-600">{totais.falta}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Faltou</div>
                </div>
                <div className="p-4 text-center border-r">
                  <div className="text-2xl font-bold text-orange-600">{totais.reagendado}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Reagendou</div>
                </div>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{totais.cancelado}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Cancelados</div>
                </div>
              </div>
            )}

            {/* Alerta de prontuários pendentes */}
            {totais && totais.prontuariosPendentes > 0 && (
              <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2 text-amber-800 text-sm no-print">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span><strong>{totais.prontuariosPendentes}</strong> atendimento(s) realizado(s) com prontuário pendente de preenchimento.</span>
              </div>
            )}

            {/* Tabela de atendimentos */}
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  Carregando relatório...
                </div>
              ) : atendimentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Calendar className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">Nenhum atendimento encontrado para os filtros seleccionados.</p>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-semibold text-gray-700 w-16">Horário</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Paciente</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Nº Carteirinha</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Profissional</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Convênio</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Tipo</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
                      <th className="text-center px-3 py-2 font-semibold text-gray-700 w-24">Prontuário</th>
                      <th className="text-center px-3 py-2 font-semibold text-gray-700 w-24">Confirmação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atendimentos.map((a: any, idx: number) => (
                      <tr
                        key={a.id}
                        className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                      >
                        <td className="px-3 py-2.5 font-mono font-semibold text-gray-800">{a.hora}</td>
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-gray-900">{a.pacienteNome || '—'}</div>
                          {a.pacienteWhatsapp && (
                            <div className="text-xs text-gray-400">{a.pacienteWhatsapp}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 text-xs font-mono">{(a as any).pacienteCarteirinha || '—'}</td>
                        <td className="px-3 py-2.5">
                          <div className="text-gray-800">{a.profissionalNome || '—'}</div>
                          {a.profissionalEspecialidade && (
                            <div className="text-xs text-gray-400">{a.profissionalEspecialidade}</div>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">{a.convenioNome || <span className="text-gray-400 italic">Particular</span>}</td>
                        <td className="px-3 py-2.5 text-gray-600">{a.tipo || '—'}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusClass(a.status, a.reagendadoPara)}`}>
                            {getStatusLabel(a.status, a.reagendadoPara)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {a.status === 'realizado' ? (
                            a.prontuarioFeito ? (
                              <span title="Prontuário preenchido" className="inline-flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </span>
                            ) : (
                              <span title="Prontuário pendente" className="inline-flex items-center justify-center">
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              </span>
                            )
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {a.confirmacaoStatus === 'confirmado' ? (
                            <span title="Confirmou presença" className="inline-flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            </span>
                          ) : a.confirmacaoStatus === 'cancelado' ? (
                            <span title="Cancelou" className="inline-flex items-center justify-center">
                              <XCircle className="w-4 h-4 text-red-500" />
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Rodapé do relatório */}
            <div className="border-t px-6 py-3 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
              <span>MIFATURE — Sistema de Faturamento Médico</span>
              <span>{atendimentos.length} registro(s) exibido(s)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
