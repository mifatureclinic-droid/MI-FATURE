import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Palette, Plus, Trash2 } from "lucide-react";
import { TIPOS_ATENDIMENTO_DISPONIVEIS } from '@shared/tiposAtendimento';

// Paleta de cores sugeridas
const CORES_SUGERIDAS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1',
  '#14b8a6', '#6b7280', '#1d4ed8', '#7c3aed', '#059669',
];

// Tipos padrão de atendimento
const TIPOS_PADRAO = [...TIPOS_ATENDIMENTO_DISPONIVEIS];

interface ConfigCoresAtendimentoProps {
  open: boolean;
  onClose: () => void;
}

export default function ConfigCoresAtendimento({ open, onClose }: ConfigCoresAtendimentoProps) {
  const { data: coresSalvas, refetch } = trpc.coresAtendimento.listar.useQuery(undefined, { enabled: open });
  const salvarTodas = trpc.coresAtendimento.salvarTodas.useMutation();

  const [cores, setCores] = useState<{ tipo: string; cor: string; corTexto: string }[]>([]);
  const [novoTipo, setNovoTipo] = useState('');

  useEffect(() => {
    if (coresSalvas && coresSalvas.length > 0) {
      setCores(coresSalvas.map(c => ({ tipo: c.tipo, cor: c.cor, corTexto: c.corTexto })));
    } else if (open) {
      // Inicializar com tipos padrão e cores padrão
      setCores(TIPOS_PADRAO.map((tipo, i) => ({
        tipo,
        cor: CORES_SUGERIDAS[i % CORES_SUGERIDAS.length],
        corTexto: '#ffffff',
      })));
    }
  }, [coresSalvas, open]);

  const handleSalvar = async () => {
    try {
      await salvarTodas.mutateAsync(cores);
      toast.success('Cores salvas com sucesso!');
      refetch();
      onClose();
    } catch {
      toast.error('Erro ao salvar as cores.');
    }
  };

  const handleAddTipo = () => {
    const tipo = novoTipo.trim();
    if (!tipo) return;
    if (cores.some(c => c.tipo.toLowerCase() === tipo.toLowerCase())) {
      toast.error('Tipo já cadastrado.');
      return;
    }
    setCores(prev => [...prev, { tipo, cor: '#3b82f6', corTexto: '#ffffff' }]);
    setNovoTipo('');
  };

  const handleRemoveTipo = (tipo: string) => {
    setCores(prev => prev.filter(c => c.tipo !== tipo));
  };

  const handleCorChange = (tipo: string, cor: string) => {
    setCores(prev => prev.map(c => c.tipo === tipo ? { ...c, cor } : c));
  };

  const handleCorTextoChange = (tipo: string, corTexto: string) => {
    setCores(prev => prev.map(c => c.tipo === tipo ? { ...c, corTexto } : c));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-600" />
            Configurar Cores por Tipo de Atendimento
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 mb-4">
          Defina uma cor para cada tipo de atendimento. Essas cores serão exibidas nos cards da agenda para identificação visual rápida.
        </p>

        {/* Lista de tipos */}
        <div className="space-y-2">
          {cores.map(({ tipo, cor, corTexto }) => (
            <div key={tipo} className="flex items-center gap-3 p-2 rounded-lg border bg-gray-50">
              {/* Preview do card */}
              <div
                className="flex-shrink-0 px-3 py-1 rounded text-xs font-semibold min-w-[140px] text-center truncate"
                style={{ backgroundColor: cor, color: corTexto }}
              >
                {tipo}
              </div>

              {/* Seletor de cor de fundo */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">Fundo:</label>
                <input
                  type="color"
                  value={cor}
                  onChange={e => handleCorChange(tipo, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  title="Cor de fundo"
                />
              </div>

              {/* Seletor de cor do texto */}
              <div className="flex items-center gap-1">
                <label className="text-xs text-gray-500">Texto:</label>
                <input
                  type="color"
                  value={corTexto}
                  onChange={e => handleCorTextoChange(tipo, e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  title="Cor do texto"
                />
              </div>

              {/* Cores sugeridas */}
              <div className="flex gap-1 flex-wrap flex-1">
                {CORES_SUGERIDAS.slice(0, 8).map(c => (
                  <button
                    key={c}
                    onClick={() => handleCorChange(tipo, c)}
                    className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ backgroundColor: c, borderColor: cor === c ? '#1f2937' : 'transparent' }}
                    title={c}
                  />
                ))}
              </div>

              {/* Botão remover */}
              <button
                onClick={() => handleRemoveTipo(tipo)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                title="Remover tipo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar novo tipo */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <input
            type="text"
            value={novoTipo}
            onChange={e => setNovoTipo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
            placeholder="Novo tipo de atendimento..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <Button variant="outline" onClick={handleAddTipo} className="gap-1">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleSalvar}
            disabled={salvarTodas.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {salvarTodas.isPending ? 'Salvando...' : 'Salvar cores'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
