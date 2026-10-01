import { BarChart3, Download, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';

export function Relatorios() {
  const relatorios = [
    {
      titulo: 'Atendimentos por Convênio',
      descricao: 'Análise de atendimentos realizados por convênio',
      tipo: 'Operacional',
      periodo: 'Mensal'
    },
    {
      titulo: 'Faturamento por Profissional',
      descricao: 'Produtividade e faturamento individual',
      tipo: 'Financeiro',
      periodo: 'Mensal'
    },
    {
      titulo: 'Notas Fiscais Emitidas (NF-e)',
      descricao: 'Relatório completo de NF-e para pacientes particulares',
      tipo: 'Fiscal',
      periodo: 'Mensal'
    },
    {
      titulo: 'Guias Geradas - ANS/TISS',
      descricao: 'Relatório de guias SP/SADT emitidas',
      tipo: 'Operacional',
      periodo: 'Mensal'
    },
    {
      titulo: 'Autorizações e Validades',
      descricao: 'Controle de autorizações ativas e vencimentos',
      tipo: 'Operacional',
      periodo: 'Semanal'
    },
    {
      titulo: 'Faturamento Particular vs Convênios',
      descricao: 'Comparativo de receitas entre particulares e convênios',
      tipo: 'Fiscal',
      periodo: 'Mensal'
    },
    {
      titulo: 'Procedimentos Mais Realizados',
      descricao: 'Ranking de procedimentos por quantidade',
      tipo: 'Estatístico',
      periodo: 'Mensal'
    },
    {
      titulo: 'Fechamento Financeiro',
      descricao: 'Demonstrativo de valores por convênio',
      tipo: 'Financeiro',
      periodo: 'Mensal'
    },
    {
      titulo: 'Glosas e Rejeições',
      descricao: 'Análise de glosas por convênio e motivo',
      tipo: 'Financeiro',
      periodo: 'Mensal'
    },
    {
      titulo: 'Produtividade da Clínica',
      descricao: 'Indicadores gerais de performance',
      tipo: 'Gerencial',
      periodo: 'Mensal'
    },
  ];

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'Financeiro': return 'bg-green-100 text-green-700';
      case 'Fiscal': return 'bg-emerald-100 text-emerald-700';
      case 'Operacional': return 'bg-blue-100 text-blue-700';
      case 'Estatístico': return 'bg-purple-100 text-purple-700';
      case 'Gerencial': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Relatórios</h1>
        <p className="text-gray-600">Análises e indicadores do faturamento médico</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {relatorios.map((relatorio, index) => (
          <div key={index} className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="mb-1">{relatorio.titulo}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getTipoColor(relatorio.tipo)}`}>
                    {relatorio.tipo}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{relatorio.descricao}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{relatorio.periodo}</span>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Gerar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="mb-2">Relatórios Personalizados</h3>
            <p className="text-sm text-gray-700 mb-4">
              Configure filtros avançados e gere relatórios personalizados de acordo com suas necessidades específicas.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Criar Relatório Personalizado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}