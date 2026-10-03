import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { LoadingButton } from './LoadingButton';

interface CSVUploadPacientesProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVUploadPacientes({ isOpen, onClose, onSuccess }: CSVUploadPacientesProps) {
  const [csvContent, setCsvContent] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [resultado, setResultado] = useState<any>(null);
  const importMutation = trpc.pacientes.importarCSV.useMutation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent) {
      toast.error('Por favor, selecione um arquivo CSV');
      return;
    }

    try {
      const res = await importMutation.mutateAsync({ csvContent });
      setResultado(res);
      
      if (res.importados > 0) {
        toast.success(`${res.importados} pacientes importados com sucesso!`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      }
    } catch (erro: any) {
      toast.error(erro.message || 'Erro ao importar pacientes');
    }
  };

  const handleClose = () => {
    setCsvContent('');
    setResultado(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Pacientes via CSV</DialogTitle>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4">
            {/* Instruções */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Formato do CSV:</h3>
              <p className="text-sm text-blue-800">
                nome, cpf, dataNascimento, email, telefone, whatsapp, recebeLembretesWhatsapp, endereco, cidade, estado, cep, cartaoSUS, pedidoMedicoUrl, dataVencimentoPedido, anexoUrl
              </p>
              <p className="text-xs text-blue-700 mt-2">
                * Apenas nome, CPF e data de nascimento são obrigatórios. Os demais campos são opcionais.
              </p>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary'
              }`}
            >
              <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Arraste o arquivo CSV aqui ou clique para selecionar
              </p>
              <p className="text-xs text-gray-500">
                Máximo 10MB
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer" />
            </div>

            {/* CSV Preview */}
            {csvContent && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Preview do CSV:</h3>
                  <button
                    onClick={() => setCsvContent('')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white rounded border border-gray-200 p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                    {csvContent.split('\n').slice(0, 5).join('\n')}
                    {csvContent.split('\n').length > 5 && '\n...'}
                  </pre>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total de linhas: {csvContent.split('\n').length - 1}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <LoadingButton
                onClick={handleImport}
                disabled={!csvContent}
                loadingMessage="Importando..."
              >
                Importar Pacientes
              </LoadingButton>
            </div>
          </div>
        ) : (
          /* Resultado */
          <div className="space-y-4">
            {resultado.importados > 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">Importação bem-sucedida!</h3>
                  <p className="text-sm text-green-800">
                    {resultado.importados} de {resultado.processados} pacientes foram importados
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Erro na importação</h3>
                  <p className="text-sm text-red-800">
                    Nenhum paciente foi importado. Verifique os erros abaixo.
                  </p>
                </div>
              </div>
            )}

            {/* Erros de Validação */}
            {resultado.validacaoErros && resultado.validacaoErros.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Erros de Validação:</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {resultado.validacaoErros.map((erro: any, idx: number) => (
                    <p key={idx} className="text-xs text-yellow-800">
                      Linha {erro.linha}: {erro.erro}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Erros de Importação */}
            {resultado.erros && resultado.erros.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Erros de Importação:</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {resultado.erros.map((erro: any, idx: number) => (
                    <p key={idx} className="text-xs text-red-800">
                      <strong>{erro.nome}:</strong> {erro.erro}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{resultado.total}</p>
                <p className="text-xs text-gray-600">Total de linhas</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{resultado.importados}</p>
                <p className="text-xs text-gray-600">Importados</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{resultado.falhados}</p>
                <p className="text-xs text-gray-600">Falhados</p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              {resultado.importados > 0 && (
                <Button onClick={handleClose} className="bg-primary hover:bg-primary/90">
                  Voltar para Pacientes
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
