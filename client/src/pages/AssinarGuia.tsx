/**
 * Página pública de Assinatura Digital de Guia SADT
 * Acessível via /assinar/:token — sem necessidade de login
 * Optimizada para telemóvel: canvas responsivo, botões grandes, layout vertical
 * Suporta: assinatura desenhada OU motivo de recusa (obrigatório se não assinar)
 */
import { useRef, useState, useCallback } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_MIFATURE = "/logo-mifature.png";

function formatarData(d: string | Date | null | undefined) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarOrdinal(n: number) {
  if (n === 1) return "1ª";
  if (n === 2) return "2ª";
  if (n === 3) return "3ª";
  return `${n}ª`;
}

// ─── Canvas de Assinatura (mobile-first) ─────────────────────────────────────
function CanvasAssinatura({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e, canvas);
    lastPos.current = pos;
    drawing.current = true;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "#1E4D3A";
    ctx.fill();
    setHasDrawn(true);
  }, [getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.lineWidth = 2.8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1E4D3A";
      ctx.stroke();
    }
    lastPos.current = pos;
    setHasDrawn(true);
  }, [getPos]);

  const stopDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
    if (canvasRef.current) {
      onSign(canvasRef.current.toDataURL("image/png"));
    }
  }, [onSign]);

  const limpar = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSign("");
  }, [onSign]);

  return (
    <div>
      <div style={{
        position: "relative",
        border: hasDrawn ? "2px solid #C6E0D4" : "2px dashed #CBD5E0",
        borderRadius: 16,
        background: hasDrawn ? "#FAFFFE" : "#FAFAF8",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
        boxShadow: hasDrawn ? "0 2px 12px rgba(30,77,58,0.08)" : "none",
      }}>
        <canvas
          ref={canvasRef}
          width={800}
          height={220}
          style={{
            display: "block",
            width: "100%",
            height: 200,
            cursor: "crosshair",
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          onTouchCancel={stopDraw}
        />
        {!hasDrawn && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none", textAlign: "center",
          }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>✍️</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#A0AEC0", whiteSpace: "nowrap" }}>
              Assine aqui com o dedo ou mouse
            </div>
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 40, left: 24, right: 24,
          height: 1, background: "rgba(0,0,0,0.06)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 28, left: 24,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10,
          color: "#CBD5E0", pointerEvents: "none", letterSpacing: "0.05em",
        }}>
          ASSINATURA DO PACIENTE
        </div>
      </div>

      {/* Botões Limpar / Refazer */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          onClick={limpar}
          disabled={!hasDrawn}
          style={{
            flex: 1,
            background: hasDrawn ? "white" : "#F7FAFC",
            border: `1px solid ${hasDrawn ? "#E2E8F0" : "#EDF2F7"}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: hasDrawn ? "#E53E3E" : "#CBD5E0",
            cursor: hasDrawn ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
          Limpar
        </button>
        <button
          onClick={limpar}
          disabled={!hasDrawn}
          style={{
            flex: 1,
            background: hasDrawn ? "white" : "#F7FAFC",
            border: `1px solid ${hasDrawn ? "#E2E8F0" : "#EDF2F7"}`,
            borderRadius: 12,
            padding: "12px 16px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: hasDrawn ? "#2D6B52" : "#CBD5E0",
            cursor: hasDrawn ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
          </svg>
          Refazer
        </button>
      </div>

      {hasDrawn && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 6,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#2D6B52",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Assinatura registada — pode limpar e refazer se necessário
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function AssinarGuia({ token: tokenProp }: { token?: string } = {}) {
  const params = useParams<{ token: string }>();
  const token = tokenProp || params.token || "";
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState("");
  const [aceite, setAceite] = useState(false);
  const [recusarAssinar, setRecusarAssinar] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [hashFinal, setHashFinal] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [tipoFinal, setTipoFinal] = useState<"assinatura" | "recusa">("assinatura");

  const { data, isLoading, error } = trpc.assinaturas.getByToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const assinarMutation = trpc.assinaturas.assinar.useMutation({
    onSuccess: (res) => {
      setHashFinal(res.hash);
      setPdfUrl(res.pdfUrl ?? null);
      setTipoFinal(res.tipo as "assinatura" | "recusa");
      setSucesso(true);
    },
  });

  const temAssinatura = assinaturaDataUrl.length > 100;
  const temMotivo = motivoRecusa.trim().length > 0;

  // Pode submeter se: (tem assinatura E aceite) OU (recusou E tem motivo E aceite)
  const podeSubmeter = aceite && (temAssinatura || (recusarAssinar && temMotivo)) && !assinarMutation.isPending;

  const handleSubmeter = () => {
    if (!podeSubmeter) return;
    assinarMutation.mutate({
      token,
      assinaturaDataUrl: temAssinatura ? assinaturaDataUrl : "",
      motivoRecusa: recusarAssinar ? motivoRecusa : undefined,
    });
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F2EDE4", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, border: "3px solid #1E4D3A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#4A5568" }}>A carregar documento...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // ─── Erro / Expirado ───────────────────────────────────────────────────────
  if (error || !data) {
    const msg = error?.message || "Link inválido ou não encontrado.";
    const isExpired = msg.includes("expirou");
    const isAlreadySigned = msg.includes("já foi assinada") || msg.includes("já foi processada");
    return (
      <div style={{ minHeight: "100vh", background: "#F2EDE4", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ background: "white", borderRadius: 20, padding: "40px 28px", maxWidth: 440, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{isAlreadySigned ? "✅" : isExpired ? "⏰" : "❌"}</div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#1E4D3A", margin: "0 0 12px" }}>
            {isAlreadySigned ? "Guia já processada" : isExpired ? "Link expirado" : "Link inválido"}
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#718096", lineHeight: 1.6, margin: 0 }}>
            {isAlreadySigned
              ? "Esta guia SADT já foi processada. Não é necessária nenhuma acção adicional."
              : isExpired
              ? "O prazo para assinar este documento expirou. Por favor, contacte a sua clínica para um novo link."
              : "Este link de assinatura não é válido. Por favor, contacte a sua clínica."}
          </p>
        </div>
      </div>
    );
  }

  // ─── Sucesso ───────────────────────────────────────────────────────────────
  if (sucesso) {
    const isRecusa = tipoFinal === "recusa";
    return (
      <div style={{ minHeight: "100vh", background: isRecusa ? "linear-gradient(135deg, #2D3748, #4A5568)" : "linear-gradient(135deg, #0D2A1E, #1A3D2E)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
        <div style={{ background: "white", borderRadius: 24, padding: "40px 28px", maxWidth: 500, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: isRecusa ? "linear-gradient(135deg, #718096, #4A5568)" : "linear-gradient(135deg, #1E4D3A, #2D6B52)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            boxShadow: isRecusa ? "0 8px 32px rgba(74,85,104,0.3)" : "0 8px 32px rgba(30,77,58,0.3)",
          }}>
            {isRecusa ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: isRecusa ? "#4A5568" : "#1E4D3A", margin: "0 0 8px" }}>
            {isRecusa ? "Recusa Registada" : "Assinatura Concluída!"}
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#4A5568", lineHeight: 1.65, margin: "0 0 24px" }}>
            {isRecusa
              ? "A sua recusa foi registada com validade jurídica. A clínica foi notificada."
              : "A sua assinatura digital foi registada com validade jurídica conforme a MP 2.200-2/2001 e o padrão ICP-Brasil."}
          </p>

          {/* Resumo */}
          <div style={{ background: "#F7F9F7", border: "1px solid #E2E8F0", borderRadius: 14, padding: "16px 20px", marginBottom: 20, textAlign: "left" }}>
            {[
              { label: "Paciente", value: data.pacienteNome },
              { label: "Sessão", value: `${formatarOrdinal(data.numeroSessao)} Sessão` },
              { label: "Data", value: formatarData(data.dataSessao) },
              { label: "Procedimento", value: data.procedimento },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid #F0F4F8" : "none" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#718096" }}>{item.label}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A", textAlign: "right", maxWidth: "60%" }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Hash SHA-256 */}
          <div style={{ background: "#EBF4F0", border: "1px solid #C6E0D4", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#2D6B52", marginBottom: 6 }}>
              🔒 Hash SHA-256 de Verificação
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: "#1E4D3A", wordBreak: "break-all", lineHeight: 1.5 }}>
              {hashFinal}
            </div>
          </div>

          {/* Botão de download do PDF */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%",
                background: "linear-gradient(135deg, #1E4D3A, #2D6B52)",
                color: "white",
                border: "none",
                borderRadius: 14,
                padding: "16px 24px",
                fontSize: 15,
                fontWeight: 700,
                textDecoration: "none",
                marginBottom: 12,
                boxShadow: "0 4px 16px rgba(30,77,58,0.25)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Descarregar Comprovante PDF
            </a>
          )}

          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#A0AEC0", margin: 0 }}>
            Guarde o código SHA-256 para verificação futura.
          </p>
        </div>
      </div>
    );
  }

  // ─── Formulário de Assinatura ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F2EDE4", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header sticky */}
      <header style={{ background: "#0D2A1E", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <img src={data?.clinicaLogoUrl || LOGO_MIFATURE} alt={data?.clinicaNome || "MiFatureClinic"} style={{ height: 44, maxWidth: 160, objectFit: 'contain', ...(data?.clinicaLogoUrl ? {} : { background: '#fff', borderRadius: 8, padding: 2 }) }} />
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(106,184,138,0.15)", border: "1px solid rgba(106,184,138,0.3)", borderRadius: 100, padding: "5px 12px" }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6AB88A" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#6AB88A", textTransform: "uppercase", letterSpacing: "0.1em" }}>Seguro</span>
        </div>
      </header>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 14px 80px" }}>

        {/* Card principal */}
        <div style={{ background: "white", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

          {/* Cabeçalho verde */}
          <div style={{ background: "linear-gradient(135deg, #1E4D3A, #2D6B52)", padding: "24px 20px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
              Guia SADT — Assinatura Digital
            </div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: "white", marginBottom: 16 }}>
              {formatarOrdinal(data.numeroSessao)} Sessão — {formatarData(data.dataSessao)}
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Paciente</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white", lineHeight: 1.3 }}>{data.pacienteNome}</div>
              </div>
              {data.pacienteCpf && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>CPF</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{data.pacienteCpf}</div>
                </div>
              )}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>Procedimento</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "white", lineHeight: 1.3 }}>{data.procedimento}</div>
              </div>
            </div>
          </div>

          {/* Corpo */}
          <div style={{ padding: "22px 20px" }}>

            {/* Aviso de validade jurídica */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#EBF4F0", border: "1px solid #C6E0D4", borderRadius: 12, padding: "12px 14px", marginBottom: 22 }}>
              <div style={{ fontSize: 18, flexShrink: 0 }}>🔒</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1E4D3A", marginBottom: 2 }}>Assinatura com Validade Jurídica</div>
                <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.5 }}>
                  Registada com hash SHA-256 e carimbo de tempo, conforme MP 2.200-2/2001 e ICP-Brasil.
                </div>
              </div>
            </div>

            {/* Toggle: assinar / recusar */}
            <div style={{ display: "flex", background: "#F7FAFC", borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 }}>
              <button
                onClick={() => setRecusarAssinar(false)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, border: "none",
                  background: !recusarAssinar ? "white" : "transparent",
                  boxShadow: !recusarAssinar ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, fontWeight: 600,
                  color: !recusarAssinar ? "#1E4D3A" : "#718096",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                ✍️ Assinar
              </button>
              <button
                onClick={() => setRecusarAssinar(true)}
                style={{
                  flex: 1, padding: "10px 12px", borderRadius: 10, border: "none",
                  background: recusarAssinar ? "white" : "transparent",
                  boxShadow: recusarAssinar ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13, fontWeight: 600,
                  color: recusarAssinar ? "#E53E3E" : "#718096",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                ❌ Não assinar
              </button>
            </div>

            {/* Painel de assinatura */}
            {!recusarAssinar && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E4D3A", marginBottom: 10 }}>
                  A sua assinatura <span style={{ color: "#E53E3E" }}>*</span>
                </label>
                <CanvasAssinatura onSign={setAssinaturaDataUrl} />
                {!temAssinatura && (
                  <div style={{ marginTop: 8, textAlign: "center", fontSize: 12, color: "#A0AEC0" }}>
                    ↑ Desenhe a sua assinatura no campo acima para continuar
                  </div>
                )}
              </div>
            )}

            {/* Painel de recusa — campo de motivo obrigatório */}
            {recusarAssinar && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#C53030", marginBottom: 4 }}>⚠ Atenção</div>
                  <div style={{ fontSize: 12, color: "#742A2A", lineHeight: 1.5 }}>
                    Ao recusar assinar, o motivo será registado com validade jurídica e a clínica será notificada. Esta acção não pode ser desfeita.
                  </div>
                </div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#1E4D3A", marginBottom: 8 }}>
                  Motivo da recusa <span style={{ color: "#E53E3E" }}>*</span>
                  <span style={{ fontWeight: 400, color: "#718096", marginLeft: 6 }}>(obrigatório)</span>
                </label>
                <textarea
                  value={motivoRecusa}
                  onChange={e => setMotivoRecusa(e.target.value)}
                  placeholder="Descreva o motivo pelo qual não pretende assinar este documento..."
                  rows={4}
                  style={{
                    width: "100%",
                    border: motivoRecusa.trim() ? "2px solid #C6E0D4" : "2px solid #E2E8F0",
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 14,
                    color: "#1A202C",
                    resize: "vertical",
                    outline: "none",
                    background: "white",
                    boxSizing: "border-box",
                    transition: "border-color 0.15s",
                    lineHeight: 1.5,
                  }}
                  onFocus={e => { e.target.style.borderColor = "#2D6B52"; }}
                  onBlur={e => { e.target.style.borderColor = motivoRecusa.trim() ? "#C6E0D4" : "#E2E8F0"; }}
                />
                {!temMotivo && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#E53E3E" }}>
                    O motivo é obrigatório para registar a recusa.
                  </div>
                )}
                {temMotivo && (
                  <div style={{ marginTop: 6, fontSize: 12, color: "#2D6B52", display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Motivo preenchido ({motivoRecusa.trim().length} caracteres)
                  </div>
                )}
              </div>
            )}

            {/* Checkbox de aceite */}
            <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", marginBottom: 22, padding: "14px 16px", background: "#F7FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <input
                type="checkbox"
                checked={aceite}
                onChange={e => setAceite(e.target.checked)}
                style={{ width: 22, height: 22, accentColor: "#1E4D3A", cursor: "pointer", flexShrink: 0, marginTop: 1 }}
              />
              <span style={{ fontSize: 13, color: "#4A5568", lineHeight: 1.6 }}>
                {recusarAssinar
                  ? <>Confirmo que sou <strong style={{ color: "#1E4D3A" }}>{data.pacienteNome}</strong> e que o motivo declarado acima é verdadeiro.</>
                  : <>Confirmo que sou <strong style={{ color: "#1E4D3A" }}>{data.pacienteNome}</strong> e que o atendimento descrito foi realizado. Estou ciente de que esta assinatura digital tem validade jurídica.</>
                }
              </span>
            </label>

            {/* Botão principal */}
            <button
              onClick={handleSubmeter}
              disabled={!podeSubmeter}
              style={{
                width: "100%",
                background: podeSubmeter
                  ? recusarAssinar
                    ? "linear-gradient(135deg, #C53030, #E53E3E)"
                    : "linear-gradient(135deg, #1E4D3A, #2D6B52)"
                  : "#E2E8F0",
                color: podeSubmeter ? "white" : "#A0AEC0",
                border: "none",
                borderRadius: 16,
                padding: "18px 24px",
                fontSize: 16,
                fontWeight: 700,
                cursor: podeSubmeter ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: podeSubmeter ? "0 4px 20px rgba(30,77,58,0.3)" : "none",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseDown={e => { if (podeSubmeter) (e.currentTarget.style.transform = "scale(0.97)"); }}
              onMouseUp={e => { (e.currentTarget.style.transform = "scale(1)"); }}
              onTouchStart={e => { if (podeSubmeter) (e.currentTarget.style.transform = "scale(0.97)"); }}
              onTouchEnd={e => { (e.currentTarget.style.transform = "scale(1)"); }}
            >
              {assinarMutation.isPending ? (
                <>
                  <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  A processar...
                </>
              ) : recusarAssinar ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Registar Recusa
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Assinar Digitalmente
                </>
              )}
            </button>

            {/* Erro */}
            {assinarMutation.isError && (
              <div style={{ marginTop: 12, background: "#FFF5F5", border: "1px solid #FEB2B2", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#C53030" }}>
                {assinarMutation.error?.message || "Erro ao processar. Tente novamente."}
              </div>
            )}

            {/* Expiração */}
            <div style={{ marginTop: 16, textAlign: "center", fontSize: 11, color: "#A0AEC0" }}>
              ⏰ Link válido até {new Date(data.tokenExpiresAt).toLocaleString("pt-BR")}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <img src={data?.clinicaLogoUrl || LOGO_MIFATURE} alt={data?.clinicaNome || "MiFatureClinic"} style={{ height: 24, maxWidth: 100, objectFit: 'contain', opacity: 0.35 }} />
          <p style={{ fontSize: 10, color: "#A0AEC0", marginTop: 6, lineHeight: 1.5 }}>
            MiFatureClinic · Assinatura Digital com Validade Jurídica
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
        @media (max-width: 480px) {
          canvas { height: 160px !important; }
        }
      `}</style>
    </div>
  );
}
