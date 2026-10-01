import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { formatarResumoProcedimentoSalvo } from '@shared/procedimentoFeedback';
import { extrairBase64DeArquivo, mensagemErroLogoConvenio } from '@shared/logoConvenioUpload';
import { Building2, Search, Plus, Trash2, Upload, Image, Pencil, AlertTriangle, Power, PowerOff, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

const emptyForm = {
  nome: '',
  cnpj: '',
  codigoOperadora: '',
  registroANS: '',
  codigoNaOperadora: '',
  logoUrl: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  aniversarioConvenio: '',
  anexoUrl: '',
};

export function Convenios() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingConvenio, setDeletingConvenio] = useState<any>(null);

  const [selectedConvenio, setSelectedConvenio] = useState<any>(null);
  const [showProcedimentos, setShowProcedimentos] = useState(false);
  const [procedimentoForm, setProcedimentoForm] = useState({
    codigoConvenio: '',
    descricaoConvenio: '',
    valor: '',
  });
  const [procedimentoSalvo, setProcedimentoSalvo] = useState<{
    codigo: string;
    descricao: string;
    valor: string;
  } | null>(null);

  const { data: convenios = [], refetch } = trpc.convenios.list.useQuery();
  const { data: procedimentosConvenio = [], refetch: refetchProcedimentos } = trpc.procedimentos.getProcedimentosPorConvenio.useQuery(
    { convenioId: selectedConvenio?.id || 0 },
    { enabled: !!selectedConvenio }
  );
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const createMutation = trpc.convenios.create.useMutation();
  const updateMutation = trpc.convenios.update.useMutation();
  const deleteMutation = trpc.convenios.delete.useMutation();
  const toggleAtivoMutation = trpc.convenios.toggleAtivo.useMutation();
  const createProcedimentoMutation = trpc.procedimentos.createProcedimentoConvenio.useMutation();
  const deleteProcedimentoMutation = trpc.procedimentos.deleteProcedimentoConvenio.useMutation();
  const uploadLogoMutation = trpc.convenios.uploadLogo.useMutation();

  const filteredConvenios = convenios.filter(c => {
    const ativo = (c as any).ativo !== 0;
    if (!mostrarInativos && !ativo) return false;
    return (
      c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cnpj ?? '').includes(searchTerm)
    );
  });

  const resetForm = () => {
    setFormData(emptyForm);
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleOpenEdit = (convenio: any) => {
    setFormData({
      nome: convenio.nome || '',
      cnpj: convenio.cnpj || '',
      codigoOperadora: convenio.codigoOperadora || '',
      registroANS: convenio.registroANS || '',
      codigoNaOperadora: convenio.codigoNaOperadora || '',
      logoUrl: convenio.logoUrl || '',
      email: convenio.email || '',
      telefone: convenio.telefone || '',
      endereco: convenio.endereco || '',
      cidade: convenio.cidade || '',
      estado: convenio.estado || '',
      cep: convenio.cep || '',
      aniversarioConvenio: convenio.aniversarioConvenio
        ? new Date(convenio.aniversarioConvenio).toISOString().split('T')[0]
        : '',
      anexoUrl: convenio.anexoUrl || '',
    });
    setEditingId(convenio.id);
    setIsEditMode(true);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && editingId !== null) {
        await updateMutation.mutateAsync({ id: editingId, ...formData });
        toast.success('Convênio atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Convênio cadastrado com sucesso!');
      }
      resetForm();
      setIsOpen(false);
      refetch();
    } catch (error: any) {
      const mensagem = error?.message ? `: ${error.message}` : '';
      toast.error(`${isEditMode ? 'Erro ao atualizar convênio' : 'Erro ao cadastrar convênio'}${mensagem}`);
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo selecionado.'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
      const base64Data = extrairBase64DeArquivo(dataUrl);
      if (!base64Data) {
        throw new Error('Não foi possível preparar a imagem para envio.');
      }
      const result = await uploadLogoMutation.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        base64Data,
      });
      setFormData(prev => ({ ...prev, logoUrl: result.url }));
      toast.success('Logo carregada com sucesso!');
    } catch (error: any) {
      toast.error(mensagemErroLogoConvenio(error));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (convenio: any) => {
    setDeletingConvenio(convenio);
    setShowDeleteConfirm(true);
  };

  const handleToggleAtivo = async (convenio: any) => {
    const ativo = (convenio as any).ativo !== 0;
    try {
      await toggleAtivoMutation.mutateAsync({ id: convenio.id });
      toast.success(ativo ? `Convênio "${convenio.nome}" desativado.` : `Convênio "${convenio.nome}" ativado!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status do convênio');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingConvenio) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingConvenio.id });
      toast.success(`Convênio "${deletingConvenio.nome}" excluído com sucesso!`);
      setShowDeleteConfirm(false);
      setDeletingConvenio(null);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir convênio. Verifique se não há registros vinculados.');
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Convênios</h1>
          <p className="text-gray-600">Gerenciamento de convênios e operadoras de saúde</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setMostrarInativos(v => !v)}
            className={mostrarInativos ? 'border-orange-400 text-orange-600 bg-orange-50' : ''}
            title={mostrarInativos ? 'Ocultar inativos' : 'Mostrar inativos'}
          >
            {mostrarInativos ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {mostrarInativos ? 'Ocultar Inativos' : 'Mostrar Inativos'}
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleOpenCreate}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Cadastrar Convênio
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Logo</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Nome</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">CNPJ</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Registro ANS</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Cód. Operadora</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Telefone</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredConvenios.map((convenio) => (
                <tr key={convenio.id} className={`hover:bg-gray-50 ${
                  (convenio as any).ativo === 0 ? 'opacity-60 bg-gray-50/50' : ''
                }`}>
                  <td className="px-6 py-4">
                    {(convenio as any).logoUrl ? (
                      <img
                        src={(convenio as any).logoUrl}
                        alt={`Logo ${convenio.nome}`}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
                        <Image className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium">{convenio.nome}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{convenio.cnpj}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(convenio as any).registroANS || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{(convenio as any).codigoNaOperadora || convenio.codigoOperadora || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{convenio.telefone}</td>
                  <td className="px-6 py-4">
                    {(convenio as any).ativo !== 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <Power className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
                        <PowerOff className="w-3 h-3" /> Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedConvenio(convenio);
                          setProcedimentoSalvo(null);
                          setShowProcedimentos(true);
                        }}
                        title="Gerenciar procedimentos"
                      >
                        Procedimentos
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(convenio)}
                        title="Editar convênio"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(convenio)}
                        title={(convenio as any).ativo !== 0 ? 'Desativar convênio' : 'Ativar convênio'}
                        className={(convenio as any).ativo !== 0
                          ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                          : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }
                        disabled={toggleAtivoMutation.isPending}
                      >
                        {(convenio as any).ativo !== 0
                          ? <PowerOff className="w-4 h-4" />
                          : <Power className="w-4 h-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(convenio)}
                        title="Excluir convênio"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredConvenios.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Nenhum convênio encontrado
          </div>
        )}
      </div>

      {/* Modal Criar / Editar Convênio */}
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Convênio' : 'Cadastrar Novo Convênio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                  placeholder="Nome do convênio"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="codigoOperadora">Código Operadora (ANS)</Label>
                <Input
                  id="codigoOperadora"
                  name="codigoOperadora"
                  value={formData.codigoOperadora}
                  onChange={handleChange}
                  placeholder="Código ANS da operadora"
                />
              </div>
              <div>
                <Label htmlFor="registroANS">Registro ANS</Label>
                <Input
                  id="registroANS"
                  name="registroANS"
                  value={formData.registroANS}
                  onChange={handleChange}
                  placeholder="Número de registro na ANS"
                  maxLength={10}
                />
              </div>
              <div>
                <Label htmlFor="codigoNaOperadora">Código da Clínica na Operadora</Label>
                <Input
                  id="codigoNaOperadora"
                  name="codigoNaOperadora"
                  value={formData.codigoNaOperadora}
                  onChange={handleChange}
                  placeholder="Código da clínica nesta operadora"
                />
              </div>
              <div>
                <Label>Logo do Convênio</Label>
                <div className="flex items-center gap-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo || uploadLogoMutation.isPending}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Enviando...' : formData.logoUrl ? 'Trocar Logo' : 'Selecionar Logo'}
                  </Button>
                  {formData.logoUrl && (
                    <img
                      src={formData.logoUrl}
                      alt="Preview logo"
                      className="h-8 w-auto object-contain border rounded"
                    />
                  )}
                </div>
                {formData.logoUrl && (
                  <p className="text-xs text-green-600 mt-1">Logo carregada com sucesso</p>
                )}
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@convenio.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
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
              <div>
                <Label htmlFor="aniversarioConvenio">Aniversário do Convênio</Label>
                <Input
                  id="aniversarioConvenio"
                  name="aniversarioConvenio"
                  type="date"
                  value={formData.aniversarioConvenio}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="anexoUrl">Anexo (URL)</Label>
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
              <Button type="button" variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending)
                  ? (isEditMode ? 'Salvando...' : 'Cadastrando...')
                  : (isEditMode ? 'Salvar Alterações' : 'Cadastrar')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Tem certeza que deseja excluir o convênio{' '}
              <strong>"{deletingConvenio?.nome}"</strong>?
            </p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Esta ação não pode ser desfeita. Convênios com pacientes, autorizações ou guias vinculadas não poderão ser excluídos.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowDeleteConfirm(false); setDeletingConvenio(null); }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Convênio'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Procedimentos */}
      <Dialog open={showProcedimentos} onOpenChange={(open) => {
        setShowProcedimentos(open);
        if (!open) {
          setProcedimentoSalvo(null);
          setProcedimentoForm({ codigoConvenio: '', descricaoConvenio: '', valor: '' });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procedimentos - {selectedConvenio?.nome}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {procedimentoSalvo && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Procedimento salvo com sucesso!</p>
                  <p className="mt-1 text-sm">
                    {formatarResumoProcedimentoSalvo(procedimentoSalvo)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:bg-green-100 hover:text-green-900"
                  onClick={() => setProcedimentoSalvo(null)}
                >
                  Fechar
                </Button>
              </div>
            )}

            {/* Formulário de Novo Procedimento */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-semibold">Adicionar Novo Procedimento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigoConvenio">Código Convênio *</Label>
                  <Input
                    id="codigoConvenio"
                    value={procedimentoForm.codigoConvenio}
                    onChange={(e) => setProcedimentoForm({...procedimentoForm, codigoConvenio: e.target.value})}
                    placeholder="Código do procedimento"
                  />
                </div>
                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    value={procedimentoForm.valor}
                    onChange={(e) => setProcedimentoForm({...procedimentoForm, valor: e.target.value})}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="descricaoConvenio">Descrição *</Label>
                  <Input
                    id="descricaoConvenio"
                    value={procedimentoForm.descricaoConvenio}
                    onChange={(e) => setProcedimentoForm({...procedimentoForm, descricaoConvenio: e.target.value})}
                    placeholder="Descrição do procedimento"
                  />
                </div>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 w-full"
                onClick={async () => {
                  const codigoConvenio = procedimentoForm.codigoConvenio.trim();
                  const descricaoConvenio = procedimentoForm.descricaoConvenio.trim();
                  if (!codigoConvenio || !descricaoConvenio || !procedimentoForm.valor || !selectedConvenio) {
                    toast.error('Preencha os campos obrigatórios: código, descrição e valor');
                    return;
                  }
                  const valor = parseFloat(procedimentoForm.valor);
                  if (!Number.isFinite(valor) || valor < 0) {
                    toast.error('Informe um valor válido e não negativo');
                    return;
                  }
                  try {
                    await createProcedimentoMutation.mutateAsync({
                      convenioId: selectedConvenio.id,
                      codigoConvenio,
                      descricaoConvenio,
                      valor: valor.toFixed(2),
                    });
                    setProcedimentoSalvo({
                      codigo: codigoConvenio,
                      descricao: descricaoConvenio,
                      valor: valor.toFixed(2),
                    });
                    toast.success('Procedimento salvo com sucesso!');
                    setProcedimentoForm({ codigoConvenio: '', descricaoConvenio: '', valor: '' });
                    await refetchProcedimentos();
                  } catch (error: any) {
                    toast.error(`Erro: ${error.message}`);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Procedimento
              </Button>
            </div>

            {/* Tabela de Procedimentos */}
            <div>
              <h3 className="font-semibold mb-4">Procedimentos Cadastrados</h3>
              {procedimentosConvenio.length === 0 ? (
                <p className="text-gray-500">Nenhum procedimento cadastrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-2">Código</th>
                        <th className="text-left px-4 py-2">Descrição</th>
                        <th className="text-left px-4 py-2">Valor</th>
                        <th className="text-left px-4 py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {procedimentosConvenio.map((proc: any) => (
                        <tr key={proc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">{proc.codigoConvenio || proc.codigoANS || '—'}</td>
                          <td className="px-4 py-2">{proc.descricaoConvenio || proc.descricaoANS || '—'}</td>
                          <td className="px-4 py-2">R$ {parseFloat(proc.valor || '0').toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await deleteProcedimentoMutation.mutateAsync({ id: proc.id });
                                  toast.success('Procedimento removido');
                                  refetchProcedimentos();
                                } catch (error: any) {
                                  toast.error(`Erro: ${error.message}`);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
