const REGISTRO_ANS_LUMINAR = "418374";

function normalizarNomeConvenio(nome: unknown): string {
  return String(nome ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reconhece somente o cadastro da operadora Luminar, incluindo complementos do mesmo nome. */
export function ehConvenioLuminar(nome: unknown): boolean {
  const normalizado = normalizarNomeConvenio(nome);
  return normalizado === "luminar saude" || normalizado.startsWith("luminar saude ");
}

/**
 * Resolve o Registro ANS usado no destino do XML TISS.
 * A Luminar possui valor contratual explícito; os demais convênios conservam o cadastro.
 */
export function obterRegistroAnsTiss(params: {
  nomeConvenio?: unknown;
  registroANS?: unknown;
  codigoOperadora?: unknown;
}): string {
  if (ehConvenioLuminar(params.nomeConvenio)) return REGISTRO_ANS_LUMINAR;
  const cadastrado = String(params.registroANS ?? params.codigoOperadora ?? "").trim();
  return cadastrado || "000000";
}

export { REGISTRO_ANS_LUMINAR };
