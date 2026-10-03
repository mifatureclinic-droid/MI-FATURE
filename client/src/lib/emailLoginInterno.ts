export function resolverEmailDoLoginInterno(
  emailLoginInterno: string | null | undefined,
  emailOAuth: string | null | undefined,
): string | null {
  const emailInternoNormalizado = emailLoginInterno?.trim().toLowerCase();
  if (emailInternoNormalizado) return emailInternoNormalizado;

  const emailOAuthNormalizado = emailOAuth?.trim().toLowerCase();
  return emailOAuthNormalizado || null;
}
