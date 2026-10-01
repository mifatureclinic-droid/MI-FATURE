import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { trpc } from '../lib/trpc';
import { formatDateBR } from '../lib/utils';
import { toast } from 'sonner';
import { useAuth } from '../_core/hooks/useAuth';
import { ContratoA4 } from './ContratoA4';
import { AnexosPaciente } from './AnexosPaciente';
import { podeGerirPastaPaciente } from '@shared/permissoesPastaPaciente';
import {
  FolderOpen, User, ClipboardList, FileText, Phone, Mail, MapPin,
  MessageCircle, Copy, CheckCircle, AlertTriangle, Loader2,
  Pencil, Save, X
  , Send
} from 'lucide-react';

interface PastaPacienteProps {
  paciente: {
    id: number;
    nome: string;
    cpf: string;
    dataNascimento: string | Date;
    email?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
    cartaoSUS?: string | null;
    pedidoMedicoUrl?: string | null;
    dataVencimentoPedido?: string | Date | null;
  };
  open: boolean;
  onClose: () => void;
}

type Aba = 'ficha' | 'anamnese' | 'contrato' | 'anexos';

export function PastaPaciente({ paciente, open, onClose }: PastaPacienteProps) {
  const { user } = useAuth();
  const perfil = (user as any)?.perfil as string | undefined;
  const podeGerirDocumentos = podeGerirPastaPaciente(user as any);

  const [aba, setAba] = useState<Aba>('ficha');
  const [copiadoTelefone, setCopiadoTelefone] = useState(false);
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  // ─── Anamnese ────────────────────────────────────────────────────────────────
  const { data: anamnese, refetch: refetchAnamnese, isLoading: loadingAnamnese } =
    trpc.anamnese.get.useQuery(
      { pacienteId: paciente.id },
      { enabled: open && aba === 'anamnese' && podeGerirDocumentos }
    );
  const [editandoAnamnese, setEditandoAnamnese] = useState(false);
  const [anamneseForm, setAnamneseForm] = useState({
    queixaPrincipal: '',
    historiaDoenca: '',
    historiaFamiliar: '',
    historiaSocial: '',
    antecedentesPatologicos: '',
    medicamentosEmUso: '',
    alergias: '',
    cirurgiasAnteriores: '',
    habitos: '',
    observacoes: '',
  });

  const saveAnamneseMutation = trpc.anamnese.save.useMutation({
    onSuccess: () => {
      toast.success('Anamnese salva com sucesso');
      setEditandoAnamnese(false);
      refetchAnamnese();
    },
    onError: (e) => toast.error('Erro ao salvar anamnese: ' + e.message),
  });

  const enviarLinkAnamneseMutation = trpc.anamnese.enviarLinkWhatsapp.useMutation({
    onSuccess: (data) => {
      if (data.success) toast.success('Link de preenchimento da anamnese enviado pelo WhatsApp');
      else toast.error('Não foi possível enviar o link da anamnese pelo WhatsApp');
    },
    onError: (e) => toast.error('Erro ao enviar anamnese: ' + e.message),
  });

  const iniciarEdicaoAnamnese = () => {
    setAnamneseForm({
      queixaPrincipal: anamnese?.queixaPrincipal || '',
      historiaDoenca: anamnese?.historiaDoenca || '',
      historiaFamiliar: anamnese?.historiaFamiliar || '',
      historiaSocial: anamnese?.historiaSocial || '',
      antecedentesPatologicos: anamnese?.antecedentesPatologicos || '',
      medicamentosEmUso: anamnese?.medicamentosEmUso || '',
      alergias: anamnese?.alergias || '',
      cirurgiasAnteriores: anamnese?.cirurgiasAnteriores || '',
      habitos: anamnese?.habitos || '',
      observacoes: anamnese?.observacoes || '',
    });
    setEditandoAnamnese(true);
  };

  // ─── Contrato Terapêutico ─────────────────────────────────────────────────────
  const { data: contratos = [], refetch: refetchContratos, isLoading: loadingContratos } =
    trpc.contratos.list.useQuery(
      { pacienteId: paciente.id },
      { enabled: open && aba === 'contrato' && podeGerirDocumentos }
    );
  const [contratoSelecionado, setContratoSelecionado] = useState<any>(null);
  const [criandoContrato, setCriandoContrato] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [assinadoCanvas, setAssinadoCanvas] = useState(false);

  const createContratoMutation = trpc.contratos.create.useMutation({
    onSuccess: (data) => {
      toast.success('Contrato criado com sucesso');
      setCriandoContrato(false);
      refetchContratos();
      setContratoSelecionado(data);
    },
    onError: (e) => toast.error('Erro ao criar contrato: ' + e.message),
  });

  const updateContratoMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success('Contrato actualizado');
      refetchContratos();
    },
    onError: (e) => toast.error('Erro ao actualizar contrato: ' + e.message),
  });

  const exportarPDFMutation = trpc.contratos.exportarPDF.useMutation({
    onSuccess: (data) => {
      const bytes = Uint8Array.from(atob(data.base64), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF exportado com sucesso');
    },
    onError: (e) => toast.error('Erro ao exportar PDF: ' + e.message),
  });

  // Gerar conteúdo padrão do contrato
  const gerarConteudoContrato = () => {
    const hoje = formatDateBR(new Date().toISOString().split('T')[0]);
    return `CONTRATO TERAPÊUTICO

Este Contrato Terapêutico é celebrado entre:

PACIENTE:
Nome: ${paciente.nome}
CPF: ${paciente.cpf}

Data: ${hoje}

CLÁUSULAS E CONDIÇÕES:

1. OBJETIVO DO TRATAMENTO
O presente contrato estabelece os termos e condições para o atendimento terapêutico, conforme legislação vigente e normas dos conselhos profissionais.

2. DIREITOS E DEVERES DO PACIENTE
- Comparecer pontualmente aos atendimentos agendados
- Comunicar com antecedência em caso de impossibilidade de comparecer
- Fornecer informações precisas sobre seu histórico de saúde
- Seguir as orientações do profissional
- Manter sigilo sobre informações compartilhadas

3. DIREITOS E DEVERES DO PROFISSIONAL
- Respeitar o sigilo profissional conforme legislação vigente
- Manter atualização profissional contínua
- Fornecer atendimento de qualidade
- Informar sobre o processo terapêutico
- Manter registros adequados (prontuário)

4. CONFIDENCIALIDADE E SIGILO PROFISSIONAL
Todas as informações compartilhadas durante o atendimento são confidenciais, conforme Lei Geral de Proteção de Dados (LGPD) e normas dos conselhos profissionais.

5. RESPONSABILIDADES
O paciente é responsável por informar mudanças em seu estado de saúde, comunicar desconfortos ou dúvidas, e seguir as recomendações profissionais.

O profissional é responsável por manter sigilo profissional, documentar adequadamente o atendimento e respeitar a autonomia do paciente.

6. CANCELAMENTO E REMARCAÇÃO
Cancelamentos devem ser comunicados com 24 horas de antecedência. Faltas sem aviso prévio podem resultar em cobrança.

7. CONSENTIMENTO INFORMADO
O paciente declara estar ciente dos objetivos do tratamento, possíveis benefícios e limitações, direito de interromper o tratamento a qualquer momento e direito de buscar segunda opinião.

8. CONFORMIDADE LEGAL
Este contrato segue as normas estabelecidas por:
- Conselho Federal de Psicologia (CFP) - Resolução CFP nº 006/2019
- Conselho Regional de Educação Física (CREF) - Resolução CONFEF nº 229/2012
- Conselho Regional de Medicina (CRM) - Código de Ética Médica
- Lei Geral de Proteção de Dados (LGPD) - Lei nº 13.709/2018

9. VIGÊNCIA
Este contrato entra em vigor a partir da data de assinatura e permanece válido enquanto o paciente estiver em atendimento.

10. DISPOSIÇÕES FINAIS
Qualquer alteração neste contrato deve ser acordada por escrito entre as partes.

---
ASSINATURA DO PACIENTE: _____________________________
Data: ${hoje}

Este documento foi gerado digitalmente pelo Sistema MIFATURE e possui validade legal conforme legislação vigente.`;
  };

  // ─── WhatsApp ────────────────────────────────────────────────────────────────
  const abrirWhatsApp = (numero: string | null | undefined, mensagem?: string) => {
    if (!numero) return;
    const n = numero.replace(/\D/g, '');
    const text = mensagem ? encodeURIComponent(mensagem) : '';
    window.open(`https://wa.me/55${n}${text ? `?text=${text}` : ''}`, '_blank');
  };

  const copiarNumero = (numero: string | null | undefined, tipo: 'telefone' | 'whatsapp') => {
    if (!numero) return;
    navigator.clipboard.writeText(numero).then(() => {
      if (tipo === 'telefone') {
        setCopiadoTelefone(true);
        setTimeout(() => setCopiadoTelefone(false), 2000);
      } else {
        setCopiadoWhatsapp(true);
        setTimeout(() => setCopiadoWhatsapp(false), 2000);
      }
      toast.success('Número copiado!');
    });
  };

  const enviarContratoWhatsApp = (contrato: any) => {
    const whatsapp = paciente.whatsapp || paciente.telefone;
    if (!whatsapp) {
      toast.error('Paciente não tem WhatsApp cadastrado');
      return;
    }
    const mensagem = `Olá ${paciente.nome}! Segue o seu Contrato Terapêutico do Sistema MIFATURE para leitura e assinatura. Por favor, confirme o recebimento respondendo esta mensagem.`;
    abrirWhatsApp(whatsapp, mensagem);
    if (contrato?.id) {
      updateContratoMutation.mutate({ id: contrato.id, assinado: 0 });
    }
    toast.success('WhatsApp aberto para envio do contrato');
  };

  // ─── Canvas de assinatura ─────────────────────────────────────────────────────
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
    ctx.strokeStyle = '#1e40af';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setAssinadoCanvas(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const limparAssinatura = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setAssinadoCanvas(false);
  };

  const confirmarAssinatura = (contratoId: number) => {
    if (!canvasRef.current || !assinadoCanvas) {
      toast.error('Por favor, assine antes de confirmar');
      return;
    }
    const assinaturaBase64 = canvasRef.current.toDataURL('image/png');
    updateContratoMutation.mutate({
      id: contratoId,
      assinado: 1,
      dataAssinatura: new Date(),
    });
    toast.success('Contrato assinado com sucesso!');
    limparAssinatura();
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  const abas: { id: Aba; label: string; icon: React.ReactNode; restrito?: boolean }[] = [
    { id: 'ficha', label: 'Ficha Cadastral', icon: <User className="w-4 h-4" /> },
    { id: 'anexos', label: 'Anexos', icon: <FileText className="w-4 h-4" />, restrito: true },
    { id: 'anamnese', label: 'Anamnese', icon: <ClipboardList className="w-4 h-4" />, restrito: true },
    { id: 'contrato', label: 'Contrato Terapêutico', icon: <FileText className="w-4 h-4" />, restrito: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            Pasta do Paciente — {paciente.nome}
          </DialogTitle>
        </DialogHeader>

        {/* Abas */}
        <div className="flex border-b flex-shrink-0">
          {abas.map((a) => {
            if (a.restrito && !podeGerirDocumentos) return null;
            return (
              <button
                key={a.id}
                onClick={() => setAba(a.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  aba === a.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {a.icon}
                {a.label}
              </button>
            );
          })}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ─── Ficha Cadastral ─── */}
          {aba === 'ficha' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Nome Completo</Label>
                  <p className="font-medium">{paciente.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">CPF</Label>
                  <p className="font-medium">{paciente.cpf}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Data de Nascimento</Label>
                  <p className="font-medium">
                    {formatDateBR(paciente.dataNascimento as string)}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Cartão SUS</Label>
                  <p className="font-medium">{paciente.cartaoSUS || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">E-mail</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="font-medium">{paciente.email || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Telefone com botões WhatsApp */}
              <div className="border rounded-lg p-3 bg-gray-50 space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Phone className="w-4 h-4" /> Contactos
                </h4>
                {paciente.telefone && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-gray-500">Telefone</Label>
                      <p className="font-medium">{paciente.telefone}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copiarNumero(paciente.telefone, 'telefone')}
                        title="Copiar número"
                      >
                        {copiadoTelefone ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => abrirWhatsApp(paciente.telefone)}
                        title="Abrir no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
                {paciente.whatsapp && paciente.whatsapp !== paciente.telefone && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs text-gray-500">WhatsApp</Label>
                      <p className="font-medium">{paciente.whatsapp}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copiarNumero(paciente.whatsapp, 'whatsapp')}
                        title="Copiar número"
                      >
                        {copiadoWhatsapp ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => abrirWhatsApp(paciente.whatsapp)}
                        title="Abrir no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                )}
                {!paciente.telefone && !paciente.whatsapp && (
                  <p className="text-sm text-gray-400">Nenhum contacto cadastrado</p>
                )}
              </div>

              {/* Endereço */}
              {(paciente.endereco || paciente.cidade) && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-2">
                    <MapPin className="w-4 h-4" /> Endereço
                  </h4>
                  <p className="text-sm">{paciente.endereco}</p>
                  <p className="text-sm text-gray-600">
                    {[paciente.cidade, paciente.estado, paciente.cep].filter(Boolean).join(' — ')}
                  </p>
                </div>
              )}

              {/* Pedido Médico */}
              {paciente.dataVencimentoPedido && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Pedido Médico</h4>
                  <p className={`text-sm font-medium ${
                    new Date(String(paciente.dataVencimentoPedido).split('T')[0]) < new Date(new Date().toISOString().split('T')[0])
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {new Date(String(paciente.dataVencimentoPedido).split('T')[0]) < new Date(new Date().toISOString().split('T')[0])
                      ? '⚠ Vencido em '
                      : 'Vence em '}
                    {formatDateBR(paciente.dataVencimentoPedido as string)}
                  </p>
                  {paciente.pedidoMedicoUrl && (
                    <a
                      href={paciente.pedidoMedicoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline mt-1 block"
                    >
                      Ver pedido médico
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── Anexos ─── */}
          {aba === 'anexos' && podeGerirDocumentos && (
            <AnexosPaciente pacienteId={paciente.id} />
          )}

          {/* ─── Anamnese ─── */}
          {aba === 'anamnese' && podeGerirDocumentos && (
            <div>
              {loadingAnamnese ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : editandoAnamnese ? (
                <div className="space-y-3">
                  {[
                    { key: 'queixaPrincipal', label: 'Queixa Principal' },
                    { key: 'historiaDoenca', label: 'História da Doença Actual' },
                    { key: 'historiaFamiliar', label: 'História Familiar' },
                    { key: 'historiaSocial', label: 'História Social' },
                    { key: 'antecedentesPatologicos', label: 'Antecedentes Patológicos' },
                    { key: 'medicamentosEmUso', label: 'Medicamentos em Uso' },
                    { key: 'alergias', label: 'Alergias' },
                    { key: 'cirurgiasAnteriores', label: 'Cirurgias Anteriores' },
                    { key: 'habitos', label: 'Hábitos de Vida' },
                    { key: 'observacoes', label: 'Observações' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label className="text-xs text-gray-600">{label}</Label>
                      <Textarea
                        rows={2}
                        value={(anamneseForm as any)[key]}
                        onChange={(e) => setAnamneseForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={`${label}...`}
                        className="mt-1 text-sm"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => saveAnamneseMutation.mutate({ pacienteId: paciente.id, ...anamneseForm })}
                      disabled={saveAnamneseMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {saveAnamneseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                      Salvar Anamnese
                    </Button>
                    <Button variant="outline" onClick={() => setEditandoAnamnese(false)}>
                      <X className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                </div>
              ) : anamnese ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Última actualização: {formatDateBR(anamnese.updatedAt as unknown as string)}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => enviarLinkAnamneseMutation.mutate({ pacienteId: paciente.id })}
                        disabled={enviarLinkAnamneseMutation.isPending}
                      >
                        {enviarLinkAnamneseMutation.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                          : <Send className="w-3.5 h-3.5 mr-1" />}
                        Enviar link da Anamnese
                      </Button>
                      <Button size="sm" variant="outline" onClick={iniciarEdicaoAnamnese}>
                        <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                      </Button>
                    </div>
                  </div>
                  {[
                    { key: 'queixaPrincipal', label: 'Queixa Principal' },
                    { key: 'historiaDoenca', label: 'História da Doença Actual' },
                    { key: 'historiaFamiliar', label: 'História Familiar' },
                    { key: 'historiaSocial', label: 'História Social' },
                    { key: 'antecedentesPatologicos', label: 'Antecedentes Patológicos' },
                    { key: 'medicamentosEmUso', label: 'Medicamentos em Uso' },
                    { key: 'alergias', label: 'Alergias' },
                    { key: 'cirurgiasAnteriores', label: 'Cirurgias Anteriores' },
                    { key: 'habitos', label: 'Hábitos de Vida' },
                    { key: 'observacoes', label: 'Observações' },
                  ].map(({ key, label }) => (
                    (anamnese as any)[key] ? (
                      <div key={key} className="border rounded p-3 bg-gray-50">
                        <Label className="text-xs text-gray-500">{label}</Label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{(anamnese as any)[key]}</p>
                      </div>
                    ) : null
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 mb-4">Nenhuma anamnese registada para este paciente</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      onClick={() => enviarLinkAnamneseMutation.mutate({ pacienteId: paciente.id })}
                      disabled={enviarLinkAnamneseMutation.isPending}
                    >
                      {enviarLinkAnamneseMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        : <Send className="w-4 h-4 mr-1" />}
                      Enviar link pelo WhatsApp
                    </Button>
                    <Button onClick={iniciarEdicaoAnamnese} className="bg-blue-600 hover:bg-blue-700">
                      <Pencil className="w-4 h-4 mr-1" /> Preencher na clínica
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Contrato Terapêutico ─── */}
          {aba === 'contrato' && podeGerirDocumentos && (
            <div>
              {loadingContratos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : contratoSelecionado ? (
                /* Visualizar contrato em formato A4 */
                <div className="space-y-3">
                  <Button variant="outline" size="sm" onClick={() => setContratoSelecionado(null)}>
                    ← Voltar à lista
                  </Button>
                  <ContratoA4
                    contrato={contratoSelecionado}
                    paciente={paciente}
                    onAssinado={() => {
                      refetchContratos();
                      setContratoSelecionado((prev: any) => prev ? { ...prev, assinado: 1, dataAssinatura: new Date() } : prev);
                    }}
                  />
                </div>
              ) : (
                /* Lista de contratos */
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-gray-700">Contratos Terapêuticos</h4>
                    {podeGerirDocumentos && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                          createContratoMutation.mutate({
                            pacienteId: paciente.id,
                            conteudo: gerarConteudoContrato(),
                          });
                        }}
                        disabled={createContratoMutation.isPending}
                      >
                        {createContratoMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                          : <FileText className="w-4 h-4 mr-1" />}
                        Novo Contrato
                      </Button>
                    )}
                  </div>

                  {(contratos as any[]).length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 mb-4">Nenhum contrato criado ainda</p>
                      <p className="text-xs text-gray-400">Clique em "Novo Contrato" para gerar o contrato terapêutico padrão</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {(contratos as any[]).map((c: any) => (
                        <div
                          key={c.id}
                          className={`border rounded-lg p-3 cursor-pointer flex items-center justify-between transition-colors ${
                            c.assinado
                              ? 'border-green-200 bg-green-50 hover:bg-green-100'
                              : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
                          }`}
                          onClick={() => setContratoSelecionado(c)}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-gray-800">
                              Contrato Terapêutico #{c.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              Criado em {formatDateBR(c.createdAt as string)}
                            </p>
                            {c.assinado && c.dataAssinatura && (
                              <p className="text-xs text-green-700 font-medium">
                                Assinado em {formatDateBR(c.dataAssinatura as string)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {c.assinado ? (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" /> Assinado
                              </span>
                            ) : (
                              <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" /> Aguardando Assinatura
                              </span>
                            )}
                            <span className="text-xs text-gray-400">Clique para visualizar</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
