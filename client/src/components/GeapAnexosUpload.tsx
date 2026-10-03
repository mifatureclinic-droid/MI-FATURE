import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileUp, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface GeapAnexosUploadProps {
  autorizacaoId: number;
  onUploadSuccess?: () => void;
  pedidoMedicoUrl?: string;
  relatorioUrl?: string;
  pedidoMedicoNomeArquivo?: string;
  relatorioNomeArquivo?: string;
}

export function GeapAnexosUpload({
  autorizacaoId,
  onUploadSuccess,
  pedidoMedicoUrl,
  relatorioUrl,
  pedidoMedicoNomeArquivo,
  relatorioNomeArquivo,
}: GeapAnexosUploadProps) {
  const [pedidoMedicoFile, setPedidoMedicoFile] = useState<File | null>(null);
  const [relatorioFile, setRelatorioFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const TAMANHO_MAX = 10 * 1024 * 1024; // 10MB

  const validarArquivo = (file: File, tipo: string) => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      toast.error(`Tipo de arquivo não permitido: ${file.type}. Use PDF ou imagem.`);
      return false;
    }
    if (file.size > TAMANHO_MAX) {
      toast.error(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo 10MB)`);
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'pedido' | 'relatorio') => {
    const file = e.target.files?.[0];
    if (file && validarArquivo(file, tipo)) {
      if (tipo === 'pedido') {
        setPedidoMedicoFile(file);
      } else {
        setRelatorioFile(file);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const handleUpload = async () => {
    if (!pedidoMedicoFile && !relatorioFile) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setUploading(true);
    try {
      const payload: any = { autorizacaoId };

      if (pedidoMedicoFile) {
        const base64 = await fileToBase64(pedidoMedicoFile);
        payload.pedidoMedicoBase64 = base64;
        payload.pedidoMedicoNomeArquivo = pedidoMedicoFile.name;
        payload.pedidoMedicoTipo = pedidoMedicoFile.type;
      }

      if (relatorioFile) {
        const base64 = await fileToBase64(relatorioFile);
        payload.relatorioBase64 = base64;
        payload.relatorioNomeArquivo = relatorioFile.name;
        payload.relatorioTipo = relatorioFile.type;
      }

      // Chamar API tRPC
      const response = await fetch('/api/trpc/geap.uploadAnexos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao fazer upload');

      toast.success('Anexos enviados com sucesso!');
      setPedidoMedicoFile(null);
      setRelatorioFile(null);
      onUploadSuccess?.();
    } catch (error) {
      toast.error('Erro ao fazer upload dos anexos');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileUp className="w-5 h-5" />
          Anexos Discriminados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pedido Médico */}
        <div className="space-y-2">
          <Label className="font-semibold text-blue-700">Pedido Médico (Obrigatório)</Label>
          {pedidoMedicoUrl ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-700">✓ {pedidoMedicoNomeArquivo}</span>
              <a href={pedidoMedicoUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e, 'pedido')}
                disabled={uploading}
              />
              {pedidoMedicoFile && (
                <div className="text-sm text-blue-600">Selecionado: {pedidoMedicoFile.name}</div>
              )}
            </div>
          )}
        </div>

        {/* Relatório */}
        <div className="space-y-2">
          <Label className="font-semibold text-blue-700">Relatório/Laudo (Obrigatório)</Label>
          {relatorioUrl ? (
            <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
              <span className="text-sm text-green-700">✓ {relatorioNomeArquivo}</span>
              <a href={relatorioUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  Baixar
                </Button>
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e, 'relatorio')}
                disabled={uploading}
              />
              {relatorioFile && (
                <div className="text-sm text-blue-600">Selecionado: {relatorioFile.name}</div>
              )}
            </div>
          )}
        </div>

        {/* Botão de Upload */}
        {(!pedidoMedicoUrl || !relatorioUrl) && (
          <Button
            onClick={handleUpload}
            disabled={uploading || (!pedidoMedicoFile && !relatorioFile)}
            className="w-full"
          >
            {uploading ? 'Enviando...' : 'Enviar Anexos'}
          </Button>
        )}

        <p className="text-xs text-gray-500">
          Formatos aceitos: PDF, JPG, PNG | Tamanho máximo: 10MB
        </p>
      </CardContent>
    </Card>
  );
}
