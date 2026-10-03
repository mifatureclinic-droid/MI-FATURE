import { useState, useRef } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Upload, Trash2, FileText, FileImage, File, ExternalLink, Paperclip, X } from 'lucide-react';

const CATEGORIAS = [
  { value: 'exame', label: 'Exame' },
  { value: 'pedido_medico', label: 'Pedido Médico' },
  { value: 'laudo', label: 'Laudo' },
  { value: 'receita', label: 'Receita' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'documento', label: 'Documento Pessoal' },
  { value: 'imagem', label: 'Imagem' },
  { value: 'outros', label: 'Outros' },
];

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

function inferMimeType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'pdf' ? 'application/pdf' : 'application/octet-stream';
}

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return <File className="w-5 h-5 text-gray-400" />;
  if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-400" />;
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  pacienteId: number;
}

export function AnexosPaciente({ pacienteId }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ nome: '', descricao: '', categoria: 'outros' });
  const [fileData, setFileData] = useState<{ base64: string; mimeType: string; tamanho: number; nome: string } | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: anexos = [], refetch } = trpc.anexos.list.useQuery(
    { pacienteId },
    { enabled: pacienteId > 0 }
  );

  const uploadMutation = trpc.anexos.upload.useMutation();
  const deleteMutation = trpc.anexos.delete.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('Arquivo muito grande. Limite de 25 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileData({
        base64: reader.result as string,
        mimeType: inferMimeType(file),
        tamanho: file.size,
        nome: file.name,
      });
      // Preencher nome automaticamente se estiver vazio
      if (!form.nome) {
        setForm(prev => ({ ...prev, nome: file.name }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!fileData) { toast.error('Selecione um arquivo'); return; }
    if (!form.nome.trim()) { toast.error('Informe um nome para o anexo'); return; }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({
        pacienteId,
        nome: form.nome,
        descricao: form.descricao || undefined,
        categoria: form.categoria,
        mimeType: fileData.mimeType,
        tamanho: fileData.tamanho,
        base64: fileData.base64,
      });
      toast.success('Anexo enviado com sucesso!');
      setShowUpload(false);
      setForm({ nome: '', descricao: '', categoria: 'outros' });
      setFileData(null);
      refetch();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o anexo.';
      toast.error(message || 'Não foi possível enviar o anexo.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Excluir o anexo "${nome}"?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success('Anexo excluído');
      refetch();
    } catch {
      toast.error('Erro ao excluir anexo');
    }
  };

  const anexosFiltrados = filtroCategoria === 'todos'
    ? anexos
    : anexos.filter(a => a.categoria === filtroCategoria);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-semibold text-gray-800">Anexos do Paciente</h3>
          <span className="text-xs bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 font-medium">{anexos.length}</span>
        </div>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
          onClick={() => setShowUpload(true)}
        >
          <Upload className="w-4 h-4" />
          Adicionar Anexo
        </Button>
      </div>

      {/* Filtro por categoria */}
      {anexos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroCategoria('todos')}
            className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${filtroCategoria === 'todos' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}
          >
            Todos ({anexos.length})
          </button>
          {CATEGORIAS.filter(c => anexos.some(a => a.categoria === c.value)).map(c => (
            <button
              key={c.value}
              onClick={() => setFiltroCategoria(c.value)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors ${filtroCategoria === c.value ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'}`}
            >
              {c.label} ({anexos.filter(a => a.categoria === c.value).length})
            </button>
          ))}
        </div>
      )}

      {/* Lista de anexos */}
      {anexosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Paperclip className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum anexo encontrado.</p>
          <p className="text-xs mt-1">Clique em "Adicionar Anexo" para enviar documentos, exames ou imagens.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {anexosFiltrados.map(anexo => (
            <div key={anexo.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-3 hover:border-teal-200 hover:bg-teal-50/30 transition-colors group">
              <div className="flex-shrink-0">
                {getFileIcon(anexo.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 truncate">{anexo.nome}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 flex-shrink-0">
                    {CATEGORIAS.find(c => c.value === anexo.categoria)?.label || anexo.categoria}
                  </span>
                </div>
                {anexo.descricao && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{anexo.descricao}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {anexo.tamanho && (
                    <span className="text-[10px] text-gray-400">{formatBytes(anexo.tamanho)}</span>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {new Date(anexo.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={anexo.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-teal-100 text-teal-600 transition-colors"
                  title="Abrir anexo"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleDelete(anexo.id, anexo.nome)}
                  className="p-1.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                  title="Excluir anexo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Upload */}
      <Dialog open={showUpload} onOpenChange={(open) => { setShowUpload(open); if (!open) { setForm({ nome: '', descricao: '', categoria: 'outros' }); setFileData(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              Adicionar Anexo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Área de seleção de arquivo */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {fileData ? (
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(fileData.mimeType)}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[240px]">{fileData.nome}</p>
                    <p className="text-xs text-gray-400">{formatBytes(fileData.tamanho)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFileData(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="ml-2 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Clique para selecionar um arquivo</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, imagens e documentos — máximo 25 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.zip"
                onChange={handleFileChange}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Nome do Anexo *</Label>
                <Input
                  value={form.nome}
                  onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Exame de sangue - Janeiro 2026"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(prev => ({ ...prev, categoria: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Descrição (opcional)</Label>
                <Input
                  value={form.descricao}
                  onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Observações sobre o documento..."
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                onClick={handleUpload}
                disabled={uploading || !fileData}
              >
                {uploading ? (
                  <><span className="animate-spin">⏳</span> Enviando...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Enviar Anexo</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
