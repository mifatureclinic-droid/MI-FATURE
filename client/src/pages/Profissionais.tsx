import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { UserPlus, Search, Paperclip, Pencil, Trash2, AlertTriangle, Power, PowerOff, Eye, EyeOff, Percent, Clock, Plus, X } from 'lucide-react';
import { filtrarProfissionaisPorBusca } from '../../../shared/filtrarProfissionais';
const CONSELHOS_ANS = [
  { codigo: '01', sigla: 'CRM',     descricao: 'Conselho Regional de Medicina' },
  { codigo: '02', sigla: 'CRO',     descricao: 'Conselho Regional de Odontologia' },
  { codigo: '03', sigla: 'COREN',   descricao: 'Conselho Regional de Enfermagem' },
  { codigo: '05', sigla: 'CRF',     descricao: 'Conselho Regional de Farmácia' },
  { codigo: '06', sigla: 'CREFITO', descricao: 'Conselho Regional de Fisioterapia e Terapia Ocupacional' },
  { codigo: '07', sigla: 'CRN',     descricao: 'Conselho Regional de Nutrição' },
  { codigo: '08', sigla: 'CRFA',    descricao: 'Conselho Regional de Fonoaudiologia' },
  { codigo: '11', sigla: 'CRP',     descricao: 'Conselho Regional de Psicologia' },
  { codigo: '12', sigla: 'CRBM',    descricao: 'Conselho Regional de Biomedicina' },
  { codigo: '13', sigla: 'CREF',    descricao: 'Conselho Federal de Educação Física' },
  { codigo: '14', sigla: 'CRTR',    descricao: 'Conselho Regional de Técnicos em Radiologia' },
  { codigo: '15', sigla: 'CRBIO',   descricao: 'Conselho Regional de Biologia' },
  { codigo: '16', sigla: 'CRAS',    descricao: 'Conselho Regional de Assistência Social' },
];

export function Profissionais() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [anexoFile, setAnexoFile] = useState<File | null>(null);

  // Confirmação de exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProf, setDeletingProf] = useState<any>(null);

  const emptyForm = {
    nome: '',
    cpf: '',
    conselho: '',
    codigoConselho: '11',
    especialidade: '',
    uf: '',
    codigoCBO: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    anexoUrl: '',
    percentualRepasse: '70.00',
    percentualConvenio: '70.00',
    percentualParticular: '70.00',
    percentualTesteAvulso: '70.00',
    percentualAvaliacaoNeuropsicologica: '70.00',
    duracaoPadrao: 30,
  };

  const [formData, setFormData] = useState(emptyForm);

  const {
    data: profissionais,
    isLoading: profissionaisCarregando,
    isError: profissionaisComErro,
    refetch,
  } = trpc.profissionais.list.useQuery();
  const createMutation = trpc.profissionais.create.useMutation();
  const updateMutation = trpc.profissionais.update.useMutation();
  const deleteMutation = trpc.profissionais.delete.useMutation();
  const toggleAtivoMutation = trpc.profissionais.toggleAtivo.useMutation();

  // ===== HORÁRIOS DE TRABALHO =====
  // Cada entrada tem um id local para controle de múltiplos intervalos por dia
  type HorarioEntry = { _id: number; diaSemana: number; horaInicio: string; horaFim: string; ativo: number };
  const [showHorarios, setShowHorarios] = useState(false);
  const [horariosProfId, setHorariosProfId] = useState<number | null>(null);
  const [horariosProfNome, setHorariosProfNome] = useState('');
  const [horariosForm, setHorariosForm] = useState<HorarioEntry[]>([]);
  const [nextHorarioId, setNextHorarioId] = useState(1);

  const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const { data: horariosData } = trpc.profissionais.getHorarios.useQuery(
    { profissionalId: horariosProfId! },
    { enabled: !!horariosProfId }
  );

  const saveHorariosMutation = trpc.profissionais.saveHorarios.useMutation();

  const handleOpenHorarios = (prof: any) => {
    setHorariosProfId(prof.id);
    setHorariosProfNome(prof.nome);
    setShowHorarios(true);
  };

  // Quando carregar os horários do profissional, preencher o form
  useEffect(() => {
    if (horariosData) {
      let id = 1;
      setHorariosForm(horariosData.map(h => ({ _id: id++, diaSemana: h.diaSemana, horaInicio: h.horaInicio, horaFim: h.horaFim, ativo: h.ativo ?? 1 })));
      setNextHorarioId(horariosData.length + 1);
    }
  }, [horariosData]);

  const handleSaveHorarios = async () => {
    if (!horariosProfId) return;
    try {
      await saveHorariosMutation.mutateAsync({ profissionalId: horariosProfId, horarios: horariosForm.map(({ _id, ...rest }) => rest) });
      toast.success('Horários salvos com sucesso!');
      setShowHorarios(false);
      setHorariosProfId(null);
      setHorariosForm([]);
    } catch (e) {
      toast.error('Erro ao salvar horários');
    }
  };

  // Adiciona um novo intervalo para o dia (padrão: 08:00-12:00 se já existe um, senão 08:00-18:00)
  const addIntervaloDia = (dia: number) => {
    const existentes = horariosForm.filter(h => h.diaSemana === dia);
    const novoInicio = existentes.length > 0 ? '13:00' : '08:00';
    const novoFim = existentes.length > 0 ? '18:00' : '12:00';
    setHorariosForm(prev => [...prev, { _id: nextHorarioId, diaSemana: dia, horaInicio: novoInicio, horaFim: novoFim, ativo: 1 }]);
    setNextHorarioId(n => n + 1);
  };

  // Remove um intervalo específico pelo _id local
  const removeIntervalo = (_id: number) => {
    setHorariosForm(prev => prev.filter(h => h._id !== _id));
  };

  // Atualiza campo de um intervalo específico
  const updateIntervalo = (_id: number, field: 'horaInicio' | 'horaFim', value: string) => {
    setHorariosForm(prev => prev.map(h => h._id === _id ? { ...h, [field]: value } : h));
  };

  // Toggle de dia: se não tem nenhum intervalo, adiciona um; se tem, remove todos
  const toggleDia = (dia: number) => {
    const existentes = horariosForm.filter(h => h.diaSemana === dia);
    if (existentes.length > 0) {
      setHorariosForm(prev => prev.filter(h => h.diaSemana !== dia));
    } else {
      addIntervaloDia(dia);
    }
  };

  const filteredProfissionais = filtrarProfissionaisPorBusca(
    profissionais ?? [],
    searchTerm,
    mostrarInativos,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar percentuais
    const percFields = [
      { key: 'percentualConvenio', label: 'Convênio' },
      { key: 'percentualParticular', label: 'Particular' },
      { key: 'percentualTesteAvulso', label: 'Teste Avulso' },
      { key: 'percentualAvaliacaoNeuropsicologica', label: 'Avaliação Neuropsicológica' },
    ] as const;
    for (const f of percFields) {
      const v = parseFloat((formData as any)[f.key]);
      if (isNaN(v) || v < 0 || v > 100) {
        toast.error(`Percentual de ${f.label} deve ser entre 0 e 100`);
        return;
      }
    }
    const perc = parseFloat(formData.percentualRepasse);
    const percConvenio = parseFloat(formData.percentualConvenio).toFixed(2);
    const percParticular = parseFloat(formData.percentualParticular).toFixed(2);
    const percTesteAvulso = parseFloat(formData.percentualTesteAvulso).toFixed(2);
    const percAvaliacaoNeuro = parseFloat(formData.percentualAvaliacaoNeuropsicologica).toFixed(2);
    try {
      if (isEditMode && editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...formData,
          crm: formData.conselho,
          percentualRepasse: perc.toFixed(2),
          percentualConvenio: percConvenio,
          percentualParticular: percParticular,
          percentualTesteAvulso: percTesteAvulso,
          percentualAvaliacaoNeuropsicologica: percAvaliacaoNeuro,
          duracaoPadrao: formData.duracaoPadrao,
        });
        toast.success('Profissional atualizado com sucesso!');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          crm: formData.conselho,
          percentualRepasse: perc.toFixed(2),
          percentualConvenio: percConvenio,
          percentualParticular: percParticular,
          percentualTesteAvulso: percTesteAvulso,
          percentualAvaliacaoNeuropsicologica: percAvaliacaoNeuro,
          duracaoPadrao: formData.duracaoPadrao,
        });
        toast.success('Profissional cadastrado com sucesso!');
      }
      resetForm();
      refetch();
    } catch (error) {
      toast.error(isEditMode ? 'Erro ao atualizar profissional' : 'Erro ao cadastrar profissional');
      console.error(error);
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setAnexoFile(null);
    setIsOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  const handleEdit = (prof: any) => {
    setFormData({
      nome: prof.nome,
      cpf: prof.cpf || '',
      conselho: prof.crm,
      especialidade: prof.especialidade,
      uf: (prof as any).uf || '',
      codigoCBO: (prof as any).codigoCBO || '',
      codigoConselho: (prof as any).codigoConselho || '11',
      email: prof.email || '',
      telefone: prof.telefone || '',
      endereco: prof.endereco || '',
      cidade: prof.cidade || '',
      estado: prof.estado || '',
      cep: prof.cep || '',
      anexoUrl: prof.anexoUrl || '',
      percentualRepasse: prof.percentualRepasse ? String(prof.percentualRepasse) : '70.00',
      percentualConvenio: (prof as any).percentualConvenio ? String((prof as any).percentualConvenio) : '70.00',
      percentualParticular: (prof as any).percentualParticular ? String((prof as any).percentualParticular) : '70.00',
      percentualTesteAvulso: (prof as any).percentualTesteAvulso ? String((prof as any).percentualTesteAvulso) : '70.00',
      percentualAvaliacaoNeuropsicologica: (prof as any).percentualAvaliacaoNeuropsicologica ? String((prof as any).percentualAvaliacaoNeuropsicologica) : '70.00',
      duracaoPadrao: (prof as any).duracaoPadrao ?? 30,
    });
    setEditingId(prof.id);
    setIsEditMode(true);
    setIsOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAnexoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnexoFile(e.target.files[0]);
    }
  };

  const handleDeleteClick = (prof: any) => {
    setDeletingProf(prof);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProf) return;
    try {
      await deleteMutation.mutateAsync({ id: deletingProf.id });
      toast.success(`Profissional "${deletingProf.nome}" excluído com sucesso!`);
      setShowDeleteConfirm(false);
      setDeletingProf(null);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir profissional. Verifique se não há registros vinculados.');
      console.error(error);
    }
  };

  const handleToggleAtivo = async (prof: any) => {
    const ativo = (prof as any).ativo !== 0;
    try {
      await toggleAtivoMutation.mutateAsync({ id: prof.id });
      toast.success(ativo ? `Profissional "${prof.nome}" desativado.` : `Profissional "${prof.nome}" ativado!`);
      refetch();
    } catch (error: any) {
      toast.error('Erro ao alterar status do profissional');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-2">Profissionais</h1>
          <p className="text-gray-600">Gerenciamento de profissionais de saúde</p>
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
            onClick={() => {
              setIsEditMode(false);
              setEditingId(null);
              resetForm();
              setIsOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Cadastrar Profissional
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CRM ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {profissionaisComErro ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-medium text-gray-800">Não foi possível carregar os profissionais.</p>
            <p className="mt-1 text-sm text-gray-500">Verifique a conexão e tente novamente.</p>
            <Button className="mt-4" variant="outline" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : profissionaisCarregando ? (
          <div className="p-12 text-center text-gray-500">Carregando profissionais…</div>
        ) : (
        <>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Nome</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">CRM / Conselho</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Especialidade</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">CPF</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Telefone</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Duração</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Status</th>
                <th className="text-left px-6 py-3 text-sm text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredProfissionais.map((prof) => {
                return (
                  <tr
                    key={prof.id}
                    className={`hover:bg-gray-50 ${(prof as any).ativo === 0 ? 'opacity-60 bg-gray-50/50' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium">{prof.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.crm}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.especialidade}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.cpf}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prof.telefone || '—'}</td>
                    <td className="px-6 py-4">
                      {(prof as any).duracaoPadrao === 60 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-700">
                          ⏱ 1h
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
                          ⏱ 30min
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(prof as any).ativo !== 0 ? (
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
                          onClick={() => handleEdit(prof)}
                          title="Editar profissional"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleAtivo(prof)}
                          title={(prof as any).ativo !== 0 ? 'Desativar profissional' : 'Ativar profissional'}
                          className={(prof as any).ativo !== 0
                            ? 'text-orange-500 hover:text-orange-700 hover:bg-orange-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          }
                          disabled={toggleAtivoMutation.isPending}
                        >
                          {(prof as any).ativo !== 0
                            ? <PowerOff className="w-4 h-4" />
                            : <Power className="w-4 h-4" />
                          }
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenHorarios(prof)}
                          title="Horários de trabalho"
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(prof)}
                          title="Excluir profissional"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {filteredProfissionais.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Nenhum profissional encontrado
            </div>
          )}
        </>
        )}
      </div>

      {/* Modal Criar / Editar Profissional */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}</DialogTitle>
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
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="codigoConselho">Tipo de Conselho (ANS Tabela 28) *</Label>
                <select
                  id="codigoConselho"
                  value={(formData as any).codigoConselho || '11'}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigoConselho: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {CONSELHOS_ANS.map(c => (
                    <option key={c.codigo} value={c.codigo}>{c.codigo} — {c.sigla} ({c.descricao})</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="conselho">Nº do Conselho *</Label>
                <Input
                  id="conselho"
                  name="conselho"
                  value={formData.conselho}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 12345/AM"
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
                <Label htmlFor="especialidade">Especialidade *</Label>
                <Input
                  id="especialidade"
                  name="especialidade"
                  value={formData.especialidade}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Cardiologia"
                />
              </div>
              <div>
                <Label htmlFor="uf">UF do Conselho</Label>
                <Input
                  id="uf"
                  name="uf"
                  value={(formData as any).uf}
                  onChange={handleChange}
                  placeholder="Ex: AM"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="codigoCBO">Código CBO <span className="text-muted-foreground text-xs">(ex: 251510 = Psicólogo)</span></Label>
                <Input
                  id="codigoCBO"
                  name="codigoCBO"
                  value={(formData as any).codigoCBO}
                  onChange={handleChange}
                  placeholder="Ex: 251510"
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
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Duração Padrão dos Atendimentos */}
              <div className="col-span-2">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-800 font-semibold text-sm">⏱ Duração Padrão dos Atendimentos</span>
                  </div>
                  <p className="text-xs text-teal-600 mb-3">
                    Define a duração pré-preenchida ao agendar uma consulta para este profissional.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duracaoPadrao: 30 }))}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.duracaoPadrao === 30
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      30 minutos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, duracaoPadrao: 60 }))}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.duracaoPadrao === 60
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                      }`}
                    >
                      1 hora (60 min)
                    </button>
                  </div>
                </div>
              </div>

              {/* Percentuais de Repasse por Tipo de Atendimento */}
              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent className="w-4 h-4 text-blue-700" />
                    <span className="text-blue-800 font-semibold text-sm">Percentuais de Repasse por Tipo de Atendimento</span>
                  </div>
                  <p className="text-xs text-blue-600">
                    Defina o percentual do valor bruto da guia repassado ao profissional para cada tipo de atendimento.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'percentualConvenio', label: 'Convênio' },
                      { name: 'percentualParticular', label: 'Particular' },
                      { name: 'percentualTesteAvulso', label: 'Teste Avulso' },
                      { name: 'percentualAvaliacaoNeuropsicologica', label: 'Avaliação Neuropsicológica' },
                    ].map(({ name, label }) => (
                      <div key={name} className="bg-white rounded border border-blue-100 p-2">
                        <Label htmlFor={name} className="text-xs text-gray-600 mb-1 block">{label}</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id={name}
                            name={name}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={(formData as any)[name]}
                            onChange={handleChange}
                            required
                            placeholder="70.00"
                            className="w-24 text-center font-semibold"
                          />
                          <span className="text-gray-500 text-sm">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
                <Label htmlFor="anexo">Anexar Documento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="anexo"
                    type="file"
                    onChange={handleAnexoChange}
                    className="flex-1"
                  />
                  {anexoFile && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Paperclip className="w-4 h-4" />
                      {anexoFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>
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

      {/* Modal de Horários de Trabalho */}
      <Dialog open={showHorarios} onOpenChange={(open) => { setShowHorarios(open); if (!open) { setHorariosProfId(null); setHorariosForm([]); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Horários de Trabalho — {horariosProfNome}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Selecione os dias em que o profissional atende e defina o horário de entrada e saída. A agenda exibirá apenas os dias e horários configurados.</p>
            <div className="grid grid-cols-7 gap-1 mb-4">
              {DIAS_SEMANA.map((dia, idx) => {
                const ativo = horariosForm.some(h => h.diaSemana === idx);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDia(idx)}
                    className={`py-2 px-1 rounded-lg text-xs font-semibold border-2 transition-all ${
                      ativo
                        ? 'bg-teal-500 border-teal-500 text-white'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300'
                    }`}
                  >
                    {dia.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {[1,2,3,4,5,6,0].map(idx => {
                const intervalos = horariosForm.filter(h => h.diaSemana === idx);
                if (intervalos.length === 0) return null;
                return (
                  <div key={idx} className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
                    {/* Cabeçalho do dia com botão de adicionar intervalo */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-teal-700">{DIAS_SEMANA[idx]}</span>
                      <button
                        type="button"
                        onClick={() => addIntervaloDia(idx)}
                        className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium border border-teal-300 rounded px-2 py-0.5 bg-white hover:bg-teal-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Adicionar intervalo
                      </button>
                    </div>
                    {/* Intervalos do dia */}
                    {intervalos.map((intervalo, i) => (
                      <div key={intervalo._id} className="flex items-center gap-2 bg-white border border-teal-100 rounded-md px-3 py-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <Label className="text-xs text-gray-500">Entrada</Label>
                        <input
                          type="time"
                          value={intervalo.horaInicio}
                          onChange={e => updateIntervalo(intervalo._id, 'horaInicio', e.target.value)}
                          className="border border-input rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <Label className="text-xs text-gray-500">Saída</Label>
                        <input
                          type="time"
                          value={intervalo.horaFim}
                          onChange={e => updateIntervalo(intervalo._id, 'horaFim', e.target.value)}
                          className="border border-input rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                          type="button"
                          onClick={() => removeIntervalo(intervalo._id)}
                          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                          title="Remover intervalo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {horariosForm.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">
                  Nenhum dia selecionado. Clique nos dias acima para adicionar horários.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowHorarios(false); setHorariosProfId(null); setHorariosForm([]); }}>Cancelar</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleSaveHorarios}
                disabled={saveHorariosMutation.isPending}
              >
                {saveHorariosMutation.isPending ? 'Salvando...' : 'Salvar Horários'}
              </Button>
            </div>
          </div>
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
              Tem certeza que deseja excluir o profissional{' '}
              <strong>"{deletingProf?.nome}"</strong>?
            </p>
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Esta ação não pode ser desfeita. Profissionais com agendamentos, guias ou prontuários vinculados não poderão ser excluídos. Considere desativar o profissional em vez de excluir.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => { setShowDeleteConfirm(false); setDeletingProf(null); }}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Profissional'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
