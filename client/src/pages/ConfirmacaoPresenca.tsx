import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, Stethoscope, Building2, CalendarDays } from 'lucide-react';
import { formatDateBR } from '@/lib/utils';

/**
 * Página pública /confirmar-presenca?token=TOKEN
 * Permite ao paciente confirmar ou cancelar a presença na consulta via link WhatsApp.
 * Sem autenticação necessária.
 */
export default function ConfirmacaoPresenca() {
  const [location] = useLocation();

  // Suporta token tanto em query string (?token=) como em path (/confirmar-presenca/TOKEN)
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const tokenFromQuery = searchParams.get('token');
  const tokenFromPath = location.split('/confirmar-presenca/')[1]?.split('?')[0] || '';
  const token = tokenFromQuery || tokenFromPath;

  const [processando, setProcessando] = useState(false);

  // Buscar dados da consulta pelo token (rota pública)
  const { data: consulta, isLoading, error } = trpc.confirmacaoAtendimento.getByToken.useQuery(
    { token: token || '' },
    { enabled: !!token, retry: false }
  );

  // Mutation para confirmar ou cancelar (rota pública)
  const confirmarMutation = trpc.confirmacaoAtendimento.confirmarPorToken.useMutation();

  const handleAcao = async (acao: 'confirmado' | 'cancelado') => {
    if (!token) return;
    setProcessando(true);
    try {
      await confirmarMutation.mutateAsync({ token, acao });
    } finally {
      setProcessando(false);
    }
  };

  // Token ausente
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Link Inválido</CardTitle>
            <CardDescription>O link de confirmação está incompleto ou foi mal copiado.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Sucesso após confirmar/cancelar
  if (confirmarMutation.isSuccess) {
    const acao = confirmarMutation.variables?.acao;
    const confirmado = acao === 'confirmado';
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className={`w-16 h-16 ${confirmado ? 'text-green-500' : 'text-orange-500'}`} />
            </div>
            <CardTitle className="text-2xl">
              {confirmado ? 'Presença Confirmada!' : 'Cancelamento Registrado'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {confirmado
                ? 'Obrigado por confirmar sua presença. Te esperamos na consulta!'
                : 'Seu cancelamento foi registrado. Entre em contato para reagendar.'}
            </p>
            {consulta && (
              <p className="text-sm text-gray-500">
                {formatDateBR(consulta.data as any)} às {consulta.hora}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Erro ao buscar dados
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Link Inválido ou Expirado</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">
              {error.message?.includes('expirado') || error.message?.includes('inválido')
                ? 'O link expirou ou é inválido. Solicite um novo link de confirmação.'
                : 'Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <Clock className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <CardTitle>Carregando dados da consulta...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Dados não encontrados
  if (!consulta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Consulta Não Encontrada</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const jaRespondeu = consulta.confirmacaoStatus === 'confirmado' || consulta.confirmacaoStatus === 'cancelado';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          {(consulta as any).clinicaLogoUrl && (
            <div className="flex justify-center mb-3">
              <img
                src={(consulta as any).clinicaLogoUrl}
                alt={(consulta as any).clinicaNome || 'Clínica'}
                style={{ height: 60, maxWidth: 200, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
            </div>
          )}
          <CardTitle className="text-2xl">{(consulta as any).clinicaNome || 'Confirmação de Presença'}</CardTitle>
          <CardDescription className="text-blue-100">
            Confirme sua presença na consulta agendada
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">

          {/* Informações da Consulta */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Dados da Consulta
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Data</p>
                <p className="font-semibold text-gray-900">
                  {formatDateBR(consulta.data as any)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Hora</p>
                <p className="font-semibold text-gray-900">{consulta.hora}</p>
              </div>
              <div>
                <p className="text-gray-500">Tipo</p>
                <p className="font-semibold text-gray-900 capitalize">{consulta.tipo}</p>
              </div>
              <div>
                <p className="text-gray-500">Paciente</p>
                <p className="font-semibold text-gray-900">{consulta.pacienteNome}</p>
              </div>
            </div>
          </div>

          {/* Profissional */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-green-600" />
              Profissional
            </h3>
            <p className="font-semibold text-gray-900">{consulta.profissionalNome}</p>
            {consulta.profissionalEspecialidade && (
              <p className="text-sm text-gray-600">{consulta.profissionalEspecialidade}</p>
            )}
          </div>

          {/* Convênio */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Convênio
            </h3>
            <p className="font-semibold text-gray-900">{consulta.convenioNome}</p>
          </div>

          {/* Aviso se já respondeu */}
          {jaRespondeu && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">Nota:</span> Você já{' '}
                {consulta.confirmacaoStatus === 'confirmado' ? 'confirmou sua presença' : 'cancelou'} nesta consulta.
                Pode alterar sua resposta abaixo.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-2">
            <Button
              onClick={() => handleAcao('confirmado')}
              disabled={processando}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {processando ? 'Processando...' : '✓ Confirmar Presença'}
            </Button>
            <Button
              onClick={() => handleAcao('cancelado')}
              disabled={processando}
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50 bg-white"
              size="lg"
            >
              {processando ? 'Processando...' : '✗ Cancelar'}
            </Button>
          </div>

          {/* Rodapé */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>Dúvidas? Entre em contato pelo WhatsApp da clínica.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
