import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { CheckCircle, Download, Signature, History, AlertCircle, Pencil, Trash2, Check, X, FileKey, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { obterPrimeiraDataAtendimentoDaAssinatura } from '@shared/datasAtendimentoAssinatura';
import { podeGerenciarDatasAssinatura } from '@shared/permissoesAssinatura';
import { exibirHashIntegridade, statusAssinaturaSadt } from '@shared/historicoAssinaturasGuia';

interface AssinaturaHistorico {
  id?: number;
  guiaId?: number;
  sessaoNumero: number;
  dataAssinatura: Date;
  hashAssinatura?: string | null;
  assinaturaPacienteUrl?: string | null;
  datasAtendimento?: string | null; // JSON array de strings "YYYY-MM-DD"
}

interface AssinaturaGuiaSADTProps {
  guiaId: number;
  pacienteNome: string;
  pacienteCPF: string;
  numeroGuia: string;
  procedimento: string;
  dataAtendimento: Date;
  totalSessoes?: number;
  historicoAssinaturas?: AssinaturaHistorico[];
  onAssinar?: (assinatura: string, sessaoNumero: number) => void;
  onHistoricoAlterado?: () => void;
}

export function AssinaturaGuiaSADT({
  guiaId,
  pacienteNome,
  pacienteCPF,
  numeroGuia,
  procedimento,
  dataAtendimento,
  totalSessoes = 0,
  historicoAssinaturas = [],
  onAssinar,
  onHistoricoAlterado,
}: AssinaturaGuiaSADTProps) {
  const [showModal, setShowModal] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [showHistorico, setShowHistorico] = useState(false);
  const [showInformacoes, setShowInformacoes] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editandoAssinaturaId, setEditandoAssinaturaId] = useState<number | null>(null);
  const [novaDataSessao, setNovaDataSessao] = useState('');
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState<number | null>(null);
  const { user } = useAuth();
  const podeGerenciar = podeGerenciarDatasAssinatura((user as any)?.perfil, (user as any)?.role);
  const utils = trpc.useUtils();
  const proximaSessao = totalSessoes + 1;
  const informacoesGuiaQuery = trpc.assinaturasGuias.historicoCompleto.useQuery(
    { guiaId },
    { enabled: showInformacoes },
  );

  const editarDataMutation = trpc.assinaturasGuias.editarDataSessao.useMutation({
    onSuccess: () => {
      toast.success('Data da sessão atualizada');
      setEditandoAssinaturaId(null);
      setNovaDataSessao('');
      utils.assinaturasGuias.list.invalidate();
      onHistoricoAlterado?.();
    },
    onError: (erro: any) => toast.error(`Erro ao atualizar data da sessão: ${erro.message}`),
  });

  const excluirMutation = trpc.assinaturasGuias.excluirAssinatura.useMutation({
    onSuccess: () => {
      toast.success('Assinatura excluída');
      setConfirmarExclusaoId(null);
      utils.assinaturasGuias.list.invalidate();
      onHistoricoAlterado?.();
    },
    onError: (erro: any) => toast.error(`Erro ao excluir assinatura: ${erro.message}`),
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const saveSignature = () => {
    if (!canvasRef.current || !onAssinar) return;
    const assinatura = canvasRef.current.toDataURL('image/png');
    onAssinar(assinatura, proximaSessao);
    setShowSignature(false);
    setShowModal(false);
  };

  const downloadComprovante = () => {
    const geradoEm = new Date();
    const conteudo = `
COMPROVANTE DE ASSINATURA - GUIA SADT

Número da Guia: ${numeroGuia}
Data do Atendimento: ${format(dataAtendimento, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}

PACIENTE:
Nome: ${pacienteNome}
CPF: ${pacienteCPF}

PROCEDIMENTO:
${procedimento}

HISTÓRICO DE SESSÕES:
${historicoAssinaturas
  .map(
    (h, i) =>
      `Sessão ${h.sessaoNumero}: ${format(h.dataAssinatura, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`
  )
  .join('\n')}

Total de Sessões Realizadas: ${totalSessoes}

---
Este comprovante foi gerado digitalmente e possui validade legal.
Gerado em: ${format(geradoEm, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
    `;

    const element = document.createElement('a');
    const file = new Blob([conteudo], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Comprovante_Assinatura_${numeroGuia}_${format(geradoEm, 'dd-MM-yyyy')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getOrdinalSessao = (numero: number) => {
    const ordinais: { [key: number]: string } = {
      1: '1ª',
      2: '2ª',
      3: '3ª',
      4: '4ª',
      5: '5ª',
    };
    return ordinais[numero] || `${numero}ª`;
  };

  return (
    <div className="space-y-4">
      {/* Card de Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Assinatura Digital da Guia SADT</h3>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Guia:</strong> {numeroGuia}
              </p>
              <p>
                <strong>Procedimento:</strong> {procedimento}
              </p>
              <p>
                <strong>Próxima Sessão:</strong> {getOrdinalSessao(proximaSessao)}
              </p>
              <p>
                <strong>Total de Sessões:</strong> {totalSessoes}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{totalSessoes}</div>
            <div className="text-xs text-blue-600">sessões realizadas</div>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Signature className="w-4 h-4 mr-2" />
          Assinar Guia ({getOrdinalSessao(proximaSessao)} Sessão)
        </Button>
        <Button
          onClick={() => { window.location.href = `/informacoes-guia?guiaId=${guiaId}`; }}
          variant="outline"
          className="border-violet-600 text-violet-700 hover:bg-violet-50"
        >
          <FileKey className="w-4 h-4 mr-2" />
          Informações e Hashes
        </Button>
        <Button
          onClick={() => { window.location.href = `/registro-digital-assinaturas?guiaId=${guiaId}`; }}
          variant="outline"
          className="border-slate-600 text-slate-700 hover:bg-slate-50"
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Registro Digital
        </Button>
        {historicoAssinaturas.length > 0 && (
          <>
            <Button
              onClick={() => setShowHistorico(true)}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <History className="w-4 h-4 mr-2" />
              Ver Histórico ({historicoAssinaturas.length})
            </Button>
            <Button
              onClick={downloadComprovante}
              variant="outline"
              className="border-gray-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar Comprovante
            </Button>
          </>
        )}
      </div>

      {/* Lista sequencial de assinaturas inline */}
      {historicoAssinaturas.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Sessões Assinadas
          </h4>
          {podeGerenciar && (
            <p className="text-xs text-gray-500 -mt-1">
              Use os controles ao lado de cada sessão para corrigir a data ou remover uma assinatura registada indevidamente.
            </p>
          )}
          {historicoAssinaturas.map((assinatura, index) => {
            const assinaturaId = assinatura.id;
            const dataSessao = obterPrimeiraDataAtendimentoDaAssinatura((assinatura as any).datasAtendimento);
            const dataAtendFormatada = dataSessao
              ? new Date(dataSessao + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : format(assinatura.dataAssinatura, 'dd/MM/yyyy', { locale: ptBR });
            return (
              <div key={assinaturaId ?? index} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Linha de cabeçalho */}
                <div className="flex items-center gap-3 bg-green-50 border-b border-green-100 px-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {assinatura.sessaoNumero}
                  </span>
                  <div className="flex-1">
                    <span className="font-semibold text-green-900 text-sm">
                      {assinatura.sessaoNumero}º Sessão &mdash; {dataAtendFormatada}
                    </span>
                    <span className="text-xs text-green-700 ml-2">
                      (assinado em {format(assinatura.dataAssinatura, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })})
                    </span>
                  </div>
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  {podeGerenciar && assinaturaId && (
                    confirmarExclusaoId === assinaturaId ? (
                      <div className="flex items-center gap-1 shrink-0" aria-label="Confirmar exclusão da assinatura">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2 text-xs"
                          disabled={excluirMutation.isPending}
                          onClick={() => excluirMutation.mutate({ assinaturaId, guiaId: assinatura.guiaId ?? guiaId })}
                        >
                          Excluir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs bg-white"
                          onClick={() => setConfirmarExclusaoId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-indigo-600 hover:bg-indigo-100"
                          title="Editar data da sessão"
                          aria-label={`Editar data da sessão ${assinatura.sessaoNumero}`}
                          onClick={() => {
                            setNovaDataSessao(dataSessao ?? '');
                            setEditandoAssinaturaId(assinaturaId);
                            setConfirmarExclusaoId(null);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                          title="Excluir assinatura"
                          aria-label={`Excluir assinatura da sessão ${assinatura.sessaoNumero}`}
                          onClick={() => {
                            setConfirmarExclusaoId(assinaturaId);
                            setEditandoAssinaturaId(null);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )
                  )}
                </div>
                {podeGerenciar && assinaturaId && editandoAssinaturaId === assinaturaId && (
                  <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                    <label className="text-xs font-medium text-indigo-900" htmlFor={`data-assinatura-${assinaturaId}`}>
                      Nova data da sessão:
                    </label>
                    <input
                      id={`data-sessao-${assinaturaId}`}
                      type="date"
                      className="h-8 rounded border border-indigo-200 bg-white px-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      value={novaDataSessao}
                      onChange={(event) => setNovaDataSessao(event.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-8 bg-indigo-600 hover:bg-indigo-700"
                      disabled={!novaDataSessao || editarDataMutation.isPending}
                      onClick={() => editarDataMutation.mutate({ assinaturaId, novaDataSessao })}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 bg-white"
                      onClick={() => {
                        setEditandoAssinaturaId(null);
                        setNovaDataSessao('');
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                )}
                {/* Imagem da assinatura */}
                {assinatura.assinaturaPacienteUrl && assinatura.assinaturaPacienteUrl.length > 10 && (
                  <div className="px-3 py-2 bg-gray-50 flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Assinatura:</span>
                    <div className="border border-gray-200 rounded bg-white p-1">
                      <img
                        src={assinatura.assinaturaPacienteUrl}
                        alt={`Assinatura sessão ${assinatura.sessaoNumero}`}
                        className="h-12 max-w-[200px] object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showInformacoes} onOpenChange={setShowInformacoes}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Informações da Guia e Integridade das Assinaturas</DialogTitle>
          </DialogHeader>
          {informacoesGuiaQuery.isLoading ? (
            <p className="py-8 text-center text-sm text-gray-500">Carregando informações da guia...</p>
          ) : informacoesGuiaQuery.data ? (
            <div className="space-y-5">
              <div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <p><span className="font-medium text-slate-600">Guia:</span> {informacoesGuiaQuery.data.guia.numeroGuia || numeroGuia}</p>
                <p><span className="font-medium text-slate-600">Paciente:</span> {informacoesGuiaQuery.data.paciente?.nome || pacienteNome}</p>
                <p><span className="font-medium text-slate-600">Profissional:</span> {informacoesGuiaQuery.data.profissional?.nome || 'Não informado'}</p>
                <p><span className="font-medium text-slate-600">Convênio:</span> {informacoesGuiaQuery.data.convenio?.nome || 'Não informado'}</p>
              </div>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Sessões assinadas e hashes SHA-256</h3>
                <div className="space-y-3">
                  {informacoesGuiaQuery.data.assinaturasGuias.length === 0 ? (
                    <p className="rounded border border-dashed p-3 text-sm text-gray-500">Nenhuma sessão assinada nesta guia.</p>
                  ) : informacoesGuiaQuery.data.assinaturasGuias.map((assinatura) => (
                    <article key={assinatura.id} className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <strong>{assinatura.sessaoNumero}ª sessão</strong>
                        <span>{format(new Date(assinatura.dataAssinatura), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">Hash de integridade SHA-256</p>
                      <code className="mt-1 block break-all rounded bg-white p-2 text-[11px] text-slate-800">{exibirHashIntegridade(assinatura.hashAssinatura)}</code>
                    </article>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Registros SADT vinculados</h3>
                <div className="space-y-3">
                  {informacoesGuiaQuery.data.assinaturasSadt.length === 0 ? (
                    <p className="rounded border border-dashed p-3 text-sm text-gray-500">Nenhum registro SADT complementar vinculado a esta guia.</p>
                  ) : informacoesGuiaQuery.data.assinaturasSadt.map((registro) => (
                    <article key={registro.id} className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <strong>{registro.numeroSessao}ª sessão — {statusAssinaturaSadt(registro.status)}</strong>
                        <span>{format(new Date(`${registro.dataSessao}T12:00:00`), 'dd/MM/yyyy')}</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-slate-600">Hash de integridade SHA-256</p>
                      <code className="mt-1 block break-all rounded bg-white p-2 text-[11px] text-slate-800">{exibirHashIntegridade(registro.assinaturaHash)}</code>
                      {registro.motivoRecusa && <p className="mt-2 text-xs text-amber-800"><strong>Justificativa:</strong> {registro.motivoRecusa}</p>}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">A guia não foi encontrada.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Assinatura */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinar Guia SADT - {getOrdinalSessao(proximaSessao)} Sessão</DialogTitle>
          </DialogHeader>

          {!showSignature ? (
            <div className="space-y-4">
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Paciente</p>
                    <p className="font-semibold">{pacienteNome}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">CPF</p>
                    <p className="font-semibold">{pacienteCPF}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Guia</p>
                    <p className="font-semibold">{numeroGuia}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sessão</p>
                    <p className="font-semibold">{getOrdinalSessao(proximaSessao)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Procedimento</p>
                    <p className="font-semibold">{procedimento}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>
                  <strong>Aviso:</strong> Ao assinar esta guia, você confirma que realizou a {getOrdinalSessao(proximaSessao)} sessão do procedimento acima descrito. Esta assinatura será registrada com data e hora.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowSignature(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Signature className="w-4 h-4 mr-2" />
                  Prosseguir para Assinatura
                </Button>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Assinatura Digital - {getOrdinalSessao(proximaSessao)} Sessão
                </label>
                <p className="text-xs text-gray-600 mb-2">
                  Assine no espaço abaixo. Sua assinatura será registrada com data, hora e hash criptográfico.
                </p>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  className="border-2 border-gray-300 rounded-lg bg-white cursor-crosshair w-full"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={clearSignature}
                  variant="outline"
                  className="border-gray-300"
                >
                  Limpar
                </Button>
                <Button
                  onClick={saveSignature}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </Button>
                <Button
                  onClick={() => setShowSignature(false)}
                  variant="outline"
                >
                  Voltar
                </Button>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                <strong>Aviso Legal:</strong> Ao assinar, você confirma que realizou a sessão descrita. Esta assinatura digital tem validade legal conforme Lei nº 14.063/2020 e será armazenada com hash criptográfico (SHA-256) para validação de autenticidade.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico */}
      <Dialog open={showHistorico} onOpenChange={setShowHistorico}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico de Assinaturas - Guia {numeroGuia}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {historicoAssinaturas.length === 0 ? (
              <div className="bg-gray-50 border rounded-lg p-4 text-center text-gray-600">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Nenhuma assinatura registrada ainda.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historicoAssinaturas.map((assinatura, index) => {
                  // Parsear data do atendimento desta assinatura
                  let datasAtend: string[] = [];
                  if ((assinatura as any).datasAtendimento) {
                    try { datasAtend = JSON.parse((assinatura as any).datasAtendimento); } catch {}
                  }
                  const dataAtendFormatada = datasAtend.length > 0
                    ? new Date(datasAtend[0] + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : format(assinatura.dataAssinatura, 'dd/MM/yyyy', { locale: ptBR });

                  return (
                    <div key={index} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                      {/* Cabeçalho da sessão */}
                      <div className="flex items-center justify-between bg-green-50 border-b border-green-100 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {assinatura.sessaoNumero}
                          </span>
                          <div>
                            <p className="font-semibold text-green-900 text-sm">
                              {assinatura.sessaoNumero}º Sessão &mdash; {dataAtendFormatada}
                            </p>
                            <p className="text-xs text-green-700">
                              Assinado em {format(assinatura.dataAssinatura, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      </div>
                      {/* Imagem da assinatura */}
                      {assinatura.assinaturaPacienteUrl && assinatura.assinaturaPacienteUrl.length > 10 && (
                        <div className="px-4 py-3 bg-gray-50">
                          <p className="text-xs text-gray-500 mb-1 font-medium">Assinatura do paciente:</p>
                          <div className="border border-gray-200 rounded-lg bg-white p-2 inline-block">
                            <img
                              src={assinatura.assinaturaPacienteUrl}
                              alt={`Assinatura sessão ${assinatura.sessaoNumero}`}
                              className="max-h-20 max-w-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                      {/* Hash */}
                      {assinatura.hashAssinatura && (
                        <div className="px-4 pb-2">
                          <p className="text-xs text-gray-400 font-mono">
                            Hash: {assinatura.hashAssinatura.substring(0, 40)}...
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p>
                <strong>Total de Sessões:</strong> {historicoAssinaturas.length}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadComprovante}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Comprovante Completo
              </Button>
              <Button
                onClick={() => setShowHistorico(false)}
                variant="outline"
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
