export const EMAIL_ACESSO_SOMENTE_LEITURA = "carelli@carelliassociados.com.br";

export function usuarioTemAcessoSomenteLeitura(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === EMAIL_ACESSO_SOMENTE_LEITURA;
}
