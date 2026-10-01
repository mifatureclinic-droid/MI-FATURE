import { useRef, useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { CheckCircle, AlertTriangle, Loader2, PenLine, Trash2, FileText } from 'lucide-react';

interface AssinarContratoProps {
  token: string;
}

export default function AssinarContrato({ token }: AssinarContratoProps) {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [assinado, setAssinado] = useState(false);
  const [lido, setLido] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const { data: contrato, isLoading, error } = trpc.contratos.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const assinarMutation = trpc.contratos.assinarPorToken.useMutation({
    onSuccess: () => {
      setAssinado(true);
      toast.success('Contrato assinado com sucesso!');
    },
    onError: (e) => toast.error(e.message),
  });

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [contrato]);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setHasSignature(true);
    const pos = getPos(e, canvas);
    setLastPos(pos);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => setIsDrawing(false);

  const limparAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const confirmarAssinatura = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataUrl = canvas.toDataURL('image/png');
    assinarMutation.mutate({ token, assinaturaPacienteUrl: dataUrl });
  };

  // ─── Estados de carregamento e erro ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-gray-600">A carregar contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contrato) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link inválido</h2>
          <p className="text-gray-500 text-sm">
            {error?.message || 'Este link de assinatura não existe ou já expirou.'}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Contacte a clínica para obter um novo link.
          </p>
        </div>
      </div>
    );
  }

  // ─── Já assinado ───
  if (contrato.assinado || assinado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Contrato Assinado!</h2>
          <p className="text-gray-500 text-sm mb-4">
            O seu contrato terapêutico foi assinado com sucesso e registado no sistema da clínica.
          </p>
          {contrato.dataAssinatura && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
              Assinado em {new Date(contrato.dataAssinatura).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Página de assinatura ───
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-green-700 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-md">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">Contrato Terapêutico</h1>
          <p className="text-green-200 text-xs">Leia e assine digitalmente</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Aviso de leitura */}
        {!lido && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Leia o contrato completo</p>
              <p className="text-xs text-amber-600 mt-0.5">Role até ao final para habilitar a assinatura.</p>
            </div>
          </div>
        )}

        {/* Documento A4 */}
        <div
          className="bg-white rounded-xl shadow-md overflow-hidden"
          style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
          {/* Cabeçalho do documento */}
          <div className="bg-green-700 text-white text-center py-5 px-4">
            <h2 className="text-lg font-bold tracking-wide">CONTRATO TERAPÊUTICO</h2>
            <p className="text-green-200 text-xs mt-1">Documento Digital com Validade Jurídica</p>
          </div>

          {/* Conteúdo */}
          <div className="p-5">
            <pre
              className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {contrato.conteudo}
            </pre>
          </div>

          {/* Linha de separação */}
          <div className="mx-5 border-t border-gray-200" />

          {/* Secção de assinatura */}
          <div className="p-5 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <PenLine className="w-5 h-5 text-green-700" />
              <h3 className="font-bold text-gray-800 text-sm">Assinatura Digital do Paciente</h3>
            </div>

            {!lido ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 mb-3">Role para cima para ler o contrato completo</p>
                <Button
                  onClick={() => setLido(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Li e compreendi o contrato
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  Assine no campo abaixo usando o dedo ou caneta do seu telemóvel:
                </p>

                <div className="relative border-2 border-dashed border-green-300 rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={160}
                    className="w-full touch-none cursor-crosshair"
                    style={{ display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-gray-300 text-sm select-none">Assine aqui</p>
                    </div>
                  )}
                </div>

                {/* Linha de assinatura */}
                <div className="flex items-center gap-2 px-2">
                  <div className="flex-1 border-b-2 border-gray-400" />
                  <span className="text-xs text-gray-400">Assinatura</span>
                  <div className="flex-1 border-b-2 border-gray-400" />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={limparAssinatura}
                    className="flex-1 text-gray-600"
                    disabled={!hasSignature}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={confirmarAssinatura}
                    disabled={!hasSignature || assinarMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {assinarMutation.isPending
                      ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      : <CheckCircle className="w-4 h-4 mr-1" />}
                    Confirmar Assinatura
                  </Button>
                </div>

                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Ao confirmar, declaro que li e concordo com todos os termos deste contrato.
                  Esta assinatura digital tem validade jurídica conforme a Lei nº 14.063/2020.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center text-xs text-gray-400 pb-8">
          <p>Documento gerado pelo sistema MIFATURE</p>
          <p>Link válido por 7 dias a partir da geração</p>
        </div>
      </div>
    </div>
  );
}
