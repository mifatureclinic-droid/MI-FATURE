import { useState, useEffect } from 'react';
import { MessageCircle, Send, CheckCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface MensagemWhatsAppProps {
  paciente: {
    nome: string;
    telefone: string;
    whatsapp?: string;
  };
  consulta: {
    data: string;
    hora: string;
    profissional: string;
    especialidade?: string;
  };
  envioAutomatico?: boolean;
}

export function MensagemWhatsApp({ paciente, consulta, envioAutomatico = false }: MensagemWhatsAppProps) {
  const [mensagemEnviada, setMensagemEnviada] = useState(false);

  const gerarMensagem = () => {
    const mensagem = `🏥 *CONFIRMAÇÃO DE CONSULTA - MIFATURE*

Olá, *${paciente.nome}*!

Você tem uma consulta agendada:

📅 *Data:* ${consulta.data}
⏰ *Horário:* ${consulta.hora}
👨‍⚕️ *Profissional:* ${consulta.profissional}
${consulta.especialidade ? `🩺 *Especialidade:* ${consulta.especialidade}` : ''}

Por favor, confirme sua presença respondendo:
✅ *SIM* - Para confirmar
❌ *NÃO* - Para cancelar

⚠️ Em caso de cancelamento, favor avisar com antecedência mínima de 24h.

Atenciosamente,
Equipe MIFATURE`;

    return mensagem;
  };

  const enviarWhatsApp = () => {
    const numero = (paciente.whatsapp || paciente.telefone).replace(/\D/g, '');
    const mensagem = encodeURIComponent(gerarMensagem());
    
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, '_blank');
    
    setMensagemEnviada(true);
    toast.success(`Mensagem de confirmação enviada para ${paciente.nome}`);
    
    // Registrar no log/histórico
    console.log({
      paciente: paciente.nome,
      telefone: numero,
      consulta: consulta,
      dataEnvio: new Date().toISOString(),
      tipo: 'confirmacao_consulta'
    });
  };

  // Envio automático se configurado e 24h antes
  useEffect(() => {
    if (envioAutomatico && !mensagemEnviada) {
      const dataConsulta = new Date(`${consulta.data} ${consulta.hora}`);
      const agora = new Date();
      const diferencaHoras = (dataConsulta.getTime() - agora.getTime()) / (1000 * 60 * 60);
      
      // Se faltam entre 23 e 25 horas para a consulta, envia automaticamente
      if (diferencaHoras >= 23 && diferencaHoras <= 25) {
        setTimeout(() => {
          enviarWhatsApp();
        }, 1000);
      }
    }
  }, [envioAutomatico, mensagemEnviada]);

  return (
    <div className="flex items-center gap-2">
      {mensagemEnviada ? (
        <div className="flex items-center gap-2 text-green-600 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Enviada</span>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={enviarWhatsApp}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Enviar Confirmação
        </Button>
      )}
    </div>
  );
}

// Hook para agendar envios automáticos
export function useEnvioAutomaticoWhatsApp() {
  const [consultasParaEnviar, setConsultasParaEnviar] = useState<any[]>([]);

  useEffect(() => {
    // Verifica a cada hora se há consultas para enviar confirmação
    const interval = setInterval(() => {
      verificarConsultasPendentes();
    }, 60 * 60 * 1000); // A cada 1 hora

    // Verifica imediatamente ao carregar
    verificarConsultasPendentes();

    return () => clearInterval(interval);
  }, []);

  const verificarConsultasPendentes = () => {
    // Aqui você buscaria do backend as consultas agendadas
    // Filtraria as que estão a 24h de acontecer
    // E que o paciente tem confirmação automática ativada
    // E que ainda não receberam mensagem

    // Mockado para demonstração
    const consultasMock = [
      {
        id: 1,
        paciente: { nome: 'Maria Silva', whatsapp: '11987654321', confirmacaoAutomatica: true },
        data: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
        hora: '10:00',
        profissional: 'Dr. João Silva',
        mensagemEnviada: false
      }
    ];

    const agora = new Date();
    const consultasPendentes = consultasMock.filter(consulta => {
      if (consulta.mensagemEnviada || !consulta.paciente.confirmacaoAutomatica) {
        return false;
      }

      const dataConsulta = new Date(`${consulta.data} ${consulta.hora}`);
      const diferencaHoras = (dataConsulta.getTime() - agora.getTime()) / (1000 * 60 * 60);
      
      return diferencaHoras >= 23 && diferencaHoras <= 25;
    });

    if (consultasPendentes.length > 0) {
      setConsultasParaEnviar(consultasPendentes);
      toast.info(`${consultasPendentes.length} mensagem(ns) de confirmação agendada(s)`, {
        icon: <Clock className="w-4 h-4" />
      });
    }
  };

  return { consultasParaEnviar };
}
