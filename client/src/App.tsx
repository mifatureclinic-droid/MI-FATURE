import { lazy, Suspense, useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoadingProvider } from './contexts/LoadingContext';
import { ProntuarioProvider } from './contexts/ProntuarioContext';
import { LeafLoader } from "./components/LeafLoader";
import { trpc } from '@/lib/trpc';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { NormativasFooter } from './components/NormativasFooter';
import { SystemFooter } from './components/SystemFooter';
import { ModalAlertasProntuario } from './components/ModalAlertasProntuario';
import { AlertaFeriadoProfissionais } from './components/AlertaFeriadoProfissionais';
import { AvisoAcessoTemporario } from './components/AvisoAcessoTemporario';
import { useLocation } from 'wouter';
import { useLoading } from './contexts/LoadingContext';
import { extrairTokenAssinaturaContrato } from '@shared/rotaAssinaturaContrato';
import { getSystemLocationForPage, getSystemPageFromLocation } from './lib/systemRoutes';
import { resolverEmailDoLoginInterno } from './lib/emailLoginInterno';
import { usuarioTemAcessoSomenteLeitura } from '@shared/acessoSomenteLeitura';
import { ConteudoSomenteLeitura } from './components/ConteudoSomenteLeitura';

const Login = lazy(() => import('./pages/Login').then(({ Login }) => ({ default: Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const Agenda = lazy(() => import('./pages/Agenda').then(({ Agenda }) => ({ default: Agenda })));
const Pacientes = lazy(() => import('./pages/Pacientes').then(({ Pacientes }) => ({ default: Pacientes })));
const Profissionais = lazy(() => import('./pages/Profissionais').then(({ Profissionais }) => ({ default: Profissionais })));
const Convenios = lazy(() => import('./pages/Convenios').then(({ Convenios }) => ({ default: Convenios })));
const Atendimentos = lazy(() => import('./pages/Atendimentos').then(({ Atendimentos }) => ({ default: Atendimentos })));
const Prontuario = lazy(() => import('./pages/Prontuario').then(({ Prontuario }) => ({ default: Prontuario })));
const GuiasSPSADT = lazy(() => import('./pages/GuiasSPSADT').then(({ GuiasSPSADT }) => ({ default: GuiasSPSADT })));
const InformacoesGuia = lazy(() => import('./pages/InformacoesGuia').then(({ InformacoesGuia }) => ({ default: InformacoesGuia })));
const RegistroDigitalAssinaturas = lazy(() => import('./pages/RegistroDigitalAssinaturas').then(({ RegistroDigitalAssinaturas }) => ({ default: RegistroDigitalAssinaturas })));
const FaturamentoTISS = lazy(() => import('./pages/FaturamentoTISS').then(({ FaturamentoTISS }) => ({ default: FaturamentoTISS })));
const Relatorios = lazy(() => import('./pages/Relatorios').then(({ Relatorios }) => ({ default: Relatorios })));
const Configuracoes = lazy(() => import('./pages/Configuracoes').then(({ Configuracoes }) => ({ default: Configuracoes })));
const NotasFiscais = lazy(() => import('./pages/NotasFiscais').then(({ NotasFiscais }) => ({ default: NotasFiscais })));
const Repasse = lazy(() => import('./pages/Repasse').then(({ Repasse }) => ({ default: Repasse })));
const Usuarios = lazy(() => import('./pages/Usuarios').then(({ Usuarios }) => ({ default: Usuarios })));
const Financeiro = lazy(() => import('./pages/Financeiro').then(({ Financeiro }) => ({ default: Financeiro })));
const PreencherAnamnese = lazy(() => import('./pages/PreencherAnamnese'));
const RelatorioDiario = lazy(() => import('./pages/RelatorioDiario').then(({ RelatorioDiario }) => ({ default: RelatorioDiario })));
const Notificacoes = lazy(() => import('./pages/Notificacoes'));
const CadastroClinica = lazy(() => import('./pages/CadastroClinica').then(({ CadastroClinica }) => ({ default: CadastroClinica })));
const Liberacoes = lazy(() => import('./pages/Liberacoes'));
const ConfirmacaoPresenca = lazy(() => import('./pages/ConfirmacaoPresenca'));
const AssinarContrato = lazy(() => import('./pages/AssinarContrato'));
const ConfirmarAtendimento = lazy(() => import('./pages/ConfirmarAtendimento').then(({ ConfirmarAtendimento }) => ({ default: ConfirmarAtendimento })));
const AssinarSessaoGuia = lazy(() => import('./pages/AssinarSessaoGuia').then(({ AssinarSessaoGuia }) => ({ default: AssinarSessaoGuia })));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const AssinarGuia = lazy(() => import('./pages/AssinarGuia'));
const AssinaturasSadt = lazy(() => import('./pages/AssinaturasSadt').then(({ AssinaturasSadt }) => ({ default: AssinaturasSadt })));
const WhatsAppGestao = lazy(() => import('./pages/WhatsAppGestao'));
const LogAuditoria = lazy(() => import('./pages/LogAuditoria'));
const MeuPerfil = lazy(() => import('./pages/MeuPerfil'));
const LocalizarAgendamentos = lazy(() => import('./pages/LocalizarAgendamentos').then(({ LocalizarAgendamentos }) => ({ default: LocalizarAgendamentos })));
const PontoEletronico = lazy(() => import('./pages/PontoEletronico').then(({ PontoEletronico }) => ({ default: PontoEletronico })));

// Mapeamento de páginas permitidas por perfil
const PAGINAS_POR_PERFIL: Record<string, string[]> = {
  administrador: [
    'dashboard', 'cadastro-clinica', 'agenda', 'pacientes', 'profissionais',
    'convenios', 'atendimentos', 'prontuario', 'guias', 'informacoes-guia', 'registro-digital-assinaturas',
    'fechamento', 'faturamento-tiss', 'financeiro', 'repasse', 'liberacoes',
    'notas-fiscais', 'relatorios', 'relatorio-diario', 'usuarios', 'configuracoes', 'notificacoes', 'assinaturas-sadt', 'whatsapp', 'log-auditoria', 'meu-perfil', 'localizar-agendamentos', 'ponto-eletronico',
  ],
  recepcao: [
    'dashboard', 'agenda', 'pacientes', 'atendimentos', 'guias', 'informacoes-guia', 'registro-digital-assinaturas', 'relatorio-diario', 'notificacoes', 'assinaturas-sadt', 'meu-perfil', 'localizar-agendamentos', 'ponto-eletronico',
  ],
  profissional: [
    'agenda', 'atendimentos', 'prontuario', 'repasse', 'meu-perfil',
  ],
};

function paginaPermitida(perfil: string | null | undefined, pagina: string): boolean {
  const p = perfil === 'master' ? 'administrador' : (perfil || 'administrador');
  const permitidas = PAGINAS_POR_PERFIL[p] ?? PAGINAS_POR_PERFIL['administrador'];
  return permitidas.includes(pagina);
}

function AcessoNegado({ onVoltar }: { onVoltar: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800">Acesso Restrito</h2>
      <p className="text-gray-500 text-center max-w-sm">
        Você não tem permissão para acessar esta página. Entre em contato com o administrador.
      </p>
      <button
        onClick={onVoltar}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Voltar ao Dashboard
      </button>
    </div>
  );
}

function PaginaCarregando() {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" aria-live="polite">
      <LeafLoader message="Carregando..." />
    </div>
  );
}

// Chave usada no sessionStorage para marcar que o login interno foi feito nesta sessão
const SESSION_LOGIN_KEY = 'mifature_internal_login';
const SESSION_SISTEMA_KEY = 'mifature_show_sistema';
const SESSION_LOGIN_EMAIL_KEY = 'mifature_internal_login_email';

function AppContentWithLoading() {
  const [location, navigate] = useLocation();
  // Página inicial varia por perfil: profissional começa em 'atendimentos'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [initialPageSet, setInitialPageSet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Controla se o utilizador já fez o login interno nesta sessão do browser
  const [internalLoginDone, setInternalLoginDone] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_LOGIN_KEY) === '1'
  );
  const [internalLoginEmail, setInternalLoginEmail] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_LOGIN_EMAIL_KEY),
  );
  // Controla se está a mostrar o site público ou o sistema
  const [showSistema, setShowSistema] = useState<boolean>(
    () => sessionStorage.getItem(SESSION_SISTEMA_KEY) === '1'
  );

  const handleIrParaSistema = () => {
    // Vai para o ecrã de login — o portal só abre depois de autenticar
    sessionStorage.setItem(SESSION_SISTEMA_KEY, '1');
    setShowSistema(true);
    // Limpar o login interno para forçar a tela de login
    sessionStorage.removeItem(SESSION_LOGIN_KEY);
    sessionStorage.removeItem(SESSION_LOGIN_EMAIL_KEY);
    setInternalLoginDone(false);
    setInternalLoginEmail(null);
  };

  // Verificar se é uma rota pública (confirmação de presença)
  const isPublicRoute = location.startsWith('/confirmar-presenca') || location.startsWith('/assinar-contrato') || location.startsWith('/confirmar-atendimento') || location.startsWith('/assinar-sessao') || location.startsWith('/assinar/') || location.startsWith('/preencher-anamnese/');

  // Só fazer query auth.me se NÃO for rota pública
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, { enabled: !isPublicRoute });
  const utils = trpc.useUtils();

  const handleLogin = (email: string) => {
    // Marcar login interno como feito nesta sessão
    sessionStorage.setItem(SESSION_LOGIN_KEY, '1');
    sessionStorage.setItem(SESSION_LOGIN_EMAIL_KEY, email.trim().toLowerCase());
    setInternalLoginDone(true);
    setInternalLoginEmail(email.trim().toLowerCase());
    utils.auth.me.invalidate();
  };

  // Redirecionar profissional para a agenda ao fazer login
  const perfil_early = (user as any)?.perfil as string | null | undefined;
  useEffect(() => {
    if (user && internalLoginDone && !initialPageSet) {
      if (perfil_early === 'profissional') {
        setCurrentPage('agenda');
      }
      setInitialPageSet(true);
    }
  }, [user, internalLoginDone, initialPageSet, perfil_early]);

  const handleNavigate = (page: string) => {
    const destination = getSystemLocationForPage(page);
    if (location !== destination) navigate(destination);
    startLoading(`Carregando ${page}...`);
    setTimeout(() => {
      setCurrentPage(page);
      stopLoading();
    }, 800);
  };

  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const pageFromRoute = getSystemPageFromLocation(location);
    if (pageFromRoute) setCurrentPage(pageFromRoute);
  }, [location]);

  // Mostrar landing page se não está a ir para o sistema e não é rota pública
  if (!showSistema && !isPublicRoute) {
    return (
      <Suspense fallback={<PaginaCarregando />}>
        <LandingPage onSistema={handleIrParaSistema} />
      </Suspense>
    );
  }

  // Rotas públicas não requerem login
  if (location.startsWith('/confirmar-presenca')) {
    return (
      <Suspense fallback={<PaginaCarregando />}>
        <div className="min-h-screen bg-gray-50">
          <ConfirmacaoPresenca />
        </div>
      </Suspense>
    );
  }

  if (location.startsWith('/assinar-contrato')) {
    const tokenContrato = extrairTokenAssinaturaContrato(location);
    return <Suspense fallback={<PaginaCarregando />}><AssinarContrato token={tokenContrato} /></Suspense>;
  }
  if (location.startsWith('/confirmar-atendimento')) {
    // Extrair o token da URL: /confirmar-atendimento/TOKEN
    const tokenConfirmacao = location.split('/confirmar-atendimento/')[1]?.split('?')[0] || '';
    return <Suspense fallback={<PaginaCarregando />}><ConfirmarAtendimento token={tokenConfirmacao} /></Suspense>;
  }
  if (location.startsWith('/assinar-sessao')) {
    // Extrair o token da URL: /assinar-sessao/TOKEN
    const tokenAssinatura = location.split('/assinar-sessao/')[1]?.split('?')[0] || '';
    return <Suspense fallback={<PaginaCarregando />}><AssinarSessaoGuia token={tokenAssinatura} /></Suspense>;
  }

  if (location.startsWith('/preencher-anamnese/')) {
    const tokenAnamnese = location.split('/preencher-anamnese/')[1]?.split('?')[0] || '';
    return <Suspense fallback={<PaginaCarregando />}><PreencherAnamnese token={tokenAnamnese} /></Suspense>;
  }

  // Rota pública de assinatura digital de guia SADT
  if (location.startsWith('/assinar/')) {
    const tokenAssinatura = location.split('/assinar/')[1]?.split('?')[0] || '';
    return <Suspense fallback={<PaginaCarregando />}><AssinarGuia token={tokenAssinatura} /></Suspense>;
  }

  // Mostrar login se:
  // 1. O utilizador não está autenticado via OAuth (sem sessão), OU
  // 2. O utilizador está autenticado via OAuth mas ainda não fez o login interno MIFATURE nesta sessão
  if (!user || !internalLoginDone) {
    // Se ainda está a verificar a sessão OAuth, mostrar spinner
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <p className="text-sm text-gray-500">Carregando...</p>
          </div>
        </div>
      );
    }
    // Sessão verificada — exibir tela de login interno
    return (
      <Suspense fallback={<PaginaCarregando />}>
        <Login onLogin={handleLogin} onVoltarSite={() => {
          sessionStorage.removeItem(SESSION_SISTEMA_KEY);
          sessionStorage.removeItem(SESSION_LOGIN_EMAIL_KEY);
          setShowSistema(false);
          setInternalLoginEmail(null);
        }} />
      </Suspense>
    );
  }

  // Perfil do usuário logado
  const perfil = (user as any).perfil as string | null | undefined;
  const emailDoLoginAtual = resolverEmailDoLoginInterno(internalLoginEmail, (user as any)?.email);
  const acessoSomenteLeitura = usuarioTemAcessoSomenteLeitura(emailDoLoginAtual);

  const renderPage = () => {
    // Bloquear acesso a páginas não permitidas para o perfil
    const paginaInicial = perfil === 'profissional' ? 'atendimentos' : 'dashboard';
    if (!paginaPermitida(perfil, currentPage)) {
      return <AcessoNegado onVoltar={() => setCurrentPage(paginaInicial)} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'agenda':
        return <Agenda onNavigate={handleNavigate} />;
      case 'pacientes':
        return <Pacientes onNavigate={handleNavigate} />;
      case 'profissionais':
        return <Profissionais />;
      case 'convenios':
        return <Convenios />;
      case 'atendimentos':
        return <Atendimentos onNavigate={handleNavigate} />;
      case 'prontuario':
        return <Prontuario onNavigate={handleNavigate} />;
      case 'guias':
        return <GuiasSPSADT />;
      case 'informacoes-guia':
        return <InformacoesGuia />;
      case 'registro-digital-assinaturas':
        return <RegistroDigitalAssinaturas />;
      case 'faturamento-tiss':
        return <FaturamentoTISS />;
      case 'relatorios':
        return <Relatorios />;
      case 'relatorio-diario':
        return <RelatorioDiario onNavigate={handleNavigate} />;
      case 'notas-fiscais':
        return <NotasFiscais />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'repasse':
        return <Repasse />;
      case 'usuarios':
        return <Usuarios />;
      case 'financeiro':
        return <Financeiro />;
      case 'cadastro-clinica':
        return <CadastroClinica />;
      case 'liberacoes':
        return <Liberacoes />;
      case 'notificacoes':
        return <Notificacoes />;
      case 'assinaturas-sadt':
        return <AssinaturasSadt />;
      case 'whatsapp':
        return <WhatsAppGestao />;
      case 'log-auditoria':
        return <LogAuditoria />;
      case 'meu-perfil':
        return <MeuPerfil />;
      case 'localizar-agendamentos':
        return <LocalizarAgendamentos onNavigate={handleNavigate} />;
      case 'ponto-eletronico':
        return <PontoEletronico />;
      case 'confirmar-presenca':
        return <ConfirmacaoPresenca />;
      default:
        // Profissional começa em atendimentos; outros perfis no dashboard
        if (perfil === 'profissional') return <Atendimentos onNavigate={handleNavigate} />;
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.97 0.008 90)' }}>
      <Header
        onToggleMenu={() => setMobileMenuOpen(true)}
        userName={(user as any)?.name || (user as any)?.nome || 'Utilizador'}
        userAvatarUrl={(user as any)?.avatarUrl || null}
        onNavigatePerfil={() => handleNavigate('meu-perfil')}
      />
      <div className="flex w-full overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          perfil={perfil}
        />
        <main className="flex-1 min-w-0 w-full">
          <AvisoAcessoTemporario
            email={emailDoLoginAtual}
          />
          {acessoSomenteLeitura && (
            <div
              aria-label="Modo somente leitura"
              className="mx-4 mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950 shadow-sm sm:mx-6"
            >
              <strong>Modo somente leitura:</strong> este acesso permite consultar o portal, mas não criar, editar, excluir ou registrar informações.
            </div>
          )}
          <ConteudoSomenteLeitura ativo={acessoSomenteLeitura}>
            <Suspense fallback={<PaginaCarregando />}>
              {renderPage()}
            </Suspense>
          </ConteudoSomenteLeitura>
        </main>
      </div>
      <NormativasFooter />
      <SystemFooter />
      <LoadingOverlay />
      {/* Modal de alertas apenas para profissionais */}
      {perfil === 'profissional' && <AlertaFeriadoProfissionais />}
      {perfil === 'profissional' && <ModalAlertasProntuario />}
    </div>
  );
}

function LoadingOverlay() {
  try {
    const { isLoading, message } = useLoading();
    if (!isLoading) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <LeafLoader message={message} />
      </div>
    );
  } catch {
    return null;
  }
}

function AppContent() {
  return (
    <LoadingProvider>
      <ProntuarioProvider>
        <AppContentWithLoading />
      </ProntuarioProvider>
    </LoadingProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
