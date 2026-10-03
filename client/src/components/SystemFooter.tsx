import { Shield, Lock } from 'lucide-react';
import { SYSTEM_CONFIG, LEGAL_INFO } from '../config/system.config';

export function SystemFooter() {
  return (
    <footer className="border-t bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Linha principal */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">
              {SYSTEM_CONFIG.SYSTEM_NAME}
            </span>
            <span className="text-xs text-gray-500">
              v{SYSTEM_CONFIG.SYSTEM_VERSION}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>{LEGAL_INFO.COPYRIGHT}</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Sistema Protegido
            </span>
          </div>
        </div>

        {/* Linha de certificações */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              ✅ Certificado ANS/TISS {SYSTEM_CONFIG.ANS_VERSION}
            </span>
            <span className="flex items-center gap-1">
              ✅ Conformidade LGPD
            </span>
            <span className="flex items-center gap-1">
              ✅ Padrão CFM
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>Registro: {SYSTEM_CONFIG.ANS_CERTIFICATION}</span>
          </div>
        </div>

        {/* Informações técnicas */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-400 flex items-center justify-between">
          <div>
            Build {SYSTEM_CONFIG.SYSTEM_BUILD} | Hash: {SYSTEM_CONFIG.SYSTEM_HASH_MD5.substring(0, 16)}...
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={`mailto:${SYSTEM_CONFIG.SUPPORT_EMAIL}`}
              className="hover:text-blue-600 transition-colors"
            >
              Suporte Técnico
            </a>
            <span>•</span>
            <a 
              href={SYSTEM_CONFIG.SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600 transition-colors"
            >
              Portal de Ajuda
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
