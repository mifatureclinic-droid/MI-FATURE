export type PerfilAssinatura = string | null | undefined;

/**
 * Somente a gestão administrativa pode alterar a prova de assinatura já registada.
 */
export function podeGerenciarDatasAssinatura(perfil: PerfilAssinatura, role?: string | null): boolean {
  const perfilNormalizado = (perfil ?? '').trim().toLocaleLowerCase('pt-BR');
  return role === 'admin'
    || perfilNormalizado === 'administrador'
    || perfilNormalizado === 'master'
    || perfilNormalizado === 'recepção'
    || perfilNormalizado === 'recepcao'
    || perfilNormalizado === 'recepcionista';
}
