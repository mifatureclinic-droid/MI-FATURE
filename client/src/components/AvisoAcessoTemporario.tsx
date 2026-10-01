import React, { useEffect, useState } from "react";

const EMAIL_DESTINATARIO = "carelli@carelliassociados.com.br";
const EXPIRACAO_ACESSO = "2026-08-28T08:00:00-04:00";

export function deveExibirAvisoAcessoTemporario(email: string | null | undefined, agora = new Date()): boolean {
  return (
    email?.trim().toLowerCase() === EMAIL_DESTINATARIO &&
    agora.getTime() < new Date(EXPIRACAO_ACESSO).getTime()
  );
}

export function AvisoAcessoTemporario({ email }: { email: string | null | undefined }) {
  const [agora, setAgora] = useState(() => new Date());
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    const atraso = Math.max(0, new Date(EXPIRACAO_ACESSO).getTime() - Date.now());
    const temporizador = window.setTimeout(() => setAgora(new Date()), atraso + 50);
    return () => window.clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    setAberto(true);
  }, [email]);

  if (!aberto || !deveExibirAvisoAcessoTemporario(email, agora)) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
      role="presentation"
    >
      <section
        aria-labelledby="aviso-acesso-temporario-titulo"
        aria-modal="true"
        role="dialog"
        className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-800" aria-hidden="true">
            !
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Aviso importante</p>
            <h2 id="aviso-acesso-temporario-titulo" className="mt-1 text-xl font-bold text-slate-900">
              Acesso temporário para visualização
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Este portal estará disponível para sua visualização até <strong>28/08 às 08h</strong>, no horário de Manaus (AM).
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
          >
            Entendi
          </button>
        </div>
      </section>
    </div>
  );
}
