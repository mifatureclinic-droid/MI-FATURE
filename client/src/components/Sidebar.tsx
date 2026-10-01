import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Heart,
  Activity,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  ClipboardList,
  Receipt,
  Wallet,
  CreditCard,
  UserCog,
  Building2,
  ShieldCheck,
  FileSearch,
  CheckCircle,
  FileCode,
  Bell,
  X,
  PenLine,
  MessageSquare,
  UserCircle2,
  Clock3,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  perfil?: string | null;
}

export const menuItems = [
  { id: 'dashboard',        label: 'Dashboard',         icon: LayoutDashboard, perfis: ['administrador', 'recepcao'] },
  { id: 'cadastro-clinica', label: 'Clínica',            icon: Building2,       perfis: ['administrador'] },
  { id: 'agenda',           label: 'Agenda',             icon: Calendar,        perfis: ['administrador', 'recepcao', 'profissional'] },
  { id: 'localizar-agendamentos', label: 'Localizar Agendamentos', icon: FileSearch, perfis: ['administrador', 'recepcao'] },
  { id: 'ponto-eletronico', label: 'Ponto Eletrônico', icon: Clock3, perfis: ['administrador', 'recepcao'] },
  { id: 'pacientes',        label: 'Pacientes',          icon: Users,           perfis: ['administrador', 'recepcao'] },
  { id: 'profissionais',    label: 'Profissionais',      icon: Stethoscope,     perfis: ['administrador'] },
  { id: 'convenios',        label: 'Convênios',          icon: Heart,           perfis: ['administrador'] },
  { id: 'atendimentos',     label: 'Atendimentos',       icon: Activity,        perfis: ['administrador', 'recepcao', 'profissional'] },
  { id: 'prontuario',       label: 'Prontuário',         icon: ClipboardList,   perfis: ['administrador', 'profissional'] },
  { id: 'guias',            label: 'Pré-Faturamento',    icon: FileText,        perfis: ['administrador', 'recepcao'] },
  { id: 'faturamento-tiss', label: 'Faturamento TISS',   icon: FileCode,        perfis: ['administrador'] },
  { id: 'financeiro',       label: 'Financeiro',         icon: CreditCard,      perfis: ['administrador'] },
  { id: 'repasse',          label: 'Repasse',            icon: Wallet,          perfis: ['administrador', 'profissional'] },
  { id: 'liberacoes',       label: 'Liberações',         icon: CheckCircle,     perfis: ['administrador'] },
  { id: 'notas-fiscais',    label: 'Notas Fiscais',      icon: Receipt,         perfis: ['administrador'] },
  { id: 'relatorios',       label: 'Relatórios',         icon: BarChart3,       perfis: ['administrador'] },
  { id: 'relatorio-diario', label: 'Relatório Diário',   icon: Calendar,        perfis: ['administrador', 'recepcao'] },
  { id: 'usuarios',         label: 'Usuários',           icon: UserCog,         perfis: ['administrador'] },
  { id: 'notificacoes',     label: 'Status de Assinatura', icon: Bell,          perfis: ['administrador', 'recepcao'] },
  { id: 'assinaturas-sadt', label: 'Assinaturas SADT',   icon: PenLine,         perfis: ['administrador', 'recepcao'] },
  { id: 'whatsapp',          label: 'WhatsApp',            icon: MessageSquare,   perfis: ['administrador'] },
  { id: 'configuracoes',    label: 'Configurações',      icon: Settings,        perfis: ['administrador'] },
  { id: 'log-auditoria',    label: 'Log de Auditoria',   icon: ShieldCheck,     perfis: ['administrador'] },
  { id: 'meu-perfil',        label: 'Meu Perfil',          icon: UserCircle2,     perfis: ['administrador', 'recepcao', 'profissional', 'master', 'user'] },
];

// Separadores visuais por grupo
const groupSeparators: Record<string, string> = {
  'agenda':        'ATENDIMENTO',
  'faturamento-tiss': 'FATURAMENTO',
  'relatorios':    'RELATÓRIOS',
  'localizar-agendamentos': 'RECEPÇÃO',
  'ponto-eletronico': 'RECEPÇÃO',
  'usuarios':      'SISTEMA',
  'meu-perfil':     'CONTA',
};

export function Sidebar({ currentPage, onNavigate, mobileOpen = false, onCloseMobile, perfil }: SidebarProps) {
  const perfilEfetivo = perfil === 'master' ? 'administrador' : (perfil || 'administrador');
  const itensFiltrados = menuItems.filter((item) => item.perfis.includes(perfilEfetivo));
  const menuExclusivoRecepcao = perfilEfetivo === 'recepcao';

  const handleClick = (id: string) => {
    onNavigate(id);
    onCloseMobile?.();
  };

  const nav = (
    <nav className="py-3 px-2 space-y-0.5">
      {itensFiltrados.map((item, indice) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        const groupLabel = menuExclusivoRecepcao
          ? (indice === 0 ? 'RECEPÇÃO' : undefined)
          : groupSeparators[item.id];

        return (
          <div key={item.id}>
            {/* Separador de grupo */}
            {groupLabel && (
              <div
                className="px-3 pt-4 pb-1.5 text-xs font-semibold tracking-widest uppercase"
                style={{ color: 'oklch(0.70 0.09 75 / 0.7)' }}
              >
                {groupLabel}
              </div>
            )}

            <button
              onClick={() => handleClick(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm font-medium"
              style={
                isActive
                  ? {
                      background: 'oklch(0.70 0.09 75 / 0.15)',
                      color: 'oklch(0.82 0.07 75)',
                      borderLeft: '3px solid oklch(0.70 0.09 75)',
                      paddingLeft: '9px',
                    }
                  : {
                      color: 'oklch(0.78 0.03 90)',
                      borderLeft: '3px solid transparent',
                      paddingLeft: '9px',
                    }
              }
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.32 0.06 130)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.95 0.02 90)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.78 0.03 90)';
                }
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: isActive ? 'oklch(0.82 0.07 75)' : 'oklch(0.65 0.04 90)' }}
              />
              <span className="truncate">{item.id === 'repasse' && perfilEfetivo === 'profissional' ? 'Pagamentos' : item.label}</span>
            </button>
          </div>
        );
      })}
    </nav>
  );

  const sidebarStyle = {
    background: 'oklch(0.22 0.05 130)',
    borderRight: '1px solid oklch(0.28 0.05 130)',
  };

  const mobileHeaderStyle = {
    borderBottom: '1px solid oklch(0.28 0.05 130)',
  };

  return (
    <>
      {/* Sidebar fixa no desktop */}
      <aside
        className="hidden md:flex flex-col w-60 shrink-0 min-h-screen overflow-y-auto"
        style={sidebarStyle}
      >
        {nav}
      </aside>

      {/* Overlay no mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar deslizante no mobile */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 max-w-[85%] md:hidden
          transform transition-transform duration-300 ease-out overflow-y-auto`}
        style={{
          ...sidebarStyle,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: mobileOpen ? '4px 0 24px oklch(0.10 0.03 130 / 0.5)' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-4 h-16" style={mobileHeaderStyle}>
          <img
            src="/manus-storage/logo_mifature_78bd4714.png"
            alt="MIFATURE"
            className="h-9 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'oklch(0.78 0.03 90)' }}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {nav}
      </aside>
    </>
  );
}
