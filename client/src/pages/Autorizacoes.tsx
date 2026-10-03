import { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

export function Autorizacoes() {
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [formData, setFormData] = useState({
    numeroAutorizacao: '',
    pacienteId: '',
    convenioId: '',
    procedimento: '',
    dataAutorizacao: '',
    dataValidade: '',
    quantidadeSessoes: '',
    status: 'ativa',
  });

  const { data: autorizacoes = [], refetch } = trpc.autorizacoes.list.useQuery();
  const { data: pacientes = [] } = trpc.pacientes.list.useQuery();
  const { data: convenios = [] } = trpc.convenios.list.useQuery();
  const createMutation = trpc.autorizacoes.create.useMutation();

  const filteredAutorizacoes = statusFilter === 'todos' 
    ? autorizacoes 
    : autorizacoes.filter(a => a.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-700';
      case 'utilizada': return 'bg-yellow-100 text-yellow-700';
      case 'expirada': return 'bg-red-100 text-red-700';
      case 'cancelada': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        numeroAutorizacao: formData.numeroAutorizacao,
        pacienteId: parseInt(formData.pacienteId),
        convenioId: parseInt(formData.convenioId),
        procedimento: formData.procedimento,
        dataAutorizacao: formData.dataAutorizacao,
        dataValidade: formData.dataValidade,
        quantidadeSessoes: formData.quantidadeSessoes ? parseInt(formData.quantidadeSessoes) : undefined,
        status: formData.status as any,
      });
      toast.success('Autorização criada com sucesso!');
      setFormData({
        numeroAutorizacao: '',
        pacienteId: '',
        convenioId: '',
        procedimento: '',
        dataAutorizacao: '',
        dataValidade: '',
        quantidadeSessoes: '',
        status: 'ativa',
      });
      setIsOpen(false);
      refetch();
    } catch (error) {
      toast.error('Erro ao criar autorização');
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
          <h1 className="text-3xl mb-2">Autorizações</h1>
          <p className="text-gray-600">Gestão de autorizações de procedimentos</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Autorização
        </Button>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="utilizada">Utilizada</SelectItem>
              <SelectItem value="expirada">Expirada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Número</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Paciente</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Convênio</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Procedimento</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Validade</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAutorizacoes.map((auth) => (
                <tr key={auth.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{auth.numeroAutorizacao}</td>
                  <td className="px-6 py-4 text-sm">{pacientes.find(p => p.id === auth.pacienteId)?.nome || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{convenios.find(c => c.id === auth.convenioId)?.nome || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">{auth.procedimento}</td>
                  <td className="px-6 py-4 text-sm">{new Date(auth.dataValidade).toLocaleDateString('pt-PT')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(auth.status)}`}>
                      {auth.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAutorizacoes.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            Nenhuma autorização encontrada
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Autorização</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numeroAutorizacao">Número de Autorização *</Label>
                <Input
                  id="numeroAutorizacao"
                  name="numeroAutorizacao"
                  value={formData.numeroAutorizacao}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 123456789"
                />
              </div>
              <div>
                <Label htmlFor="pacienteId">Paciente *</Label>
                <Select value={formData.pacienteId} onValueChange={(value) => setFormData({...formData, pacienteId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="convenioId">Convênio *</Label>
                <Select value={formData.convenioId} onValueChange={(value) => setFormData({...formData, convenioId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um convênio" />
                  </SelectTrigger>
                  <SelectContent>
                    {convenios.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="procedimento">Procedimento *</Label>
                <Input
                  id="procedimento"
                  name="procedimento"
                  value={formData.procedimento}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Consulta Cardiologia"
                />
              </div>
              <div>
                <Label htmlFor="dataAutorizacao">Data de Autorização *</Label>
                <Input
                  id="dataAutorizacao"
                  name="dataAutorizacao"
                  type="date"
                  value={formData.dataAutorizacao}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dataValidade">Data de Validade *</Label>
                <Input
                  id="dataValidade"
                  name="dataValidade"
                  type="date"
                  value={formData.dataValidade}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidadeSessoes">Quantidade de Sessões</Label>
                <Input
                  id="quantidadeSessoes"
                  name="quantidadeSessoes"
                  type="number"
                  value={formData.quantidadeSessoes}
                  onChange={handleChange}
                  placeholder="Ex: 10"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="utilizada">Utilizada</SelectItem>
                    <SelectItem value="expirada">Expirada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Criar Autorização
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
