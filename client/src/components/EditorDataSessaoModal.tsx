import React from 'react';

interface EditorDataSessaoModalProps {
  aberta: boolean;
  data: string;
  salvando?: boolean;
  onAlterarData: (data: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
}

export function EditorDataSessaoModal({
  aberta,
  data,
  salvando = false,
  onAlterarData,
  onSalvar,
  onCancelar,
}: EditorDataSessaoModalProps) {
  if (!aberta) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/50 p-4" role="presentation">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-data-da-sessao-titulo"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 id="editar-data-da-sessao-titulo" className="text-lg font-semibold text-slate-900">
          Editar data da sessão
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Esta alteração atualiza somente a data clínica da sessão. A assinatura, o hash e o horário em que o paciente assinou permanecem preservados.
        </p>
        <label htmlFor="nova-data-sessao" className="mt-5 block text-sm font-medium text-slate-800">
          Nova data da sessão
        </label>
        <input
          id="nova-data-sessao"
          aria-label="Nova data da sessão"
          type="date"
          value={data}
          onChange={(event) => onAlterarData(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-300 px-3 text-base text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200"
        />
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onCancelar} className="min-h-11 flex-1 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSalvar}
            disabled={salvando || !data}
            className="min-h-11 flex-1 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar data'}
          </button>
        </div>
      </section>
    </div>
  );
}
