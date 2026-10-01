import { Shield, FileCheck, Lock } from 'lucide-react';

export function NormativasFooter() {
  return (
    <div className="bg-gray-800 text-white py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="mb-1">ANS/TISS</h4>
              <p className="text-sm text-gray-300">
                Sistema conforme padrão TISS para intercâmbio de informações na saúde suplementar
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h4 className="mb-1">CFM - Resolução 1.638/2002</h4>
              <p className="text-sm text-gray-300">
                Prontuário eletrônico em conformidade com as normas do Conselho Federal de Medicina
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="mb-1">LGPD</h4>
              <p className="text-sm text-gray-300">
                Proteção de dados pessoais e sensíveis conforme Lei Geral de Proteção de Dados
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
          <p>
            Portal de Faturamento Médico © 2025 - Todos os direitos reservados | 
            Versão 1.0 | Suporte: (11) 3000-0000
          </p>
        </div>
      </div>
    </div>
  );
}
