import { useState } from 'react';
import { Button } from '../components/ui/button';
import { StatsCard } from '../components/StatsCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Download, FileText, AlertCircle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { getHojeBrasilia } from '../lib/utils';
import { toast } from 'sonner';

export function Fechamento() {
  const [modalXmlOpen, setModalXmlOpen] = useState(false);
  const [modalBaixaOpen, setModalBaixaOpen] = useState(false);
  const [selectedGuias, setSelectedGuias] = useState<number[]>([]);
  const [fechamentoSelecionado, setFechamentoSelecionado] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: guias = [] } = trpc.guias.list.useQuery();
  const exportXMLMutation = trpc.guias.exportXML.useQuery(
    { guiaIds: selectedGuias },
    { enabled: false }
  );

  // Agrupar guias por mês/convênio
  const fechamentos = guias.reduce((acc: any[], guia: any) => {
    const dataEmissao = guia.dataEmissao instanceof Date 
      ? guia.dataEmissao 
      : new Date(guia.dataEmissao);
    const mes = dataEmissao.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    const existing = acc.find(f => f.mes === mes && f.convenioId === guia.convenioId);
    
    if (existing) {
      existing.guias.push(guia);
      existing.quantidadeGuias += 1;
      existing.valorTotal += parseFloat(guia.valor || 0);
    } else {
      acc.push({
        mes,
        convenioId: guia.convenioId,
        convenioNome: `Convênio ${guia.convenioId}`,
        guias: [guia],
        quantidadeGuias: 1,
        valorTotal: parseFloat(guia.valor || 0),
        status: 'Em Aberto'
      });
    }
    
    return acc;
  }, []);

  const handleExportarXML = async (fechamento: any) => {
    if (fechamento.guias.length === 0) {
      toast.error('Nenhuma guia disponível para exportar');
      return;
    }

    setIsExporting(true);
    try {
      const guiaIds = fechamento.guias.map((g: any) => g.id);
      const { data } = await trpc.guias.exportXML.useQuery({ guiaIds }).refetch?.();
      
      if (data?.xml) {
        // Criar e baixar arquivo XML
        const blob = new Blob([data.xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || `guias_tiss_${getHojeBrasilia()}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('XML exportado com sucesso!');
        setModalXmlOpen(false);
      }
    } catch (error) {
      toast.error('Erro ao exportar XML');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDarBaixa = (fechamento: any) => {
    setFechamentoSelecionado(fechamento);
    setModalBaixaOpen(true);
  };

  const handleConfirmarBaixa = () => {
    toast.success(`Pagamento confirmado para ${fechamentoSelecionado.convenioNome}!`);
    setModalBaixaOpen(false);
  };

  const handleSelectGuia = (guiaId: number) => {
    setSelectedGuias(prev => 
      prev.includes(guiaId) 
        ? prev.filter((id: number) => id !== guiaId)
        : [...prev, guiaId]
    );
  };

  const handleSelectAll = (fechamento: any) => {
    const guiaIds = fechamento.guias.map((g: any) => g.id);
    const allSelected = guiaIds.every((id: number) => selectedGuias.includes(id));
    
    if (allSelected) {
      setSelectedGuias(prev => prev.filter((id: number) => !guiaIds.includes(id)));
    } else {
      setSelectedGuias(prev => {
        const newIds = [...prev, ...guiaIds].filter((id: number, index: number, arr: number[]) => arr.indexOf(id) === index);
        return newIds;
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Fechamento de Faturamento</h1>
        <p className="text-gray-600">Gerenciamento de fechamentos e exportação de guias</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Total de Guias</p>
          <p className="text-2xl font-bold text-gray-900">{guias.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-gray-900">R$ {guias.reduce((sum, g) => sum + parseFloat(String(g.valor) || '0'), 0).toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Fechamentos</p>
          <p className="text-2xl font-bold text-gray-900">{fechamentos.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-600 text-sm mb-1">Selecionadas</p>
          <p className="text-2xl font-bold text-gray-900">{selectedGuias.length}</p>
        </div>
      </div>

      {/* Tabela de fechamentos */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Período</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Convênio</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Guias</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Valor Total</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {fechamentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Nenhuma guia disponível para fechamento
                  </td>
                </tr>
              ) : (
                fechamentos.map((fechamento, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{fechamento.mes}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{fechamento.convenioNome}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">{fechamento.quantidadeGuias}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      R$ {fechamento.valorTotal.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {fechamento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setFechamentoSelecionado(fechamento);
                          setModalXmlOpen(true);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        XML TISS
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleDarBaixa(fechamento)}
                      >
                        Dar Baixa
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de exportação XML */}
      <Dialog open={modalXmlOpen} onOpenChange={setModalXmlOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exportar XML TISS</DialogTitle>
          </DialogHeader>
          
          {fechamentoSelecionado && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Período:</strong> {fechamentoSelecionado.mes}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Convênio:</strong> {fechamentoSelecionado.convenioNome}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Guias:</strong> {fechamentoSelecionado.quantidadeGuias}
                </p>
                <p className="text-sm text-blue-900">
                  <strong>Valor Total:</strong> R$ {fechamentoSelecionado.valorTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Guias a exportar:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <Checkbox 
                      checked={fechamentoSelecionado.guias.every((g: any) => selectedGuias.includes(g.id))}
                      onCheckedChange={() => handleSelectAll(fechamentoSelecionado)}
                    />
                    <span className="font-semibold text-sm">Selecionar todas ({fechamentoSelecionado.quantidadeGuias})</span>
                  </label>
                  
                  {fechamentoSelecionado.guias.map((guia: any) => (
                    <label key={guia.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <Checkbox 
                        checked={selectedGuias.includes(guia.id)}
                        onCheckedChange={() => handleSelectGuia(guia.id)}
                      />
                      <span className="text-sm">
                        Guia {guia.numeroGuia} - {guia.procedimento} (R$ {(guia.valor || 0).toFixed(2).replace('.', ',')})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-900">
                  <strong>Nota:</strong> O arquivo XML será gerado no padrão TISS 3.05.00 conforme especificação ANS.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setModalXmlOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleExportarXML(fechamentoSelecionado)}
                  disabled={isExporting || selectedGuias.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isExporting ? 'Exportando...' : 'Exportar XML'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de dar baixa */}
      <Dialog open={modalBaixaOpen} onOpenChange={setModalBaixaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          
          {fechamentoSelecionado && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900 mb-2">
                  <strong>Convênio:</strong> {fechamentoSelecionado.convenioNome}
                </p>
                <p className="text-sm text-green-900 mb-2">
                  <strong>Período:</strong> {fechamentoSelecionado.mes}
                </p>
                <p className="text-sm text-green-900">
                  <strong>Valor:</strong> R$ {fechamentoSelecionado.valorTotal.toFixed(2).replace('.', ',')}
                </p>
              </div>

              <div>
                <Label htmlFor="dataRecebimento">Data de Recebimento</Label>
                <Input 
                  id="dataRecebimento"
                  type="date" 
                  defaultValue={getHojeBrasilia()}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setModalBaixaOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleConfirmarBaixa}
                >
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
