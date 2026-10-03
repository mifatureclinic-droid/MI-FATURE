import React from 'react';

/**
 * Componente de carregamento — apenas a logo Mifature animada
 * Fundo transparente sobre o overlay do App
 */
export function LeafLoader({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-5">
      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 10px rgba(34,197,94,0.35)); }
          50%       { transform: scale(1.1); filter: drop-shadow(0 0 28px rgba(34,197,94,0.75)); }
        }
        @keyframes logoFadeIn {
          0%   { opacity: 0; transform: scale(0.75) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .logo-animated {
          animation: logoFadeIn 0.45s cubic-bezier(0.23,1,0.32,1) forwards,
                     logoPulse 2.2s ease-in-out 0.45s infinite;
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.45; }
          40%            { transform: translateY(-7px); opacity: 1; }
        }
        .dot-1 { animation: dotBounce 1.2s ease-in-out infinite; }
        .dot-2 { animation: dotBounce 1.2s ease-in-out infinite 0.15s; }
        .dot-3 { animation: dotBounce 1.2s ease-in-out infinite 0.3s; }
        .dot-4 { animation: dotBounce 1.2s ease-in-out infinite 0.45s; }
      `}</style>

      {/* Logo */}
      <img
        src="/manus-storage/LOGONOVA_ed586c89.png"
        alt="Mifature"
        className="logo-animated"
        style={{ width: '160px', height: '160px', objectFit: 'contain' }}
      />

      {/* Texto e dots */}
      <div className="text-center space-y-2">
        <p className="text-sm font-semibold text-green-200 tracking-wide">{message}</p>
        <div className="flex gap-1.5 justify-center">
          <span className="w-2 h-2 rounded-full bg-green-400 dot-1" />
          <span className="w-2 h-2 rounded-full bg-green-400 dot-2" />
          <span className="w-2 h-2 rounded-full bg-green-400 dot-3" />
          <span className="w-2 h-2 rounded-full bg-green-400 dot-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de skeleton loading para cards
 */
export function LeafSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
