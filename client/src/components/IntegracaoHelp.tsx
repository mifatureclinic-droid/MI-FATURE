import { Info, X } from 'lucide-react';
import { useState } from 'react';

interface IntegracaoHelpProps {
  page: 'agenda' | 'prontuario' | 'guias';
}

export function IntegracaoHelp({ page }: IntegracaoHelpProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center z-50"
      >
        <Info className="w-6 h-6" />
      </button>
    );
  }

  const content = {
    agenda: {
      title: 'Como a Agenda se integra ao Sistema',
      steps: [
        {
          number: '1',
          text: 'Ao agendar uma consulta, o sistema valida automaticamente se o paciente possui autorização ativa no convênio'
        },
        {
          number: '2',
          text: 'O número da autorização é vinculado ao agendamento e será usado posteriormente no faturamento'
        },
        {
          number: '3',
          text: 'Quando o profissional finalizar o prontuário, o status muda automaticamente para "Realizada"'
        },
        {
          number: '4',
          text: 'A consulta realizada gera automaticamente uma Guia SP/SADT pronta para faturamento'
        }
      ]
    },
    prontuario: {
      title: 'Integração do Prontuário com Faturamento',
      steps: [
        {
          number: '1',
          text: 'Preencha todos os campos obrigatórios conforme Resolução CFM nº 1.638/2002'
        },
        {
          number: '2',
          text: 'Ao clicar em "Finalizar", o sistema valida: CID-10, hipótese diagnóstica e conduta'
        },
        {
          number: '3',
          text: 'Uma Guia SP/SADT é gerada automaticamente com todos os dados do atendimento'
        },
        {
          number: '4',
          text: 'A guia é enviada para o módulo de Faturamento, pronta para fechamento mensal'
        },
        {
          number: '5',
          text: 'O prontuário fica arquivado no histórico do paciente para consultas futuras'
        }
      ]
    },
    guias: {
      title: 'Guias SP/SADT e o Fluxo de Faturamento',
      steps: [
        {
          number: '1',
          text: 'Guias são geradas automaticamente quando o médico finaliza um prontuário'
        },
        {
          number: '2',
          text: 'Todos os dados seguem o padrão TISS da ANS: paciente, profissional, procedimento, CID-10'
        },
        {
          number: '3',
          text: 'O número da autorização é vinculado à guia para validação pelo convênio'
        },
        {
          number: '4',
          text: 'No fechamento mensal, as guias são agrupadas por convênio e exportadas em lote'
        },
        {
          number: '5',
          text: 'O sistema rastreia o status: Pronta → Enviada → Aprovada → Paga'
        }
      ]
    }
  };

  const { title, steps } = content[page];

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white border border-blue-200 rounded-lg shadow-xl z-50">
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          <h3 className="text-sm">{title}</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
              {step.number}
            </div>
            <p className="text-sm text-gray-700 flex-1">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-gray-50 border-t text-xs text-gray-600 rounded-b-lg">
        💡 <strong>Dica:</strong> Todos os módulos estão integrados para garantir conformidade com ANS/TISS e CFM
      </div>
    </div>
  );
}
