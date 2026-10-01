import { UserPlus, Shield, Calendar, DollarSign, Mail, Edit, Trash2, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';

export function Usuarios() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    perfil: '',
    profissionalVinculado: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  // Modal de redefinição de senha (admin)
  const [redefinirModal, setRedefinirModal] = useState(false);
  const [redefinirId, setRedefinirId] = useState<number | null>(null);
  const [redefinirNome, setRedefinirNome] = useState('');
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);

  const utils = trpc.useUtils();
  const { data: usuariosData = [] } = trpc.usuarios.list.useQuery();
  const { data: profissionaisData = [] } = trpc.profissionais.list.useQuery();

  const updateUserMutation = trpc.usuarios.updateFull.useMutation({
    onSuccess: () => { utils.usuarios.list.invalidate(); },
  });
  const createUserMutation = trpc.usuarios.create.useMutation({
    onSuccess: () => { utils.usuarios.list.invalidate(); },
  });
  const deleteUserMutation = trpc.usuarios.delete.useMutation({
    onSuccess: () => { utils.usuarios.list.invalidate(); },
  });
  const redefinirSenhaMutation = trpc.usuarios.redefinirSenha.useMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({ nome: '', email: '', senha: '', confirmarSenha: '', perfil: '', profissionalVinculado: 'none' });
    setEditingId(null);
    setShowSenha(false);
    setShowConfirmar(false);
  };

  const handleEditUser = (usuario: any) => {
    setEditingId(usuario.id);
    setFormData({
      nome: usuario.name || '',
      email: usuario.email || '',
      senha: '',
      confirmarSenha: '',
      perfil: usuario.perfil || '',
      profissionalVinculado: usuario.profissionalVinculadoId?.toString() || 'none',
    });
    setModalOpen(true);
  };

  const handleDeleteUser = async (id: number, nome: string) => {
    if (!confirm(`Tem certeza que deseja eliminar o utilizador "${nome}"? Esta acção não pode ser desfeita.`)) return;
    try {
      await deleteUserMutation.mutateAsync({ id });
      toast.success('Utilizador eliminado com sucesso.');
    } catch (error: any) {
      toast.error(`Erro ao eliminar: ${error.message}`);
    }
  };

  const handleOpenRedefinir = (usuario: any) => {
    setRedefinirId(usuario.id);
    setRedefinirNome(usuario.name || usuario.email || '');
    setNovaSenhaAdmin('');
    setConfirmarNovaSenha('');
    setShowNovaSenha(false);
    setRedefinirModal(true);
  };

  const handleRedefinirSenha = async () => {
    if (!redefinirId) return;
    if (novaSenhaAdmin.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenhaAdmin !== confirmarNovaSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }
    try {
      await redefinirSenhaMutation.mutateAsync({ id: redefinirId, novaSenha: novaSenhaAdmin });
      toast.success(`Senha de "${redefinirNome}" redefinida com sucesso.`);
      setRedefinirModal(false);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  const handleSaveUser = async () => {
    if (!formData.nome.trim()) { toast.error('Nome completo é obrigatório'); return; }
    if (!formData.email.trim()) { toast.error('E-mail é obrigatório'); return; }
    if (!formData.perfil) { toast.error('Perfil de acesso é obrigatório'); return; }

    if (!editingId) {
      // Criação: senha obrigatória
      if (!formData.senha) { toast.error('Senha é obrigatória'); return; }
      if (formData.senha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres'); return; }
      if (formData.senha !== formData.confirmarSenha) { toast.error('As senhas não coincidem'); return; }
    } else {
      // Edição: se preencheu senha, validar
      if (formData.senha && formData.senha.length < 6) { toast.error('A nova senha deve ter pelo menos 6 caracteres'); return; }
      if (formData.senha && formData.senha !== formData.confirmarSenha) { toast.error('As senhas não coincidem'); return; }
    }

    setLoading(true);
    try {
      if (editingId) {
        await updateUserMutation.mutateAsync({
          id: editingId,
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          profissionalVinculadoId: formData.profissionalVinculado !== 'none' ? parseInt(formData.profissionalVinculado) : null,
          ...(formData.senha ? { senha: formData.senha } : {}),
        });
        toast.success('Utilizador actualizado com sucesso!');
      } else {
        await createUserMutation.mutateAsync({
          nome: formData.nome,
          email: formData.email,
          senha: formData.senha,
          perfil: formData.perfil,
          profissionalVinculadoId: formData.profissionalVinculado !== 'none' ? parseInt(formData.profissionalVinculado) : undefined,
        });
        toast.success('Utilizador criado com sucesso!');
      }
      setModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const perfilBadge = (perfil: string) => {
    if (perfil === 'administrador') return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Administrador</Badge>;
    if (perfil === 'profissional') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Profissional</Badge>;
    if (perfil === 'recepcao') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Recepção</Badge>;
    return <Badge variant="outline">{perfil}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-1">Gestão de Utilizadores</h1>
          <p className="text-gray-500 text-sm">Controle de acesso, perfis e senhas do sistema</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { resetForm(); setModalOpen(true); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Utilizador
        </Button>
      </div>

      {/* Cards de Perfis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Administrador</h3>
              <p className="text-xs text-gray-500">Acesso Total</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Gestão de utilizadores e senhas</li>
            <li>✓ Configurações do sistema</li>
            <li>✓ Relatórios financeiros completos</li>
            <li>✓ Logs e monitoramento</li>
          </ul>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Profissional</h3>
              <p className="text-xs text-gray-500">Acesso Limitado</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Agenda pessoal</li>
            <li>✓ Prontuários (próprios)</li>
            <li>✓ Repasse financeiro (consulta)</li>
            <li>✗ Sem acesso a configurações</li>
          </ul>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Recepção</h3>
              <p className="text-xs text-gray-500">Agenda e Pré-faturamento</p>
            </div>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>✓ Agenda geral</li>
            <li>✓ Cadastro de pacientes</li>
            <li>✓ Elegibilidade e autorizações</li>
            <li>✗ Sem acesso a prontuários</li>
          </ul>
        </div>
      </div>

      {/* Tabela de Utilizadores */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Utilizadores Cadastrados</h2>
          <span className="text-sm text-gray-500">{usuariosData.length} utilizador(es)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Perfil</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vínculo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Último Acesso</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Senha</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuariosData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400 text-sm">
                    Nenhum utilizador cadastrado. Clique em "Novo Utilizador" para começar.
                  </td>
                </tr>
              )}
              {usuariosData.map((usuario: any) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-800">{usuario.name || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    {usuario.email || '—'}
                  </td>
                  <td className="px-5 py-4">{perfilBadge(usuario.perfil)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {usuario.profissionalVinculadoId
                      ? (profissionaisData.find((p: any) => p.id === usuario.profissionalVinculadoId)?.nome ?? `Profissional #${usuario.profissionalVinculadoId}`)
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {usuario.lastSignedIn ? new Date(usuario.lastSignedIn).toLocaleString('pt-BR') : <span className="text-gray-400">Nunca</span>}
                  </td>
                  <td className="px-5 py-4">
                    {usuario.senha
                      ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs"><Lock className="w-3 h-3 mr-1" />Definida</Badge>
                      : <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs"><Key className="w-3 h-3 mr-1" />Sem senha</Badge>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Editar utilizador"
                        onClick={() => handleEditUser(usuario)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Redefinir senha"
                        onClick={() => handleOpenRedefinir(usuario)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar utilizador"
                        onClick={() => handleDeleteUser(usuario.id, usuario.name || usuario.email)}
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
      </div>

      {/* ── Modal Criar / Editar Utilizador ── */}
      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) resetForm(); setModalOpen(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Utilizador' : 'Novo Utilizador'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome Completo *</Label>
                <Input
                  placeholder="Nome do utilizador"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail *</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
            </div>

            {/* Senha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</Label>
                <div className="relative">
                  <Input
                    type={showSenha ? 'text' : 'password'}
                    placeholder={editingId ? '••••••••' : 'Mínimo 6 caracteres'}
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{editingId ? 'Confirmar Nova Senha' : 'Confirmar Senha *'}</Label>
                <div className="relative">
                  <Input
                    type={showConfirmar ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmar(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmar ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formData.confirmarSenha && formData.senha !== formData.confirmarSenha && (
                  <p className="text-xs text-red-500">As senhas não coincidem</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Perfil de Acesso *</Label>
              <Select value={formData.perfil} onValueChange={(value) => handleInputChange('perfil', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador — Acesso Total</SelectItem>
                  <SelectItem value="profissional">Profissional — Agenda e Prontuários</SelectItem>
                  <SelectItem value="recepcao">Recepção — Agenda e Pré-faturamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Vincular a Profissional <span className="text-gray-400 font-normal">(opcional)</span></Label>
              <Select value={formData.profissionalVinculado} onValueChange={(value) => handleInputChange('profissionalVinculado', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {profissionaisData.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nome}{p.especialidade ? ` — ${p.especialidade}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Para perfil "Profissional", vincule ao cadastro do profissional para filtrar agenda e repasse.</p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }} disabled={loading}>
                Cancelar
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveUser} disabled={loading}>
                {loading ? (editingId ? 'Guardando...' : 'Criando...') : (editingId ? 'Guardar Alterações' : 'Criar Utilizador')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Redefinir Senha (Admin) ── */}
      <Dialog open={redefinirModal} onOpenChange={setRedefinirModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              Redefinir Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Você está a redefinir a senha de <strong>{redefinirNome}</strong>. O utilizador deverá usar a nova senha no próximo acesso.
            </div>
            <div className="space-y-1.5">
              <Label>Nova Senha *</Label>
              <div className="relative">
                <Input
                  type={showNovaSenha ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={novaSenhaAdmin}
                  onChange={(e) => setNovaSenhaAdmin(e.target.value)}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNovaSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar Nova Senha *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
              />
              {confirmarNovaSenha && novaSenhaAdmin !== confirmarNovaSenha && (
                <p className="text-xs text-red-500">As senhas não coincidem</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <Button variant="outline" onClick={() => setRedefinirModal(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleRedefinirSenha}
                disabled={redefinirSenhaMutation.isPending || novaSenhaAdmin.length < 6 || novaSenhaAdmin !== confirmarNovaSenha}
              >
                {redefinirSenhaMutation.isPending ? 'Redefinindo...' : 'Redefinir Senha'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
