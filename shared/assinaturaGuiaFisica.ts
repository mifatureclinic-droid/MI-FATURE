export const CONVENIOS_ASSINATURA_EM_GUIA_FISICA = [
  'proasa',
  'affeam',
  'mediservice',
  'medservice',
  'fusex',
] as const;

export const MENSAGEM_ASSINATURA_EM_GUIA_FISICA =
  'Este convênio utiliza assinatura em guia física. Não é necessário enviar link de assinatura.';

export function convenioUsaAssinaturaEmGuiaFisica(nomeConvenio?: string | null): boolean {
  const nomeNormalizado = (nomeConvenio ?? '').trim().toLowerCase();
  return CONVENIOS_ASSINATURA_EM_GUIA_FISICA.some((convenio) => nomeNormalizado.includes(convenio));
}
