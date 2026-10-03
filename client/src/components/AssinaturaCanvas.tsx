import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { PenLine, Trash2, Check } from 'lucide-react';

interface AssinaturaCanvasProps {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
  sessaoNumero: number;
  pacienteNome: string;
}

export function AssinaturaCanvas({ onConfirm, onCancel, sessaoNumero, pacienteNome }: AssinaturaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setIsEmpty(false);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !lastPos.current) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;
    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="p-5 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <PenLine className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Assinatura do Paciente</h2>
              <p className="text-sm text-gray-500">
                {pacienteNome} — {sessaoNumero}ª sessão
              </p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="p-5">
          <p className="text-sm text-gray-600 mb-3">
            Peça ao paciente que assine no campo abaixo:
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white touch-none">
            <canvas
              ref={canvasRef}
              width={480}
              height={200}
              className="w-full cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          {isEmpty && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Área de assinatura — toque ou clique e arraste para assinar
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            disabled={isEmpty}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isEmpty}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check className="w-4 h-4" />
              Confirmar Assinatura
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
