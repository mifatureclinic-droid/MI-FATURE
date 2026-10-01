import { AlertTriangle, CalendarDays, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';
import { aplicarCienciaNoAviso } from '../../../shared/avisoFeriadoEstado';

export function AlertaFeriadoProfissionais() {
  const utils = trpc.useUtils();
  const { data: aviso, isLoading } = trpc.avisosProfissionais.feriadoSetembro.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  const registrarCiencia = trpc.avisosProfissionais.registrarCienciaFeriado.useMutation({
    onSuccess: async (resultado) => {
      utils.avisosProfissionais.feriadoSetembro.setData(undefined, avisoAtual => aplicarCienciaNoAviso(avisoAtual));
      void utils.avisosProfissionais.feriadoSetembro.invalidate();
      toast.success('Ciência registrada com sucesso. Obrigado!');
      if (!resultado.emailEnviado) {
        toast.info('O registro foi encaminhado como notificação interna; o e-mail será enviado após a configuração do serviço.');
      }
    },
    onError: (erro) => toast.error(erro.message || 'Não foi possível registrar a ciência.'),
  });

  const aberto = Boolean(!isLoading && aviso?.exibir);

  return (
    <Dialog open={aberto}>
      <DialogContent
        className="max-w-xl border-amber-300 bg-amber-50/95"
        onEscapeKeyDown={(evento) => evento.preventDefault()}
        onPointerDownOutside={(evento) => evento.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            {aviso?.titulo || 'Atenção'}
          </DialogTitle>
          <DialogDescription className="sr-only">Aviso obrigatório para profissionais</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-200 bg-white p-5 text-amber-950 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-800">
            <CalendarDays className="h-4 w-4" />
            Aviso válido até 18/08/2026
          </div>
          <p className="whitespace-pre-line text-base leading-7">{aviso?.mensagem}</p>
          <p className="mt-4 text-sm text-amber-800">
            Ao dar ciência, este aviso será ocultado hoje e reaparecerá no próximo acesso, no dia seguinte, durante o período de vigência.
          </p>
        </div>

        <Button
          className="h-11 w-full bg-amber-600 text-white hover:bg-amber-700"
          onClick={() => registrarCiencia.mutate()}
          disabled={registrarCiencia.isPending}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          {registrarCiencia.isPending ? 'Registrando ciência...' : 'Estou ciente'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default AlertaFeriadoProfissionais;
