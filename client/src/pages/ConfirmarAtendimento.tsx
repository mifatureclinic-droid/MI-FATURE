/**
 * Página pública /confirmar-atendimento/:token
 * Permite ao paciente confirmar ou cancelar o atendimento via link WhatsApp.
 * Optimizada para telemóvel — sem autenticação necessária.
 */
import { useState } from 'react';
import { useParams } from 'wouter';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Calendar, Clock, User, Building2, Loader2, AlertCircle } from 'lucide-react';
import { formatarDataConfirmacaoManaus } from '@shared/dataConfirmacaoAtendimento';

export function ConfirmarAtendimento({ token: tokenProp }: { token?: string } = {}) {
  const params = useParams<{ token: string }>();
  const token = tokenProp || params.token;
  const [resultado, setResultado] = useState<'confirmado' | 'cancelado' | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const { data: atendimento, isLoading, error: queryError } = trpc.confirmacaoAtendimento.getByToken.useQuery(
    { token: token! },
    { enabled: !!token, retry: false }
  );

  const confirmarMutation = trpc.confirmacaoAtendimento.confirmarPorToken.useMutation({
    onSuccess: (data) => {
      setResultado(data.acao as 'confirmado' | 'cancelado');
    },
    onError: (e) => {
      setErro(e.message || 'Erro ao processar. Tente novamente.');
    },
  });

  const handleAcao = (acao: 'confirmado' | 'cancelado') => {
    if (!token) return;
    confirmarMutation.mutate({ token, acao });
  };

  // Já respondeu
  if (resultado) {
    const isConfirmado = resultado === 'confirmado';
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`py-8 px-6 text-center ${isConfirmado ? 'bg-green-600' : 'bg-red-500'}`}>
            {isConfirmado
              ? <CheckCircle className="w-16 h-16 text-white mx-auto mb-3" />
              : <XCircle className="w-16 h-16 text-white mx-auto mb-3" />}
            <h1 className="text-xl font-bold text-white">
              {isConfirmado ? 'Presença Confirmada!' : 'Atendimento Cancelado'}
            </h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 text-sm leading-relaxed">
              {isConfirmado
                ? 'Obrigado por confirmar. Aguardamos a sua presença no dia e horário agendados.'
                : 'O seu cancelamento foi registado. Entre em contacto com a clínica para reagendar.'}
            </p>
            <p className="text-xs text-gray-400 mt-4">Sistema MIFATURE</p>
          </div>
        </div>
      </div>
    );
  }

  // Já respondeu anteriormente (status do BD)
  if (atendimento && (atendimento as any).confirmacaoStatus && (atendimento as any).confirmacaoStatus !== 'pendente') {
    const status = (atendimento as any).confirmacaoStatus as string;
    const isConfirmado = status === 'confirmado';
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`py-8 px-6 text-center ${isConfirmado ? 'bg-green-600' : 'bg-red-500'}`}>
            {isConfirmado
              ? <CheckCircle className="w-16 h-16 text-white mx-auto mb-3" />
              : <XCircle className="w-16 h-16 text-white mx-auto mb-3" />}
            <h1 className="text-xl font-bold text-white">
              {isConfirmado ? 'Presença já Confirmada' : 'Atendimento já Cancelado'}
            </h1>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 text-sm">
              {isConfirmado
                ? 'A sua presença já foi confirmada anteriormente.'
                : 'O cancelamento já foi registado anteriormente.'}
            </p>
            <p className="text-xs text-gray-400 mt-4">Sistema MIFATURE</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  if (queryError || !atendimento) {
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Cabeçalho */}
        <div className="bg-green-700 text-white rounded-2xl p-6 text-center shadow-lg">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-90" />
          <h1 className="text-lg font-bold">Confirmação de Consulta</h1>
          <p className="text-green-200 text-xs mt-1">MIFATURE — Sistema de Saúde</p>
        </div>

        {/* Dados do atendimento */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalhes da Consulta</p>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Paciente</p>
                <p className="text-sm font-semibold text-gray-800">{atendimento.pacienteNome}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Profissional</p>
                <p className="text-sm font-semibold text-gray-800">{atendimento.profissionalNome}</p>
                <p className="text-xs text-gray-400">{atendimento.profissionalEspecialidade}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Data</p>
                <p className="text-sm font-semibold text-gray-800">{formatarDataConfirmacaoManaus(atendimento.data)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Horário</p>
                <p className="text-sm font-semibold text-gray-800">{atendimento.hora}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Convénio</p>
                <p className="text-sm font-semibold text-gray-800">{atendimento.convenioNome}</p>
              </div>
            </div>
            {atendimento.tipo && (
              <div className="bg-blue-50 rounded-lg px-3 py-2">
                <p className="text-xs text-blue-700 font-medium">{atendimento.tipo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botões de acção */}
        <div className="bg-white rounded-2xl shadow-md p-5 space-y-3">
          <p className="text-sm text-gray-600 text-center font-medium">
            Irá comparecer à sua consulta?
          </p>
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
              {erro}
            </div>
          )}
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-base font-semibold rounded-xl"
            onClick={() => handleAcao('confirmado')}
            disabled={confirmarMutation.isPending}
          >
            {confirmarMutation.isPending
              ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
              : <CheckCircle className="w-5 h-5 mr-2" />}
            Sim, vou comparecer
          </Button>
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50 h-12 text-base font-semibold rounded-xl"
            onClick={() => handleAcao('cancelado')}
            disabled={confirmarMutation.isPending}
          >
            {confirmarMutation.isPending
              ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
              : <XCircle className="w-5 h-5 mr-2" />}
            Não poderei comparecer
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Em caso de dúvidas, entre em contacto com a clínica.
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">Sistema MIFATURE</p>
      </div>
    </div>
  );
}

export default ConfirmarAtendimento;
