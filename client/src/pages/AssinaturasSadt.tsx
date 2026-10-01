/**
 * Painel de Gestão de Assinaturas Digitais SADT
 * Acesso restrito à clínica (utilizadores autenticados)
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function formatarData(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d + "T12:00:00") : new Date(d);
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarDataHora(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatarOrdinal(n: number) {
  if (n === 1) return "1ª";
  if (n === 2) return "2ª";
  if (n === 3) return "3ª";
  return `${n}ª`;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: "Aguardando", color: "#B7791F", bg: "#FEFCBF" },
  assinado: { label: "Assinado", color: "#276749", bg: "#C6F6D5" },
  expirado: { label: "Expirado", color: "#9B2C2C", bg: "#FED7D7" },
  cancelado: { label: "Cancelado", color: "#718096", bg: "#EDF2F7" },
};

export function AssinaturasSadt() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [convenioFiltro, setConvenioFiltro] = useState<string>("");
  const [profissionalFiltro, setProfissionalFiltro] = useState<string>("");
  const [sincronizando, setSincronizando] = useState(false);
  const [resultadoSincronizacao, setResultadoSincronizacao] = useState<{ sucesso: boolean; migrados: number; erro?: string } | null>(null);

  // Buscar lista de convênios e profissionais
  const { data: convenios } = trpc.convenios.list.useQuery();
  const { data: profissionaisList } = trpc.profissionais.list.useQuery();

  const { data: assinaturas, isLoading, refetch } = trpc.assinaturas.listarTodas.useQuery({
    limit: 100,
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined,
  });

  const migrarMutation = trpc.assinaturas.migrar.useMutation({
    onSuccess: (resultado) => {
      setResultadoSincronizacao(resultado);
      setSincronizando(false);
      if (resultado.sucesso) {
        toast.success("Sincronização concluída!", {
          description: `${resultado.migrados} assinaturas sincronizadas com sucesso.`,
        });
        refetch();
      } else {
        toast.error("Erro na sincronização", { description: resultado.erro });
      }
    },
    onError: (erro: any) => {
      setSincronizando(false);
      toast.error("Erro ao sincronizar", { description: erro.message });
    },
  });

  const handleSincronizar = async () => {
    setSincronizando(true);
    setResultadoSincronizacao(null);
    migrarMutation.mutate();
  };

  // Filtrar assinaturas baseado no termo de busca, convênio e profissional
  const assinaturasFiltered = assinaturas?.filter(a => {
    const termo = searchTerm.toLowerCase();
    const matchBusca = (
      a.pacienteNome.toLowerCase().includes(termo) ||
      (a.pacienteCpf?.toLowerCase().includes(termo) || false) ||
      a.procedimento.toLowerCase().includes(termo)
    );
    const matchConvenio = !convenioFiltro || (a.convenio?.toLowerCase().includes(convenioFiltro.toLowerCase()) ?? false);
    const matchProfissional = !profissionalFiltro || (a.profissionalNome?.toLowerCase().includes(profissionalFiltro.toLowerCase()) ?? false);
    return matchBusca && matchConvenio && matchProfissional;
  }) || [];

  const handleCopiarLink = (token: string) => {
    const url = `${window.location.origin}/assinar/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copiado!", { description: "Cole no WhatsApp do paciente." });
    });
  };

  const handleWhatsApp = (token: string, pacienteNome: string, pacienteWhatsapp: string | null | undefined, numeroSessao: number, dataSessao: string | Date) => {
    const url = `${window.location.origin}/assinar/${token}`;
    const sessaoFormatada = formatarOrdinal(numeroSessao);
    const dataFormatada = formatarData(dataSessao);
    const nome = pacienteNome.split(" ")[0];
    const msg = `Olá ${nome}! 👋\n\nSua guia SADT está pronta para assinatura. Clique no link abaixo para assinar digitalmente com validade jurídica:\n\n🔗 ${url}\n\n✅ Sessão ${sessaoFormatada} - ${dataFormatada}\n⏰ Link válido por 24 horas`;
    const phone = (pacienteWhatsapp || "").replace(/\D/g, "");
    const waUrl = phone
      ? `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  const selected = assinaturas?.find(a => a.id === selectedId);

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Cabeçalho com Botão de Sincronização */}
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 700, color: "#1E4D3A", margin: "0 0 6px" }}>
            Assinaturas Digitais SADT
          </h1>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#718096", margin: 0 }}>
            Gerencie os pedidos de assinatura digital enviados aos pacientes. Cada assinatura é registada com hash SHA-256 e validade jurídica.
          </p>
        </div>
        <button
          onClick={handleSincronizar}
          disabled={sincronizando}
          style={{
            padding: "10px 20px",
            background: sincronizando ? "#CBD5E0" : "#2D6B52",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: sincronizando ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            marginLeft: 16,
          }}
          onMouseEnter={(e) => {
            if (!sincronizando) (e.target as any).style.background = "#1E4D3A";
          }}
          onMouseLeave={(e) => {
            if (!sincronizando) (e.target as any).style.background = "#2D6B52";
          }}
        >
          {sincronizando ? "⏳ Sincronizando..." : "🔄 Sincronizar Assinaturas"}
        </button>
      </div>

      {/* Resultado da Sincronização */}
      {resultadoSincronizacao && (
        <div style={{
          marginBottom: 20,
          padding: "14px 16px",
          borderRadius: 10,
          background: resultadoSincronizacao.sucesso ? "#C6F6D5" : "#FED7D7",
          border: `1px solid ${resultadoSincronizacao.sucesso ? "#9AE6B4" : "#FC8181"}`,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          color: resultadoSincronizacao.sucesso ? "#22543D" : "#742A2A",
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {resultadoSincronizacao.sucesso ? "✅ Sincronização Concluída" : "❌ Erro na Sincronização"}
          </div>
          <div>
            {resultadoSincronizacao.sucesso
              ? `${resultadoSincronizacao.migrados} assinaturas foram sincronizadas com sucesso!`
              : resultadoSincronizacao.erro}
          </div>
        </div>
      )}

      {/* Barra de Busca e Filtros */}
      <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome, CPF ou procedimento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            boxSizing: "border-box",
            transition: "all 0.2s",
            outline: "none",
            backgroundColor: "white"
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#1E4D3A";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30, 77, 58, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Filtro por intervalo de datas */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#2D6B52", marginBottom: 6, textTransform: "uppercase" }}>
              📅 Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                outline: "none",
                backgroundColor: "white",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1E4D3A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30, 77, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#2D6B52", marginBottom: 6, textTransform: "uppercase" }}>
              📅 Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                outline: "none",
                backgroundColor: "white",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1E4D3A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30, 77, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#2D6B52", marginBottom: 6, textTransform: "uppercase" }}>
              🏥 Convênio
            </label>
            <select
              value={convenioFiltro}
              onChange={(e) => setConvenioFiltro(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                outline: "none",
                backgroundColor: "white",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1E4D3A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30, 77, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">Todos os convênios</option>
              {convenios?.map((c) => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "#2D6B52", marginBottom: 6, textTransform: "uppercase" }}>
              👨‍⚕️ Profissional
            </label>
            <select
              value={profissionalFiltro}
              onChange={(e) => setProfissionalFiltro(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                outline: "none",
                backgroundColor: "white",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1E4D3A";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30, 77, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <option value="">Todos os profissionais</option>
              {profissionaisList?.map((p) => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setDataInicio("");
              setDataFim("");
              setConvenioFiltro("");
              setProfissionalFiltro("");
            }}
            style={{
              padding: "10px 16px",
              background: "#F0F9F7",
              border: "1px solid #C6E0D4",
              borderRadius: 8,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#2D6B52",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as any).style.background = "#E0F2ED";
            }}
            onMouseLeave={(e) => {
              (e.target as any).style.background = "#F0F9F7";
            }}
          >
            ✕ Limpar Filtros
          </button>
        </div>
      </div>

      {/* Stats rápidos */}
      {assinaturasFiltered && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total", value: assinaturasFiltered.length, color: "#1E4D3A", bg: "#EBF4F0" },
            { label: "Assinadas", value: assinaturasFiltered.filter(a => a.status === "assinado").length, color: "#276749", bg: "#C6F6D5" },
            { label: "Pendentes", value: assinaturasFiltered.filter(a => a.status === "pendente").length, color: "#B7791F", bg: "#FEFCBF" },
            { label: "Expiradas", value: assinaturasFiltered.filter(a => a.status === "expirado").length, color: "#9B2C2C", bg: "#FED7D7" },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 14, padding: "16px 20px", border: `1px solid ${s.color}20` }}>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: selectedId ? "1fr 380px" : "1fr", gap: 20 }}>

        {/* Tabela */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ padding: 48, textAlign: "center", color: "#A0AEC0", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>
              A carregar assinaturas...
            </div>
          ) : !assinaturasFiltered.length ? (
            <div style={{ padding: 64, textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#1E4D3A", margin: "0 0 8px" }}>{searchTerm ? "Nenhuma assinatura encontrada" : "Nenhuma assinatura ainda"}</h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#718096", margin: 0 }}>
                {searchTerm ? "Tente ajustar os termos de busca." : "Os pedidos de assinatura criados a partir das guias SADT aparecerão aqui."}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F7FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    {["Paciente", "Convênio", "Sessão", "Data", "Procedimento", "Status", "Criado em", "Acções"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#718096", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assinaturasFiltered.map((a, i) => {
                    const st = STATUS_LABELS[a.status] || STATUS_LABELS.pendente;
                    const isSelected = a.id === selectedId;
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelectedId(isSelected ? null : a.id)}
                        style={{ borderBottom: "1px solid #F0F4F8", cursor: "pointer", background: isSelected ? "#EBF4F0" : i % 2 === 0 ? "white" : "#FAFAFA", transition: "background 0.15s" }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#F7F9F7"; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "white" : "#FAFAFA"; }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A" }}>{a.pacienteNome}</div>
                          {a.pacienteCpf && <div style={{ fontSize: 11, color: "#A0AEC0" }}>{a.pacienteCpf}</div>}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          {a.convenio ? (
                            <span style={{ background: "#EBF4F0", color: "#1E4D3A", borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                              {a.convenio}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#A0AEC0", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#4A5568" }}>
                          {formatarOrdinal(a.numeroSessao)}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#4A5568", whiteSpace: "nowrap" }}>
                          {formatarData(a.dataSessao)}
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#718096", maxWidth: 180 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.procedimento}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: st.bg, color: st.color, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#A0AEC0", whiteSpace: "nowrap" }}>
                          {formatarDataHora(a.createdAt)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                            {a.status === "pendente" && (
                              <>
                                <button
                                  onClick={() => handleCopiarLink(a.token)}
                                  title="Copiar link"
                                  style={{ background: "#EBF4F0", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#C6E0D4")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "#EBF4F0")}
                                >
                                  🔗
                                </button>
                                <button
                                  onClick={() => handleWhatsApp(a.token, a.pacienteNome, a.pacienteWhatsapp, a.numeroSessao, a.dataSessao)}
                                  title="Enviar pelo WhatsApp"
                                  style={{ background: "#C6F6D5", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, transition: "all 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget.style.background = "#9AE6B4")}
                                  onMouseLeave={e => (e.currentTarget.style.background = "#C6F6D5")}
                                >
                                  📱
                                </button>
                              </>
                            )}
                            {a.status === "assinado" && (
                              <button
                                onClick={() => setSelectedId(isSelected ? null : a.id)}
                                title="Ver detalhes"
                                style={{ background: "#EBF4F0", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14 }}
                              >
                                🔍
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Painel de detalhes */}
        {selected && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E2E8F0", padding: "24px", alignSelf: "start", position: "sticky", top: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#1E4D3A", margin: 0 }}>Detalhes da Assinatura</h3>
              <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#A0AEC0" }}>✕</button>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              {(() => {
                const st = STATUS_LABELS[selected.status] || STATUS_LABELS.pendente;
                return (
                  <span style={{ background: st.bg, color: st.color, borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {st.label}
                  </span>
                );
              })()}
            </div>

            {/* Convênio e Profissional em destaque */}
            {(selected.convenio || selected.profissionalNome) && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {selected.convenio && (
                  <span style={{ background: "#EBF4F0", color: "#1E4D3A", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", border: "1px solid #C6E0D4" }}>
                    🏥 {selected.convenio}
                  </span>
                )}
                {selected.profissionalNome && (
                  <span style={{ background: "#EDF2FF", color: "#3730A3", borderRadius: 100, padding: "4px 12px", fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", border: "1px solid #C7D2FE" }}>
                    👨‍⚕️ {selected.profissionalNome}
                  </span>
                )}
              </div>
            )}

            {/* Dados */}
            {[
              { label: "Paciente", value: selected.pacienteNome },
              { label: "CPF", value: selected.pacienteCpf || "—" },
              { label: "WhatsApp", value: selected.pacienteWhatsapp || "—" },
              { label: "Convênio", value: selected.convenio || "—" },
              { label: "Profissional", value: selected.profissionalNome || "—" },
              { label: "Sessão", value: `${formatarOrdinal(selected.numeroSessao)} Sessão` },
              { label: "Data da Sessão", value: formatarData(selected.dataSessao) },
              { label: "Procedimento", value: selected.procedimento },
              { label: "Criado em", value: formatarDataHora(selected.createdAt) },
              { label: "Expira em", value: formatarDataHora(selected.tokenExpiresAt) },
              ...(selected.dataAssinatura ? [{ label: "Assinado em", value: formatarDataHora(selected.dataAssinatura) }] : []),
              ...(selected.ipAssinatura ? [{ label: "IP de Assinatura", value: selected.ipAssinatura }] : []),
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F0F4F8" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#718096" }}>{item.label}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "#1E4D3A", textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
              </div>
            ))}

            {/* Hash SHA-256 */}
            {selected.assinaturaHash && (
              <div style={{ marginTop: 16, background: "#EBF4F0", border: "1px solid #C6E0D4", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D6B52", marginBottom: 6 }}>
                  🔒 Hash SHA-256
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#1E4D3A", wordBreak: "break-all", lineHeight: 1.5 }}>
                  {selected.assinaturaHash}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(selected.assinaturaHash!); toast.success("Hash copiado!"); }}
                  style={{ marginTop: 8, background: "none", border: "1px solid #C6E0D4", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#2D6B52", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Copiar hash
                </button>
              </div>
            )}

            {/* Acções para pendentes */}
            {selected.status === "pendente" && (
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => handleCopiarLink(selected.token)}
                  style={{ background: "#EBF4F0", border: "1px solid #C6E0D4", borderRadius: 10, padding: "10px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  🔗 Copiar link de assinatura
                </button>
                <button
                  onClick={() => handleWhatsApp(selected.token, selected.pacienteNome, selected.pacienteWhatsapp, selected.numeroSessao, selected.dataSessao)}
                  style={{ background: "#C6F6D5", border: "1px solid #9AE6B4", borderRadius: 10, padding: "10px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#276749", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
                >
                  📱 Enviar pelo WhatsApp
                </button>
              </div>
            )}

            {/* Acções para assinadas */}
            {selected.status === "assinado" && (
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {selected.pdfUrl && (
                  <a
                    href={selected.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: "#EBF4F0", border: "1px solid #C6E0D4", borderRadius: 10, padding: "10px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none", textAlign: "center", justifyContent: "center" }}
                  >
                    📄 Baixar PDF Comprovante
                  </a>
                )}
              </div>
            )}

            {/* Informações de rastreamento */}
            {selected.status === "assinado" && (
              <div style={{ marginTop: 16, background: "#F0F9F7", border: "1px solid #C6E0D4", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D6B52", marginBottom: 8 }}>
                  📍 Rastreamento de Assinatura
                </div>
                <div>
                  {selected.ipAssinatura && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #C6E0D4" }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#2D6B52" }}>IP</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#1E4D3A" }}>{selected.ipAssinatura}</span>
                    </div>
                  )}
                  {selected.userAgentAssinatura && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#2D6B52" }}>Navegador</span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "#1E4D3A", textAlign: "right", maxWidth: "50%", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.userAgentAssinatura.substring(0, 40)}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Motivo de recusa */}
            {selected.motivoRecusa && (
              <div style={{ marginTop: 16, background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#92400E", marginBottom: 6 }}>
                  ⚠️ Motivo da Recusa
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>
                  {selected.motivoRecusa}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
