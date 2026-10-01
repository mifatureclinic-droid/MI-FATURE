import { useState, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Upload, Plus, Trash2, AlertCircle, CheckCircle2, X, Eye, FileImage, CreditCard, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { normalizarChaveComprovante } from '@shared/comprovantePagamento';
import { ehConvenioOab } from '@shared/pagamentoBalcao';
import { exigeComprovanteDePagamento } from '@shared/repasseParticular';

// Converte Date ou string ISO para DD/MM/AAAA sem conversão de fuso horário
// Resolve o UTC shift em Manaus (UTC-4): 2026-08-08T00:00:00Z → 07/08/2026 (errado)
function fmtDateSafe(val: Date | string | null | undefined): string {
  if (!val) return '—';
  const s = val instanceof Date ? val.toISOString() : String(val);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return '—';
}

import { toast } from 'sonner';

interface AbaPagamentoAtendimentoProps {
  atendimentoId: number;
  pacienteId: number;
  profissionalId: number;
  pacienteNome: string;
  convenioNome?: string;
  isVisible: boolean;
  onClose?: () => void;
}

const METODO_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  pix: 'PIX',
  transferencia: 'Transferência',
  outro: 'Outro',
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatarFormasPagamento(pagamento: any): string {
  try {
    const formas = pagamento.formasPagamento ? JSON.parse(pagamento.formasPagamento) : null;
    if (Array.isArray(formas) && formas.length === 2) {
      return formas
        .map((forma: any) => `${METODO_LABEL[forma.metodoPagamento] || forma.metodoPagamento} ${Number(forma.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
        .join(' + ');
    }
  } catch {
    // Registros legados permanecem exibindo a única forma original.
  }
  return METODO_LABEL[pagamento.metodoPagamento] || pagamento.metodoPagamento;
}

export function AbaPagamentoAtendimento({
  atendimentoId,
  pacienteId,
  profissionalId,
  pacienteNome,
  convenioNome,
  isVisible,
  onClose,
}: AbaPagamentoAtendimentoProps) {
  const hoje = new Date();
  const [formData, setFormData] = useState({
    valor: '',
    dataPagamento: format(hoje, 'yyyy-MM-dd'),
    referenciaDatas: '',
    metodoPagamento: 'pix' as 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'outro',
    observacoes: '',
  });
  const [pagamentoDividido, setPagamentoDividido] = useState(false);
  const [valorPrimeiraForma, setValorPrimeiraForma] = useState('');
  const [segundaForma, setSegundaForma] = useState({
    metodoPagamento: 'dinheiro' as 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'transferencia' | 'outro',
    valor: '',
  });

  // Comprovante
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovantePreview, setComprovantePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sessões do mês vinculadas
  const [mesSelecionado, setMesSelecionado] = useState(hoje.getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(hoje.getFullYear());
  const [sessoesVinculadas, setSessoesVinculadas] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const utils = trpc.useUtils();
  const pagamentoOab = ehConvenioOab(convenioNome);
  const comprovanteObrigatorio = exigeComprovanteDePagamento(convenioNome);

  const handleVerComprovante = async (p: any) => {
    const chave = normalizarChaveComprovante(p.comprovanteKey || p.comprovanteUrl);
    if (!chave) {
      toast.error('Comprovante não disponível.');
      return;
    }

    // Abrir a aba dentro do gesto de clique evita bloqueio de pop-up no perfil de recepção.
    const novaAba = window.open('about:blank', '_blank');
    if (!novaAba) {
      toast.error('O navegador bloqueou a abertura do comprovante. Permita pop-ups e tente novamente.');
      return;
    }

    try {
      const { url } = await utils.pagamentos.getComprovanteUrl.fetch({ comprovanteKey: chave });
      novaAba.opener = null;
      novaAba.location.replace(url);
    } catch (error) {
      novaAba.close();
      toast.error('Não foi possível abrir o comprovante. Tente novamente.');
    }
  };

  const { data: pagamentos = [], refetch: refetchPagamentos } = trpc.pagamentos.listar.useQuery({ atendimentoId });
  const { data: sessoesMes = [] } = trpc.pagamentos.buscarSessoesMes.useQuery({
    pacienteId,
    profissionalId,
    mes: mesSelecionado,
    ano: anoSelecionado,
  });

  const criarPagamento = trpc.pagamentos.criar.useMutation({
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      setFormData({
        valor: '',
        dataPagamento: format(new Date(), 'yyyy-MM-dd'),
        referenciaDatas: '',
        metodoPagamento: 'pix',
        observacoes: '',
      });
      setPagamentoDividido(false);
      setValorPrimeiraForma('');
      setSegundaForma({ metodoPagamento: 'dinheiro', valor: '' });
      setComprovanteFile(null);
      setComprovantePreview(null);
      setSessoesVinculadas([]);
      refetchPagamentos();
    },
    onError: (error) => toast.error(`Erro ao registrar pagamento: ${error.message}`),
  });

  const deletarPagamento = trpc.pagamentos.deletar.useMutation({
    onSuccess: () => { toast.success('Pagamento removido.'); refetchPagamentos(); },
    onError: (error) => toast.error(`Erro ao remover: ${error.message}`),
  });

  const handleFile = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Formato não suportado. Use JPG, PNG, WEBP ou PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }
    setComprovanteFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setComprovantePreview(url);
    } else {
      setComprovantePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valor || !formData.referenciaDatas) {
      toast.error('Preencha os campos obrigatórios: Valor e Referência de Datas.');
      return;
    }
    if (comprovanteObrigatorio && !comprovanteFile) {
      toast.error('Anexe o comprovante de pagamento para registrar Mente Aberta.');
      return;
    }
    const valorTotal = Number(formData.valor);
    const formasPagamento = pagamentoDividido
      ? [
          { metodoPagamento: formData.metodoPagamento, valor: Number(valorPrimeiraForma) },
          { metodoPagamento: segundaForma.metodoPagamento, valor: Number(segundaForma.valor) },
        ]
      : undefined;
    if (pagamentoDividido) {
      const valoresValidos = formasPagamento?.every(forma => Number.isFinite(forma.valor) && forma.valor > 0) ?? false;
      const somaEmCentavos = formasPagamento?.reduce((soma, forma) => soma + Math.round(forma.valor * 100), 0) ?? 0;
      if (!valoresValidos || somaEmCentavos !== Math.round(valorTotal * 100)) {
        toast.error('A soma das duas formas deve ser igual ao valor total do recebimento.');
        return;
      }
      if (formasPagamento?.[0].metodoPagamento === formasPagamento?.[1].metodoPagamento) {
        toast.error('Escolha duas formas de pagamento diferentes.');
        return;
      }
    }
    setIsSubmitting(true);
    try {
      let comprovanteBase64: string | undefined;
      let comprovanteNome: string | undefined;
      let comprovanteMime: string | undefined;
      if (comprovanteFile) {
        comprovanteBase64 = await toBase64(comprovanteFile);
        comprovanteNome = comprovanteFile.name;
        comprovanteMime = comprovanteFile.type;
      }
      await criarPagamento.mutateAsync({
        atendimentoId,
        pacienteId,
        profissionalId,
        valor: parseFloat(formData.valor),
        dataPagamento: new Date(formData.dataPagamento + 'T12:00:00'),
        referenciaDatas: formData.referenciaDatas,
        metodoPagamento: formData.metodoPagamento,
        formasPagamento,
        observacoes: formData.observacoes || undefined,
        comprovanteBase64,
        comprovanteNome,
        comprovanteMime,
        atendimentosVinculados: sessoesVinculadas,
        convenioNome: convenioNome || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSessao = (id: number) => {
    setSessoesVinculadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isVisible) return null;

  const totalPago = (pagamentos as any[]).reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);

  return (
    <div className="space-y-5 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 max-h-[85vh] overflow-y-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            {pagamentoOab ? 'Registrar Recebimento OAB' : 'Registrar Pagamento'}
            {convenioNome && <span className="text-sm font-normal text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{convenioNome}</span>}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">Paciente: <span className="font-medium text-emerald-700">{pacienteNome}</span></p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Pago (R$) *</label>
            <Input
              type="number" step="0.01" min="0" placeholder="0.00"
              value={formData.valor}
              onChange={e => setFormData({ ...formData, valor: e.target.value })}
              required className="w-full"
            />
          </div>
          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
            <Input
              type="date" value={formData.dataPagamento}
              onChange={e => setFormData({ ...formData, dataPagamento: e.target.value })}
              className="w-full"
            />
          </div>
          {/* Referência */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Referência de Datas (ex: 01 a 31 de agosto) *</label>
            <Input
              type="text" placeholder="Ex: 01 a 31 de agosto de 2026"
              value={formData.referenciaDatas}
              onChange={e => setFormData({ ...formData, referenciaDatas: e.target.value })}
              required className="w-full"
            />
          </div>
          {/* Método */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{pagamentoDividido ? '1ª Forma de Pagamento' : 'Forma de Pagamento'}</label>
            <select
              value={formData.metodoPagamento}
              onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="transferencia">Transferência</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              placeholder="Observações sobre o pagamento..."
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={2}
            />
          </div>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-emerald-900 cursor-pointer">
            <input
              type="checkbox"
              checked={pagamentoDividido}
              onChange={e => {
                const ativar = e.target.checked;
                setPagamentoDividido(ativar);
                if (ativar) {
                  setValorPrimeiraForma(formData.valor);
                  setSegundaForma({
                    metodoPagamento: formData.metodoPagamento === 'dinheiro' ? 'pix' : 'dinheiro',
                    valor: '',
                  });
                }
              }}
            />
            Dividir este recebimento em duas formas de pagamento
          </label>
          {pagamentoDividido && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor da 1ª forma (R$) *</label>
                <Input type="number" step="0.01" min="0.01" value={valorPrimeiraForma} onChange={e => setValorPrimeiraForma(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">2ª Forma de Pagamento *</label>
                <select value={segundaForma.metodoPagamento} onChange={e => setSegundaForma({ ...segundaForma, metodoPagamento: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="pix" disabled={formData.metodoPagamento === 'pix'}>PIX</option>
                  <option value="dinheiro" disabled={formData.metodoPagamento === 'dinheiro'}>Dinheiro</option>
                  <option value="cartao_credito" disabled={formData.metodoPagamento === 'cartao_credito'}>Cartão de Crédito</option>
                  <option value="cartao_debito" disabled={formData.metodoPagamento === 'cartao_debito'}>Cartão de Débito</option>
                  <option value="transferencia" disabled={formData.metodoPagamento === 'transferencia'}>Transferência</option>
                  <option value="outro" disabled={formData.metodoPagamento === 'outro'}>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Valor da 2ª forma (R$) *</label>
                <Input type="number" step="0.01" min="0.01" value={segundaForma.valor} onChange={e => setSegundaForma({ ...segundaForma, valor: e.target.value })} />
              </div>
              <p className="self-end text-xs text-emerald-800">Soma informada: <strong>{((Number(valorPrimeiraForma) || 0) + (Number(segundaForma.valor) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> de <strong>{(Number(formData.valor) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>.</p>
            </div>
          )}
        </div>

        {/* Upload de comprovante */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comprovante de Pagamento {comprovanteObrigatorio && <span className="text-red-600">*</span>}
            <span className={`text-xs ${comprovanteObrigatorio ? 'text-red-600' : 'text-gray-400'}`}>
              {comprovanteObrigatorio ? ' (obrigatório para Mente Aberta — JPG, PNG, PDF, máx. 10MB)' : ' (opcional — JPG, PNG, PDF, máx. 10MB)'}
            </span>
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragging ? 'border-emerald-400 bg-emerald-50' : comprovanteFile ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30'}`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef} type="file" className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {comprovanteFile ? (
              <div className="flex items-center justify-center gap-3">
                {comprovantePreview ? (
                  <img src={comprovantePreview} alt="Preview" className="w-16 h-16 object-cover rounded border" />
                ) : (
                  <FileImage className="w-10 h-10 text-emerald-500" />
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-emerald-700">{comprovanteFile.name}</p>
                  <p className="text-xs text-gray-500">{(comprovanteFile.size / 1024).toFixed(0)} KB</p>
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                    onClick={e => { e.stopPropagation(); setComprovanteFile(null); setComprovantePreview(null); }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm">Arraste o comprovante aqui ou <span className="text-emerald-600 font-medium">clique para selecionar</span></p>
              </div>
            )}
          </div>
        </div>

        {/* Sessões do mês para vincular */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vincular Sessões do Mês (opcional)</label>
          <div className="flex gap-2 mb-3">
            <select
              value={mesSelecionado}
              onChange={e => setMesSelecionado(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={anoSelecionado}
              onChange={e => setAnoSelecionado(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {[hoje.getFullYear() - 1, hoje.getFullYear(), hoje.getFullYear() + 1].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          {(sessoesMes as any[]).length === 0 ? (
            <p className="text-xs text-gray-400 italic">Nenhuma sessão encontrada para este mês.</p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {(sessoesMes as any[]).map((s: any) => {
                const isVinculada = sessoesVinculadas.includes(s.id) || s.id === atendimentoId;
                const jaTemPagamento = s.pagamentoParticularId && s.pagamentoParticularId !== null;
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${isVinculada ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-200 hover:border-emerald-200'} ${jaTemPagamento && s.id !== atendimentoId ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isVinculada}
                      disabled={s.id === atendimentoId || (jaTemPagamento && !isVinculada)}
                      onChange={() => s.id !== atendimentoId && toggleSessao(s.id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="flex-1">
                      {fmtDateSafe(s.data)} {s.horario && `às ${s.horario}`}
                      {s.tipo && <span className="text-gray-500 ml-1">· {s.tipo}</span>}
                    </span>
                    {jaTemPagamento && <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">Pago</span>}
                    {s.id === atendimentoId && <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-medium">Esta sessão</span>}
                  </label>
                );
              })}
            </div>
          )}
          {sessoesVinculadas.length > 0 && (
            <p className="text-xs text-emerald-600 mt-1.5 font-medium">{sessoesVinculadas.length + 1} sessão(ões) serão marcadas como pagas.</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || criarPagamento.isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Registrando...' : pagamentoOab ? 'Registrar Recebimento OAB' : 'Registrar Pagamento'}
        </Button>
      </form>

      {/* Histórico */}
      {(pagamentos as any[]).length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Histórico de Pagamentos</h4>
            <span className="text-sm font-medium text-emerald-600">Total: R$ {totalPago.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            {(pagamentos as any[]).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">R$ {parseFloat(p.valor).toFixed(2)}</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{formatarFormasPagamento(p)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">{p.referenciaDatas}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDateSafe(p.dataPagamento)}
                  </p>
                </div>
                <div className="flex gap-1 ml-3 shrink-0">
  {(p.comprovanteUrl || p.comprovanteKey) && (() => {
                    const key = (p.comprovanteKey || p.comprovanteUrl || '').toLowerCase();
                    const isPdf = key.endsWith('.pdf') || key.includes('.pdf');
                    return (
                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPdf ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {isPdf ? 'PDF' : 'IMG'}
                      </span>
                      <button
                       className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                       title="Ver comprovante"
                       onClick={() => handleVerComprovante(p)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                    );
                  })()}
                  <button
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    title="Remover pagamento"
                    disabled={deletarPagamento.isPending}
                    onClick={() => {
                      if (confirm('Remover este pagamento? As sessões vinculadas serão desmarcadas.')) {
                        deletarPagamento.mutate({ pagamentoId: p.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
