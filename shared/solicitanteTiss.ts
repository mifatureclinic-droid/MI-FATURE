type ProfissionalPadrao = {
  nome?: string | null;
  codigoConselho?: string | null;
  conselhoProfissional?: string | null;
  numeroConselho?: string | null;
  crm?: string | null;
  uf?: string | null;
  estado?: string | null;
  codigoCBO?: string | null;
  cbos?: string | null;
};

const CONSELHOS_TISS: Record<string, string> = {
  CRM: "01", CRO: "02", COREN: "03", CRF: "05", CREFITO: "06",
  CRN: "07", CRFA: "08", CRP: "11", CRBM: "12", CREF: "13",
  CRTR: "14", CRBIO: "15", CRAS: "16",
};

function lerDadosPrefaturamento(valor: unknown): Record<string, unknown> {
  if (!valor) return {};
  if (typeof valor === "object") return valor as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(valor));
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : valor == null ? "" : String(valor).trim();
}

export function normalizarConselhoTiss(valor: unknown): string {
  const bruto = texto(valor).toUpperCase();
  if (!bruto) return "";
  if (/^\d{1,2}$/.test(bruto)) return bruto.padStart(2, "0");
  return CONSELHOS_TISS[bruto] ?? bruto;
}

export function resolverDadosSolicitanteTiss(input: {
  dadosPrefaturamento?: unknown;
  codigoPrestadorPadrao?: string | null;
  profissionalPadrao?: ProfissionalPadrao | null;
}) {
  const dados = lerDadosPrefaturamento(input.dadosPrefaturamento);
  const profissional = input.profissionalPadrao ?? {};

  return {
    codigoPrestadorSolicitante: texto(dados.codigoOperadoraSolicitante) || texto(input.codigoPrestadorPadrao),
    nomeProfissionalSolicitante: texto(dados.nomeProfissionalSolicitante) || texto(profissional.nome),
    conselhoProfissionalSolicitante: normalizarConselhoTiss(dados.conselhoProfissionalSolicitante || profissional.codigoConselho || profissional.conselhoProfissional),
    numeroConselhoSolicitante: texto(dados.numeroConselhoSolicitante) || texto(profissional.numeroConselho) || texto(profissional.crm),
    ufSolicitante: texto(dados.ufSolicitante) || texto(profissional.uf) || texto(profissional.estado) || "AM",
    codigoCBOSolicitante: texto(dados.codigoCBOSolicitante) || texto(profissional.codigoCBO) || texto(profissional.cbos),
  };
}
