import {
  CONVENIOS_ASSINATURA_EM_GUIA_FISICA,
  convenioUsaAssinaturaEmGuiaFisica,
} from './assinaturaGuiaFisica';

export const CONVENIOS_SEM_ASSINATURA_DIGITAL = CONVENIOS_ASSINATURA_EM_GUIA_FISICA;

export function convenioIsentoDeAssinaturaDigital(nomeConvenio?: string | null): boolean {
  return convenioUsaAssinaturaEmGuiaFisica(nomeConvenio);
}

/** Une as fontes que tornam o paciente elegível ao Prontuário do profissional. */
export function unirPacientesElegiveisProntuario(...listas: Array<Array<number | null | undefined>>): number[] {
  return Array.from(new Set(listas.flat().filter((id): id is number => typeof id === 'number' && Number.isFinite(id))));
}
