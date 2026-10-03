import React, { forwardRef } from 'react';
import { obterPrimeiraDataAtendimentoDaAssinatura } from '@shared/datasAtendimentoAssinatura';

interface AssinaturaAnexa {
  id: number | string;
  sessaoNumero?: number | string | null;
  datasAtendimento?: string | null;
  dataAssinatura?: string | Date | null;
  assinaturaPacienteUrl?: string | null;
  hashAssinatura?: string | null;
}

interface AnexoRegistroDigitalSadtProps {
  numeroGuia?: string;
  paciente?: string;
  profissional?: string;
  procedimento?: string;
  assinaturas: AssinaturaAnexa[];
}

function formatarData(valor?: string | Date | null) {
  if (!valor) return 'Não informada';
  const texto = String(valor);
  const correspondencia = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (correspondencia) return `${correspondencia[3]}/${correspondencia[2]}/${correspondencia[1]}`;
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? texto : data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarMomentoGeracaoManaus(momento: Date) {
  const data = momento.toLocaleDateString('pt-BR', { timeZone: 'America/Manaus' });
  const hora = momento.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Manaus',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return `${data} às ${hora}`;
}

export const AnexoRegistroDigitalSadt = forwardRef<HTMLDivElement, AnexoRegistroDigitalSadtProps>(function AnexoRegistroDigitalSadt(
  { numeroGuia, procedimento, assinaturas },
  ref,
) {
  if (assinaturas.length === 0) return null;

  const sessoes = [...assinaturas].sort((a, b) => {
    const dataA = obterPrimeiraDataAtendimentoDaAssinatura(a.datasAtendimento) ?? '';
    const dataB = obterPrimeiraDataAtendimentoDaAssinatura(b.datasAtendimento) ?? '';
    return dataA.localeCompare(dataB) || Number(a.id) - Number(b.id);
  });
  const proximaSessao = sessoes.length + 1;
  const geradoEm = new Date();

  return (
    <section ref={ref} data-sadt-document="anexo" className="print-area anexo-guia-sadt mt-8 min-h-[210mm] break-before-page bg-white p-5 font-sans text-slate-900 print:mt-0 print:min-h-0 print:p-4" aria-label="Anexo de assinatura digital">
      <header className="border-b-2 border-slate-800 pb-2">
        <h2 className="text-lg font-bold">Anexo à Guia SADT</h2>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">Registro Digital de Assinaturas</p>
      </header>

      <section className="mt-3 rounded border border-blue-200 bg-blue-50 p-3 text-blue-950">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <p><strong>Guia:</strong> {numeroGuia || 'Não informada'}</p>
            <p><strong>Procedimento:</strong> {procedimento || 'Não informado'}</p>
            <p><strong>Próxima sessão:</strong> {proximaSessao}ª</p>
            <p><strong>Total de sessões:</strong> {sessoes.length}</p>
          </div>
          <div className="min-w-20 text-right">
            <div className="text-2xl font-bold text-blue-700">{sessoes.length}</div>
            <div className="text-[10px] text-blue-700">sessões realizadas</div>
          </div>
        </div>
      </section>

      <section className="mt-3" aria-label="Sessões assinadas">
        <h3 className="mb-2 text-sm font-bold text-slate-800">Sessões assinadas</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 print:grid-cols-5">
          {sessoes.map((assinatura, indice) => {
          const numeroSessao = assinatura.sessaoNumero ?? indice + 1;
          const dataSessao = obterPrimeiraDataAtendimentoDaAssinatura(assinatura.datasAtendimento);
          return (
          <article key={assinatura.id} className="overflow-hidden rounded border border-emerald-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-1 bg-emerald-50 px-2 py-1 text-[9px] text-emerald-950">
              <strong>{numeroSessao}ª sessão — {formatarData(dataSessao)}</strong>
              <span>Assinado em {formatarData(assinatura.dataAssinatura)}</span>
            </div>
            <div className="flex h-16 items-center justify-center bg-slate-50 p-2">
            {assinatura.assinaturaPacienteUrl ? (
              <img src={assinatura.assinaturaPacienteUrl} alt={`Assinatura do paciente — sessão ${numeroSessao}`} className="h-12 w-full object-contain" />
            ) : (
              <span className="text-[9px] text-slate-500">Assinatura não disponível</span>
            )}
            </div>
            <div className="border-t border-slate-200 bg-white px-2 py-1">
              <p className="text-[8px] font-semibold text-slate-700">Hash SHA-256 da assinatura</p>
              <code className="mt-0.5 block break-all rounded bg-slate-100 p-1 text-[7px] leading-tight text-slate-800">
                {assinatura.hashAssinatura || 'Hash não disponível'}
              </code>
            </div>
          </article>
          );
          })}
        </div>
      </section>

      <footer className="mt-3 border-t border-slate-300 pt-2 text-[9px] leading-relaxed text-slate-700">
        <p className="font-semibold">Este comprovante foi gerado digitalmente e possui validade legal.</p>
        <p className="mt-1">Gerado em: {formatarMomentoGeracaoManaus(geradoEm)} (horário de Manaus/AM)</p>
      </footer>
    </section>
  );
});
