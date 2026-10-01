export const CBO_PSICOLOGO_CLINICO = "251510";
export const CBO_NEUROPSICOLOGO = "251545";

function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

/**
 * No XML TISS, o número de conselho deve conter apenas o registro do profissional.
 * Prefixos como "CRP 20/" ou "20ª/" pertencem à identificação do conselho/UF e
 * não ao campo numeroConselhoProfissional.
 */
export function normalizarNumeroConselhoTiss(valor: string | null | undefined): string {
  const registro = (valor ?? "").trim().split("/").at(-1) ?? "";
  return apenasDigitos(registro);
}

/** Normaliza o CBO TISS para os seis dígitos transmitidos no XML. */
export function normalizarCodigoCboTiss(valor: string | null | undefined): string {
  const codigo = apenasDigitos(valor);
  return codigo.length === 6 ? codigo : "";
}

/**
 * Preserva o CBO cadastrado quando válido e completa apenas lacunas cujo
 * mapeamento é inequívoco pela especialidade profissional.
 */
export function resolverCodigoCboProfissionalTiss(profissional: {
  codigoCBO?: string | null;
  cbos?: string | null;
  especialidade?: string | null;
}): string {
  const cadastrado = normalizarCodigoCboTiss(profissional.codigoCBO ?? profissional.cbos);
  if (cadastrado) return cadastrado;

  const especialidade = (profissional.especialidade ?? "").normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (especialidade.includes("neuropsicolog")) return CBO_NEUROPSICOLOGO;
  if (especialidade.includes("psicolog")) return CBO_PSICOLOGO_CLINICO;
  return "";
}
