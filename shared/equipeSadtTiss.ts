import {
  normalizarCodigoCboTiss,
  normalizarNumeroConselhoTiss,
  resolverCodigoCboProfissionalTiss,
} from "./identificacaoProfissionalTiss";
import { reidratarCamposPrefaturamento } from "./prefaturamentoPersistencia";

export interface EquipeSadtTiss {
  grauPart: string;
  codigoProfissional?: string;
  cpfContratado?: string;
  nomeProf: string;
  conselho: string;
  numeroConselhoProfissional: string;
  uf: string;
  cbos: string;
}

type ProfissionalFonte = {
  id?: number | null;
  nome?: string | null;
  cpf?: string | null;
  conselhoProfissional?: string | null;
  codigoConselho?: string | null;
  crm?: string | null;
  numeroConselho?: string | null;
  uf?: string | null;
  codigoCBO?: string | null;
  cbos?: string | null;
  especialidade?: string | null;
};

type MembroPrefaturamento = {
  profissionalId?: number | null;
  seqRef?: string | number | null;
  grauPart?: string | null;
  codigoOperadoraCPF?: string | null;
  nome?: string | null;
  conselhoProfissional?: string | null;
  numeroConselho?: string | null;
  uf?: string | null;
  codigoCBO?: string | null;
};

const CONSELHO_POR_SIGLA: Record<string, string> = {
  CRM: "01",
  CRO: "02",
  COREN: "03",
  CRF: "05",
  CREFITO: "06",
  CRN: "07",
  CRFA: "08",
  CRP: "11",
  CRBM: "12",
  CREF: "13",
  CRTR: "14",
  CRBIO: "15",
  CRAS: "16",
};

function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

function normalizarConselhoTiss(valor: string | null | undefined): string {
  const normalizado = (valor ?? "").trim().toUpperCase();
  if (/^\d{1,2}$/.test(normalizado)) return normalizado.padStart(2, "0");
  return CONSELHO_POR_SIGLA[normalizado] ?? "";
}

function membrosSalvos(dadosPrefaturamento: unknown): MembroPrefaturamento[] {
  const dados = reidratarCamposPrefaturamento(dadosPrefaturamento);
  const profissionais = dados.profissionais;
  return Array.isArray(profissionais)
    ? profissionais.filter((membro): membro is MembroPrefaturamento => Boolean(membro) && typeof membro === "object")
    : [];
}

function criarEquipe(
  membro: MembroPrefaturamento | undefined,
  profissional: ProfissionalFonte | undefined,
): EquipeSadtTiss | undefined {
  const identificador = membro?.codigoOperadoraCPF || profissional?.cpf || "";
  const digitos = apenasDigitos(identificador);
  const nomeProf = (membro?.nome || profissional?.nome || "").trim();
  const conselho = normalizarConselhoTiss(membro?.conselhoProfissional || profissional?.codigoConselho || profissional?.conselhoProfissional);
  const numeroConselhoProfissional = normalizarNumeroConselhoTiss(membro?.numeroConselho || profissional?.numeroConselho || profissional?.crm);
  const cbos = normalizarCodigoCboTiss(membro?.codigoCBO) || resolverCodigoCboProfissionalTiss(profissional ?? {});
  const uf = (membro?.uf || profissional?.uf || "AM").trim().toUpperCase();

  // Todos os campos abaixo são obrigatórios dentro de equipeSadt no XSD TISS.
  if (!identificador || !nomeProf || !conselho || !numeroConselhoProfissional || !cbos) return undefined;

  return {
    grauPart: (membro?.grauPart || "12").toString().trim() || "12",
    ...(digitos.length === 11 ? { cpfContratado: digitos } : { codigoProfissional: identificador.trim() }),
    nomeProf,
    conselho,
    numeroConselhoProfissional,
    uf,
    cbos,
  };
}

/**
 * Vincula os membros salvos no pré-faturamento ao item executado pelo número
 * de sequência. Quando não há uma linha manual para o item, usa o profissional
 * registrado no próprio procedimento/guia como equipe executante única.
 */
export function resolverEquipeSadtTiss(input: {
  dadosPrefaturamento: unknown;
  sequencial: number;
  profissionalDoProcedimento?: ProfissionalFonte;
  profissionalDaGuia?: ProfissionalFonte;
  profissionaisExecutantes?: ProfissionalFonte[];
}): EquipeSadtTiss[] {
  const membros = membrosSalvos(input.dadosPrefaturamento);
  const vinculados = membros.filter(membro => String(membro.seqRef ?? "").trim() === String(input.sequencial));
  const fontePadrao = input.profissionalDoProcedimento ?? input.profissionalDaGuia;
  const candidatos = vinculados.length > 0 ? vinculados : [undefined];

  return candidatos
    .map(membro => {
      const profissionalDoMembro = membro?.profissionalId != null
        ? input.profissionaisExecutantes?.find(profissional => profissional.id === membro.profissionalId)
          ?? (input.profissionalDoProcedimento?.id === membro.profissionalId
            ? input.profissionalDoProcedimento
            : undefined)
        : fontePadrao;
      return criarEquipe(membro, profissionalDoMembro);
    })
    .filter((equipe): equipe is EquipeSadtTiss => Boolean(equipe));
}
