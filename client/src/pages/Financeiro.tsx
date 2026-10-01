import { getHojeBrasilia, formatDateBR } from '../lib/utils';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, Download, Filter, Calendar, Zap, Upload, Trash2, Search, ChevronLeft, ChevronRight, FileSpreadsheet, ArrowUpCircle, ArrowDownCircle, Banknote, GitMerge, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatsCard } from '../components/StatsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { obterPeriodoMes } from '@shared/periodoFinanceiro';
import { gerarCsvRelatorioFinanceiro } from '@shared/relatorioFinanceiroCsv';
import { PagamentosRepasse } from '../components/PagamentosRepasse';


export function Financeiro() {
  const [activeTab, setActiveTab] = useState('pagar');
  const [modalBaixaOpen, setModalBaixaOpen] = useState(false);
  const [modalNovaContaOpen, setModalNovaContaOpen] = useState(false);
  const [modalEdicaoOpen, setModalEdicaoOpen] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<Conta | null>(null);
  const [tipoNovaContaModal, setTipoNovaContaModal] = useState<'pagar' | 'receber'>('pagar');
  const [contaEmEdicao, setContaEmEdicao] = useState<Conta | null>(null);
  const [filtroData, setFiltroData] = useState('');
  const [filtroConvenio, setFiltroConvenio] = useState('');
  const [dataInicio, setDataInicio] = useState(() => obterPeriodoMes(new Date()).inicio);
  const [dataFim, setDataFim] = useState(() => obterPeriodoMes(new Date()).fim);
  const [filtroStatus, setFiltroStatus] = useState('');

  // Estado para formulario de nova conta
  const [novaContaForm, setNovaContaForm] = useState({
    descricao: '',
    categoriaId: '',
    valor: '',
    dataVencimento: '',
    formaPagamentoId: '',
    observacoes: '',
  });

  // Estado para edicao de conta
  const [edicaoForm, setEdicaoForm] = useState({
    descricao: '',
    valor: '',
    dataVencimento: '',
    status: 'pendente' as 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'cancelado',
    observacoes: '',
  });

  const [filtroSemana, setFiltroSemana] = useState(false);

  // Estados para extrato bancário
  const [extratoDataInicio, setExtratoDataInicio] = useState('');
  const [extratoDataFim, setExtratoDataFim] = useState('');
  const [extratoTipo, setExtratoTipo] = useState<'credito' | 'debito' | 'saldo' | 'todos'>('todos');
  const [extratoCategoria, setExtratoCategoria] = useState('');
  const [extratoBusca, setExtratoBusca] = useState('');
  const [extratoPagina, setExtratoPagina] = useState(1);
  const [extratoArquivo, setExtratoArquivo] = useState<File | null>(null);
  const [extratoImportando, setExtratoImportando] = useState(false);
  const [conciliando, setConciliando] = useState(false);
  const extratoInputRef = useRef<HTMLInputElement>(null);

  // Calcular data de hoje e data de 7 dias atrás
  // Helper para formatar datas como DD/MM/AAAA
  const formatDate = (d: string | Date | null | undefined): string => {
    if (!d) return '-';
    const s = String(d);
    // Se já está no formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const [year, month, day] = s.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    }
    // Tentar parsear como Date
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    return s;
  };

  const hoje = new Date();
  const periodoMesAtual = obterPeriodoMes(hoje);
  const seteDisasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dataInicioSemana = seteDisasAtras.toISOString().split('T')[0];
  const dataFimSemana = hoje.toISOString().split('T')[0];

  // Esta tela trata repasses; ao entrar nela, posicionar na aba e competência
  // pedidas para evitar a preservação de um filtro semanal de navegação anterior.
  useEffect(() => {
    setActiveTab('pagar');
    setFiltroSemana(false);
    setDataInicio(periodoMesAtual.inicio);
    setDataFim(periodoMesAtual.fim);
  }, [periodoMesAtual.inicio, periodoMesAtual.fim]);

  // Tipos para contas
  interface Conta {
    id: number;
    descricao: string;
    valor: number;
    dataVencimento: string;
    status: 'pendente' | 'pago' | 'recebido' | 'atrasado' | 'cancelado';
    dataPagamento?: string | null;
    dataRecebimento?: string | null;
    tipo?: string | null;
    convenio?: string | null;
    paciente?: string | null;
    profissional?: string | null;
    fornecedor?: string | null;
    categoria?: string | null;
    prontuario?: string | null;
    glosa?: number | null;
    origemExtrato?: number | null;
    extratoBancarioId?: number | null;
  }

  // Queries tRPC
  const { data: contasReceber = [] as Conta[], refetch: refetchReceber } = trpc.financeiro.listarContasReceber.useQuery({
    status: (filtroStatus || undefined) as ('pendente' | 'recebido' | 'atrasado' | 'cancelado') | undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  });

  const { data: contasPagar = [] as Conta[], refetch: refetchPagar } = trpc.financeiro.listarContasPagar.useQuery({
    status: (filtroStatus || undefined) as ('pendente' | 'pago' | 'atrasado' | 'cancelado') | undefined,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  });

  const { data: categorias = [] } = trpc.financeiro.listarCategorias.useQuery();
  const { data: formasPagamento = [] } = trpc.financeiro.listarFormasPagamento.useQuery();
  const { data: resumo } = trpc.financeiro.resumoFinanceiro.useQuery({ dataInicio, dataFim });

  // Queries de extrato bancário
  const extratoQuery = trpc.extrato.listar.useQuery({
    dataInicio: extratoDataInicio || undefined,
    dataFim: extratoDataFim || undefined,
    tipo: extratoTipo,
    categoria: extratoCategoria || undefined,
    busca: extratoBusca || undefined,
    pagina: extratoPagina,
    porPagina: 50,
  }, { enabled: activeTab === 'extrato' });

  const extratoResumoQuery = trpc.extrato.resumo.useQuery({
    dataInicio: extratoDataInicio || undefined,
    dataFim: extratoDataFim || undefined,
  }, { enabled: activeTab === 'extrato' });

  const extratoCategoriasQuery = trpc.extrato.categorias.useQuery(undefined, { enabled: activeTab === 'extrato' });

  const importarExtrato = trpc.extrato.importar.useMutation({
    onSuccess: (data) => {
      toast.success(`Importado! ${data.inseridos} novos, ${data.duplicados} duplicados`);
      extratoQuery.refetch();
      extratoResumoQuery.refetch();
      setExtratoArquivo(null);
      if (extratoInputRef.current) extratoInputRef.current.value = '';
    },
    onError: (err) => toast.error(err.message || 'Erro ao importar extrato'),
  });

  const conciliarExtrato = trpc.financeiro.conciliarExtrato.useMutation({
    onSuccess: (data) => {
      toast.success(`Conciliação concluída! ${data.inseridosReceber} créditos → Contas a Receber, ${data.inseridosPagar} débitos → Contas a Pagar`);
      extratoQuery.refetch();
      extratoResumoQuery.refetch();
      refetchReceber();
      refetchPagar();
      setConciliando(false);
    },
    onError: (err) => { toast.error(err.message || 'Erro ao conciliar'); setConciliando(false); },
  });

  const excluirExtrato = trpc.extrato.excluir.useMutation({
    onSuccess: () => { toast.success('Lançamento excluído'); extratoQuery.refetch(); extratoResumoQuery.refetch(); },
    onError: () => toast.error('Erro ao excluir'),
  });

  const handleImportarExtrato = useCallback(async () => {
    if (!extratoArquivo) return;
    setExtratoImportando(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(extratoArquivo);
      });
      await importarExtrato.mutateAsync({ arquivoBase64: base64, nomeArquivo: extratoArquivo.name });
    } finally {
      setExtratoImportando(false);
    }
  }, [extratoArquivo, importarExtrato]);

  // Mutations
  const atualizarPagar = trpc.financeiro.atualizarContaPagar.useMutation({
    onSuccess: () => {
      toast.success('Conta actualizada!');
      refetchPagar();
    },
    onError: () => toast.error('Erro ao actualizar'),
  });

  const atualizarReceber = trpc.financeiro.atualizarContaReceber.useMutation({
    onSuccess: () => {
      toast.success('Conta actualizada!');
      refetchReceber();
    },
    onError: () => toast.error('Erro ao actualizar'),
  });

  const criarContaPagar = trpc.financeiro.criarContaPagar.useMutation({
    onSuccess: () => {
      toast.success('Conta a pagar criada!');
      refetchPagar();
      setModalNovaContaOpen(false);
      setNovaContaForm({ descricao: '', categoriaId: '', valor: '', dataVencimento: '', formaPagamentoId: '', observacoes: '' });
    },
    onError: (error) => toast.error(error.message || 'Erro ao criar'),
  });

  const criarContaReceber = trpc.financeiro.criarContaReceber.useMutation({
    onSuccess: () => {
      toast.success('Conta a receber criada!');
      refetchReceber();
      setModalNovaContaOpen(false);
      setNovaContaForm({ descricao: '', categoriaId: '', valor: '', dataVencimento: '', formaPagamentoId: '', observacoes: '' });
    },
    onError: (error) => toast.error(error.message || 'Erro ao criar'),
  });

  // Dados antigos (removidos - usando tRPC agora)
  const contasReceberAntigos = [
    {
      id: 1,
      tipo: 'Convênio',
      descricao: 'Unimed - Dezembro/2025',
      convenio: 'Unimed',
      paciente: null,
      dataVencimento: '10/01/2026',
      valor: 18450.0,
      valorPago: 0,
      status: 'Pendente',
      prontuario: 'Feito',
      guiasGeradas: 48,
    },
    {
      id: 2,
      tipo: 'Particular',
      descricao: 'Consulta - Ana Carolina Costa',
      convenio: 'Particular',
      paciente: 'Ana Carolina Costa',
      dataVencimento: '28/12/2025',
      dataAtendimento: '28/12/2025',
      valor: 450.0,
      valorPago: 450.0,
      status: 'Pago',
      dataPagamento: '28/12/2025',
      prontuario: 'Feito',
      nfEmitida: true,
    },
    {
      id: 3,
      tipo: 'Convênio',
      descricao: 'Bradesco Saúde - Dezembro/2025',
      convenio: 'Bradesco Saúde',
      paciente: null,
      dataVencimento: '15/01/2026',
      valor: 12340.0,
      valorPago: 0,
      status: 'Pendente',
      prontuario: 'Feito',
      guiasGeradas: 32,
    },
    {
      id: 4,
      tipo: 'Particular',
      descricao: 'Exames - Roberto Santos Lima',
      convenio: 'Particular',
      paciente: 'Roberto Santos Lima',
      dataVencimento: '27/12/2025',
      dataAtendimento: '27/12/2025',
      valor: 280.0,
      valorPago: 0,
      status: 'Vencido',
      prontuario: 'Pendente',
      nfEmitida: false,
    },
    {
      id: 5,
      tipo: 'Convênio',
      descricao: 'Amil - Novembro/2025',
      convenio: 'Amil',
      paciente: null,
      dataVencimento: '05/12/2025',
      valor: 10560.0,
      valorPago: 10560.0,
      status: 'Pago',
      dataPagamento: '10/12/2025',
      prontuario: 'Feito',
      guiasGeradas: 28,
    },
    {
      id: 6,
      tipo: 'Convênio',
      descricao: 'Unimed - Outubro/2025',
      convenio: 'Unimed',
      paciente: null,
      dataVencimento: '08/11/2025',
      valor: 19800.0,
      valorPago: 18810.0,
      status: 'Pago',
      dataPagamento: '08/11/2025',
      glosa: 990.0,
      prontuario: 'Feito',
      guiasGeradas: 45,
    },
  ];

  // Dados antigos (removidos - usando tRPC agora)
  const contasPagarAntigos = [
    {
      id: 1,
      tipo: 'Repasse',
      descricao: 'Repasse - Dr. João Silva - Dezembro/2025',
      profissional: 'Dr. João Silva',
      dataVencimento: '05/01/2026',
      valor: 7840.0,
      valorPago: 0,
      status: 'Pendente',
    },
    {
      id: 2,
      tipo: 'Repasse',
      descricao: 'Repasse - Dra. Maria Santos - Dezembro/2025',
      profissional: 'Dra. Maria Santos',
      dataVencimento: '05/01/2026',
      valor: 5096.0,
      valorPago: 0,
      status: 'Pendente',
    },
    {
      id: 3,
      tipo: 'Fornecedor',
      descricao: 'Aluguel - Janeiro/2026',
      fornecedor: 'Imobiliária Central',
      dataVencimento: '10/01/2026',
      valor: 8500.0,
      valorPago: 0,
      status: 'Pendente',
    },
    {
      id: 4,
      tipo: 'Repasse',
      descricao: 'Repasse - Dr. João Silva - Novembro/2025',
      profissional: 'Dr. João Silva',
      dataVencimento: '05/12/2025',
      valor: 8575.0,
      valorPago: 8575.0,
      status: 'Pago',
      dataPagamento: '05/12/2025',
      comprovante: 'COMP-2025-11-001',
    },
    {
      id: 5,
      tipo: 'Fornecedor',
      descricao: 'Energia Elétrica - Dezembro/2025',
      fornecedor: 'Companhia de Energia',
      dataVencimento: '15/12/2025',
      valor: 1250.0,
      valorPago: 1250.0,
      status: 'Pago',
      dataPagamento: '14/12/2025',
    },
  ];

  const handleDarBaixa = (item: any) => {
    setItemSelecionado(item);
    setModalBaixaOpen(true);
  };

  const handleConfirmarBaixa = () => {
    console.log('Baixa confirmada:', itemSelecionado);
    alert(`Pagamento confirmado!`);
    setModalBaixaOpen(false);
  };

  const handleCriarConta = () => {
    if (!novaContaForm.descricao.trim()) {
      toast.error('Descricao eh obrigatoria');
      return;
    }
    if (!novaContaForm.categoriaId) {
      toast.error('Categoria eh obrigatoria');
      return;
    }
    if (!novaContaForm.valor || parseFloat(novaContaForm.valor) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (!novaContaForm.dataVencimento) {
      toast.error('Data de vencimento eh obrigatoria');
      return;
    }

    const payload = {
      descricao: novaContaForm.descricao,
      categoriaId: parseInt(novaContaForm.categoriaId),
      valor: parseFloat(novaContaForm.valor),
      dataVencimento: novaContaForm.dataVencimento,
      formaPagamentoId: novaContaForm.formaPagamentoId ? parseInt(novaContaForm.formaPagamentoId) : undefined,
      observacoes: novaContaForm.observacoes || undefined,
    };

    if (tipoNovaContaModal === 'pagar') {
      criarContaPagar.mutate(payload);
    } else {
      criarContaReceber.mutate(payload);
    }
  };

  const handleAbrirEdicao = (conta: Conta) => {
    setContaEmEdicao(conta);
    setEdicaoForm({
      descricao: conta.descricao,
      valor: conta.valor.toString(),
      dataVencimento: conta.dataVencimento,
      status: conta.status,
      observacoes: '',
    });
    setModalEdicaoOpen(true);
  };





  const handleSalvarEdicao = () => {
    if (!edicaoForm.descricao.trim()) {
      toast.error('Descricao eh obrigatoria');
      return;
    }
    if (!edicaoForm.valor || parseFloat(edicaoForm.valor) <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    if (!edicaoForm.dataVencimento) {
      toast.error('Data de vencimento eh obrigatoria');
      return;
    }

    if (contaEmEdicao && activeTab === 'pagar') {
      const statusPagar = edicaoForm.status as 'pendente' | 'pago' | 'atrasado' | 'cancelado';
      atualizarPagar.mutate({
        id: contaEmEdicao.id,
        data: {
          descricao: edicaoForm.descricao,
          valor: parseFloat(edicaoForm.valor),
          dataVencimento: edicaoForm.dataVencimento,
          status: statusPagar,
          observacoes: edicaoForm.observacoes || undefined,
        },
      });
      toast.success('Conta actualizada!');
      setModalEdicaoOpen(false);
    } else if (contaEmEdicao && activeTab === 'receber') {
      const statusReceber = edicaoForm.status as 'pendente' | 'recebido' | 'atrasado' | 'cancelado';
      atualizarReceber.mutate({
        id: contaEmEdicao.id,
        data: {
          descricao: edicaoForm.descricao,
          valor: parseFloat(edicaoForm.valor),
          dataVencimento: edicaoForm.dataVencimento,
          status: statusReceber,
          observacoes: edicaoForm.observacoes || undefined,
        },
      });
      toast.success('Conta actualizada!');
      setModalEdicaoOpen(false);
    }
  };

    // Cálculos — helper para somar valores
  const soma = (arr: Conta[]) => arr.reduce((acc, c) => acc + (typeof c.valor === 'number' ? c.valor : parseFloat(String(c.valor)) || 0), 0);

  // Totais por status
  const totalReceber  = soma(contasReceber.filter(c => c.status === 'pendente'));   // a receber (pendente)
  const totalRecebido = soma(contasReceber.filter(c => c.status === 'recebido'));   // já recebido
  const totalAtrasadoReceber = soma(contasReceber.filter(c => c.status === 'atrasado'));
  const totalPagar    = soma(contasPagar.filter(c => c.status === 'pendente'));     // a pagar (pendente)
  const totalPago     = soma(contasPagar.filter(c => c.status === 'pago'));         // já pago
  const totalAtrasadoPagar = soma(contasPagar.filter(c => c.status === 'atrasado'));

  // Cards de resumo
  const saldoAtual    = totalRecebido - totalPago;                                  // recebido - pago
  const saldoPrevisao = saldoAtual + totalReceber - totalPagar;                     // saldo atual + pendentes

  // Contas atrasadas
  const contasAtrasadas = [...contasReceber.filter(c => c.status === 'atrasado'), ...contasPagar.filter(c => c.status === 'atrasado')];
  // Contas desta semana
  const contasSemanaPagar = filtroSemana ? contasPagar.filter(c => c.dataVencimento >= dataInicioSemana && c.dataVencimento <= dataFimSemana) : contasPagar;
  const contasSemanReceber = filtroSemana ? contasReceber.filter(c => c.dataVencimento >= dataInicioSemana && c.dataVencimento <= dataFimSemana) : contasReceber;
  const saldoAtrasado = totalAtrasadoReceber - totalAtrasadoPagar;

  const handleExportarRelatorio = () => {
    const receberNoRelatorio = filtroSemana ? contasSemanReceber : contasReceber;
    const pagarNoRelatorio = filtroSemana ? contasSemanaPagar : contasPagar;
    const csv = gerarCsvRelatorioFinanceiro({
      contasReceber: receberNoRelatorio,
      contasPagar: pagarNoRelatorio,
      dataInicio,
      dataFim,
    });
    const arquivo = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${dataInicio || 'completo'}-${dataFim || 'completo'}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    // Alguns navegadores cancelam o download quando a URL do Blob é revogada
    // no mesmo ciclo do clique. Mantê-la brevemente ativa garante o salvamento.
    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1000);
    toast.success('Relatório financeiro exportado com sucesso.');
  };

  // Análise financeira
  const taxaInadimplencia = totalAtrasadoReceber > 0 ? ((totalAtrasadoReceber / (totalReceber + totalRecebido + totalAtrasadoReceber)) * 100).toFixed(1) : '0';
  const glosaTotal = 0; // Será implementado depois
  const taxaGlosa = '0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Financeiro</h1>
          <p className="text-gray-600">Controle de contas a pagar e receber</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportarRelatorio}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => {
            setTipoNovaContaModal('receber');
            setModalNovaContaOpen(true);
          }}>
            + Conta a Receber
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => {
            setTipoNovaContaModal('pagar');
            setModalNovaContaOpen(true);
          }}>
            + Conta a Pagar
          </Button>
        </div>
      </div>

      {/* Alertas de Contas Atrasadas */}
      {contasAtrasadas.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">⚠️ Atenção: Contas Atrasadas</h3>
              <p className="text-sm text-red-700 mt-1">
                {contasAtrasadas.length} conta(s) atrasada(s) no valor de R$ {saldoAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros Rápidos */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold">Filtros Rápidos:</span>
          </div>
          <Button
            variant={filtroSemana ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFiltroSemana(!filtroSemana);
              if (!filtroSemana) {
                setDataInicio(dataInicioSemana);
                setDataFim(dataFimSemana);
              } else {
                setDataInicio('');
                setDataFim('');
              }
            }}
          >
            <Zap className="w-4 h-4 mr-2" />
            Esta Semana
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            // Mês completo: o filtro semanal não pode continuar ocultando os
            // pagamentos da primeira semana do mês selecionado.
            setFiltroSemana(false);
            setDataInicio(periodoMesAtual.inicio);
            setDataFim(periodoMesAtual.fim);
          }}>
            <Calendar className="w-4 h-4 mr-2" />
            Mês Completo
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            setDataInicio('');
            setDataFim('');
          }}>
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Saldo Atual"
          value={`R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle="Recebido − Pago"
        />
        {/* Card Recebido */}
        <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500 font-medium">Recebido</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-green-700">
            R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">{contasReceber.filter(c => c.status === 'recebido').length} lançamentos</p>
        </div>
        {/* Card Pago */}
        <div className="bg-white border border-red-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500 font-medium">Pago</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600">
            R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">{contasPagar.filter(c => c.status === 'pago').length} lançamentos</p>
        </div>
        <StatsCard
          title="A Receber"
          value={`R$ ${totalReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          subtitle={`${contasReceber.filter(c => c.status === 'pendente').length} conta${contasReceber.filter(c => c.status === 'pendente').length !== 1 ? 's' : ''} pendente${contasReceber.filter(c => c.status === 'pendente').length !== 1 ? 's' : ''}`}
        />
        <StatsCard
          title="A Pagar"
          value={`R$ ${totalPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingDown}
          subtitle={`${contasPagar.filter(c => c.status === 'pendente').length} conta${contasPagar.filter(c => c.status === 'pendente').length !== 1 ? 's' : ''} pendente${contasPagar.filter(c => c.status === 'pendente').length !== 1 ? 's' : ''}`}
        />
        <StatsCard
          title="Previsão de Saldo"
          value={`R$ ${saldoPrevisao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          subtitle="Após receber/pagar tudo"
        />
      </div>

      

      {/* Card de Contas Atrasadas */}
      {totalAtrasadoReceber > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-900">⚠️ Total de Contas Atrasadas</p>
              <p className="text-xl text-red-700 mt-1">R$ {totalAtrasadoReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      )}





      {/* Filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => { setFiltroSemana(false); setDataInicio(e.target.value); }}
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <Label>Data Final</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => { setFiltroSemana(false); setDataFim(e.target.value); }}
              className="w-44"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filtroStatus || 'todos'}
              onValueChange={(v) => setFiltroStatus(v === 'todos' ? '' : v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recebido">Recebido</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(dataInicio || dataFim || filtroStatus) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDataInicio(''); setDataFim(''); setFiltroStatus(''); }}
              className="h-10"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Tabs de Contas */}
      <div className="bg-white border rounded-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none px-4">
            <TabsTrigger value="receber">
              Contas a Receber ({(filtroSemana ? contasSemanReceber : contasReceber).filter(c => c.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="pagar">
              Contas a Pagar ({(filtroSemana ? contasSemanaPagar : contasPagar).filter(c => c.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="repasses" className="flex items-center gap-1">
              <Banknote className="w-4 h-4" />
              Repasses
            </TabsTrigger>
            <TabsTrigger value="extrato" className="flex items-center gap-1">
              <Banknote className="w-4 h-4" />
              Extrato Bancário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receber">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Tipo</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Descrição</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Convênio/Paciente</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Vencimento</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Valor</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Prontuário</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(filtroSemana ? contasSemanReceber : contasReceber).map((conta) => (
                    <tr key={conta.id} className={`hover:bg-gray-50 ${conta.status === 'atrasado' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          (conta as any).tipo === 'Convênio' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {(conta as any).tipo || conta.categoria || 'Receita'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{conta.descricao}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>{(conta as any).convenio || '-'}</div>
                        {(conta as any).paciente && <div className="text-xs text-gray-500">{(conta as any).paciente}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm">{formatDate(conta.dataVencimento)}</td>
                      <td className="px-6 py-4">
                        <div>R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        {(conta as any).glosa && (
                          <div className="text-xs text-red-600">
                            Glosa: R$ {Number((conta as any).glosa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          (conta as any).prontuario === 'Feito' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {(conta as any).prontuario || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  conta.status === 'atrasado' ? 'bg-red-100 text-red-700 font-semibold' :
                  conta.status === 'pago' || conta.status === 'recebido' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                        }`}>
                          {conta.status}
                        </span>
                        {(conta as any).dataPagamento && (
                          <div className="text-xs text-gray-500 mt-1">{(conta as any).dataPagamento}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAbrirEdicao(conta)}
                        >
                          Editar
                        </Button>
                        {conta.status === 'pendente' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleDarBaixa(conta)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Baixa
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{conta.categoria || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pagar">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Tipo</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Descrição</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Beneficiário</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Vencimento</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Valor</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
                    <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(filtroSemana ? contasSemanaPagar : contasPagar).map((conta) => (
                    <tr key={conta.id} className={`hover:bg-gray-50 ${conta.status === 'atrasado' ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          (conta as any).tipo === 'Repasse' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {(conta as any).tipo || conta.categoria || 'Despesa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{conta.descricao}</td>
                      <td className="px-6 py-4 text-sm">{(conta as any).profissional || (conta as any).fornecedor || '-'}</td>
                      <td className="px-6 py-4 text-sm">{formatDate(conta.dataVencimento)}</td>
                      <td className="px-6 py-4">
                        R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          conta.status === 'pago' || conta.status === 'recebido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {conta.status}
                        </span>
                        {conta.dataPagamento && (
                          <div className="text-xs text-gray-500 mt-1">{formatDate(conta.dataPagamento)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAbrirEdicao(conta)}
                        >
                          Editar
                        </Button>
                        {conta.status === 'pendente' && (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleDarBaixa(conta)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">-</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="repasses" className="p-4">
            <PagamentosRepasse modo="master" />
          </TabsContent>

          {/* Aba de Extrato Bancário */}
          <TabsContent value="extrato" className="p-4 space-y-4">
            {/* Cards de resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">Total Créditos</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  R$ {(extratoResumoQuery.data?.totalCredito ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-600 mt-1">{extratoResumoQuery.data?.qtdCredito ?? 0} lançamentos</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">Total Débitos</span>
                </div>
                <p className="text-2xl font-bold text-red-700">
                  R$ {(extratoResumoQuery.data?.totalDebito ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-red-600 mt-1">{extratoResumoQuery.data?.qtdDebito ?? 0} lançamentos</p>
              </div>
              <div className={`border rounded-lg p-4 ${(extratoResumoQuery.data?.saldo ?? 0) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className={`w-5 h-5 ${(extratoResumoQuery.data?.saldo ?? 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                  <span className={`text-sm font-semibold ${(extratoResumoQuery.data?.saldo ?? 0) >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Saldo do Período</span>
                </div>
                <p className={`text-2xl font-bold ${(extratoResumoQuery.data?.saldo ?? 0) >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  R$ {(extratoResumoQuery.data?.saldo ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">{extratoResumoQuery.data?.qtdTotal ?? 0} lançamentos no total</p>
              </div>
            </div>

            {/* Botão de Conciliação */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <GitMerge className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Conciliar Extrato</p>
                  <p className="text-xs text-blue-700">Envia créditos para Contas a Receber e débitos para Contas a Pagar automaticamente</p>
                </div>
              </div>
              <Button
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
                disabled={conciliando}
                onClick={() => {
                  setConciliando(true);
                  conciliarExtrato.mutate({});
                }}
              >
                {conciliando ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Conciliando...</>
                ) : (
                  <><GitMerge className="w-4 h-4 mr-2" />Conciliar Lançamentos Não Conciliados</>
                )}
              </Button>
            </div>
            {/* Upload de arquivo */}
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold">Importar Extrato Bradesco (.XLS)</p>
                    <p className="text-xs text-gray-500">Selecione o arquivo exportado pelo internet banking</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <input
                    ref={extratoInputRef}
                    type="file"
                    accept=".xls,.xlsx"
                    className="hidden"
                    onChange={(e) => setExtratoArquivo(e.target.files?.[0] ?? null)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => extratoInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {extratoArquivo ? extratoArquivo.name : 'Selecionar Arquivo'}
                  </Button>
                  {extratoArquivo && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={extratoImportando}
                      onClick={handleImportarExtrato}
                    >
                      {extratoImportando ? 'Importando...' : 'Importar'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <Label className="text-xs">Data Início</Label>
                <Input type="date" value={extratoDataInicio} onChange={(e) => { setExtratoDataInicio(e.target.value); setExtratoPagina(1); }} className="w-36" />
              </div>
              <div>
                <Label className="text-xs">Data Fim</Label>
                <Input type="date" value={extratoDataFim} onChange={(e) => { setExtratoDataFim(e.target.value); setExtratoPagina(1); }} className="w-36" />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={extratoTipo} onValueChange={(v) => { setExtratoTipo(v as any); setExtratoPagina(1); }}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="saldo">Saldo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={extratoCategoria} onValueChange={(v) => { setExtratoCategoria(v === 'todas' ? '' : v); setExtratoPagina(1); }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {(extratoCategoriasQuery.data ?? []).map((cat) => (
                      <SelectItem key={cat as string} value={cat as string}>{cat as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[160px]">
                <Label className="text-xs">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Descrição..."
                    value={extratoBusca}
                    onChange={(e) => { setExtratoBusca(e.target.value); setExtratoPagina(1); }}
                    className="pl-8"
                  />
                </div>
              </div>
              {(extratoDataInicio || extratoDataFim || extratoTipo !== 'todos' || extratoCategoria || extratoBusca) && (
                <Button variant="outline" size="sm" onClick={() => {
                  setExtratoDataInicio(''); setExtratoDataFim('');
                  setExtratoTipo('todos'); setExtratoCategoria(''); setExtratoBusca('');
                  setExtratoPagina(1);
                }}>Limpar</Button>
              )}
            </div>

            {/* Tabela de lançamentos */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600">Data</th>
                    <th className="text-left px-4 py-3 text-gray-600">Descrição</th>
                    <th className="text-left px-4 py-3 text-gray-600">Documento</th>
                    <th className="text-left px-4 py-3 text-gray-600">Categoria</th>
                    <th className="text-right px-4 py-3 text-gray-600">Crédito</th>
                    <th className="text-right px-4 py-3 text-gray-600">Débito</th>
                    <th className="text-center px-4 py-3 text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {extratoQuery.isLoading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">Carregando...</td></tr>
                  ) : (extratoQuery.data?.lancamentos ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-500">
                      {activeTab === 'extrato' ? 'Nenhum lançamento encontrado. Importe um extrato XLS do Bradesco.' : ''}
                    </td></tr>
                  ) : (
                    (extratoQuery.data?.lancamentos ?? []).map((lanc: any) => (
                      <tr key={lanc.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {lanc.data ? formatDateBR(lanc.data as string) : '-'}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <span className="block truncate" title={lanc.descricao}>{lanc.descricao}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lanc.documento || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{lanc.categoria || 'Outros'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {lanc.credito ? (
                            <span className="text-green-700 font-medium">R$ {parseFloat(lanc.credito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {lanc.debito ? (
                            <span className="text-red-700 font-medium">R$ {parseFloat(lanc.debito).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => excluirExtrato.mutate({ id: lanc.id })}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {(extratoQuery.data?.total ?? 0) > 50 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {(extratoPagina - 1) * 50 + 1}–{Math.min(extratoPagina * 50, extratoQuery.data?.total ?? 0)} de {extratoQuery.data?.total ?? 0} lançamentos
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={extratoPagina <= 1} onClick={() => setExtratoPagina(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={extratoPagina * 50 >= (extratoQuery.data?.total ?? 0)} onClick={() => setExtratoPagina(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Nova Conta */}
      <Dialog open={modalNovaContaOpen} onOpenChange={setModalNovaContaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {tipoNovaContaModal === 'pagar' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descricao *</Label>
                <Input
                  placeholder="Ex: Salario, Aluguel, Consulta..."
                  value={novaContaForm.descricao}
                  onChange={(e) => setNovaContaForm({ ...novaContaForm, descricao: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={novaContaForm.categoriaId} onValueChange={(value) => setNovaContaForm({ ...novaContaForm, categoriaId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Salarios</SelectItem>
                    <SelectItem value="2">Aluguel</SelectItem>
                    <SelectItem value="3">Servicos</SelectItem>
                    <SelectItem value="4">Produtos</SelectItem>
                    <SelectItem value="5">Utilidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={novaContaForm.valor}
                  onChange={(e) => setNovaContaForm({ ...novaContaForm, valor: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={novaContaForm.dataVencimento}
                  onChange={(e) => setNovaContaForm({ ...novaContaForm, dataVencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={novaContaForm.formaPagamentoId} onValueChange={(value) => setNovaContaForm({ ...novaContaForm, formaPagamentoId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dinheiro</SelectItem>
                  <SelectItem value="2">PIX</SelectItem>
                  <SelectItem value="3">Transferencia Bancaria</SelectItem>
                  <SelectItem value="4">Cartao de Debito</SelectItem>
                  <SelectItem value="5">Cartao de Credito</SelectItem>
                  <SelectItem value="6">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Input
                placeholder="Observacoes adicionais..."
                value={novaContaForm.observacoes}
                onChange={(e) => setNovaContaForm({ ...novaContaForm, observacoes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalNovaContaOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCriarConta} disabled={criarContaPagar.isPending || criarContaReceber.isPending}>
                Criar Conta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edicao */}
      <Dialog open={modalEdicaoOpen} onOpenChange={setModalEdicaoOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conta</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Descricao *</Label>
                <Input
                  value={edicaoForm.descricao}
                  onChange={(e) => setEdicaoForm({ ...edicaoForm, descricao: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={edicaoForm.status} onValueChange={(value: any) => setEdicaoForm({ ...edicaoForm, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="atrasado">Atrasado</SelectItem>
                    {activeTab === 'pagar' ? (
                      <SelectItem value="pago">Pago</SelectItem>
                    ) : (
                      <SelectItem value="recebido">Recebido</SelectItem>
                    )}
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={edicaoForm.valor}
                  onChange={(e) => setEdicaoForm({ ...edicaoForm, valor: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data de Vencimento *</Label>
                <Input
                  type="date"
                  value={edicaoForm.dataVencimento}
                  onChange={(e) => setEdicaoForm({ ...edicaoForm, dataVencimento: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observacoes</Label>
              <Input
                placeholder="Observacoes adicionais..."
                value={edicaoForm.observacoes}
                onChange={(e) => setEdicaoForm({ ...edicaoForm, observacoes: e.target.value })}
              />
            </div>


            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalEdicaoOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSalvarEdicao}>
                Salvar Alteracoes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Baixa */}
      <Dialog open={modalBaixaOpen} onOpenChange={setModalBaixaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento/Recebimento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm mb-2">Informações da Conta</h4>
              <p className="text-sm"><strong>Descrição:</strong> {itemSelecionado?.descricao}</p>
              <p className="text-sm"><strong>Valor:</strong> R$ {itemSelecionado?.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Pagamento *</Label>
                <Input type="date" defaultValue={getHojeBrasilia()} />
              </div>
              
              <div className="space-y-2">
                <Label>Valor Pago/Recebido *</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  defaultValue={itemSelecionado?.valor}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                  <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {activeTab === 'receber' && itemSelecionado?.tipo === 'Convênio' && (
              <div className="space-y-2">
                <Label>Glosa (se houver)</Label>
                <Input type="number" step="0.01" placeholder="0.00" />
                <p className="text-xs text-gray-500">Informe o valor glosado pelo convênio, se aplicável</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Comprovante de Pagamento</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png" />
              <p className="text-xs text-gray-500">Anexe o comprovante de pagamento/recebimento</p>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Input placeholder="Observações adicionais..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalBaixaOpen(false)}>
                Cancelar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmarBaixa}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar {activeTab === 'receber' ? 'Recebimento' : 'Pagamento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
