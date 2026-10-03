import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, UserPlus, Upload, FolderOpen, MessageCircle, Trash2 } from 'lucide-react';
import { FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LoadingButton } from '../components/LoadingButton';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { trpc } from '../lib/trpc';
import { formatDateBR } from '../lib/utils';
import { toast } from 'sonner';
import { formatarDataParaInput, normalizarPedidoMedicoOpcional } from '@shared/pedidoMedicoOpcional';
import { filtrarPacientesDaRecepcao } from '@shared/pacientesRecepcao';
import { podeExcluirPaciente } from '@shared/acoesPorPerfil';

// Componente de Histórico de Guias por Série
function HistoricoGuiasPaciente({ paciente, onClose }: { paciente: any; onClose: () => void }) {
  const { data: guias = [], isLoading } = trpc.guias.getHistoricoGuiasPaciente.useQuery(
    { pacienteId: paciente.id },
    { enabled: !!paciente.id }
  );

  // Agrupar guias por serieId (ou por guia individual se não tiver série)
  const grupos = guias.reduce((acc: any, g: any) => {
    const chave = g.serieId || `guia-${g.id}`;
    if (!acc[chave]) acc[chave] = { serieId: g.serieId, serieNumero: g.serieNumero, guias: [] };
    acc[chave].guias.push(g);
    return acc;
  }, {} as Record<string, { serieId: string | null; serieNumero: number | null; guias: any[] }>);

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      rascunho: 'bg-gray-100 text-gray-700',
      emitida: 'bg-blue-100 text-blue-700',
      enviada: 'bg-yellow-100 text-yellow-700',
      processada: 'bg-purple-100 text-purple-700',
      paga: 'bg-green-100 text-green-700',
      glosa: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Histórico de Guias — {paciente.nome}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">Carregando...</div>
        ) : guias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <FileText className="w-10 h-10 mb-2 opacity-30" />
            <p>Nenhuma guia encontrada para este paciente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(grupos).map((grupo: any, idx: number) => (
              <div key={idx} className="border rounded-lg overflow-hidden">
                <div className={`px-4 py-2 flex items-center gap-2 ${grupo.serieId ? 'bg-purple-50 border-b border-purple-200' : 'bg-gray-50 border-b border-gray-200'}`}>
                  {grupo.serieId ? (
                    <>
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      <span className="font-semibold text-purple-800 text-sm">Série {grupo.serieNumero ?? idx + 1}</span>
                      <span className="text-purple-500 text-xs ml-1">({grupo.guias.length} guia{grupo.guias.length > 1 ? 's' : ''})</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700 text-sm">Guia Avulsa</span>
                    </>
                  )}
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="px-3 py-2 text-left">Nº Guia</th>
                      <th className="px-3 py-2 text-left">Procedimento</th>
                      <th className="px-3 py-2 text-left">Profissional</th>
                      <th className="px-3 py-2 text-left">Convênio</th>
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Valor</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {grupo.guias.map((g: any) => (
                      <tr key={g.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{g.numeroGuiaInterno || g.numeroGuia}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[150px] truncate" title={g.procedimento}>{g.procedimento}</td>
                        <td className="px-3 py-2 text-gray-600">{g.nomeProfissional}</td>
                        <td className="px-3 py-2 text-gray-600">{g.nomeConvenio}</td>
                        <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDateBR(g.dataEmissao)}</td>
                        <td className="px-3 py-2 font-semibold text-green-700">
                          {(() => {
                            const v = parseFloat(String(g.valorTotalGeral || g.valor || '0'));
                            return v > 0 ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(g.status)}`}>{g.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { CSVUploadPacientes } from '../components/CSVUploadPacientes';
import { PastaPaciente } from '../components/PastaPaciente';

interface PacientesProps {
  onNavigate?: (page: string) => void;
}

export function Pacientes({ onNavigate }: PacientesProps = {}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pastaPaciente, setPastaPaciente] = useState<(typeof pacientes)[0] | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    recebeLembretesWhatsapp: true,
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    cartaoSUS: '',
    convenioId: '' as string,
    numeroCarteira: '',
    validadeCarteira: '',
    pedidoMedicoUrl: '',
    dataVencimentoPedido: '',
    anexoUrl: '',
  });

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pacienteHistoricoGuias, setPacienteHistoricoGuias] = useState<any | null>(null);
  const [confirmDeleteNome, setConfirmDeleteNome] = useState('');

  const { data: pacientes = [], refetch } = trpc.pacientes.listParaRecepcao.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const createMutation = trpc.pacientes.create.useMutation();
  const updateMutation = trpc.pacientes.update.useMutation();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.pacientes.delete.useMutation({
    onSuccess: () => {
      utils.pacientes.listParaRecepcao.invalidate();
      utils.pacientes.listParaAgenda.invalidate();
      setConfirmDeleteId(null);
      setConfirmDeleteNome('');
      toast.success('Paciente excluído com sucesso.');
    },
    onError: (err: any) => {
      toast.error('Erro ao excluir: ' + (err?.message || 'Tente novamente'));
    },
  });

  const { data: authUser } = trpc.auth.me.useQuery();
  const perfilUsuario = (authUser as any)?.perfil || '';
  const podeExcluir = podeExcluirPaciente({ perfil: perfilUsuario });

  const filteredPacientes = filtrarPacientesDaRecepcao(pacientes as any[], searchTerm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validação: Nº da carteirinha é obrigatório apenas quando há convênio seleccionado
    const temConvenio = (formData as any).convenioId && (formData as any).convenioId !== 'none';
    if (temConvenio && !(formData as any).numeroCarteira?.trim()) {
      toast.error('Nº da Carteirinha do Convênio é obrigatório quando há convênio selecionado!');
      return;
    }
    try {
      const normalizedData: any = {
        nome: formData.nome,
        cpf: formData.cpf || undefined,
        dataNascimento: formData.dataNascimento || undefined,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        whatsapp: formData.telefone || undefined,
        recebeLembretesWhatsapp: formData.recebeLembretesWhatsapp ? 1 : 0,
        endereco: formData.endereco || undefined,
        cidade: formData.cidade || undefined,
        estado: formData.estado || undefined,
        cep: formData.cep || undefined,
        cartaoSUS: formData.cartaoSUS || undefined,
        convenioId: (formData.convenioId && formData.convenioId !== 'none') ? parseInt(formData.convenioId) : undefined,
        numeroCarteira: (formData as any).numeroCarteira || undefined,
        validadeCarteira: (formData as any).validadeCarteira || undefined,
        ...normalizarPedidoMedicoOpcional(formData),
        anexoUrl: formData.anexoUrl || undefined,
      };

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...normalizedData,
        });
        toast.success('Paciente atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync(normalizedData);
        toast.success('Paciente cadastrado com sucesso!');
      }
      setFormData({
        nome: '',
        cpf: '',
        dataNascimento: '',
        email: '',
        telefone: '',
        recebeLembretesWhatsapp: true,
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        cartaoSUS: '',
        convenioId: '',
        numeroCarteira: '',
        validadeCarteira: '',
        pedidoMedicoUrl: '',
        dataVencimentoPedido: '',
        anexoUrl: '',
      });
      setIsOpen(false);
      setEditingId(null);
      utils.pacientes.listParaRecepcao.invalidate();
      utils.pacientes.listParaAgenda.invalidate();
      refetch();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Tente novamente';
      toast.error(`Erro ao salvar paciente: ${mensagem}`);
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Pacientes</h1>
          <p className="text-gray-600">Gerenciamento de cadastro de pacientes</p>
        </div>
        <div className="flex gap-2">
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsCSVUploadOpen(true)}
            variant="outline"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar CSV
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Paciente
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => onNavigate?.('localizar-agendamentos')}
            title="Localizar agendamentos"
            className="px-4"
          >
            <Search className="w-4 h-4 mr-2" />
            Localizar Agendamentos
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Nome</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">CPF</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Data Nascimento</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Telefone</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Pedido Médico</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPacientes.map((paciente) => (
                <tr key={paciente.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{paciente.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{paciente.cpf}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateBR(paciente.dataNascimento as unknown as string)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span>{paciente.telefone || '—'}</span>
                      {(paciente.telefone || paciente.whatsapp) && (
                        <button
                          onClick={() => {
                            const n = (paciente.whatsapp || paciente.telefone || '').replace(/\D/g, '');
                            window.open(`https://wa.me/55${n}`, '_blank');
                          }}
                          title="Abrir no WhatsApp"
                          className="text-green-600 hover:text-green-700 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {paciente.dataVencimentoPedido ? (
                      <span className={new Date(String(paciente.dataVencimentoPedido).split('T')[0]) < new Date(new Date().toISOString().split('T')[0]) ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        Vence em {formatDateBR(paciente.dataVencimentoPedido as unknown as string)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Não informado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const pacienteCompleto = await utils.pacientes.getById.fetch({ id: paciente.id });
                            if (!pacienteCompleto) throw new Error('Paciente não encontrado');
                            setPastaPaciente(pacienteCompleto);
                          } catch (error) {
                            toast.error('Não foi possível abrir a pasta do paciente');
                            console.error(error);
                          }
                        }}
                        title="Abrir pasta do paciente"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <FolderOpen className="w-4 h-4 mr-1" />
                        Pasta
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPacienteHistoricoGuias(paciente)}
                        title="Histórico de guias do paciente"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Guias
                      </Button>
                      {podeExcluir && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setConfirmDeleteId(paciente.id);
                            setConfirmDeleteNome(paciente.nome || '');
                          }}
                          title="Excluir paciente"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={async () => {
                          try {
                            const pacienteCompleto = await utils.pacientes.getById.fetch({ id: paciente.id });
                            if (!pacienteCompleto) throw new Error('Paciente não encontrado');
                            setEditingId(pacienteCompleto.id);
                          setFormData({
                            nome: pacienteCompleto.nome || '',
                            cpf: pacienteCompleto.cpf || '',
                            dataNascimento: formatarDataParaInput(pacienteCompleto.dataNascimento),
                            email: pacienteCompleto.email || '',
                            telefone: pacienteCompleto.telefone || pacienteCompleto.whatsapp || '',
                            recebeLembretesWhatsapp: pacienteCompleto.recebeLembretesWhatsapp === 1,
                            endereco: pacienteCompleto.endereco || '',
                            cidade: pacienteCompleto.cidade || '',
                            estado: pacienteCompleto.estado || '',
                            cep: pacienteCompleto.cep || '',
                            cartaoSUS: pacienteCompleto.cartaoSUS || '',
                            convenioId: (pacienteCompleto as any).convenioId ? String((pacienteCompleto as any).convenioId) : '',
                            numeroCarteira: (pacienteCompleto as any).numeroCarteira || '',
                            validadeCarteira: formatarDataParaInput((pacienteCompleto as any).validadeCarteira),
                            pedidoMedicoUrl: pacienteCompleto.pedidoMedicoUrl || '',
                            dataVencimentoPedido: formatarDataParaInput(pacienteCompleto.dataVencimentoPedido),
                            anexoUrl: pacienteCompleto.anexoUrl || '',
                          });
                          setIsOpen(true);
                          } catch (error) {
                            toast.error('Não foi possível carregar o cadastro do paciente');
                            console.error(error);
                          }
                        }}
                      >
                        Editar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPacientes.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Nenhum paciente encontrado
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  required
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cartaoSUS">Cartão SUS</Label>
                <Input
                  id="cartaoSUS"
                  name="cartaoSUS"
                  value={formData.cartaoSUS}
                  onChange={handleChange}
                  placeholder="Número do cartão SUS"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="convenioId">Convênio do Paciente</Label>
                <Select
                  value={formData.convenioId || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, convenioId: value }))}
                >
                  <SelectTrigger id="convenioId">
                    <SelectValue placeholder="Selecione o convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum / Particular</SelectItem>
                    {convenios.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="numeroCarteira" className="flex items-center gap-1">
                  Nº Carteira do Convênio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="numeroCarteira"
                  name="numeroCarteira"
                  value={(formData as any).numeroCarteira || ''}
                  onChange={handleChange}
                  placeholder="Número da carteirinha do convênio"
                  required
                  className={!(formData as any).numeroCarteira?.trim() ? 'border-red-300 focus:border-red-500' : ''}
                />
              </div>
              <div>
                <Label htmlFor="validadeCarteira">Validade da Carteira</Label>
                <Input
                  id="validadeCarteira"
                  name="validadeCarteira"
                  type="date"
                  value={(formData as any).validadeCarteira || ''}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone" className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  Telefone / WhatsApp
                </Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Checkbox
                  id="recebeLembretesWhatsapp"
                  checked={formData.recebeLembretesWhatsapp}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, recebeLembretesWhatsapp: checked as boolean }))
                  }
                />
                <Label htmlFor="recebeLembretesWhatsapp" className="cursor-pointer">
                  Desejo receber lembretes de consultas via WhatsApp
                </Label>
              </div>
              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  name="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="pedidoMedicoUrl">Anexo de Pedido Médico</Label>
                <Input
                  id="pedidoMedicoUrl"
                  name="pedidoMedicoUrl"
                  type="file"
                  required={false}
                  aria-required={false}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({
                        ...prev,
                        pedidoMedicoUrl: file.name
                      }));
                    }
                  }}
                  placeholder="Selecione o arquivo do pedido médico"
                />
              </div>
              <div>
                <Label htmlFor="dataVencimentoPedido">Vencimento do Pedido Médico</Label>
                <Input
                  id="dataVencimentoPedido"
                  name="dataVencimentoPedido"
                  type="date"
                  value={formData.dataVencimentoPedido}
                  onChange={handleChange}
                  required={false}
                  aria-required={false}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="anexoUrl">Anexo Geral (URL)</Label>
                <Input
                  id="anexoUrl"
                  name="anexoUrl"
                  value={formData.anexoUrl}
                  onChange={handleChange}
                  placeholder="URL do anexo"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <LoadingButton
                type="submit"
                isLoading={createMutation.isPending || updateMutation.isPending}
                loadingMessage={editingId ? 'Atualizando...' : 'Cadastrando...'}
              >
                {editingId ? 'Atualizar' : 'Cadastrar'}
              </LoadingButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CSVUploadPacientes 
        isOpen={isCSVUploadOpen} 
        onClose={() => setIsCSVUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      {pastaPaciente && (
        <PastaPaciente
          paciente={pastaPaciente}
          open={!!pastaPaciente}
          onClose={() => setPastaPaciente(null)}
        />
      )}

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => { if (!open) { setConfirmDeleteId(null); setConfirmDeleteNome(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Excluir Paciente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-2">
              Tem a certeza que deseja excluir o cadastro do paciente:
            </p>
            <p className="font-semibold text-gray-900 text-lg mb-4">{confirmDeleteNome}</p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              Esta ação é irreversível. O sistema só permite excluir cadastros sem atendimentos, guias, prontuários, assinaturas, autorizações, pagamentos ou anexos vinculados.
            </p>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => { setConfirmDeleteId(null); setConfirmDeleteNome(''); }}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (confirmDeleteId) deleteMutation.mutate({ id: confirmDeleteId }); }}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Definitivamente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {pacienteHistoricoGuias && (
        <HistoricoGuiasPaciente
          paciente={pacienteHistoricoGuias}
          onClose={() => setPacienteHistoricoGuias(null)}
        />
      )}
    </div>
  );
}
