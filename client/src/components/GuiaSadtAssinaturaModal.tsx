import { useRef, useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { encontrarAssinaturaDaSessao } from '@shared/assinaturaSessao';
import { temComprovanteAssinatura } from '@shared/assinaturaSessao';
import { formatarDatasAtendimentoDaAssinatura, obterPrimeiraDataAtendimentoDaAssinatura } from '@shared/datasAtendimentoAssinatura';
import { podeGerenciarDatasAssinatura } from '@shared/permissoesAssinatura';
import { useAuth } from '../_core/hooks/useAuth';
import {
  FileSignature,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
  User,
  Calendar,
  Hash,
  Shield,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  pacienteId: number;
  pacienteNome: string;
  guiaId: number;
  atendimentoId?: number;
  profissionalId?: number;
  atendimentoData?: string; // data do atendimento para exibição
  onAssinado?: () => void;
}

function ordinal(n: number): string {
  if (n === 1) return '1ª';
  if (n === 2) return '2ª';
  if (n === 3) return '3ª';
  return `${n}ª`;
}

function formatarData(d: any): string {
  if (!d) return '-';
  const s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
  const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  return new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarDataHora(d: any): string {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR');
}

export function GuiaSadtAssinaturaModal({
  open,
  onClose,
  pacienteId,
  pacienteNome,
  guiaId,
  atendimentoId,
  profissionalId,
  atendimentoData,
  onAssinado,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [showHistorico, setShowHistorico] = useState(true);
  const [assinado, setAssinado] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState<number | null>(null);
  const [editandoData, setEditandoData] = useState<number | null>(null);
  const [novaDataEdit, setNovaDataEdit] = useState<string>('');
  const [editandoHistoricaId, setEditandoHistoricaId] = useState<number | null>(null);
  const [novaDataHistorica, setNovaDataHistorica] = useState<string>('');
  const [confirmarExclusaoHistorica, setConfirmarExclusaoHistorica] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { user } = useAuth();
  const podeGerenciar = podeGerenciarDatasAssinatura((user as any)?.perfil, (user as any)?.role);

  // Buscar guia SADT do paciente com histórico de sessões
  const { data: guiaData, isLoading, refetch } = trpc.assinaturasGuias.getGuiaPorPaciente.useQuery(
    { pacienteId, guiaId, atendimentoId, profissionalId, atendimentoData },
    { enabled: open && pacienteId > 0 && guiaId > 0 }
  );

  // Mutation para registar assinatura
  const assinarMutation = trpc.assinaturasGuias.assinarSessao.useMutation({
    onSuccess: (data) => {
      toast.success(`${ordinal(data.sessaoNumero)} sessão assinada com sucesso!`);
      setAssinado(true);
      refetch();
      onAssinado?.();
    },
    onError: (err: any) => {
      toast.error(`Erro ao registar assinatura: ${err.message}`);
    },
  });

  // Mutation para editar exclusivamente a data clínica da sessão.
  const editarDataMutation = trpc.assinaturasGuias.editarDataSessao.useMutation({
    onSuccess: () => {
      toast.success('Data da sessão actualizada!');
      setEditandoData(null);
      setNovaDataEdit('');
      // Invalidar todos os caches relacionados para que o prefaturamento
      // e outros componentes reflictam a nova data imediatamente
      refetch();
      utils.assinaturasGuias.list.invalidate();
      utils.assinaturasGuias.getGuiaPorPaciente.invalidate();
      // pacientesComAssinatura agora é mutation (POST), sem invalidate — o useEffect na Agenda recarrega automaticamente
      onAssinado?.();
    },
    onError: (err: any) => {
      toast.error(`Erro ao actualizar data da sessão: ${err.message}`);
    },
  });

  // Mutation para excluir assinatura
  const excluirMutation = trpc.assinaturasGuias.excluirAssinatura.useMutation({
    onSuccess: (data) => {
      toast.success('Assinatura excluída com sucesso!');
      setConfirmarExclusao(null);
      refetch();
      // pacientesComAssinatura agora é mutation (POST), sem invalidate — o useEffect na Agenda recarrega automaticamente
      if (data.totalSessoes === 0) onAssinado?.();
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir assinatura: ${err.message}`);
      setConfirmarExclusao(null);
    },
  });

  const editarHistoricaMutation = trpc.assinaturasGuias.editarDataHistorica.useMutation({
    onSuccess: () => {
      toast.success('Data de assinatura actualizada!');
      setEditandoHistoricaId(null);
      setNovaDataHistorica('');
      refetch();
      onAssinado?.();
    },
    onError: (err: any) => toast.error(`Erro ao actualizar data: ${err.message}`),
  });

  const excluirHistoricaMutation = trpc.assinaturasGuias.excluirAssinaturaHistorica.useMutation({
    onSuccess: () => {
      toast.success('Assinatura excluída com sucesso!');
      setConfirmarExclusaoHistorica(null);
      refetch();
      onAssinado?.();
    },
    onError: (err: any) => {
      toast.error(`Erro ao excluir assinatura: ${err.message}`);
      setConfirmarExclusaoHistorica(null);
    },
  });

  // Limpar canvas quando o modal abre
  useEffect(() => {
    if (open) {
      setHasSignature(false);
      setAssinado(false);
      setConfirmarExclusao(null);
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 100);
    }
  }, [open]);

  // ── Desenho no canvas ──────────────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing]);

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const confirmarAssinatura = () => {
    if (!hasSignature) {
      toast.error('Por favor, assine no campo acima antes de confirmar.');
      return;
    }
    if (!guiaData?.guia) {
      toast.error('Nenhuma guia SADT encontrada para este paciente.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/png');
    assinarMutation.mutate({ guiaId: guiaData.guia.id, pacienteId, assinaturaPacienteUrl: base64 });
  };

  const proximaSessao = guiaData?.proximaSessao ?? 1;
  const sessoesAnteriores = guiaData?.assinaturas ?? [];
  const assinaturaDaSessaoAtual = encontrarAssinaturaDaSessao(
    sessoesAnteriores,
    atendimentoData,
  );
  const sessaoAtualJaAssinada = Boolean(assinaturaDaSessaoAtual);

  // O campo 67 pertence somente à sessão aberta. Não reutilizar a última
  // assinatura histórica, pois ela pode ser de outra data/atendimento.
  const ultimaAssinatura = assinaturaDaSessaoAtual;
  const ultimaSessaoNumero = ultimaAssinatura && 'sessaoNumero' in ultimaAssinatura
    ? ultimaAssinatura.sessaoNumero
    : null;
  const ultimoHashAssinatura = ultimaAssinatura && 'hashAssinatura' in ultimaAssinatura
    ? ultimaAssinatura.hashAssinatura
    : null;
  const ultimaAssinaturaTemComprovante = temComprovanteAssinatura(ultimaAssinatura?.assinaturaPacienteUrl);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700">
            <FileSignature className="w-5 h-5" />
            Guia SADT — Assinatura do Paciente
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
            Carregando guia...
          </div>
        )}

        {!isLoading && !guiaData && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
            <ClipboardList className="w-12 h-12 text-gray-300" />
            <p className="font-medium">Nenhuma Guia SADT encontrada</p>
            <p className="text-sm text-center max-w-xs">
              Este paciente ainda não possui uma guia SADT cadastrada no sistema.
              Crie a guia em <strong>Guias SADT</strong> antes de registar a assinatura.
            </p>
          </div>
        )}

        {!isLoading && guiaData && (
          <div className="space-y-5">
            {/* Dados da Guia */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Guia Nº {guiaData.guia.numeroGuia}
                </h3>
                <Badge
                  className={
                    guiaData.guia.status === 'paga' ? 'bg-green-100 text-green-700' :
                    guiaData.guia.status === 'emitida' ? 'bg-blue-100 text-blue-700' :
                    guiaData.guia.status === 'enviada' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-700'
                  }
                >
                  {guiaData.guia.status.charAt(0).toUpperCase() + guiaData.guia.status.slice(1)}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Paciente:</span> {pacienteNome}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Profissional:</span> {guiaData.profissional.nome}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Convênio:</span> {guiaData.convenio.nome}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Data:</span>{' '}
                  {atendimentoData ? formatarData(atendimentoData) : (guiaData.guia.dataEmissao
                    ? formatarData(guiaData.guia.dataEmissao)
                    : '-')}
                </div>
                <div className="flex items-center gap-2 text-gray-600 col-span-2">
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-medium">Procedimento:</span> {guiaData.guia.procedimento}
                </div>
              </div>
            </div>

            {/* Campo 67 — Assinatura do Paciente (TISS) */}
            {ultimaAssinatura && (
              <div className="border-2 border-indigo-300 rounded-lg overflow-hidden">
                <div className="bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-2">
                  <span className="bg-white text-indigo-700 rounded px-1.5 py-0.5 font-mono text-xs">67</span>
                  Assinatura do Beneficiário / Responsável
                </div>
                <div className="bg-white p-3 flex items-center gap-4">
                  {ultimaAssinaturaTemComprovante ? (
                    <img
                      src={ultimaAssinatura.assinaturaPacienteUrl ?? undefined}
                      alt="Assinatura do paciente (campo 67)"
                      className="h-14 w-48 object-contain border rounded bg-gray-50"
                    />
                  ) : (
                    <div className="h-14 w-48 rounded border border-amber-200 bg-amber-50 px-2 flex items-center gap-2 text-xs text-amber-800">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Comprovante de imagem indisponível
                    </div>
                  )}
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><span className="font-medium text-gray-700">Última sessão:</span> {ultimaSessaoNumero ? ordinal(ultimaSessaoNumero) : 'Assinatura registada'}</p>
                    <p><span className="font-medium text-gray-700">Data:</span> {formatarData(ultimaAssinatura.dataAssinatura)}</p>
                    {ultimoHashAssinatura && (
                      <p className="font-mono text-gray-400 truncate max-w-[180px]" title={ultimoHashAssinatura}>
                        SHA-256: {ultimoHashAssinatura.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sessão Actual */}
            {!assinado && !sessaoAtualJaAssinada ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-indigo-500" />
                    {ordinal(proximaSessao)} Sessão — Assinatura do Paciente
                  </h3>
                  <Badge className="bg-indigo-100 text-indigo-700">
                    Sessão {proximaSessao}
                  </Badge>
                </div>

                <p className="text-sm text-gray-500">
                  Solicite ao paciente que assine no campo abaixo com o dedo ou mouse para confirmar a presença na {ordinal(proximaSessao)} sessão.
                </p>

                {/* Canvas de assinatura */}
                <div className="border-2 border-dashed border-indigo-300 rounded-lg bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={180}
                    className="w-full touch-none cursor-crosshair"
                    style={{ display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-gray-300 text-sm select-none">Assine aqui</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limparAssinatura}
                    disabled={!hasSignature}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Limpar
                  </Button>
                  <Button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                    onClick={confirmarAssinatura}
                    disabled={!hasSignature || assinarMutation.isPending}
                  >
                    {assinarMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Registando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmar {ordinal(proximaSessao)} Sessão
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : sessaoAtualJaAssinada ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3 border border-green-200 rounded-lg bg-green-50">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-700 text-lg">Esta sessão já está assinada.</p>
                <p className="text-sm text-gray-600 text-center px-5">
                  Assinatura registada em {formatarData(assinaturaDaSessaoAtual?.dataAssinatura)}. Não é necessário assinar novamente.
                </p>
                {assinaturaDaSessaoAtual?.assinaturaPacienteUrl && (
                  <img
                    src={assinaturaDaSessaoAtual.assinaturaPacienteUrl}
                    alt="Assinatura já registada para esta sessão"
                    className="h-16 max-w-[220px] object-contain border rounded bg-white"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <p className="font-semibold text-green-700 text-lg">
                  {ordinal(proximaSessao)} Sessão registada com sucesso!
                </p>
                <p className="text-sm text-gray-500 text-center">
                  A assinatura foi guardada com hash SHA-256 para validação de autenticidade.
                </p>
                <Button variant="outline" onClick={onClose}>Fechar</Button>
              </div>
            )}

            {/* Histórico de Sessões — Tabela de Procedimentos em Série */}
            {sessoesAnteriores.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
                  onClick={() => setShowHistorico(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-gray-400" />
                    Procedimentos em Série ({sessoesAnteriores.length} sessão{sessoesAnteriores.length !== 1 ? 'ões' : ''})
                  </span>
                  {showHistorico ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showHistorico && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-indigo-50 text-indigo-700 text-left">
                          <th className="px-3 py-2 font-semibold">Sessão</th>
                          <th className="px-3 py-2 font-semibold">Data da Sessão</th>
                          <th className="px-3 py-2 font-semibold">Assinatura do Paciente (Campo 67)</th>
                          <th className="px-3 py-2 font-semibold">Hash SHA-256</th>
                          {podeGerenciar && <th className="px-3 py-2 font-semibold text-center">Ações</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sessoesAnteriores.map((ass: any) => {
                          const comprovanteDisponivel = temComprovanteAssinatura(ass.assinaturaPacienteUrl);
                          const datasAtendimento = formatarDatasAtendimentoDaAssinatura(ass.datasAtendimento);
                          return (
                          <tr key={ass.id} className="hover:bg-gray-50 transition">
                            <td className="px-3 py-2">
                              <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                                {ordinal(ass.sessaoNumero)} Sessão
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                              {editandoData === ass.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="date"
                                    className="border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    value={novaDataEdit}
                                    onChange={e => setNovaDataEdit(e.target.value)}
                                  />
                                  <Button
                                    size="sm"
                                    className="h-6 w-6 p-0 bg-green-600 hover:bg-green-700"
                                    title="Confirmar"
                                    onClick={() => {
                                      if (!novaDataEdit) return;
                                      editarDataMutation.mutate({ assinaturaId: ass.id, novaDataSessao: novaDataEdit });
                                    }}
                                    disabled={editarDataMutation.isPending}
                                  >
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                                    title="Cancelar"
                                    onClick={() => { setEditandoData(null); setNovaDataEdit(''); }}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <div>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-indigo-400" />
                                      {datasAtendimento || 'Data da sessão não informada'}
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                      Assinado em {formatarData(ass.dataAssinatura)} às {new Date(ass.dataAssinatura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {comprovanteDisponivel ? (
                                <img
                                  src={ass.assinaturaPacienteUrl}
                                  alt={`Assinatura ${ordinal(ass.sessaoNumero)} sessão`}
                                  className="h-10 w-28 object-contain border rounded bg-white"
                                  title={`Assinatura da ${ordinal(ass.sessaoNumero)} sessão — ${formatarDataHora(ass.dataAssinatura)}`}
                                />
                              ) : (
                                <span className="text-amber-700 italic">Comprovante indisponível</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              {ass.hashAssinatura ? (
                                  <span className="font-mono text-gray-400 text-xs" title={ass.hashAssinatura ?? undefined}>
                                  {ass.hashAssinatura.substring(0, 12)}...
                                </span>
                              ) : '-'}
                            </td>
                            {podeGerenciar && <td className="px-3 py-2 text-center">
                              {confirmarExclusao === ass.id ? (
                                <div className="flex items-center gap-1 justify-center">
                                  <span className="text-red-600 text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Confirmar?
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => excluirMutation.mutate({ assinaturaId: ass.id, guiaId: guiaData.guia.id })}
                                    disabled={excluirMutation.isPending}
                                  >
                                    Sim
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => setConfirmarExclusao(null)}
                                  >
                                    Não
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-50"
                                    title="Editar data da sessão"
                                    onClick={() => {
                                      setNovaDataEdit(obterPrimeiraDataAtendimentoDaAssinatura(ass.datasAtendimento) ?? '');
                                      setConfirmarExclusao(null);
                                      setEditandoData(ass.id);
                                    }}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                    title="Excluir assinatura"
                                    onClick={() => {
                                      setEditandoData(null);
                                      setConfirmarExclusao(ass.id);
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </td>}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
