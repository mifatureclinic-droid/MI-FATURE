#!/usr/bin/env python3
"""Substitui o modal de datas de assinatura pelo novo modal de duas etapas."""

with open('/home/ubuntu/mifature-portal/client/src/pages/Agenda.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar o bloco do modal
start_marker = '    {/* \u2500\u2500\u2500 Modal de Sele\u00e7\u00e3o de Datas para Link de Assinatura'
end_marker = '    )}\n      {/* Modal de configura\u00e7\u00e3o de cores por tipo de atendimento */'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print("ERROR: start marker not found")
    exit(1)
if end_idx == -1:
    print("ERROR: end marker not found")
    exit(1)

# O bloco a substituir vai do start_marker at\u00e9 o end_marker (exclusive o end_marker)
old_block = content[start_idx:end_idx]
print(f"Found block from line ~{content[:start_idx].count(chr(10))+1} to ~{content[:end_idx].count(chr(10))+1}")

new_block = '''    {/* \u2500\u2500\u2500 Modal de Sele\u00e7\u00e3o de Datas + Pr\u00e9-visualiza\u00e7\u00e3o da Mensagem WhatsApp \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
    {showModalDatasAssinatura && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header com indicador de etapa */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              <h2 className="text-base font-semibold text-gray-800">
                {etapaModal === 'datas' ? 'Datas para Assinatura' : 'Pr\u00e9-visualizar Mensagem'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Indicador de etapa */}
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${etapaModal === 'datas' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}>1</span>
                <span className="w-4 h-px bg-gray-300" />
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${etapaModal === 'preview' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'}`}>2</span>
              </div>
              <button onClick={() => { setShowModalDatasAssinatura(false); setEtapaModal('datas'); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Etapa 1: Sele\u00e7\u00e3o de Datas */}
          {etapaModal === 'datas' && (
            <>
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-500">
                  Adicione as datas de atendimento que o paciente dever\u00e1 confirmar ao assinar o link.
                </p>
                {/* Lista de datas j\u00e1 adicionadas */}
                <div className="space-y-2">
                  {datasAssinaturaSelecionadas.length === 0 && (
                    <p className="text-xs text-gray-400 italic">Nenhuma data adicionada ainda.</p>
                  )}
                  {datasAssinaturaSelecionadas.map((d, i) => (
                    <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <span className="text-sm font-medium text-green-800">
                        {new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => setDatasAssinaturaSelecionadas(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-400 hover:text-red-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Adicionar nova data */}
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={novaDataAssinatura}
                    onChange={e => setNovaDataAssinatura(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button
                    onClick={() => {
                      if (!novaDataAssinatura) return;
                      if (datasAssinaturaSelecionadas.includes(novaDataAssinatura)) {
                        toast.error('Esta data j\u00e1 foi adicionada.');
                        return;
                      }
                      setDatasAssinaturaSelecionadas(prev => [...prev, novaDataAssinatura].sort());
                      setNovaDataAssinatura('');
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
                {/* Aviso de datas futuras */}
                {datasAssinaturaSelecionadas.some(d => d > new Date().toISOString().slice(0, 10)) && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Aten\u00e7\u00e3o:</strong> Uma ou mais datas s\u00e3o futuras. Confirme se pretende incluir atendimentos futuros.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => { setShowModalDatasAssinatura(false); setEtapaModal('datas'); }}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  disabled={datasAssinaturaSelecionadas.length === 0}
                  onClick={() => {
                    const pacienteNome = (pacientes as any[]).find((p: any) => p.id === atendimentoParaLinkAssinatura?.pacienteId)?.nome || 'Paciente';
                    const profissionalNome = getProfissionalNome(atendimentoParaLinkAssinatura?.profissionalId);
                    const convenioNome = getConvenioNome(atendimentoParaLinkAssinatura?.convenioId);
                    const tipoAtend = atendimentoParaLinkAssinatura?.tipo || 'atendimento';
                    const datasFormatadas = datasAssinaturaSelecionadas
                      .map(d => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }))
                      .join(', ');
                    const convenioTexto = convenioNome ? ` (Conv\u00eanio: ${convenioNome})` : '';
                    const msg = `Ol\u00e1, ${pacienteNome}!\n\nSolicito que assine digitalmente as suas sess\u00f5es de ${tipoAtend}${convenioTexto} com ${profissionalNome}.\n\nDatas: ${datasFormatadas}\n\nAcesse o link abaixo para assinar:\n[link ser\u00e1 gerado automaticamente]\n\nObrigado!`;
                    setMensagemPreview(msg);
                    setEtapaModal('preview');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" /> Pr\u00e9-visualizar Mensagem
                </button>
              </div>
            </>
          )}

          {/* Etapa 2: Pr\u00e9-visualiza\u00e7\u00e3o edit\u00e1vel */}
          {etapaModal === 'preview' && (
            <>
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-500">
                  Revise e edite a mensagem antes de enviar. O link real ser\u00e1 inserido automaticamente ao gerar.
                </p>
                {/* Informa\u00e7\u00f5es do envio */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <User className="w-3.5 h-3.5" />
                    <span><strong>Paciente:</strong> {(pacientes as any[]).find((p: any) => p.id === atendimentoParaLinkAssinatura?.pacienteId)?.nome || '\u2014'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span><strong>Profissional:</strong> {getProfissionalNome(atendimentoParaLinkAssinatura?.profissionalId)}</span>
                  </div>
                  {getConvenioNome(atendimentoParaLinkAssinatura?.convenioId) && (
                    <div className="flex items-center gap-2 text-xs text-blue-700">
                      <FileSignature className="w-3.5 h-3.5" />
                      <span><strong>Conv\u00eanio:</strong> {getConvenioNome(atendimentoParaLinkAssinatura?.convenioId)}</span>
                    </div>
                  )}
                </div>
                {/* Campo edit\u00e1vel */}
                <textarea
                  value={mensagemPreview}
                  onChange={e => setMensagemPreview(e.target.value)}
                  rows={9}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
                <p className="text-xs text-gray-400">
                  O texto "[link ser\u00e1 gerado automaticamente]" ser\u00e1 substitu\u00eddo pelo link real ao enviar.
                </p>
              </div>
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setEtapaModal('datas')}
                  className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  disabled={gerarLinkAssinaturaGuiaMutation.isPending}
                  onClick={() => {
                    if (!atendimentoParaLinkAssinatura) return;
                    gerarLinkAssinaturaGuiaMutation.mutate({
                      guiaId: atendimentoParaLinkAssinatura.guiaId,
                      pacienteId: atendimentoParaLinkAssinatura.pacienteId,
                      datasAtendimento: datasAssinaturaSelecionadas,
                      mensagemPersonalizada: mensagemPreview,
                    });
                    setShowModalDatasAssinatura(false);
                    setEtapaModal('datas');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {gerarLinkAssinaturaGuiaMutation.isPending
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> A gerar...</>
                    : <><Send className="w-4 h-4" /> Gerar e Enviar Link</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      </div>,
      document.body
    )}'''

new_content = content[:start_idx] + new_block + '\n' + content[end_idx:]

with open('/home/ubuntu/mifature-portal/client/src/pages/Agenda.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("SUCCESS: Modal replaced")
