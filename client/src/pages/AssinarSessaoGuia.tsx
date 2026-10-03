/**
 * Página pública /assinar-sessao/:token
 * Permite ao paciente assinar cada sessão individualmente via link WhatsApp.
 * Optimizada para telemóvel — sem autenticação necessária.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { CheckCircle, PenLine, Trash2, Loader2, AlertCircle, FileText, User, Building2, Calendar } from 'lucide-react';

// Componente de canvas de assinatura para uma sessão individual
function SessaoAssinaturaCanvas({
  sessaoNumero,
  dataFormatada,
  onAssinaturaChange,
}: {
  sessaoNumero: number;
  dataFormatada: string;
  onAssinaturaChange: (sessao: number, dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    // Notificar o pai com o dataUrl actualizado
    onAssinaturaChange(sessaoNumero, canvas.toDataURL('image/png'));
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(false);
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onAssinaturaChange(sessaoNumero, null);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Cabeçalho da sessão */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ background: 'linear-gradient(90deg, #3d5229 0%, #2d3d1e 100%)' }}>
        <span className="w-7 h-7 rounded-full bg-white text-xs font-bold flex items-center justify-center flex-shrink-0" style={{ color: '#3d5229' }}>
          {sessaoNumero}
        </span>
        <div>
          <p className="font-semibold text-white text-sm">{sessaoNumero}ª Sessão</p>
          <p className="text-xs" style={{ color: '#c9a96e' }}>{dataFormatada}</p>
        </div>
        {hasSignature && <CheckCircle className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: '#c9a96e' }} />}
      </div>
      {/* Canvas */}
      <div className="p-3 space-y-2">
        <p className="text-xs text-gray-500">Assine abaixo para confirmar esta sessão:</p>
        <div className="relative border-2 border-dashed rounded-xl overflow-hidden bg-white" style={{ borderColor: hasSignature ? '#3d5229' : '#c9a96e' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={140}
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
        <Button
          variant="outline"
          size="sm"
          onClick={limpar}
          disabled={!hasSignature}
          className="w-full text-gray-500 text-xs"
        >
          <Trash2 className="w-3 h-3 mr-1" /> Limpar assinatura
        </Button>
      </div>
    </div>
  );
}

export function AssinarSessaoGuia({ token: tokenProp }: { token?: string } = {}) {
  const params = useParams<{ token: string }>();
  const token = tokenProp || params.token;

  const [assinaturas, setAssinaturas] = useState<Record<number, string | null>>({});
  const [assinado, setAssinado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: sessao, isLoading, error: queryError } = trpc.assinaturaGuiaWhatsApp.getByToken.useQuery(
    { token: token! },
    { enabled: !!token, retry: false }
  );

  const assinarMutation = trpc.assinaturaGuiaWhatsApp.assinarPorToken.useMutation({
    onSuccess: () => setAssinado(true),
    onError: (e) => setErro(e.message || 'Erro ao assinar. Tente novamente.'),
  });

  // Parsear datas do link
  let datasAtend: string[] = [];
  if (sessao && (sessao as any).datasAtendimento) {
    try { datasAtend = JSON.parse((sessao as any).datasAtendimento); } catch {}
  }
  // Ordenar as datas cronologicamente (crescente) antes de exibir
  const datasAtendOrdenadas = [...datasAtend].sort((a, b) => a.localeCompare(b));
  // Se não há datas no link, usar a data do agendamento como sessão única
  const sessoes = datasAtendOrdenadas.length > 0
    ? datasAtendOrdenadas.map((d, i) => ({
        numero: i + 1,
        data: d,
        dataFormatada: new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      }))
    : [{
        numero: sessao?.sessaoNumero ?? 1,
        data: (sessao as any)?.dataAtendimento ?? '',
        dataFormatada: (sessao as any)?.dataAtendimento
          ? new Date((sessao as any).dataAtendimento + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
          : 'Data não informada',
      }];

  const handleAssinaturaChange = useCallback((sessaoNumero: number, dataUrl: string | null) => {
    setAssinaturas(prev => ({ ...prev, [sessaoNumero]: dataUrl }));
  }, []);

  // Verificar se todas as sessões foram assinadas
  const todasAssinadas = sessoes.length > 0 && sessoes.every(s => !!assinaturas[s.numero]);

  const confirmarTudo = () => {
    if (!token || !todasAssinadas) return;
    // Enviar a assinatura da 1ª sessão como principal e o array completo de assinaturas individuais
    const primeiraAssinatura = assinaturas[sessoes[0].numero];
    if (!primeiraAssinatura) return;
    // Construir array ordenado de assinaturas (uma por sessão)
    const assinaturasPorSessao = sessoes.map(s => assinaturas[s.numero] ?? primeiraAssinatura);
    assinarMutation.mutate({
      token,
      assinaturaPacienteUrl: primeiraAssinatura,
      assinaturasPorSessao,
    });
  };

  // Ecrã de sucesso
  if (assinado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)' }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="py-8 px-6 text-center" style={{ background: 'linear-gradient(135deg, #3d5229 0%, #2d3d1e 100%)' }}>
            <CheckCircle className="w-16 h-16 mx-auto mb-3" style={{ color: '#c9a96e' }} />
            <h1 className="text-xl font-bold text-white">
              {sessoes.length > 1 ? `${sessoes.length} Sessões Assinadas!` : 'Sessão Assinada!'}
            </h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              {sessoes.length > 1
                ? `A sua assinatura foi registada com sucesso para ${sessoes.length} sessões:`
                : 'A sua assinatura foi registada com sucesso. Obrigado!'}
            </p>
            {sessoes.length > 1 && (
              <div className="space-y-1 text-left">
                {sessoes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: '#3d5229' }} />
                    <span>{s.numero}ª Sessão — {s.dataFormatada}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs mt-4" style={{ color: '#8a9a7a' }}>Sistema MIFATURE</p>
          </div>
        </div>
      </div>
    );
  }

  // Sessão já assinada anteriormente
  if (sessao && sessao.assinaturaPacienteUrl && sessao.assinaturaPacienteUrl.length > 10) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)' }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="py-8 px-6 text-center" style={{ background: 'linear-gradient(135deg, #3d5229 0%, #2d3d1e 100%)' }}>
            <CheckCircle className="w-16 h-16 mx-auto mb-3" style={{ color: '#c9a96e' }} />
            <h1 className="text-xl font-bold text-white">Sessão já Assinada</h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 text-sm">Esta sessão já foi assinada anteriormente.</p>
            <p className="text-xs mt-4" style={{ color: '#8a9a7a' }}>Sistema MIFATURE</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)' }}>
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" style={{ color: '#3d5229' }} />
          <p className="text-sm" style={{ color: '#5a6b4a' }}>A carregar...</p>
        </div>
      </div>
    );
  }

  if (queryError || !sessao) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="py-8 px-6 text-center bg-red-500">
            <AlertCircle className="w-16 h-16 text-white mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white">Link Inválido</h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 text-sm leading-relaxed">
              Este link é inválido ou já expirou. Entre em contacto com a clínica para obter um novo link.
            </p>
            <p className="text-xs text-gray-400 mt-4">Sistema MIFATURE</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-8" style={{ background: 'linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 100%)' }}>
      <div className="w-full max-w-sm mx-auto space-y-4">
        {/* Cabeçalho */}
        <div className="rounded-2xl p-6 text-center shadow-lg" style={{ background: 'linear-gradient(135deg, #3d5229 0%, #2d3d1e 100%)' }}>
          <div className="mx-auto mb-3 h-24 w-32 overflow-hidden rounded-xl bg-white">
            <img
              src="/logo-mifature.png"
              alt="MIFATURE"
              className="h-full w-full object-cover scale-[1.45]"
            />
          </div>
          <div className="border-t border-white/20 pt-3 mt-1">
            {(sessao as any).nomeClinica && (
              <p className="text-sm font-bold text-white mb-1 tracking-widest uppercase" style={{ letterSpacing: '0.12em' }}>{(sessao as any).nomeClinica}</p>
            )}
            <h1 className="text-base font-semibold text-white tracking-wide">
              {sessoes.length > 1 ? `Assinatura de ${sessoes.length} Sessões` : 'Assinatura de Sessão'}
            </h1>
            <p className="text-xs mt-1" style={{ color: '#c9a96e' }}>Guia SADT — Assinatura Digital com Validade Jurídica</p>
          </div>
        </div>

        {/* Dados do paciente / guia */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dados da Guia</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3d5229' }} />
              <div>
                <p className="text-xs text-gray-500">Paciente</p>
                <p className="text-sm font-semibold text-gray-800">{sessao.pacienteNome}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#3d5229' }} />
              <div>
                <p className="text-xs text-gray-500">Profissional</p>
                <p className="text-sm font-semibold text-gray-800">{sessao.profissionalNome}</p>
                <p className="text-xs text-gray-400">{sessao.profissionalEspecialidade}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Convênio</p>
                <p className="text-sm font-semibold text-gray-800">{sessao.convenioNome}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9a96e' }} />
              <div>
                <p className="text-xs text-gray-500">Guia / Procedimento</p>
                <p className="text-sm font-semibold text-gray-800">{sessao.guiaNumero}</p>
                <p className="text-xs text-gray-400">{sessao.guiaProcedimento}</p>
              </div>
            </div>
            {/* Resumo das sessões a assinar */}
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#c9a96e' }} />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">
                  {sessoes.length === 1 ? 'Sessão a assinar' : `${sessoes.length} sessões a assinar`}
                </p>
                <div className="space-y-0.5">
                  {sessoes.map((s, i) => (
                    <p key={i} className="text-sm font-semibold text-gray-800">
                      {s.numero}ª — {s.dataFormatada}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="rounded-xl px-4 py-3 text-sm text-center font-medium" style={{ background: '#f0ebe0', color: '#3d5229', border: '1px solid #c9a96e' }}>
          {sessoes.length > 1
            ? `Assine cada uma das ${sessoes.length} sessões abaixo individualmente`
            : 'Assine no campo abaixo para confirmar a sessão'}
        </div>

        {/* Um canvas por sessão */}
        {sessoes.map((s) => (
          <SessaoAssinaturaCanvas
            key={s.numero}
            sessaoNumero={s.numero}
            dataFormatada={s.dataFormatada}
            onAssinaturaChange={handleAssinaturaChange}
          />
        ))}

        {/* Progresso */}
        {sessoes.length > 1 && (
          <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Progresso</span>
              <span>{Object.values(assinaturas).filter(Boolean).length} / {sessoes.length} assinadas</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(Object.values(assinaturas).filter(Boolean).length / sessoes.length) * 100}%`,
                  background: '#3d5229',
                }}
              />
            </div>
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600">
            {erro}
          </div>
        )}

        {/* Botão de confirmação */}
        <Button
          size="lg"
          onClick={confirmarTudo}
          disabled={!todasAssinadas || assinarMutation.isPending}
          className="w-full text-white text-base font-semibold py-4"
          style={{ background: todasAssinadas ? '#3d5229' : '#9ca3af' }}
        >
          {assinarMutation.isPending
            ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> A registar...</>
            : <><CheckCircle className="w-5 h-5 mr-2" />
              {todasAssinadas
                ? sessoes.length > 1 ? `Confirmar ${sessoes.length} Assinaturas` : 'Confirmar Assinatura'
                : `Assine todas as ${sessoes.length} sessões para continuar`}
            </>}
        </Button>

        <p className="text-xs text-gray-400 text-center leading-relaxed px-2">
          Ao confirmar, declaro que compareci às sessões indicadas e autorizo o registo das assinaturas digitais.
          Esta assinatura tem validade jurídica conforme a Lei nº 14.063/2020.
        </p>

        <p className="text-center text-xs pb-4" style={{ color: '#8a9a7a' }}>Sistema MIFATURE</p>
      </div>
    </div>
  );
}

export default AssinarSessaoGuia;
