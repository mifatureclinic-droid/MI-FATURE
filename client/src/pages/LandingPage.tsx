/*
 * mifature — Landing Page Pública
 * Design: Modernismo Orgânico Amazônico
 * Paleta: Verde Canopeia #1E4D3A | Terracota #B5541C | Areia #F2EDE4
 * Fontes: Fraunces (display) + Plus Jakarta Sans (body)
 */

import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  ArrowDown,
  Menu,
  X,
  FileText,
  RefreshCcw,
  UserCheck,
  BarChart3,
  Scale,
  Stethoscope,
  Award,
  PhoneCall,
  Send,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Leaf,
  Calendar,
  ClipboardList,
  CreditCard,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Monitor,
  MessageCircle,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  PenLine,
  Lock,
  Smartphone,
  FileSignature,
  BadgeCheck,
  Music2,
  Volume2,
  VolumeX,
} from "lucide-react";

// ─── Imagens ───────────────────────────────────────────────────────────────
const HERO_IMG = "/manus-storage/mifature-hero-manaus-passaros_2bd72c62.jpg";
const ABOUT_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663531814883/ZdeqDX2PNSJ8CFpUiSSsHd/Retratoelegantecomblusarustica_d9959fb5.png";
const SERVICES_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663531814883/ZdeqDX2PNSJ8CFpUiSSsHd/mifature-services-cvpHk8YHgKs5TZ2TdgJ9TP.webp";
const CTA_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663531814883/ZdeqDX2PNSJ8CFpUiSSsHd/mifature-cta-ci2DqDmY8XhSnmjrHeiGdL.webp";
const AMAZONIA_AMANHECER_AUDIO = "/manus-storage/amazonia-amanhecer-floresta_014d149b.mp3";

// Mockups Assinatura Digital
const MOCKUP_GUIA_SADT =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663744625581/CVtXgzSxcBQ2arrxztUU7x/mockup_assinatura_guia_sadt-4ddVw3KpNxUFvBHHg8uG44.webp";
const MOCKUP_WHATSAPP =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663744625581/CVtXgzSxcBQ2arrxztUU7x/mockup_whatsapp_assinatura-EPV5EVpTrVLaJzkQFuFq2Q.webp";
const MOCKUP_HISTORICO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663744625581/CVtXgzSxcBQ2arrxztUU7x/mockup_historico_assinaturas-GvdEe8dR7VtvrpPAJofwvE.webp";
const LOGO_IMG = "/logo-mifature.png";

// ─── Hook de Intersection ──────────────────────────────────────────────────
function useIntersection(ref: React.RefObject<Element | null>, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return visible;
}

// ─── Música ambiente ───────────────────────────────────────────────────────
function AmbientMusicControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.12;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onError = () => setAudioUnavailable(true);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);
    void audio.play()
      .then(() => setAudioUnavailable(false))
      .catch(() => setAudioUnavailable(true));
    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, []);

  const toggleAmbientMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setAudioUnavailable(false);
      } catch {
        setAudioUnavailable(true);
      }
      return;
    }
    audio.pause();
  };

  const label = audioUnavailable
    ? "Iniciar ambiente"
    : isPlaying
      ? "Pausar ambiente"
      : "Ouvir ambiente";

  return (
    <>
      <audio ref={audioRef} src={AMAZONIA_AMANHECER_AUDIO} loop autoPlay preload="auto" />
      <button
        type="button"
        onClick={toggleAmbientMusic}
        aria-label={label}
        aria-pressed={isPlaying}
        title={label}
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          zIndex: 45,
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "0 16px",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.32)",
          background: isPlaying ? "#B5541C" : "rgba(13,42,30,0.92)",
          color: "white",
          boxShadow: "0 10px 30px rgba(13,42,30,0.28)",
          backdropFilter: "blur(12px)",
          cursor: "pointer",
          opacity: 1,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          transition: "transform 160ms cubic-bezier(0.23,1,0.32,1), background 180ms cubic-bezier(0.23,1,0.32,1)",
        }}
        onMouseEnter={event => {
          event.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={event => { event.currentTarget.style.transform = "translateY(0)"; }}
      >
        {isPlaying ? <Volume2 size={18} aria-hidden="true" /> : audioUnavailable ? <VolumeX size={18} aria-hidden="true" /> : <Music2 size={18} aria-hidden="true" />}
        <span className="ambient-music-label">{label}</span>
      </button>
    </>
  );
}

// ─── Navbar ────────────────────────────────────────────────────────────────
function Navbar({ onSistema }: { onSistema: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoOpacity, setLogoOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      setLogoOpacity(Math.max(0, 1 - window.scrollY / 300));
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const navLinks = [
    { label: "Início", href: "#inicio" },
    { label: "Serviços", href: "#servicos" },
    { label: "Como Funciona", href: "#como-funciona" },
    { label: "Sobre", href: "#sobre" },
    { label: "Contato", href: "#contato" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0D2A1E]/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "88px" }}>


          {/* Desktop Links */}
          <ul style={{ display: "flex", alignItems: "center", gap: 32, listStyle: "none", margin: 0, padding: 0, marginLeft: "auto" }} className="hidden-mobile">
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => handleNav(link.href)}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = "white")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onSistema}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "white", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "8px 20px", cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              >
                Sistema
              </button>
            </li>
          </ul>

          {/* CTA Button */}
          <div className="hidden-mobile" style={{ marginLeft: 24 }}>
            <button
              onClick={() => handleNav("#contato")}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "10px 20px", borderRadius: 999, background: "#B5541C", color: "white", border: "none", cursor: "pointer", transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#D4713A"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#B5541C"; }}
            >
              Fale Conosco
            </button>
          </div>

          {/* Mobile Toggle */}
          <button
            className="show-mobile"
            style={{ color: "white", background: "none", border: "none", padding: 8, cursor: "pointer" }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
      <div
        style={{
          maxHeight: mobileOpen ? 500 : 0,
          opacity: mobileOpen ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.3s ease",
          background: "rgba(30,77,58,0.98)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ padding: "8px 16px 24px" }}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <button
                  onClick={() => handleNav(link.href)}
                  style={{ width: "100%", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.8)", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "12px 0", cursor: "pointer" }}
                >
                  {link.label}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onSistema}
                style={{ width: "100%", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "white", background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "12px 0", cursor: "pointer" }}
              >
                Sistema
              </button>
            </li>
          </ul>
          <button
            onClick={() => handleNav("#contato")}
            style={{ marginTop: 16, width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "12px 20px", borderRadius: 999, background: "#B5541C", color: "white", border: "none", cursor: "pointer" }}
          >
            Fale Conosco
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Hero Section ──────────────────────────────────────────────────────────
function HeroSection() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  return (
    <section id="inicio" style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      <div className="hero-haze hero-haze-one" aria-hidden="true" />
      <div className="hero-haze hero-haze-two" aria-hidden="true" />
      <div className="hero-bird hero-bird-one" aria-hidden="true">
        <svg viewBox="0 0 112 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 33C18 12 37 10 55 29C71 10 90 10 107 22" stroke="rgba(245, 227, 160, 0.62)" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="hero-bird hero-bird-two" aria-hidden="true">
        <svg viewBox="0 0 76 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 25C14 10 27 9 38 23C49 9 62 9 74 16" stroke="rgba(214, 238, 211, 0.5)" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(13,42,30,0.92) 0%, rgba(30,77,58,0.55) 46%, rgba(30,77,58,0.1) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,42,30,0.45) 0%, transparent 62%)" }} />

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1280, margin: "0 auto", padding: "0 1rem", width: "100%" }}>
        <div style={{ maxWidth: 720 }}>
          {/* Tag */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "all 0.7s ease" }}>
            <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#D4713A" }}>
              Faturamento Terceirizado
            </span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, color: "white", lineHeight: 1.05, marginBottom: 24, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.15s" }}>
            Gestão de{" "}
            <span style={{ fontStyle: "italic", color: "#6AB88A" }}>faturamento</span>
            <br />
            para clínicas{" "}
            <span style={{ fontStyle: "italic", color: "#6AB88A" }}>médicas</span>
          </h1>

          {/* Subtitle */}
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(1rem, 2vw, 1.2rem)", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.3s" }}>
            Credenciamento junto às operadoras, faturamento de guias, recurso de glosas e atualização cadastral — tudo com precisão e agilidade para que sua clínica foque no que realmente importa: o paciente.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.5s" }}>
            <button
              onClick={() => document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth" })}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: "16px 32px", borderRadius: 999, background: "#B5541C", color: "white", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#D4713A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#B5541C"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Solicitar Proposta
            </button>
            <button
              onClick={() => document.querySelector("#servicos")?.scrollIntoView({ behavior: "smooth" })}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: "16px 32px", borderRadius: 999, background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 15, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
            >
              Nossos Serviços
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.querySelector("#servicos")?.scrollIntoView({ behavior: "smooth" })}
        style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em" }}>Explorar</span>
        <ArrowDown size={18} style={{ animation: "bounce 2s infinite" }} />
      </button>

      {/* Bottom wave */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10 }}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: 64 }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#F2EDE4" />
        </svg>
      </div>
    </section>
  );
}

// ─── Slider Section ──────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: "portal",
    tag: "Destaque",
    tagColor: "#B5541C",
    title: "Portal MiFatureClinic",
    subtitle: "O sistema completo para a sua clínica",
    description: "Agenda inteligente, prontuário eletrônico, guias TISS/ANS, faturamento automático, repasse financeiro e muito mais — tudo em um único sistema pensado para clínicas médicas.",
    highlight: true,
    bg: "linear-gradient(135deg, #0D2A1E 0%, #1E4D3A 50%, #2D6A4F 100%)",
    accent: "#6AB88A",
    points: [
      { icon: Calendar, text: "Agenda multi-profissional" },
      { icon: ClipboardList, text: "Prontuário + assinatura digital" },
      { icon: CreditCard, text: "Faturamento TISS automático" },
      { icon: TrendingUp, text: "Relatórios e repasse financeiro" },
    ],
    cta: "Conhecer o Portal",
    ctaAction: "portal",
  },
  {
    id: "faturamento",
    tag: "Serviço Principal",
    tagColor: "#B5541C",
    title: "Faturamento de Guias",
    subtitle: "Precisão e agilidade no faturamento",
    description: "Elaboração, revisão e envio de guias SP/SADT, APAC e demais documentos de faturamento com rigor técnico e dentro dos prazos das operadoras. Zero glosas por erro de preenchimento.",
    highlight: false,
    bg: "linear-gradient(135deg, #1A1A2E 0%, #2C3E50 50%, #34495E 100%)",
    accent: "#D4713A",
    points: [
      { icon: FileText, text: "Guias SP/SADT e APAC" },
      { icon: CheckCircle2, text: "Revisão antes do envio" },
      { icon: Zap, text: "Envio dentro do prazo" },
      { icon: ShieldCheck, text: "Zero glosas por erro" },
    ],
    cta: "Solicitar Proposta",
    ctaAction: "contato",
  },
  {
    id: "credenciamento",
    tag: "Serviço",
    tagColor: "#2D6A4F",
    title: "Credenciamento",
    subtitle: "Habilitado em todas as operadoras",
    description: "Gerenciamos todo o processo de credenciamento e recredenciamento junto às operadoras de saúde, garantindo que sua clínica esteja sempre habilitada para atender sem interrupções.",
    highlight: false,
    bg: "linear-gradient(135deg, #1E3A2F 0%, #2D5A45 50%, #3D7A5F 100%)",
    accent: "#A8D5B5",
    points: [
      { icon: UserCheck, text: "Credenciamento inicial" },
      { icon: RefreshCcw, text: "Recredenciamento periódico" },
      { icon: Users, text: "Múltiplas operadoras" },
      { icon: Award, text: "Documentação completa" },
    ],
    cta: "Saiba Mais",
    ctaAction: "servicos",
  },
  {
    id: "glosas",
    tag: "Serviço",
    tagColor: "#8B1A1A",
    title: "Recurso de Glosas",
    subtitle: "Recupere o que é seu por direito",
    description: "Identificamos e contestamos glosas indevidas com argumentação técnica e jurídica, recuperando valores que impactam diretamente a receita da sua clínica. Taxa de sucesso acima de 90%.",
    highlight: false,
    bg: "linear-gradient(135deg, #2A1A0E 0%, #4A2C1A 50%, #6B3D25 100%)",
    accent: "#E8A87C",
    points: [
      { icon: Scale, text: "Análise técnica e jurídica" },
      { icon: BarChart3, text: "Acima de 90% de sucesso" },
      { icon: TrendingUp, text: "Recuperação de receita" },
      { icon: ShieldCheck, text: "Acompanhamento do processo" },
    ],
    cta: "Solicitar Análise",
    ctaAction: "contato",
  },
  {
    id: "cadastral",
    tag: "Serviço",
    tagColor: "#1A3A5C",
    title: "Atualização Cadastral",
    subtitle: "Dados sempre actualizados",
    description: "Mantemos os dados da clínica e dos profissionais atualizados em todas as operadoras, evitando bloqueios, glosas cadastrais e atrasos nos pagamentos por informações desactualizadas.",
    highlight: false,
    bg: "linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 50%, #2A5A8C 100%)",
    accent: "#7BAFD4",
    points: [
      { icon: Monitor, text: "Cadastro em todas as operadoras" },
      { icon: RefreshCcw, text: "Actualizações periódicas" },
      { icon: CheckCircle2, text: "Evita bloqueios e glosas" },
      { icon: Stethoscope, text: "Dados dos profissionais" },
    ],
    cta: "Fale Conosco",
    ctaAction: "contato",
  },
];

function SliderSection({ onSistema }: { onSistema: () => void }) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersection(ref);

  useEffect(() => { if (isVisible) setTimeout(() => setVisible(true), 100); }, [isVisible]);

  const goTo = (idx: number, dir: "left" | "right") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 320);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length, "left");
  const next = () => goTo((current + 1) % SLIDES.length, "right");

  // Autoplay
  useEffect(() => {
    timerRef.current = setTimeout(() => goTo((current + 1) % SLIDES.length, "right"), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current]);

  const slide = SLIDES[current];

  const handleCta = () => {
    if (slide.ctaAction === "portal") onSistema();
    else if (slide.ctaAction === "contato") document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth" });
    else if (slide.ctaAction === "servicos") document.querySelector("#servicos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      style={{
        padding: "80px 0 0",
        background: "#F2EDE4",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>O que oferecemos</span>
            <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 700, color: "#1E4D3A", margin: 0 }}>
            Soluções completas para <span style={{ fontStyle: "italic", color: "#B5541C" }}>clínicas médicas</span>
          </h2>
        </div>

        {/* Slider */}
        <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", minHeight: 380 }}>
          {/* Slide content */}
          <div
            style={{
              background: slide.bg,
              minHeight: 380,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateX(${direction === "right" ? "-40px" : "40px"})`
                : "translateX(0)",
              transition: "opacity 0.32s ease, transform 0.32s cubic-bezier(0.23,1,0.32,1)",
            }}
          >
            {/* Left: text */}
            <div style={{ padding: "56px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {/* Tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <span style={{ width: 24, height: 1, background: slide.accent, display: "block" }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: slide.accent }}>
                  {slide.tag}
                </span>
                {slide.highlight && (
                  <span style={{ background: "#B5541C", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.1em" }}>★ Destaque</span>
                )}
              </div>

              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, color: "white", lineHeight: 1.1, marginBottom: 8 }}>
                {slide.title}
              </h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: slide.accent, marginBottom: 16, letterSpacing: "0.02em" }}>
                {slide.subtitle}
              </p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.75)", marginBottom: 32, maxWidth: 420 }}>
                {slide.description}
              </p>

              <button
                onClick={handleCta}
                style={{
                  alignSelf: "flex-start",
                  padding: "12px 28px",
                  borderRadius: 999,
                  background: slide.highlight ? "#B5541C" : slide.accent,
                  color: slide.highlight ? "white" : "#0D2A1E",
                  border: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.25s cubic-bezier(0.23,1,0.32,1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.04)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {slide.cta} <ArrowRight size={15} />
              </button>
            </div>

            {/* Right: feature points */}
            <div style={{ padding: "56px 48px 56px 24px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
              {slide.points.map((pt, i) => {
                const PtIcon = pt.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: `1px solid ${slide.accent}30`,
                    }}>
                      <PtIcon size={20} style={{ color: slide.accent }} />
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "white", margin: 0 }}>{pt.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "all 0.2s ease", zIndex: 10 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", transition: "all 0.2s ease", zIndex: 10 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
          >
            <ChevronRight size={20} />
          </button>

          {/* Progress bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.1)" }}>
            <div
              style={{
                height: "100%",
                background: slide.accent,
                width: `${((current + 1) / SLIDES.length) * 100}%`,
                transition: "width 0.4s cubic-bezier(0.23,1,0.32,1)",
              }}
            />
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24, paddingBottom: 16 }}>
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? "right" : "left")}
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 999,
                background: i === current ? "#1E4D3A" : "rgba(30,77,58,0.25)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.35s cubic-bezier(0.23,1,0.32,1)",
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Services Section ──────────────────────────────────────────────────────
const services = [
  { icon: UserCheck, title: "Credenciamento", description: "Gerenciamos todo o processo de credenciamento e recredenciamento junto às operadoras de saúde, garantindo que sua clínica esteja sempre habilitada para atender.", highlight: false },
  { icon: FileText, title: "Faturamento de Guias", description: "Elaboração, revisão e envio de guias SP/SADT, APAC e demais documentos de faturamento com rigor técnico e dentro dos prazos das operadoras.", highlight: true },
  { icon: RefreshCcw, title: "Recurso de Glosas", description: "Identificamos e contestamos glosas indevidas, recuperando valores que impactam diretamente a receita da sua clínica.", highlight: false },
  { icon: BarChart3, title: "Atualização Cadastral", description: "Mantemos os dados da clínica e dos profissionais atualizados em todas as operadoras, evitando bloqueios e atrasos nos pagamentos.", highlight: false },
];

function ServiceCard({ service, i, visible }: { service: typeof services[0], i: number, visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = service.icon;
  const isHighlight = service.highlight;

  return (
    <div
      key={service.title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        borderRadius: 16,
        padding: 28,
        background: isHighlight
          ? (hovered ? "#163D2E" : "#1E4D3A")
          : (hovered ? "#FAFAF8" : "white"),
        color: isHighlight ? "white" : "#1E4D3A",
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)")
          : "translateY(48px) scale(1)",
        transition: hovered
          ? `opacity 0.7s ease ${i * 100 + 200}ms, transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s cubic-bezier(0.23,1,0.32,1), background 0.25s ease`
          : `opacity 0.7s ease ${i * 100 + 200}ms, transform 0.7s ease ${i * 100 + 200}ms, box-shadow 0.35s cubic-bezier(0.23,1,0.32,1), background 0.25s ease`,
        boxShadow: hovered
          ? (isHighlight ? "0 24px 48px rgba(30,77,58,0.35)" : "0 24px 48px rgba(0,0,0,0.12)")
          : "0 2px 8px rgba(0,0,0,0.04)",
        cursor: "default",
        outline: hovered && !isHighlight ? "1.5px solid #D4E8DB" : "1.5px solid transparent",
      }}
    >
      {/* Icon container */}
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        background: isHighlight
          ? (hovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.15)")
          : (hovered ? "#D4E8DB" : "#F2EDE4"),
        transition: "background 0.3s ease, transform 0.35s cubic-bezier(0.23,1,0.32,1)",
        transform: hovered ? "rotate(-6deg) scale(1.12)" : "rotate(0deg) scale(1)",
      }}>
        <Icon size={22} style={{ color: isHighlight ? "#6AB88A" : "#1E4D3A" }} />
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 12,
        color: isHighlight ? "white" : "#1E4D3A",
        transition: "color 0.2s ease",
      }}>{service.title}</h3>

      {/* Description */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14,
        lineHeight: 1.7,
        color: isHighlight ? "rgba(255,255,255,0.8)" : "#4A5568",
        margin: 0,
        transition: "color 0.2s ease",
      }}>{service.description}</p>

      {/* Bottom accent line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 28,
        right: 28,
        height: 2,
        borderRadius: 1,
        background: isHighlight ? "#6AB88A" : "#1E4D3A",
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1)",
      }} />
    </div>
  );
}

function ServicesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section id="servicos" style={{ background: "#F2EDE4", padding: "96px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }} ref={ref}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 64 }}>
          <div style={{ maxWidth: 560, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ width: 40, height: 1, background: "#B5541C", display: "block" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Nossos Serviços</span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#1E4D3A", lineHeight: 1.2, margin: 0 }}>
              Soluções completas em{" "}
              <span style={{ fontStyle: "italic" }}>faturamento médico</span>
            </h2>
          </div>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "#4A5568", maxWidth: 340, lineHeight: 1.7, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.2s" }}>
            Cuidamos de toda a burocracia do faturamento para que você possa dedicar mais tempo ao cuidado dos seus pacientes.
          </p>
        </div>

        {/* Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} i={i} visible={visible} />
          ))}
        </div>

        {/* Image Strip */}
        <div style={{ marginTop: 64, borderRadius: 24, overflow: "hidden", position: "relative", height: 280, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.7s" }}>
          <img src={SERVICES_IMG} alt="Clínica médica moderna" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(30,77,58,0.8) 0%, transparent 60%)", display: "flex", alignItems: "center" }}>
            <div style={{ paddingLeft: 48, maxWidth: 480 }}>
              <p style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", fontWeight: 600, color: "white", lineHeight: 1.4, margin: 0 }}>
                "Sua clínica merece um faturamento{" "}
                <span style={{ fontStyle: "italic", color: "#6AB88A" }}>sem complicações</span>."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ──────────────────────────────────────────────────────────
const steps = [
  { number: "01", icon: PhoneCall, title: "Diagnóstico Inicial", description: "Realizamos uma análise gratuita do processo atual de faturamento da sua clínica, identificando oportunidades de melhoria e gargalos que impactam a receita." },
  { number: "02", icon: FileText, title: "Proposta Personalizada", description: "Desenvolvemos um plano de trabalho sob medida, com escopo, prazos e indicadores claros para acompanhamento dos resultados." },
  { number: "03", icon: Send, title: "Implementação", description: "Nossa equipe especializada assume o faturamento, credenciamento e gestão de glosas, com comunicação transparente em cada etapa." },
  { number: "04", icon: CheckCircle2, title: "Resultados e Relatórios", description: "Você recebe relatórios periódicos com indicadores de desempenho, valores faturados, glosas recuperadas e status de credenciamentos." },
];

function StepCard({ step, i, visible }: { step: typeof steps[0], i: number, visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = step.icon;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        padding: 24,
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        opacity: visible ? 1 : 0,
        transform: visible
          ? (hovered ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)")
          : "translateY(48px) scale(1)",
        transition: hovered
          ? `opacity 0.7s ease ${i * 150}ms, transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s cubic-bezier(0.23,1,0.32,1), background 0.25s ease`
          : `opacity 0.7s ease ${i * 150}ms, transform 0.7s ease ${i * 150}ms, box-shadow 0.35s cubic-bezier(0.23,1,0.32,1), background 0.25s ease`,
        boxShadow: hovered ? "0 24px 48px rgba(0,0,0,0.25)" : "0 2px 8px rgba(0,0,0,0.08)",
        outline: hovered ? "1px solid rgba(106,184,138,0.3)" : "1px solid transparent",
        cursor: "default",
      }}
    >
      {/* Icon + number row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: hovered ? "#C8612A" : "#B5541C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.3s ease, transform 0.35s cubic-bezier(0.23,1,0.32,1)",
          transform: hovered ? "rotate(-6deg) scale(1.12)" : "rotate(0deg) scale(1)",
          boxShadow: hovered ? "0 8px 20px rgba(181,84,28,0.45)" : "none",
        }}>
          <Icon size={20} style={{ color: "white" }} />
        </div>
        <span style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "2.5rem",
          fontWeight: 700,
          color: hovered ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.15)",
          transition: "color 0.25s ease",
          lineHeight: 1,
        }}>{step.number}</span>
      </div>

      {/* Title */}
      <h3 style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 20,
        fontWeight: 600,
        color: hovered ? "#6AB88A" : "white",
        marginBottom: 12,
        transition: "color 0.25s ease",
      }}>{step.title}</h3>

      {/* Description */}
      <p style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14,
        color: hovered ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.65)",
        lineHeight: 1.7,
        margin: 0,
        transition: "color 0.25s ease",
      }}>{step.description}</p>

      {/* Bottom accent line */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 24,
        right: 24,
        height: 2,
        borderRadius: 1,
        background: "#6AB88A",
        transform: hovered ? "scaleX(1)" : "scaleX(0)",
        transformOrigin: "left",
        transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1)",
      }} />
    </div>
  );
}

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.1);

  return (
    <section id="como-funciona" style={{ background: "#1E4D3A", padding: "96px 0", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, right: 0, fontFamily: "'Fraunces', serif", fontSize: "20rem", fontWeight: 700, color: "rgba(255,255,255,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none" }}>∞</div>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }} ref={ref}>
        {/* Header */}
        <div style={{ marginBottom: 64, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 40, height: 1, background: "#B5541C", display: "block" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Como Funciona</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "white", lineHeight: 1.2, maxWidth: 480, margin: 0 }}>
            Do diagnóstico ao{" "}
            <span style={{ fontStyle: "italic", color: "#6AB88A" }}>resultado</span>
          </h2>
        </div>

        {/* Steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, position: "relative" }}>
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} i={i} visible={visible} />
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: "100%", height: 64 }}>
          <path d="M0,20 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="#FAFAF8" />
        </svg>
      </div>
    </section>
  );
}

// ─── About Section ─────────────────────────────────────────────────────────
const expertise = [
  { icon: Scale, title: "Direito em Saúde", description: "Bacharel em Direito com especialização em contratos de saúde suplementar e regulamentações ANS." },
  { icon: Stethoscope, title: "Processos TISS", description: "Domínio completo dos padrões TISS, TUSS e demais normas técnicas das operadoras." },
  { icon: Award, title: "Auditoria Médica", description: "Experiência em auditoria de contas médicas e contestação técnica de glosas." },
];

function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref);

  return (
    <section id="sobre" style={{ background: "#FAFAF8", padding: "96px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }} ref={ref}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 64, alignItems: "center" }}>
          {/* Image */}
          <div style={{ position: "relative", opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-48px)", transition: "all 0.7s ease" }}>
            <div style={{ borderRadius: 24, overflow: "hidden", aspectRatio: "3/4", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}>
              <img src={ABOUT_IMG} alt="Jéssica Santos — Proprietária mifature" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(30,77,58,0.4) 0%, transparent 60%)" }} />
            </div>
            <div style={{ position: "absolute", bottom: -24, right: -24, width: 128, height: 128, borderRadius: "50%", background: "#F2EDE4", zIndex: -1 }} />
            <div style={{ position: "absolute", top: -24, left: -24, width: 80, height: 80, borderRadius: "50%", border: "2px solid rgba(181,84,28,0.2)", zIndex: -1 }} />
          </div>

          {/* Text */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(48px)", transition: "all 0.7s ease 0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ width: 40, height: 1, background: "#B5541C", display: "block" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Sobre a mifature</span>
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#1E4D3A", lineHeight: 1.2, marginBottom: 24 }}>
              Expertise em{" "}
              <span style={{ fontStyle: "italic" }}>faturamento médico</span>
            </h2>

            {/* Professional Info */}
            <div style={{ marginBottom: 32, paddingBottom: 32, borderBottom: "1px solid #E5DDD3" }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: "#1E4D3A", marginBottom: 4 }}>Jéssica Santos</h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#1E4D3A", marginBottom: 8 }}>Proprietária & Consultora</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#4A5568", lineHeight: 1.7, marginBottom: 16 }}>Bacharel em Direito | Pós-graduada em Direito Civil e Processo Civil</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "#1E4D3A", marginBottom: 8 }}>16+ Anos de Experiência</p>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#4A5568", lineHeight: 1.7, margin: 0 }}>
                Trajetória consolidada em faturamento terceirizado, recurso de glosas, auditoria médica e gestão de receitas para clínicas de saúde. Conhecimento profundo dos processos TISS, regulamentações de operadoras e melhores práticas do setor de saúde suplementar.
              </p>
            </div>

            {/* Expertise */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {expertise.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 16, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `all 0.7s ease ${i * 100 + 400}ms` }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F2EDE4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} style={{ color: "#1E4D3A" }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 15, fontWeight: 600, color: "#1E4D3A", marginBottom: 4 }}>{item.title}</h4>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#4A5568", margin: 0 }}>{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div style={{ marginTop: 40, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.7s" }}>
              <button
                onClick={() => document.querySelector("#contato")?.scrollIntoView({ behavior: "smooth" })}
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: "12px 32px", borderRadius: 999, background: "#1E4D3A", color: "white", border: "none", cursor: "pointer", fontSize: 14, transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2D6B52"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1E4D3A"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Agendar Consultoria
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Portal Section ──────────────────────────────────────────────────────────
function PortalSection({ onSistema }: { onSistema: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.08);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "01",
      icon: UserCheck,
      title: "Cadastro da Clínica",
      desc: "Em minutos, a sua clínica está configurada: profissionais, convênios, procedimentos e regras de faturamento. Sem complicação, sem papelada.",
      detail: "Configure perfis de acesso por função (recepcionista, médico, administrador), importe sua tabela de procedimentos e vincule os convênios activos da clínica.",
    },
    {
      num: "02",
      icon: Calendar,
      title: "Agenda e Atendimento",
      desc: "Agende consultas, envie confirmações automáticas pelo WhatsApp e registe o prontuário do paciente directamente no sistema.",
      detail: "O paciente recebe um link de confirmação 24h antes. Ao chegar, assina digitalmente a guia SADT. O médico preenche o prontuário e o sistema gera a guia automaticamente.",
    },
    {
      num: "03",
      icon: FileText,
      title: "Faturamento TISS",
      desc: "O sistema monta os lotes de faturamento, valida as guias conforme as regras da operadora e envia electronicamente — sem erros manuais.",
      detail: "Guias SP/SADT, APAC, consulta e internação geradas em conformidade com o padrão ANS/TISS. Controle de prazos e alertas de vencimento por operadora.",
    },
    {
      num: "04",
      icon: Scale,
      title: "Controle de Glosas",
      desc: "Glosas identificadas automaticamente com sugestão de recurso. Acompanhe o status de cada contestação em tempo real.",
      detail: "O sistema cruza os retornos das operadoras com as guias enviadas, classifica as glosas por tipo e gera o recurso técnico com um clique.",
    },
    {
      num: "05",
      icon: TrendingUp,
      title: "Repasse e Relatórios",
      desc: "Calcule o repasse financeiro por profissional, convênio e período. Relatórios completos de produtividade e receita da clínica.",
      detail: "Defina percentuais de repasse por convênio, particular e tipo de atendimento. Exporte relatórios em PDF ou Excel para a contabilidade.",
    },
  ];

  const vantagens = [
    { icon: Zap, title: "Redução de glosas", value: "até 90%", desc: "Validação automática antes do envio elimina erros de preenchimento" },
    { icon: TrendingUp, title: "Mais receita", value: "+35%", desc: "Faturamento completo e sem perda de guias por prazo ou erro" },
    { icon: Calendar, title: "Tempo economizado", value: "8h/semana", desc: "Automação de tarefas repetitivas libera a equipa para o que importa" },
    { icon: ShieldCheck, title: "Conformidade ANS", value: "100%", desc: "Guias sempre em conformidade com o padrão TISS vigente" },
  ];

  const features = [
    { icon: Calendar, title: "Agenda Inteligente", desc: "Multi-profissional com confirmação automática via WhatsApp." },
    { icon: ClipboardList, title: "Prontuário Integrado", desc: "Registro clínico vinculado ao agendamento com geração automática de guia." },
    { icon: FileText, title: "Guias TISS/ANS", desc: "Emissão de guias em conformidade com as operadoras de saúde." },
    { icon: CreditCard, title: "Faturamento Automatizado", desc: "Fechamento de lotes, envio TISS e controle de glosas integrado." },
    { icon: MessageSquare, title: "Lembretes WhatsApp", desc: "Confirmação de consulta e assinatura digital pelo WhatsApp do paciente." },
    { icon: BarChart3, title: "Dashboard Financeiro", desc: "Visão em tempo real de guias emitidas, pagas e pendentes." },
  ];

  return (
    <section id="sistema" style={{ background: "#0D2A1E", overflow: "hidden", position: "relative" }}>

      {/* ─── BLOCO 1: TAG DE INTRODUÇÃO ─── */}
      <div style={{ background: "linear-gradient(135deg, #0D2A1E 0%, #1E4D3A 60%, #2D6A4F 100%)", padding: "96px 0 80px", position: "relative", overflow: "hidden" }}>
        {/* Decorative */}
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(181,84,28,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(106,184,138,0.05)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }} ref={ref}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Left: intro text */}
            <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-40px)", transition: "all 0.8s cubic-bezier(0.23,1,0.32,1)" }}>
              {/* Tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(181,84,28,0.15)", border: "1px solid rgba(181,84,28,0.35)", borderRadius: 100, padding: "8px 20px", marginBottom: 28 }}>
                <Monitor size={14} style={{ color: "#E8845A" }} />
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#E8845A" }}>Portal MiFatureClinic</span>
                <span style={{ background: "#B5541C", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.08em" }}>Novo</span>
              </div>

              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 700, color: "white", lineHeight: 1.15, margin: "0 0 20px" }}>
                O sistema que a sua<br />
                <span style={{ color: "#6AB88A", fontStyle: "italic" }}>clínica precisava</span>
              </h2>

              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.8, margin: "0 0 32px", maxWidth: 480 }}>
                O <strong style={{ color: "white" }}>MiFatureClinic</strong> é um portal completo de gestão para clínicas médicas. Do agendamento ao faturamento TISS, tudo num único sistema — integrado, automatizado e em conformidade com a ANS.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 40 }}>
                {[
                  "Agenda, prontuário e guias TISS integrados",
                  "Faturamento automático com validação antes do envio",
                  "Controle de glosas e recurso com um clique",
                  "Repasse financeiro por profissional e convênio",
                  "Confirmação de consulta e assinatura digital via WhatsApp",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(106,184,138,0.2)", border: "1px solid #6AB88A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={12} style={{ color: "#6AB88A" }} />
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{item}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <button
                  onClick={onSistema}
                  style={{ background: "#B5541C", color: "white", border: "none", borderRadius: 50, padding: "14px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.25s cubic-bezier(0.23,1,0.32,1)", boxShadow: "0 4px 20px rgba(181,84,28,0.4)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(181,84,28,0.55)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(181,84,28,0.4)"; }}
                >
                  Acessar o Sistema <ArrowRight size={16} />
                </button>
                <a
                  href="https://wa.me/5592999045415?text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20o%20portal%20MiFatureClinic."
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 50, padding: "14px 28px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none", transition: "all 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
                >
                  Solicitar Demo
                </a>
              </div>
            </div>

            {/* Right: stats cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(40px)", transition: "all 0.8s cubic-bezier(0.23,1,0.32,1) 0.2s" }}>
              {vantagens.map((v, i) => {
                const VIcon = v.icon;
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 12, transition: "all 0.25s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(106,184,138,0.4)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(106,184,138,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <VIcon size={20} style={{ color: "#6AB88A" }} />
                    </div>
                    <div style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", fontWeight: 700, color: "#6AB88A", lineHeight: 1 }}>{v.value}</div>
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "white", margin: "0 0 4px" }}>{v.title}</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.5 }}>{v.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BLOCO 2: COMO FUNCIONA (STEPS) ─── */}
      <div style={{ background: "#F2EDE4", padding: "96px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Como funciona</span>
              <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "#1E4D3A", margin: "0 0 16px" }}>
              Do cadastro ao repasse em <span style={{ fontStyle: "italic", color: "#B5541C" }}>5 passos</span>
            </h2>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, color: "#4A5568", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              O MiFatureClinic foi desenhado para ser intuitivo. Veja como o fluxo completo da sua clínica funciona dentro do sistema.
            </p>
          </div>

          {/* Steps grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, position: "relative" }}>
            {/* Connector line */}
            <div style={{ position: "absolute", top: 36, left: "10%", right: "10%", height: 2, background: "linear-gradient(90deg, #1E4D3A22, #1E4D3A44, #1E4D3A22)", zIndex: 0, display: "none" }} />

            {steps.map((step, i) => {
              const SIcon = step.icon;
              const isActive = activeStep === i;
              return (
                <div
                  key={step.num}
                  onClick={() => setActiveStep(i)}
                  style={{
                    position: "relative",
                    padding: "32px 20px",
                    borderRadius: 20,
                    background: isActive ? "#1E4D3A" : "white",
                    border: isActive ? "2px solid #1E4D3A" : "2px solid #E8E0D8",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
                    transform: isActive ? "translateY(-8px)" : "translateY(0)",
                    boxShadow: isActive ? "0 20px 48px rgba(30,77,58,0.25)" : "0 2px 8px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    zIndex: 1,
                  }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "#1E4D3A"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(30,77,58,0.15)"; } }}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "#E8E0D8"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; } }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: isActive ? "rgba(255,255,255,0.15)" : "rgba(30,77,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SIcon size={22} style={{ color: isActive ? "#6AB88A" : "#1E4D3A" }} />
                    </div>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.2)" : "rgba(30,77,58,0.15)", lineHeight: 1 }}>{step.num}</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: isActive ? "white" : "#1E4D3A", margin: "0 0 8px" }}>{step.title}</h3>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: isActive ? "rgba(255,255,255,0.75)" : "#4A5568", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                  </div>
                  {isActive && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 14, marginTop: 4 }}>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{step.detail}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── BLOCO 3: FUNCIONALIDADES (POSTS) ─── */}
      <div style={{ background: "#1E4D3A", padding: "96px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 32, height: 1, background: "#6AB88A", display: "block" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#6AB88A" }}>Funcionalidades</span>
              <span style={{ width: 32, height: 1, background: "#6AB88A", display: "block" }} />
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", fontWeight: 700, color: "white", margin: 0 }}>
              Tudo o que a sua clínica <span style={{ fontStyle: "italic", color: "#E8845A" }}>precisa</span>
            </h2>
          </div>

          {/* Feature posts grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 56 }}>
            {features.map((f, i) => {
              const FIcon = f.icon;
              return (
                <div
                  key={f.title}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 20,
                    padding: "32px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(40px)",
                    transition: `all 0.5s ease ${i * 80}ms`,
                    cursor: "default",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(181,84,28,0.4)"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(0,0,0,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(181,84,28,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FIcon size={22} style={{ color: "#E8845A" }} />
                    </div>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 700, color: "rgba(255,255,255,0.06)", lineHeight: 1 }}>0{i + 1}</span>
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "white", margin: "0 0 8px" }}>{f.title}</h3>
                    <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA final */}
          <div style={{ background: "linear-gradient(135deg, rgba(181,84,28,0.2) 0%, rgba(181,84,28,0.08) 100%)", border: "1px solid rgba(181,84,28,0.3)", borderRadius: 24, padding: "48px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 700, color: "white", margin: "0 0 10px" }}>
                Pronto para transformar a gestão da sua clínica?
              </h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "rgba(255,255,255,0.6)", margin: 0, lineHeight: 1.6 }}>
                Acesse agora o portal MiFatureClinic e veja como é simples faturar mais e glosar menos.
              </p>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", flexShrink: 0 }}>
              <button
                onClick={onSistema}
                style={{ background: "#B5541C", color: "white", border: "none", borderRadius: 50, padding: "14px 32px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.25s cubic-bezier(0.23,1,0.32,1)", boxShadow: "0 4px 20px rgba(181,84,28,0.4)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(181,84,28,0.55)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(181,84,28,0.4)"; }}
              >
                Acessar o Sistema <ArrowRight size={16} />
              </button>
              <a
                href="https://wa.me/5592999045415?text=Ol%C3%A1!%20Gostaria%20de%20conhecer%20o%20portal%20MiFatureClinic."
                target="_blank" rel="noopener noreferrer"
                style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 50, padding: "14px 28px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textDecoration: "none", transition: "all 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
              >
                Solicitar Demo
              </a>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}

// ─── Assinatura Digital Section ─────────────────────────────────────────────
function AssinaturaSection({ onSistema }: { onSistema: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.06);
  const [activeScreen, setActiveScreen] = useState(0);

  const screens = [
    { label: "Painel de Assinatura", img: MOCKUP_GUIA_SADT, desc: "O profissional gera a guia SADT e o paciente assina directamente no painel, com hash SHA-256 e conformidade ICP-Brasil." },
    { label: "WhatsApp do Paciente", img: MOCKUP_WHATSAPP, desc: "O link de assinatura é enviado automaticamente pelo WhatsApp. O paciente assina pelo celular, sem instalar nada." },
    { label: "Histórico de Assinaturas", img: MOCKUP_HISTORICO, desc: "Todas as assinaturas ficam registadas com data, sessão, status e hash criptográfico para auditoria jurídica." },
  ];

  const beneficios = [
    { icon: BadgeCheck, title: "Validade Jurídica", desc: "Conforme a MP 2.200-2/2001 e o padrão ICP-Brasil. Aceita em processos judiciais e auditorias de operadoras." },
    { icon: Smartphone, title: "Assina pelo Celular", desc: "O paciente recebe o link no WhatsApp e assina pelo smartphone, sem papel e sem aplicativo." },
    { icon: Lock, title: "Hash SHA-256", desc: "Cada assinatura gera um código criptográfico único que comprova a autenticidade e integridade do documento." },
    { icon: FileSignature, title: "Guia SADT Integrada", desc: "A assinatura é vinculada directamente à guia SADT, por sessão, com rastreamento completo do histórico." },
  ];

  return (
    <section id="assinatura" style={{ background: "#F2EDE4", overflow: "hidden" }}>

      {/* ─── HERO DA NOVIDADE ─── */}
      <div style={{ background: "linear-gradient(135deg, #0D2A1E 0%, #1A3D2E 50%, #0D2A1E 100%)", padding: "96px 0", position: "relative", overflow: "hidden" }}>
        {/* Animated glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(181,84,28,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -120, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(106,184,138,0.04)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }} ref={ref}>

          {/* Badge NOVIDADE */}
          <div style={{ textAlign: "center", marginBottom: 48, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-20px)", transition: "all 0.6s ease" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(135deg, #B5541C, #E8845A)", borderRadius: 100, padding: "10px 28px", marginBottom: 8, boxShadow: "0 8px 32px rgba(181,84,28,0.5)" }}>
              <Star size={14} style={{ color: "white" }} fill="white" />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em", color: "white" }}>Grande Novidade</span>
              <Star size={14} style={{ color: "white" }} fill="white" />
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Exclusivo no MiFatureClinic</div>
          </div>

          {/* Título principal */}
          <div style={{ textAlign: "center", marginBottom: 64, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all 0.7s ease 0.1s" }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 700, color: "white", lineHeight: 1.1, margin: "0 0 24px" }}>
              Assinatura Digital do Paciente<br />
              <span style={{ color: "#6AB88A", fontStyle: "italic" }}>com Validade Jurídica</span>
            </h2>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, maxWidth: 680, margin: "0 auto 40px" }}>
              Chega de papel. O paciente recebe o link pelo <strong style={{ color: "white" }}>WhatsApp</strong>, assina pelo celular e a guia SADT fica registada com <strong style={{ color: "#6AB88A" }}>validade jurídica plena</strong> — conforme a MP 2.200-2/2001 e o padrão ICP-Brasil.
            </p>

            {/* Stats rápidos */}
            <div style={{ display: "inline-flex", gap: 0, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden", flexWrap: "wrap" }}>
              {[
                { value: "100%", label: "Validade jurídica" },
                { value: "< 1 min", label: "Para assinar" },
                { value: "SHA-256", label: "Criptografia" },
                { value: "ICP-Brasil", label: "Padrão oficial" },
              ].map((s, i) => (
                <div key={i} style={{ padding: "20px 32px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: "#E8845A", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout: benefícios + mockup principal */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56, alignItems: "start", opacity: visible ? 1 : 0, transition: "all 0.8s ease 0.2s" }}>

            {/* Benefícios */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {beneficios.map((b, i) => {
                const BIcon = b.icon;
                return (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 20px", transition: "all 0.25s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; e.currentTarget.style.borderColor = "rgba(106,184,138,0.35)"; e.currentTarget.style.transform = "translateX(4px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateX(0)"; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(106,184,138,0.15)", border: "1px solid rgba(106,184,138,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <BIcon size={20} style={{ color: "#6AB88A" }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 6px" }}>{b.title}</h4>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={onSistema}
                style={{ marginTop: 8, background: "#B5541C", color: "white", border: "none", borderRadius: 50, padding: "16px 36px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.25s cubic-bezier(0.23,1,0.32,1)", boxShadow: "0 4px 20px rgba(181,84,28,0.4)", alignSelf: "flex-start" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px) scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(181,84,28,0.55)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0) scale(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(181,84,28,0.4)"; }}
              >
                <PenLine size={16} /> Experimentar Agora
              </button>
            </div>

            {/* Mockup interactivo */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {screens.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveScreen(i)}
                    style={{ background: activeScreen === i ? "#B5541C" : "rgba(255,255,255,0.07)", color: activeScreen === i ? "white" : "rgba(255,255,255,0.6)", border: activeScreen === i ? "none" : "1px solid rgba(255,255,255,0.12)", borderRadius: 50, padding: "8px 18px", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s ease" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Imagem do mockup */}
              <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.5)", background: "#0D2A1E", transition: "all 0.4s ease" }}>
                <img
                  src={screens[activeScreen].img}
                  alt={screens[activeScreen].label}
                  style={{ width: "100%", display: "block", transition: "opacity 0.3s ease" }}
                />
              </div>

              {/* Descrição do mockup */}
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 18px" }}>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: "#6AB88A" }}>{screens[activeScreen].label}:</strong> {screens[activeScreen].desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── COMO FUNCIONA A ASSINATURA ─── */}
      <div style={{ background: "#F2EDE4", padding: "80px 0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Fluxo de Assinatura</span>
              <span style={{ width: 32, height: 1, background: "#B5541C", display: "block" }} />
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, color: "#1E4D3A", margin: 0 }}>
              Em 3 passos, a guia está <span style={{ fontStyle: "italic", color: "#B5541C" }}>assinada e válida</span>
            </h3>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { num: "1", icon: FileSignature, title: "Guia gerada no sistema", desc: "Ao finalizar o atendimento, o sistema gera automaticamente a guia SADT com os dados da sessão e envia o link de assinatura." },
              { num: "2", icon: Smartphone, title: "Paciente assina pelo WhatsApp", desc: "O paciente recebe o link no WhatsApp, abre no celular e assina com o dedo ou digitalmente — sem instalar nenhum aplicativo." },
              { num: "3", icon: BadgeCheck, title: "Documento com validade jurídica", desc: "A assinatura é registada com hash SHA-256, carimbo de tempo e conformidade ICP-Brasil. Válida em qualquer auditoria ou processo judicial." },
            ].map((step, i) => {
              const SIcon = step.icon;
              return (
                <div key={i} style={{ background: "white", borderRadius: 20, padding: "36px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", border: "1px solid #E8E0D8", display: "flex", flexDirection: "column", gap: 16, transition: "all 0.25s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 16px 48px rgba(30,77,58,0.15)"; e.currentTarget.style.borderColor = "#1E4D3A"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = "#E8E0D8"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(30,77,58,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SIcon size={24} style={{ color: "#1E4D3A" }} />
                    </div>
                    <span style={{ fontFamily: "'Fraunces', serif", fontSize: 48, fontWeight: 700, color: "rgba(30,77,58,0.1)", lineHeight: 1 }}>{step.num}</span>
                  </div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#1E4D3A", margin: 0 }}>{step.title}</h4>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#4A5568", lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </section>
  );
}

// ─── Plans Section ──────────────────────────────────────────────────────────
function PlansSection({ onSistema }: { onSistema: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.08);
  const [loadingPlano, setLoadingPlano] = useState<string | null>(null);

  const createCheckout = (trpc as any).stripe.createCheckout.useMutation({
    onSuccess: ({ url }: { url: string | null }) => {
      setLoadingPlano(null);
      if (url) window.open(url, '_blank');
    },
    onError: (err: any) => {
      setLoadingPlano(null);
      alert(err.message || 'Erro ao iniciar o pagamento. Tente novamente.');
    },
  });

  const handleAssinar = (planoKey: string) => {
    setLoadingPlano(planoKey);
    createCheckout.mutate({ plano: planoKey, origin: window.location.origin });
  };

  const plans = [
    {
      name: "Starter",
      planoKey: "starter",
      desc: "Ideal para clínicas em fase inicial ou com baixo volume de atendimentos.",
      color: "#2D6A4F",
      highlight: false,
      features: [
        "Até 1 profissional",
        "Agenda online",
        "Prontuário eletrônico",
        "Guias TISS básicas",
        "Lembretes WhatsApp (50/mês)",
        "Suporte por e-mail",
      ],
      notIncluded: ["Faturamento TISS automático", "Relatórios avançados", "Repasse financeiro"],
    },
    {
      name: "Clínica",
      planoKey: "clinica",
      desc: "Para clínicas em crescimento que precisam de faturamento completo e equipe maior.",
      color: "#B5541C",
      highlight: true,
      badge: "Mais Popular",
      features: [
        "Até 5 profissionais",
        "Agenda multi-profissional",
        "Prontuário completo + assinatura digital",
        "Guias TISS/ANS completas",
        "Faturamento TISS automático",
        "Lembretes WhatsApp ilimitados",
        "Relatórios de produtividade",
        "Repasse financeiro automático",
        "Suporte prioritário",
      ],
      notIncluded: [],
    },
    {
      name: "Premium",
      planoKey: "premium",
      desc: "Para clínicas de médio e grande porte com múltiplas especialidades e alto volume.",
      color: "#1E4D3A",
      highlight: false,
      features: [
        "Profissionais ilimitados",
        "Agenda multi-profissional",
        "Prontuário completo + assinatura digital",
        "Guias TISS/ANS completas",
        "Faturamento TISS automático",
        "Lembretes WhatsApp ilimitados",
        "Relatórios avançados + dashboard",
        "Repasse financeiro automático",
        "Contrato terapêutico digital",
        "Gestor de conta dedicado",
        "Integração com faturamento terceirizado MiFature",
      ],
      notIncluded: [],
    },
  ];

  return (
    <section style={{ background: "#F2EDE4", padding: "96px 0", position: "relative", overflow: "hidden" }}>
      {/* Decorative */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg, #1E4D3A, #B5541C, #1E4D3A)" }} />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }} ref={ref}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 64, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(30,77,58,0.1)", borderRadius: 100, padding: "6px 20px", marginBottom: 24 }}>
            <Star size={14} style={{ color: "#B5541C" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#1E4D3A" }}>Planos MiFatureClinic</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 700, color: "#1E4D3A", lineHeight: 1.2, margin: "0 0 16px" }}>
            Escolha o plano ideal{" "}
            <span style={{ color: "#B5541C", fontStyle: "italic" }}>para sua clínica</span>
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, color: "#4A5568", lineHeight: 1.7, maxWidth: 560, margin: "0 auto" }}>
            Todos os planos incluem acesso ao portal MiFatureClinic, suporte técnico e atualizações gratuitas. Sem taxa de implantação.
          </p>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, alignItems: "start" }}>
          {plans.map((plan, i) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlight ? plan.color : "white",
                borderRadius: 20,
                padding: plan.highlight ? "40px 32px" : "32px",
                boxShadow: plan.highlight ? "0 20px 60px rgba(181,84,28,0.25)" : "0 4px 24px rgba(0,0,0,0.08)",
                border: plan.highlight ? "none" : "1px solid rgba(0,0,0,0.08)",
                position: "relative",
                transform: plan.highlight ? "scale(1.04)" : "scale(1)",
                opacity: visible ? 1 : 0,
                transition: `all 0.5s ease ${i * 120}ms`,
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#F2EDE4", color: "#B5541C", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 16px", borderRadius: 100, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: plan.highlight ? "white" : "#1E4D3A", margin: "0 0 8px" }}>{plan.name}</h3>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.75)" : "#718096", margin: "0 0 24px", lineHeight: 1.5 }}>{plan.desc}</p>

              {/* Pricing tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: plan.highlight ? "rgba(255,255,255,0.15)" : "rgba(30,77,58,0.08)", borderRadius: 8, padding: "8px 14px", marginBottom: 28 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: plan.highlight ? "rgba(255,255,255,0.9)" : "#2D6A4F" }}>Consulte valores pelo WhatsApp</span>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.08)", marginBottom: 24 }} />

              {/* Features */}
              <ul style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,0.2)" : "rgba(30,77,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <Check size={11} style={{ color: plan.highlight ? "white" : "#2D6A4F" }} />
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: plan.highlight ? "rgba(255,255,255,0.9)" : "#2D3748", lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
                {plan.notIncluded.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, opacity: 0.4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <X size={11} style={{ color: "#718096" }} />
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#718096", lineHeight: 1.5, textDecoration: "line-through" }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => handleAssinar(plan.planoKey)}
                disabled={loadingPlano === plan.planoKey}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 12,
                  background: plan.highlight ? "white" : plan.color,
                  color: plan.highlight ? plan.color : "white",
                  border: "none",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loadingPlano === plan.planoKey ? "wait" : "pointer",
                  opacity: loadingPlano && loadingPlano !== plan.planoKey ? 0.6 : 1,
                  transition: "all 0.2s cubic-bezier(0.23,1,0.32,1)",
                }}
                onMouseEnter={e => { if (!loadingPlano) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                {loadingPlano === plan.planoKey ? "A processar..." : "Assinar Plano"}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "#718096", marginTop: 40 }}>
          Todos os planos incluem período de teste gratuito. Sem taxa de implantação. Fale conosco pelo WhatsApp para saber qual plano é ideal para a sua clínica.
        </p>

      </div>
    </section>
  );
}

// ─── WhatsApp Floating Button ───────────────────────────────────────────────────────
function WhatsAppButton() {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href="https://wa.me/5592999045415?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20o%20MiFature."
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#25D366",
        color: "white",
        borderRadius: 50,
        padding: hovered ? "12px 20px 12px 16px" : "14px",
        boxShadow: "0 6px 24px rgba(37,211,102,0.45)",
        textDecoration: "none",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        transition: "all 0.3s cubic-bezier(0.23,1,0.32,1)",
        overflow: "hidden",
        maxWidth: hovered ? 220 : 52,
        whiteSpace: "nowrap",
      }}
    >
      <MessageCircle size={24} style={{ flexShrink: 0 }} />
      <span style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 14,
        fontWeight: 700,
        opacity: hovered ? 1 : 0,
        maxWidth: hovered ? 160 : 0,
        transition: "all 0.25s ease",
        overflow: "hidden",
      }}>
        Falar pelo WhatsApp
      </span>
    </a>
  );
}

// ─── Contact Section ───────────────────────────────────────────────────────
function ContactSection() {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useIntersection(ref, 0.1);
  const [form, setForm] = useState({ nome: "", clinica: "", telefone: "", email: "", mensagem: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(`Olá! Sou ${form.nome} da clínica ${form.clinica}.\n\nTelefone: ${form.telefone}\nE-mail: ${form.email}\n\nMensagem: ${form.mensagem}`);
    window.open(`https://wa.me/5592999045415?text=${msg}`, "_blank");
    setSent(true);
  };

  return (
    <section id="contato" style={{ background: "#FAFAF8", padding: "96px 0", overflow: "hidden" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 1rem" }} ref={ref}>
        {/* Header */}
        <div style={{ marginBottom: 64, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 40, height: 1, background: "#B5541C", display: "block" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#B5541C" }}>Contato</span>
          </div>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "#1E4D3A", lineHeight: 1.2, margin: 0 }}>
            Vamos conversar?
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48 }}>
          {/* Form */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "nome", label: "Nome completo", placeholder: "Seu nome", type: "text" },
                { key: "clinica", label: "Nome da clínica", placeholder: "Nome da sua clínica", type: "text" },
                { key: "telefone", label: "Telefone / WhatsApp", placeholder: "(00) 00000-0000", type: "tel" },
                { key: "email", label: "E-mail", placeholder: "seu@email.com", type: "email" },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A", display: "block", marginBottom: 6 }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    required
                    style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E5DDD3", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#1E4D3A", background: "white", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1E4D3A", display: "block", marginBottom: 6 }}>Mensagem</label>
                <textarea
                  placeholder="Descreva brevemente sua necessidade..."
                  value={form.mensagem}
                  onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  rows={4}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #E5DDD3", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "#1E4D3A", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>
              <button
                type="submit"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: "16px 32px", borderRadius: 999, background: "#1E4D3A", color: "white", border: "none", cursor: "pointer", fontSize: 15, transition: "all 0.3s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#2D6B52"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1E4D3A"; }}
              >
                {sent ? "Enviado via WhatsApp ✓" : "Enviar Mensagem"}
              </button>
            </form>
          </div>

          {/* Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(32px)", transition: "all 0.7s ease 0.2s" }}>
            {/* CTA Image */}
            <div style={{ borderRadius: 24, overflow: "hidden", height: 220, position: "relative" }}>
              <img src={CTA_IMG} alt="Amazônia" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(30,77,58,0.7) 0%, rgba(30,77,58,0.3) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 600, color: "white", textAlign: "center", padding: "0 32px", lineHeight: 1.4, margin: 0 }}>
                  "Recupere o que é seu.<br />
                  <span style={{ fontStyle: "italic", color: "#6AB88A" }}>Fature com precisão.</span>"
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ background: "#F2EDE4", borderRadius: 16, padding: 32, display: "flex", flexDirection: "column", gap: 24 }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 600, color: "#1E4D3A", margin: 0 }}>Informações de Contato</h3>
              {([
                { icon: Phone as React.ElementType | null, label: "Telefone / WhatsApp", value: "(92) 99904-5415", href: "tel:+5592999045415" },
                { icon: Mail as React.ElementType | null, label: "E-mail", value: "mifature@gmail.com", href: "mailto:mifature@gmail.com" },
                { icon: null as React.ElementType | null, label: "Instagram", value: "@mifature_am", href: "https://www.instagram.com/mifature_am/" },
                { icon: MapPin as React.ElementType | null, label: "Localização", value: "Manaus, AM — Brasil", href: "#" },
              ] as { icon: React.ElementType | null; label: string; value: string; href: string }[]).map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.label} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ display: "flex", alignItems: "flex-start", gap: 16, textDecoration: "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.08)", transition: "all 0.3s" }}>
                      {Icon ? <Icon size={18} style={{ color: "#1E4D3A" }} /> : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E4D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{item.label}</p>
                      <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "#1E4D3A", margin: "2px 0 0" }}>{item.value}</p>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/5592999045415"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, padding: "16px 32px", borderRadius: 999, background: "#25D366", color: "white", textDecoration: "none", fontSize: 15, transition: "all 0.3s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#1ebe5a"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "#25D366"; (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Vamos conversar?
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────
const footerLinks = {
  Serviços: ["Credenciamento", "Faturamento de Guias", "Recurso de Glosas", "Atualização Cadastral"],
  Empresa: ["Sobre nós", "Como Funciona", "Contato"],
  Legal: ["Política de Privacidade", "Termos de Uso"],
};

function Footer({ onSistema }: { onSistema: () => void }) {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer style={{ background: "#0D2A1E", color: "white" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "64px 1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, flexWrap: "wrap" }}>
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <button
              onClick={() => scrollTo("#inicio")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 8, display: "block" }}
              onMouseEnter={e => { const img = e.currentTarget.querySelector("img") as HTMLImageElement; if (img) { img.style.boxShadow = "0 8px 32px rgba(255,255,255,0.35)"; img.style.transform = "scale(1.04)"; } }}
              onMouseLeave={e => { const img = e.currentTarget.querySelector("img") as HTMLImageElement; if (img) { img.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"; img.style.transform = "scale(1)"; } }}
            >
              <img
                src={LOGO_IMG}
                alt="mifature logo"
                style={{
                  height: 240,
                  width: 240,
                  objectFit: "cover",
                  background: "#fff",
                  borderRadius: 24,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                  transition: "transform 0.35s cubic-bezier(0.23,1,0.32,1), box-shadow 0.35s ease",
                }}
              />
            </button>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, maxWidth: 260, marginBottom: 12 }}>
              Especialistas em faturamento terceirizado para clínicas médicas. Credenciamento, faturamento de guias, recurso de glosas e atualização cadastral.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Leaf size={14} style={{ color: "#4A9B6F" }} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Inspirados pela Amazônia</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{category}</h4>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {links.map((link) => (
                  <li key={link}>
                    <button onClick={() => scrollTo("#servicos")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", padding: 0, transition: "color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "white"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    >{link}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 1rem", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>© {new Date().getFullYear()} mifature. Todos os direitos reservados.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.3)", margin: 0 }}>(92) 99904-5415 · mifature@gmail.com · Manaus, AM</p>
            <button
              onClick={onSistema}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 999, padding: "6px 16px", cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "white"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            >
              Acessar Sistema
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Estilos globais para mobile ───────────────────────────────────────────
const mobileStyles = `
  @media (max-width: 767px) {
    .hidden-mobile { display: none !important; }
    .show-mobile { display: block !important; }
  }
  @media (min-width: 768px) {
    .show-mobile { display: none !important; }
  }
  @media (max-width: 480px) {
    .ambient-music-label { display: none !important; }
  }
  .hero-haze, .hero-bird {
    position: absolute;
    pointer-events: none;
    will-change: transform, opacity;
    z-index: 1;
  }
  .hero-haze {
    width: 44vw;
    height: 26vw;
    border-radius: 999px;
    filter: blur(34px);
    background: radial-gradient(ellipse, rgba(241, 211, 132, 0.22) 0%, rgba(126, 184, 138, 0.1) 46%, transparent 72%);
  }
  .hero-haze-one { top: 10%; right: 6%; }
  .hero-haze-two { bottom: 4%; right: 30%; opacity: 0.65; }
  .hero-bird-one { top: 19%; right: 18%; width: 7rem; opacity: 0.58; }
  .hero-bird-two { top: 38%; right: 42%; width: 4.5rem; opacity: 0.5; }
  @media (max-width: 767px) {
    .hero-haze { width: 58vw; height: 36vw; }
    .hero-bird-one { top: 15%; right: -2%; width: 4.5rem; opacity: 0.42; }
    .hero-bird-two { display: none; }
  }
  @media (prefers-reduced-motion: no-preference) {
    .hero-haze-one { animation: hero-haze-drift 18s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate; }
    .hero-haze-two { animation: hero-haze-drift-reverse 22s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate; }
    .hero-bird-one { animation: hero-bird-glide-one 16s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate; }
    .hero-bird-two { animation: hero-bird-glide-two 20s cubic-bezier(0.77, 0, 0.175, 1) infinite alternate; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-haze, .hero-bird { animation: none !important; }
  }
  @keyframes hero-haze-drift {
    from { transform: translate3d(-2%, 1%, 0) scale(0.96); opacity: 0.42; }
    to { transform: translate3d(5%, -3%, 0) scale(1.08); opacity: 0.8; }
  }
  @keyframes hero-haze-drift-reverse {
    from { transform: translate3d(3%, 3%, 0) scale(1.08); opacity: 0.28; }
    to { transform: translate3d(-4%, -2%, 0) scale(0.94); opacity: 0.62; }
  }
  @keyframes hero-bird-glide-one {
    from { transform: translate3d(-4vw, 1vh, 0) rotate(-2deg); opacity: 0.32; }
    to { transform: translate3d(4vw, -2vh, 0) rotate(3deg); opacity: 0.76; }
  }
  @keyframes hero-bird-glide-two {
    from { transform: translate3d(3vw, 1vh, 0) rotate(3deg) scale(0.92); opacity: 0.2; }
    to { transform: translate3d(-5vw, -3vh, 0) rotate(-4deg) scale(1.06); opacity: 0.62; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
`;

// ─── Componente Principal ──────────────────────────────────────────────────
export default function LandingPage({ onSistema }: { onSistema: () => void }) {
  return (
    <>
      <style>{mobileStyles}</style>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#F2EDE4" }}>
        <Navbar onSistema={onSistema} />
        <HeroSection />
        <SliderSection onSistema={onSistema} />
        <ServicesSection />
        <HowItWorksSection />
        <PortalSection onSistema={onSistema} />
        <AssinaturaSection onSistema={onSistema} />
        <PlansSection onSistema={onSistema} />
        <ContactSection />
        <AmbientMusicControl />
        <WhatsAppButton />
        <Footer onSistema={onSistema} />
      </div>
    </>
  );
}
