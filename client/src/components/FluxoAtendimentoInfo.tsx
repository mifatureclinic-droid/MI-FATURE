import { ArrowRight, Calendar, ClipboardList, FileText, DollarSign, CheckCircle } from 'lucide-react';

export function FluxoAtendimentoInfo() {
  const steps = [
    {
      icon: Calendar,
      title: 'Agendamento',
      description: 'Consulta marcada com autorização validada',
      color: 'blue'
    },
    {
      icon: ClipboardList,
      title: 'Prontuário',
      description: 'Atendimento realizado e documentado',
      color: 'purple'
    },
    {
      icon: FileText,
      title: 'Guia SP/SADT',
      description: 'Gerada automaticamente conforme TISS',
      color: 'green'
    },
    {
      icon: DollarSign,
      title: 'Faturamento',
      description: 'Enviado para fechamento mensal',
      color: 'orange'
    },
    {
      icon: CheckCircle,
      title: 'Concluído',
      description: 'Aguardando pagamento do convênio',
      color: 'emerald'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      emerald: 'bg-emerald-100 text-emerald-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-xl mb-2">Fluxo Integrado de Atendimento</h3>
      <p className="text-sm text-gray-600 mb-6">
        Sistema automatizado desde o agendamento até o faturamento
      </p>

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${getColorClasses(step.color)} flex items-center justify-center mb-3`}>
                  <Icon className="w-8 h-8" />
                </div>
                <p className="text-sm text-center mb-1">{step.title}</p>
                <p className="text-xs text-gray-600 text-center max-w-[120px]">
                  {step.description}
                </p>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-gray-400 mx-4 mb-16" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
