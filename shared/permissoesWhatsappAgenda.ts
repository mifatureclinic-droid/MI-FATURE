export type UsuarioWhatsAppAgenda = { perfil?: string | null; role?: string | null };

export function podeUsarWhatsAppNaAgenda(usuario?: UsuarioWhatsAppAgenda | null): boolean {
  const perfil = (usuario?.perfil ?? '').toLocaleLowerCase('pt-BR');
  return usuario?.role === 'admin' || [
    'administrador',
    'master',
    'recepcao',
    'recepção',
    'recepcionista',
  ].includes(perfil);
}
