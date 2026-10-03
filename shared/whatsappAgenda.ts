export function criarLinkWhatsAppAgenda(telefone?: string | null): string | null {
  const digitos = String(telefone ?? '').replace(/\D/g, '');
  if (digitos.length < 10) return null;
  const numeroInternacional = digitos.startsWith('55') && digitos.length >= 12
    ? digitos
    : `55${digitos}`;
  return `https://wa.me/${numeroInternacional}`;
}
