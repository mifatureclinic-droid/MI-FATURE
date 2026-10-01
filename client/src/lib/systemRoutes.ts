export const SYSTEM_PAGE_PATHS: Record<string, string> = {
  dashboard: '/',
  'cadastro-clinica': '/cadastro-clinica',
  agenda: '/agenda',
  pacientes: '/pacientes',
  profissionais: '/profissionais',
  convenios: '/convenios',
  atendimentos: '/atendimentos',
  prontuario: '/prontuario',
  guias: '/guias',
  'informacoes-guia': '/informacoes-guia',
  'registro-digital-assinaturas': '/registro-digital-assinaturas',
  'autorizacoes-bradesco': '/autorizacoes-bradesco',
  fechamento: '/fechamento',
  'faturamento-tiss': '/faturamento-tiss',
  financeiro: '/financeiro',
  repasse: '/repasse',
  liberacoes: '/liberacoes',
  'notas-fiscais': '/notas-fiscais',
  relatorios: '/relatorios',
  'relatorio-diario': '/relatorio-diario',
  usuarios: '/usuarios',
  notificacoes: '/notificacoes',
  'assinaturas-sadt': '/assinaturas-sadt',
  whatsapp: '/whatsapp',
  configuracoes: '/configuracoes',
  'log-auditoria': '/log-auditoria',
  'meu-perfil': '/meu-perfil',
  'localizar-agendamentos': '/localizar-agendamentos',
  'ponto-eletronico': '/ponto-eletronico',
};

export function getSystemPageFromLocation(location: string): string | null {
  const path = location.split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/dashboard') return 'dashboard';
  return Object.entries(SYSTEM_PAGE_PATHS).find(([, pagePath]) => pagePath === path)?.[0] ?? null;
}

export function getSystemLocationForPage(page: string): string {
  return SYSTEM_PAGE_PATHS[page] ?? '/';
}
