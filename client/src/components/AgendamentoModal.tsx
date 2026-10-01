import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Calendar, Clock, User, Heart, FileText, AlertCircle, Stethoscope, CheckCircle2, PartyPopper, Search, RefreshCw, UserPlus, X } from 'lucide-react';
import { addDays, parseISO } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { trpc } from '../lib/trpc';
import { getHojeBrasilia } from '../lib/utils';
import { toast } from 'sonner';
import { formatPacienteIdForSelect } from '@shared/paciente';
import { criarMensagemAgendamentoSucesso } from '@shared/agendamentoFeedback';
import { ROTULOS_PROCEDIMENTO_POR_TIPO, TIPOS_ATENDIMENTO_DISPONIVEIS } from '@shared/tiposAtendimento';
import {
  IdentificadoresObrigatoriosAgendamento,
  validarIdentificadoresAgendamento,
} from '@shared/validacaoAgendamento';
import { opcoesDuracaoParaProfissional, profissionalRecebeDuasUnidadesPorHora } from '@shared/duracaoRepasseProfissional';

interface AgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot?: { date: Date; time: string; profissionalId?: number } | null;
  onSuccess?: (profissionalId?: number) => void;
}

export function AgendamentoModal({ isOpen, onClose, selectedSlot, onSuccess }: AgendamentoModalProps) {
  // Flag para saber se houve agendamento bem-sucedido (persiste mesmo após desmontagem parcial)
    const [agendamentoCriado, setAgendamentoCriado] = useState(false);
  const [profissionalIdCriado, setProfissionalIdCriado] = useState<number | undefined>(undefined);
  // Quando o modal fecha E houve agendamento, disparar o refetch na Agenda
  useEffect(() => {
    if (!isOpen && agendamentoCriado) {
      onSuccess?.(profissionalIdCriado);
      setAgendamentoCriado(false);
      setProfissionalIdCriado(undefined);
    }
  }, [isOpen, agendamentoCriado]);

  const [formData, setFormData] = useState({
    pacienteId: '',
    profissionalId: '',
    data: '',
    horario: '',
    tipo: '',
    convenioId: '',
    procedimentoConvenioId: '',
    autorizacao: '',
    observacoes: '',
    duracao: '30',
    repetir: false,
    diasSemana: [] as string[],
    quantidadeRepeticoes: '1',
    numeroAgendas: '7',
    intervaloDias: '7',
  });

  const [autorizacaoValida, setAutorizacaoValida] = useState<boolean | null>(null);

  // Estado da tabela de agendamento em série
  type SerieItem = { data: string; hora: string; sms: boolean; email: boolean; agendar: boolean; status: 'pendente' | 'sucesso' | 'erro' | 'ignorado'; atendimentoId?: number; erro?: string };
  const [serieItems, setSerieItems] = useState<SerieItem[]>([]);
  const [serieAgendando, setSerieAgendando] = useState(false);
  const [serieIniciada, setSerieIniciada] = useState(false);
  const [serieIdCriado, setSerieIdCriado] = useState<string | null>(null);
  const [smsEnviando, setSmsEnviando] = useState(false);

  const gerarSerieItems = useCallback(() => {
    if (!formData.data || !formData.horario) return;
    const n = parseInt(formData.numeroAgendas) || 7;
    const intervalo = parseInt(formData.intervaloDias) || 7;
    const items: SerieItem[] = [];
    for (let i = 1; i <= n; i++) {
      const dt = addDays(parseISO(formData.data), i * intervalo);
      items.push({
        data: format(dt, 'yyyy-MM-dd'),
        hora: formData.horario,
        sms: false,
        email: false,
        agendar: true,
        status: 'pendente',
      });
    }
    setSerieItems(items);
    setSerieIniciada(false);
  }, [formData.data, formData.horario, formData.numeroAgendas, formData.intervaloDias]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [buscaPaciente, setBuscaPaciente] = useState('');
  const [pacienteDropdownOpen, setPacienteDropdownOpen] = useState(false);
  const pacienteDropdownRef = useRef<HTMLDivElement>(null);
  const [buscaProfissional, setBuscaProfissional] = useState('');
  const [profissionalDropdownOpen, setProfissionalDropdownOpen] = useState(false);
  const profissionalDropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pacienteDropdownRef.current && !pacienteDropdownRef.current.contains(e.target as Node)) {
        setPacienteDropdownOpen(false);
        setBuscaPaciente('');
      }
      if (profissionalDropdownRef.current && !profissionalDropdownRef.current.contains(e.target as Node)) {
        setProfissionalDropdownOpen(false);
        setBuscaProfissional('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [])
  const [successInfo, setSuccessInfo] = useState<{ pacienteNome: string; data: string; hora: string; profissionalNome: string; quantidade?: number } | null>(null);
  // O modal permanece montado mesmo fechado. As listas abaixo só são úteis
  // durante um novo agendamento e não devem atrasar a abertura da Agenda.
  const { data: pacientes = [] } = trpc.pacientes.listParaAgenda.useQuery(undefined, { enabled: isOpen });
  const { data: profissionais = [] } = trpc.profissionais.list.useQuery(undefined, { enabled: isOpen });
  const { data: convenios = [] } = trpc.convenios.list.useQuery(undefined, { enabled: isOpen });

  // Carregar procedimentos TUSS dinamicamente ao selecionar convênio
  const convenioIdNum = formData.convenioId ? parseInt(formData.convenioId) : 0;
  const { data: procedimentosConvenio = [] } = trpc.procedimentos.getProcedimentosPorConvenio.useQuery(
    { convenioId: convenioIdNum },
    { enabled: convenioIdNum > 0 }
  );

  const utils = trpc.useUtils();
  // Estado do mini-formulário de novo cadastro de paciente
  const [showNovoCadastro, setShowNovoCadastro] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState({ nome: '', cpf: '', dataNascimento: '', telefone: '', numeroCarteira: '' });
  const [salvandoPaciente, setSalvandoPaciente] = useState(false);
  // Verificação de CPF duplicado
  const [cpfParaVerificar, setCpfParaVerificar] = useState('');
  const [pacienteDuplicado, setPacienteDuplicado] = useState<any>(null);
  const [verificandoCpf, setVerificandoCpf] = useState(false);
  const { data: pacientePorCpf, isFetching: buscandoCpf } = trpc.pacientes.getByCpf.useQuery(
    { cpf: cpfParaVerificar },
    { enabled: cpfParaVerificar.replace(/\D/g, '').length === 11 }
  );
  // Quando a busca retornar, atualizar o estado de duplicado
  useEffect(() => {
    if (cpfParaVerificar.replace(/\D/g, '').length === 11) {
      setPacienteDuplicado(pacientePorCpf ?? null);
    } else {
      setPacienteDuplicado(null);
    }
  }, [pacientePorCpf, cpfParaVerificar]);

  const criarPacienteMutation = trpc.pacientes.create.useMutation({
    onSuccess: (data: any) => {
      const pacienteId = formatPacienteIdForSelect(data);
      if (pacienteId === null) {
        setSalvandoPaciente(false);
        toast.error('Paciente salvo, mas o sistema não conseguiu identificar o cadastro criado. Atualize a lista e tente novamente.');
        return;
      }

      utils.pacientes.listParaAgenda.invalidate();
      // Selecionar automaticamente o paciente recém-criado sem depender de
      // toString() em um retorno incompleto do backend.
      setFormData(prev => ({ ...prev, pacienteId }));
      setShowNovoCadastro(false);
      setNovoPaciente({ nome: '', cpf: '', dataNascimento: '', telefone: '', numeroCarteira: '' });
      setSalvandoPaciente(false);
      toast.success('Paciente cadastrado com sucesso!');
    },
    onError: (error: any) => {
      setSalvandoPaciente(false);
      toast.error('Erro ao cadastrar paciente: ' + (error?.message || 'Tente novamente'));
    },
  });

  const handleSalvarNovoPaciente = () => {
    if (!novoPaciente.nome.trim()) { toast.error('Nome do paciente é obrigatório.'); return; }
    const cpfDigitos = novoPaciente.cpf.replace(/\D/g, '');
    if (!cpfDigitos) { toast.error('CPF é obrigatório.'); return; }
    if (cpfDigitos.length !== 11) { toast.error('CPF inválido. Informe os 11 dígitos (ex.: 000.000.000-00).'); return; }
    // Bloquear cadastro se CPF já existe
    if (pacienteDuplicado) {
      toast.error(`CPF já cadastrado para o paciente "${pacienteDuplicado.nome}". Selecione-o na lista acima.`);
      return;
    }
    if (!novoPaciente.dataNascimento) { toast.error('Data de nascimento é obrigatória.'); return; }
    if (!novoPaciente.numeroCarteira.trim()) { toast.error('Número da carteirinha é obrigatório.'); return; }
    const telDigitos = novoPaciente.telefone.replace(/\D/g, '');
    if (telDigitos && (telDigitos.length < 10 || telDigitos.length > 11)) {
      toast.error('Telefone inválido. Informe DDD + número (10 ou 11 dígitos, ex.: (92) 99999-9999).');
      return;
    }
    setSalvandoPaciente(true);
    criarPacienteMutation.mutate({
      nome: novoPaciente.nome.trim(),
      cpf: cpfDigitos,
      dataNascimento: novoPaciente.dataNascimento,
      numeroCarteira: novoPaciente.numeroCarteira.trim(),
      telefone: novoPaciente.telefone.replace(/\D/g, '') || undefined,
      whatsapp: novoPaciente.telefone.replace(/\D/g, '') || undefined,
    } as any);
  };

  const cancelarSerieMutation = trpc.atendimentos.cancelarSerie.useMutation();
  const enviarSmsMutation = trpc.atendimentos.enviarSmsSerie.useMutation();
  const createMutation = trpc.atendimentos.create.useMutation({
    onSuccess: (_data, variables) => {
      // Invalidar cache, marcar que houve agendamento e disparar refetch imediatamente
      utils.atendimentos.list.invalidate();
      const profId = variables?.profissionalId;
      setAgendamentoCriado(true);
      setProfissionalIdCriado(profId);
      // Chamar onSuccess imediatamente para que a Agenda atualize sem esperar o modal fechar
      onSuccess?.(profId);
    },
    onError: (error) => {
      toast.error('Erro ao agendar: ' + (error?.message || 'Tente novamente'));
    }
  });

  useEffect(() => {
    if (selectedSlot) {
      // Buscar a duração padrão do profissional selecionado
      const profId = selectedSlot.profissionalId;
      const profissional = profId ? (profissionais as any[]).find((p: any) => p.id === profId) : null;
      const opcoes = opcoesDuracaoParaProfissional(profissional?.nome);
      const duracaoPadrao = opcoes.includes(Number(profissional?.duracaoPadrao))
        ? String(profissional.duracaoPadrao)
        : String(opcoes[0]);
      setFormData(prev => ({
        ...prev,
        data: format(selectedSlot.date, 'yyyy-MM-dd'),
        horario: selectedSlot.time,
        // Pré-preencher o profissional quando o slot já tem um profissionalId
        profissionalId: profId ? profId.toString() : prev.profissionalId,
        // Pré-preencher a duração padrão do profissional
        duracao: profId ? duracaoPadrao : prev.duracao,
      }));
    }
  }, [selectedSlot, profissionais]);

  // Quando o usuário troca o profissional manualmente, atualizar a duração padrão
  useEffect(() => {
    if (!formData.profissionalId) return;
    const profId = parseInt(formData.profissionalId);
    const profissional = (profissionais as any[]).find((p: any) => p.id === profId);
    const opcoes = opcoesDuracaoParaProfissional(profissional?.nome);
    const duracao = opcoes.includes(Number(profissional?.duracaoPadrao))
      ? String(profissional.duracaoPadrao)
      : String(opcoes[0]);
    setFormData(prev => ({ ...prev, duracao }));
  }, [formData.profissionalId, profissionais]);

  // Limpar procedimento ao trocar convênio
  useEffect(() => {
    setFormData(prev => ({ ...prev, procedimentoConvenioId: '' }));
  }, [formData.convenioId]);

  const verificarAutorizacao = (codigo: string) => {
    if (codigo.length > 5) {
      setAutorizacaoValida(true);
    } else if (codigo.length > 0) {
      setAutorizacaoValida(false);
    } else {
      setAutorizacaoValida(null);
    }
  };

  const resetForm = () => {
    setFormData({
      pacienteId: '',
      profissionalId: '',
      data: '',
      horario: '',
      tipo: '',
      convenioId: '',
      procedimentoConvenioId: '',
      autorizacao: '',
      observacoes: '',
      duracao: '30',
      repetir: false,
      diasSemana: [],
      quantidadeRepeticoes: '1',
      numeroAgendas: '7',
      intervaloDias: '7',
    });
    setAutorizacaoValida(null);
  };

  const profissionalSelecionado = formData.profissionalId
    ? (profissionais as any[]).find((p: any) => p.id === parseInt(formData.profissionalId))
    : null;
  const duracoesDisponiveis = opcoesDuracaoParaProfissional(profissionalSelecionado?.nome);
  const duracaoSelecionada = () => parseInt(formData.duracao) || 30;

  const buildAtendimentoPayload = (dataStr: string, ids: IdentificadoresObrigatoriosAgendamento) => ({
    pacienteId: ids.pacienteId,
    profissionalId: ids.profissionalId,
    convenioId: ids.convenioId,
    data: dataStr,
    hora: formData.horario,
    tipo: formData.tipo,
    descricao: formData.observacoes || undefined,
    status: 'agendado' as const,
    duracao: duracaoSelecionada(),
    procedimentoConvenioId: formData.procedimentoConvenioId
      ? parseInt(formData.procedimentoConvenioId)
      : undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações obrigatórias antes de enviar
    const identificadores = validarIdentificadoresAgendamento(formData);
    if (!identificadores.valido) {
      toast.error(identificadores.mensagem);
      return;
    }
    if (!formData.data) {
      toast.error('Selecione uma data para o agendamento.');
      return;
    }
    if (!formData.horario) {
      toast.error('Selecione um horário para o agendamento.');
      return;
    }
    if (!formData.tipo) {
      toast.error('Selecione o tipo de atendimento.');
      return;
    }

    try {
      if (formData.repetir && serieItems.length > 0) {
        // Modo série: gerar um ID único para toda a série
        const serieId = `serie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSerieIdCriado(serieId);
        setSerieAgendando(true);
        setSerieIniciada(true);
        let criados = 0;
        const erros: string[] = [];
        const updatedItems = [...serieItems];
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          if (!item.agendar || item.status === 'sucesso') {
            updatedItems[i] = { ...item, status: item.agendar ? item.status : 'ignorado' };
            setSerieItems([...updatedItems]);
            continue;
          }
          try {
            const payload = { ...buildAtendimentoPayload(item.data, identificadores.ids), hora: item.hora, serieId };
            const result = await createMutation.mutateAsync(payload);
            updatedItems[i] = { ...item, status: 'sucesso', atendimentoId: (result as any)?.id };
            criados++;
          } catch (erro) {
            const mensagem = erro instanceof Error ? erro.message : 'Não foi possível criar esta sessão.';
            erros.push(mensagem);
            updatedItems[i] = { ...item, status: 'erro', erro: mensagem };
          }
          setSerieItems([...updatedItems]);
        }
        setSerieAgendando(false);
        const pacNome = (pacientes as any[]).find((p: any) => p.id === parseInt(formData.pacienteId))?.nome || '';
        const profNome = (profissionais as any[]).find((p: any) => p.id === parseInt(formData.profissionalId))?.nome || '';
        setSuccessInfo({ pacienteNome: pacNome, data: formData.data, hora: formData.horario, profissionalNome: profNome, quantidade: criados });
        // Não fecha o modal automaticamente — usuário vê os status na tabela
        if (criados === 0) {
          toast.error(`Nenhuma sessão foi criada. ${erros[0] || 'Verifique os dados do agendamento.'}`);
        } else if (erros.length > 0) {
          toast.warning(`${criados} sessão(ões) criada(s), mas ${erros.length} falharam. ${erros[0]}`);
        } else {
          toast.success(`${criados} atendimento(s) agendado(s) com sucesso!`);
        }
      } else {
        await createMutation.mutateAsync(buildAtendimentoPayload(formData.data, identificadores.ids));
        const pacNome = (pacientes as any[]).find((p: any) => p.id === parseInt(formData.pacienteId))?.nome || '';
        const profNome = (profissionais as any[]).find((p: any) => p.id === parseInt(formData.profissionalId))?.nome || '';
        setSuccessInfo({ pacienteNome: pacNome, data: formData.data, hora: formData.horario, profissionalNome: profNome });
        setShowSuccess(true);
        resetForm();
      }
    } catch (error) {
      setSerieAgendando(false);
      toast.error('Erro ao agendar atendimento');
      console.error(error);
    }
  };

  const handleSerieItemChange = (idx: number, field: 'hora' | 'sms' | 'email' | 'agendar', value: string | boolean) => {
    setSerieItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleDiaSemanaChange = (dia: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      diasSemana: checked
        ? [...prev.diasSemana, dia]
        : prev.diasSemana.filter(d => d !== dia)
    }));
  };

  // Procedimento selecionado (para exibir código TUSS)
  const procedimentoSelecionado = procedimentosConvenio.find(
    p => p?.id != null && String(p.id) === formData.procedimentoConvenioId
  );

  // Fechar modal de sucesso
  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSuccessInfo(null);
    // O useEffect acima vai disparar o onSuccess quando isOpen mudar para false
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={showSuccess ? handleCloseSuccess : onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto" style={{ width: '80vw', maxWidth: '80vw' }}>
        {/* Ecrã de sucesso animado */}
        {showSuccess && successInfo && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="w-14 h-14 text-green-500" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <PartyPopper className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">
              {successInfo.quantidade ? `${successInfo.quantidade} sessões agendadas!` : 'Agendamento confirmado!'}
            </h2>
            <p className="text-gray-500 text-sm mb-6">{criarMensagemAgendamentoSucesso(successInfo)}</p>
            <div className="w-full max-w-sm bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100 text-left mb-8">
              <div className="flex items-center gap-3 px-4 py-3">
                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Paciente</p>
                  <p className="text-sm font-semibold text-gray-800">{successInfo.pacienteNome}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Heart className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Profissional</p>
                  <p className="text-sm font-semibold text-gray-800">{successInfo.profissionalNome}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-3">
                <Calendar className="w-4 h-4 text-violet-500 flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Data e hora</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {successInfo.data ? (() => {
                      const [year, month, day] = successInfo.data.split('-');
                      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
                    })() : ''} às {successInfo.hora}
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCloseSuccess}
              className="w-full max-w-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.97]"
            >
              Fechar
            </Button>
          </div>
        )}

        {/* Formulário normal (oculto quando sucesso) */}
        {!showSuccess && (
          <>
            <DialogHeader>
              <DialogTitle>Agendar Consulta</DialogTitle>
            </DialogHeader>
            {!showSuccess && successInfo?.quantidade && successInfo.quantidade > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div>
                  <p className="font-semibold">Agendamento realizado com sucesso!</p>
                  <p className="mt-1 text-sm">{criarMensagemAgendamentoSucesso(successInfo)}</p>
                  <p className="mt-1 text-xs text-green-700">
                    Primeira sessão: {successInfo.data} às {successInfo.hora}
                  </p>
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
          {/* Linha 1: Paciente + Profissional */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="pacienteId">
                <User className="w-4 h-4 inline mr-2" />
                Paciente *
              </Label>
              {/* Seletor de paciente com busca customizado */}
              <div className="relative" ref={pacienteDropdownRef}>
                <button
                  type="button"
                  onClick={() => { setPacienteDropdownOpen(v => !v); setBuscaPaciente(''); }}
                  className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-sm hover:bg-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className={formData.pacienteId ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.pacienteId
                      ? pacientes.find(p => p.id === parseInt(formData.pacienteId))?.nome || 'Selecione o paciente'
                      : 'Selecione o paciente'}
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {pacienteDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                    {/* Campo de busca */}
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Buscar paciente..."
                          value={buscaPaciente}
                          onChange={e => setBuscaPaciente(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                    {/* Lista filtrada */}
                    <div className="max-h-52 overflow-y-auto">
                      {pacientes
                        .filter(p => p.nome.toLowerCase().includes(buscaPaciente.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const convenioIdDoCadastro = (p as any)?.convenioId?.toString() || '';
                              setFormData(prev => ({
                                ...prev,
                                pacienteId: p.id.toString(),
                                convenioId: prev.convenioId || convenioIdDoCadastro,
                                procedimentoConvenioId: '',
                              }));
                              setPacienteDropdownOpen(false);
                              setBuscaPaciente('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                              formData.pacienteId === p.id.toString() ? 'bg-accent font-medium' : ''
                            }`}
                          >
                            {p.nome}
                          </button>
                        ))}
                      {pacientes.filter(p => p.nome.toLowerCase().includes(buscaPaciente.toLowerCase())).length === 0 && (
                        <p className="px-3 py-3 text-sm text-muted-foreground text-center">Nenhum paciente encontrado</p>
                      )}
                    </div>
                    {/* Botão Novo Cadastro dentro do dropdown */}
                    <div className="p-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => { setPacienteDropdownOpen(false); setShowNovoCadastro(true); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded transition-colors font-medium"
                      >
                        <UserPlus className="w-4 h-4" />
                        Novo Cadastro
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Botão Novo Cadastro abaixo do seletor (sempre visível) */}
              <button
                type="button"
                onClick={() => { setPacienteDropdownOpen(false); setShowNovoCadastro(true); }}
                className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium mt-1 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Novo Cadastro
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissionalId">
                <Heart className="w-4 h-4 inline mr-2" />
                Profissional *
              </Label>
              {/* Seletor de profissional com busca customizado */}
              <div className="relative" ref={profissionalDropdownRef}>
                <button
                  type="button"
                  onClick={() => { setProfissionalDropdownOpen(v => !v); setBuscaProfissional(''); }}
                  className="w-full flex items-center justify-between px-3 py-2 border border-input rounded-md bg-background text-sm hover:bg-accent/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <span className={formData.profissionalId ? 'text-foreground' : 'text-muted-foreground'}>
                    {formData.profissionalId
                      ? profissionais.find(p => p.id === parseInt(formData.profissionalId))?.nome || 'Selecione o profissional'
                      : 'Selecione o profissional'}
                  </span>
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {profissionalDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Buscar profissional..."
                          value={buscaProfissional}
                          onChange={e => setBuscaProfissional(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-sm border border-input rounded bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {profissionais
                        .filter(p => p.nome.toLowerCase().includes(buscaProfissional.toLowerCase()))
                        .map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, profissionalId: p.id.toString() }));
                              setProfissionalDropdownOpen(false);
                              setBuscaProfissional('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                              formData.profissionalId === p.id.toString() ? 'bg-accent font-medium' : ''
                            }`}
                          >
                            {p.nome}
                          </button>
                        ))}
                      {profissionais.filter(p => p.nome.toLowerCase().includes(buscaProfissional.toLowerCase())).length === 0 && (
                        <p className="px-3 py-3 text-sm text-muted-foreground text-center">Nenhum profissional encontrado</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Painel inline de Novo Cadastro de Paciente */}
          {showNovoCadastro && (
            <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-semibold text-teal-700">Novo Cadastro de Paciente</span>
                </div>
                <button type="button" onClick={() => setShowNovoCadastro(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome completo *</Label>
                  <Input
                    type="text"
                    placeholder="Nome do paciente"
                    value={novoPaciente.nome}
                    onChange={e => setNovoPaciente(p => ({ ...p, nome: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">CPF *</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="000.000.000-00"
                      value={novoPaciente.cpf}
                      onChange={e => {
                        const val = e.target.value;
                        setNovoPaciente(p => ({ ...p, cpf: val }));
                        const digitos = val.replace(/\D/g, '');
                        if (digitos.length === 11) setCpfParaVerificar(digitos);
                        else { setCpfParaVerificar(''); setPacienteDuplicado(null); }
                      }}
                      className={`h-8 text-sm pr-7 ${pacienteDuplicado ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                    />
                    {buscandoCpf && <span className="absolute right-2 top-1.5 text-[10px] text-gray-400">...</span>}
                    {!buscandoCpf && pacienteDuplicado && <span className="absolute right-2 top-1.5 text-red-500">&#x26A0;</span>}
                    {!buscandoCpf && cpfParaVerificar && !pacienteDuplicado && <span className="absolute right-2 top-1.5 text-green-500 text-xs">✓</span>}
                  </div>
                  {pacienteDuplicado && (
                    <div className="mt-1 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <p className="font-semibold mb-1">⚠️ CPF já cadastrado</p>
                      <p className="mb-1">Paciente: <strong>{pacienteDuplicado.nome}</strong></p>
                      <button
                        type="button"
                        className="mt-1 w-full text-center text-xs font-semibold text-teal-700 underline hover:text-teal-900"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, pacienteId: pacienteDuplicado.id.toString() }));
                          setShowNovoCadastro(false);
                          setNovoPaciente({ nome: '', cpf: '', dataNascimento: '', telefone: '', numeroCarteira: '' });
                          setCpfParaVerificar('');
                          setPacienteDuplicado(null);
                          toast.success(`Paciente "${pacienteDuplicado.nome}" selecionado.`);
                        }}
                      >
                        Usar este paciente
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Data de nascimento *</Label>
                  <Input
                    type="date"
                    value={novoPaciente.dataNascimento}
                    onChange={e => setNovoPaciente(p => ({ ...p, dataNascimento: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Nº Carteirinha *</Label>
                  <Input
                    type="text"
                    placeholder="Número da carteirinha"
                    value={novoPaciente.numeroCarteira}
                    onChange={e => setNovoPaciente(p => ({ ...p, numeroCarteira: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Telefone / WhatsApp</Label>
                  <Input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={novoPaciente.telefone}
                    onChange={e => setNovoPaciente(p => ({ ...p, telefone: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNovoCadastro(false)} disabled={salvandoPaciente}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleSalvarNovoPaciente} disabled={salvandoPaciente} className="bg-teal-600 hover:bg-teal-700 text-white">
                  {salvandoPaciente ? 'Salvando...' : 'Salvar Paciente'}
                </Button>
              </div>
            </div>
          )}

          {/* Linha 2: Data + Horário + Duração + Tipo de Atendimento */}
          <div className="grid grid-cols-4 gap-5">
            <div className="space-y-2">
              <Label htmlFor="data">
                <Calendar className="w-4 h-4 inline mr-2" />
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="horario">
                <Clock className="w-4 h-4 inline mr-2" />
                Horário *
              </Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">
                <Clock className="w-4 h-4 inline mr-2" />
                Duração
              </Label>
              <Select value={formData.duracao} onValueChange={(value) => setFormData({ ...formData, duracao: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {duracoesDisponiveis.map(duracao => (
                    <SelectItem key={duracao} value={String(duracao)}>{duracao === 60 ? '1 hora' : `${duracao} min`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {profissionalRecebeDuasUnidadesPorHora(profissionalSelecionado?.nome) && (
                <p className="text-xs text-blue-700">1 hora registra 2 unidades de repasse; 30 min registra 1 unidade.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Atendimento *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ATENDIMENTO_DISPONIVEIS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 3: Convênio + Procedimento TUSS */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="convenioId">Convênio *</Label>
              <Select
                value={formData.convenioId}
                onValueChange={(value) => setFormData({ ...formData, convenioId: value, procedimentoConvenioId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o convênio" />
                </SelectTrigger>
                <SelectContent>
                  {convenios.filter(c => c?.id != null).map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seletor de procedimento TUSS — carregado dinamicamente pelo convênio */}
            <div className="space-y-2">
              <Label htmlFor="procedimentoConvenioId">
                <Stethoscope className="w-4 h-4 inline mr-2" />
                Procedimento TUSS
                {formData.convenioId && procedimentosConvenio.length === 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">(nenhum procedimento cadastrado para este convênio)</span>
                )}
              </Label>
              <Select
                value={formData.procedimentoConvenioId}
                onValueChange={(value) => setFormData({ ...formData, procedimentoConvenioId: value })}
                disabled={!formData.convenioId || procedimentosConvenio.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.convenioId
                      ? 'Selecione o convênio primeiro'
                      : procedimentosConvenio.length === 0
                        ? 'Sem procedimentos cadastrados'
                        : 'Selecione o procedimento'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {procedimentosConvenio.filter(p => p?.id != null).map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.codigoConvenio || p.codigoANS} — {p.descricaoConvenio || p.descricaoANS || p.codigoConvenio}
                      {p.valor && ` (R$ ${Number(p.valor).toFixed(2)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {procedimentoSelecionado && (
                <p className="text-xs text-muted-foreground mt-1">
                  Código TUSS: <strong>{procedimentoSelecionado.codigoANS}</strong>
                  {procedimentoSelecionado.codigoConvenio && procedimentoSelecionado.codigoConvenio !== procedimentoSelecionado.codigoANS && (
                    <> · Código convênio: <strong>{procedimentoSelecionado.codigoConvenio}</strong></>
                  )}
                  {procedimentoSelecionado.valor && (
                    <> · Valor: <strong>R$ {Number(procedimentoSelecionado.valor).toFixed(2)}</strong></>
                  )}
                </p>
              )}
            </div>

          </div>

          {/* Linha 4: Autorização (largura total) */}
          <div className="space-y-2">
              <Label htmlFor="autorizacao">Autorização</Label>
              <Input
                id="autorizacao"
                placeholder="Número da autorização"
                value={formData.autorizacao}
                onChange={(e) => {
                  setFormData({ ...formData, autorizacao: e.target.value });
                  verificarAutorizacao(e.target.value);
                }}
              />
              {autorizacaoValida !== null && (
                <div className={`text-sm flex items-center gap-2 ${autorizacaoValida ? 'text-green-600' : 'text-red-600'}`}>
                  <AlertCircle className="w-4 h-4" />
                  {autorizacaoValida ? 'Autorização válida' : 'Autorização inválida'}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">
              <FileText className="w-4 h-4 inline mr-2" />
              Observações
            </Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Seção de Repetição em Série */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="repetir"
                checked={formData.repetir}
                onCheckedChange={(checked) => {
                  const val = checked as boolean;
                  setFormData({ ...formData, repetir: val });
                  if (val) setTimeout(gerarSerieItems, 0);
                  else { setSerieItems([]); setSerieIniciada(false); }
                }}
              />
              <Label htmlFor="repetir" className="cursor-pointer font-semibold text-base">Repetir atendimento em série</Label>
            </div>

            {formData.repetir && (
              <div className="space-y-5">

                {/* Agenda de Referência */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Agenda de Referência</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Data</Label>
                      <Input
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Hora</Label>
                      <Input
                        type="time"
                        value={formData.horario}
                        onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Grupo de Procedimento</Label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        className="w-full h-9 px-3 border border-input rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Selecione...</option>
                        {TIPOS_ATENDIMENTO_DISPONIVEIS.map((tipo) => (
                          <option key={tipo} value={tipo}>{ROTULOS_PROCEDIMENTO_POR_TIPO[tipo]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Intervalo */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-base font-bold text-gray-800 mb-3">Intervalo</h3>
                  <div className="flex items-end gap-3">
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs text-gray-500">Número de Agendas</Label>
                      <Input
                        type="number"
                        min="1"
                        max="52"
                        value={formData.numeroAgendas}
                        onChange={(e) => setFormData({ ...formData, numeroAgendas: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label className="text-xs text-gray-500">Intervalo em Dias</Label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={formData.intervaloDias}
                        onChange={(e) => setFormData({ ...formData, intervaloDias: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={gerarSerieItems}
                      className="bg-[#4a2d7c] hover:bg-[#3a2060] text-white px-4 h-9"
                      title="Recalcular datas"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tabela de Datas de Agendamento em Série */}
                {serieItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                      <h3 className="text-base font-bold text-gray-800">Datas de Agendamento em Série</h3>
                      <div className="flex gap-2">
                        {serieIniciada && serieIdCriado && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50 text-xs"
                            onClick={async () => {
                              if (!confirm('Cancelar todos os atendimentos futuros desta série?')) return;
                              const hoje = getHojeBrasilia();
                              const result = await cancelarSerieMutation.mutateAsync({ serieId: serieIdCriado, apenasAPartirDe: hoje });
                              utils.atendimentos.list.invalidate();
                              toast.success(`${result.cancelados} atendimento(s) cancelado(s)`);
                            }}
                            disabled={cancelarSerieMutation.isPending}
                          >
                            ❌ Cancelar Série
                          </Button>
                        )}
                        {serieIniciada && serieItems.some(i => i.status === 'sucesso' && i.sms) && (
                          <Button
                            type="button"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            onClick={async () => {
                              setSmsEnviando(true);
                              const ids = serieItems.filter(i => i.status === 'sucesso' && i.sms && i.atendimentoId).map(i => i.atendimentoId!);
                              if (ids.length === 0) { toast.error('Nenhum atendimento com SMS marcado'); setSmsEnviando(false); return; }
                              const result = await enviarSmsMutation.mutateAsync({ atendimentoIds: ids });
                              const enviados = result.resultados.filter(r => r.enviado).length;
                              const falhas = result.resultados.filter(r => !r.enviado).length;
                              setSmsEnviando(false);
                              if (falhas > 0) toast.warning(`${enviados} SMS enviados, ${falhas} falha(s)`);
                              else toast.success(`${enviados} SMS enviados com sucesso!`);
                            }}
                            disabled={smsEnviando}
                          >
                            {smsEnviando ? 'Enviando...' : '📱 Enviar SMS'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#4a2d7c] text-white">
                            <th className="px-4 py-2 text-left font-semibold">Data</th>
                            <th className="px-4 py-2 text-center font-semibold">Hora</th>
                            <th className="px-4 py-2 text-center font-semibold">SMS</th>
                            <th className="px-4 py-2 text-center font-semibold">e-mail</th>
                            <th className="px-4 py-2 text-center font-semibold">Agendar</th>
                            <th className="px-4 py-2 text-center font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {serieItems.map((item, idx) => {
                            const dt = parseISO(item.data);
                            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                            const nomeDia = diasSemana[dt.getDay()];
                            const dataFormatada = format(dt, 'dd/MM/yyyy');
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-2 font-medium text-gray-800">
                                  {dataFormatada} <span className="text-xs text-gray-500 ml-1">[{nomeDia}]</span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="time"
                                    value={item.hora}
                                    onChange={(e) => handleSerieItemChange(idx, 'hora', e.target.value)}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-24 text-center focus:outline-none focus:ring-1 focus:ring-[#4a2d7c]"
                                    disabled={item.status === 'sucesso'}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.sms}
                                    onChange={(e) => handleSerieItemChange(idx, 'sms', e.target.checked)}
                                    className="w-4 h-4 accent-[#4a2d7c] cursor-pointer"
                                    disabled={item.status === 'sucesso'}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.email}
                                    onChange={(e) => handleSerieItemChange(idx, 'email', e.target.checked)}
                                    className="w-4 h-4 accent-[#4a2d7c] cursor-pointer"
                                    disabled={item.status === 'sucesso'}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={item.agendar}
                                    onChange={(e) => handleSerieItemChange(idx, 'agendar', e.target.checked)}
                                    className="w-4 h-4 accent-[#4a2d7c] cursor-pointer"
                                    disabled={item.status === 'sucesso'}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  {item.status === 'sucesso' && (
                                    <span className="text-[#4a2d7c] font-bold text-xs tracking-wide">SUCESSO</span>
                                  )}
                                  {item.status === 'erro' && (
                                    <span className="text-red-600 font-bold text-xs">ERRO</span>
                                  )}
                                  {item.status === 'ignorado' && (
                                    <span className="text-gray-400 text-xs">ignorado</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {serieItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">Clique em <RefreshCw className="w-3 h-3 inline" /> para gerar as datas de agendamento em série.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createMutation.isPending || serieAgendando}
            >
              {serieAgendando
                ? `Agendando ${serieItems.filter(i => i.status === 'sucesso').length}/${serieItems.filter(i => i.agendar).length}...`
                : formData.repetir && serieItems.length > 0
                  ? `Agendar ${serieItems.filter(i => i.agendar).length} sessões`
                  : createMutation.isPending ? 'Agendando...' : 'Agendar'}
            </Button>
          </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
