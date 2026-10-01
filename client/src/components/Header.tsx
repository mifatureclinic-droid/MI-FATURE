import { User, LogOut, Menu } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface HeaderProps {
  clinicName?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  /** Callback para abrir o menu no mobile */
  onToggleMenu?: () => void;
  /** Callback para navegar para Meu Perfil */
  onNavigatePerfil?: () => void;
}

export function Header({ userName = 'Utilizador', userAvatarUrl, onToggleMenu, onNavigatePerfil }: HeaderProps) {
  const logoutMutation = trpc.auth.logout.useMutation({
    onSettled: () => {
      sessionStorage.removeItem('mifature_internal_login');
      sessionStorage.removeItem('mifature_show_sistema');
      window.location.href = '/';
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header
      className="h-16 border-b px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30"
      style={{
        background: 'oklch(1 0 0)',
        borderBottomColor: 'oklch(0.88 0.02 90)',
        boxShadow: '0 1px 3px oklch(0.22 0.04 130 / 0.08)',
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Botão de menu — apenas no mobile */}
        <button
          onClick={onToggleMenu}
          className="md:hidden p-2 -ml-1 rounded-lg transition-colors"
          style={{ color: 'oklch(0.38 0.07 130)' }}
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo MIFATURE */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-16 shrink-0 overflow-hidden">
            <img
              src="/logo-mifature.png"
              alt="MIFATURE"
              className="h-full w-full object-cover scale-[1.45] mix-blend-multiply"
            />
          </div>
          <div className="hidden sm:block min-w-0">
            <p
              className="text-xs truncate tracking-wide"
              style={{ color: 'oklch(0.55 0.05 75)', letterSpacing: '0.05em' }}
            >
              INTELIGÊNCIA EM FATURAMENTO MÉDICO
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Utilizador — clicável para ir a Meu Perfil */}
        <button
          onClick={onNavigatePerfil}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'oklch(0.94 0.01 90)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.90 0.02 90)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.94 0.01 90)';
          }}
          title="Editar perfil"
        >
          <div
            className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ background: 'oklch(0.38 0.07 130)' }}
          >
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4" style={{ color: 'oklch(0.98 0.01 90)' }} />
            )}
          </div>
          <span
            className="text-sm truncate max-w-[140px]"
            style={{ color: 'oklch(0.30 0.05 130)' }}
          >
            {userName}
          </span>
        </button>

        {/* Botão sair */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all disabled:opacity-50"
          style={{
            color: 'oklch(0.45 0.04 130)',
            border: '1px solid oklch(0.88 0.02 90)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.50 0.20 25)';
            (e.currentTarget as HTMLButtonElement).style.background = 'oklch(0.97 0.02 25)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'oklch(0.85 0.06 25)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'oklch(0.45 0.04 130)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'oklch(0.88 0.02 90)';
          }}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
