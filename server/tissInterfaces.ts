/**
 * tissInterfaces.ts — Interfaces TypeScript e validações para o padrão TISS 4.02.00 (ANS)
 *
 * Tabela 26 ANS: Conselhos Profissionais (código de 2 dígitos)
 * Tabela 24 ANS: Código Brasileiro de Ocupações (CBO, 6 dígitos)
 * Tabela 22 ANS: Procedimentos e Eventos em Saúde (TUSS)
 */

// ─── Interfaces de Dados ────────────────────────────────────────────────────

export interface ProfissionalExecutante {
  nome: string;
  conselho: string;       // Tabela 26 da ANS (ex: '06' = CREFITO, '11' = CRP)
  numeroConselho: string; // Número de registro no conselho (ex: '12345')
  ufConselho: string;     // UF do conselho (ex: 'AM')
  cbo: string;            // Tabela 24 da ANS (ex: '223605' = Fisioterapeuta)
}

export interface ItemTerapia {
  sequencialItem: number;      // 1, 2, 3...
  dataExecucao: string;        // Formato 'AAAA-MM-DD'
  horaInicio: string;          // Formato 'HH:MM:SS'
  horaFim: string;             // Formato 'HH:MM:SS'
  codigoProcedimento: string;  // Tabela 22 da ANS (ex: '50000470')
  quantidade: number;
}

export interface EstruturaGuiaSadt {
  // Cabeçalho da Transação
  sequencialTransacao: string;
  numeroLote: string;

  // Dados Gerais da Guia
  registroANS: string;         // Código da Operadora (registro ANS)
  numeroGuiaPrestador: string; // ID interno do sistema

  // Beneficiário
  numeroCarteira: string;
  nomeBeneficiario: string;

  // Dados Clínicos e Profissional
  indicacaoClinica: string;
  profissionalExecutante: ProfissionalExecutante;

  // Procedimentos / Terapias Realizadas
  procedimentos: ItemTerapia[];
}

// ─── Tabelas de Validação ANS ────────────────────────────────────────────────

/**
 * Tabela 26 ANS — Conselhos Profissionais (código de 2 dígitos obrigatório no XML)
 */
export const TABELA_26_CONSELHOS: Record<string, string> = {
  '01': 'CRM',
  '02': 'CRO',
  '03': 'COREN',
  '05': 'CRF',
  '06': 'CREFITO',
  '07': 'CRN',
  '08': 'CRFA',
  '11': 'CRP',
  '12': 'CRBM',
  '13': 'CREF',
  '14': 'CRTR',
  '15': 'CRBIO',
  '16': 'CRAS',
};

/**
 * Tabela 24 ANS — Código Brasileiro de Ocupações (CBO)
 * Mapeamento dos CBOs mais comuns para clínicas de reabilitação e saúde mental.
 */
export const TABELA_24_CBO: Record<string, string> = {
  '225125': 'Médico Fisiatra / Reabilitador',
  '223575': 'Obstetriz',
  '223605': 'Fisioterapeuta Geral',
  '223630': 'Terapeuta Ocupacional',
  '223810': 'Fonoaudiólogo Geral',
  '251510': 'Psicólogo Clínico',
  '251545': 'Neuropsicólogo',
};

/**
 * Regras de validação TISS: quais CBOs (Tabela 24) são permitidos para cada
 * Conselho (Tabela 26). Baseado nas diretrizes ANS para evitar glosas automáticas.
 *
 * Conselho → CBOs permitidos
 */
export const REGRAS_VALIDACAO_TISS: Record<string, string[]> = {
  '01': ['225125'],           // CRM: Médico Fisiatra
  '03': ['223575'],           // COREN: Obstetriz (novo na v4.02.00)
  '06': ['223605', '223630'], // CREFITO: Fisioterapia + Terapia Ocupacional
  '08': ['223810'],           // CRFA: Fonoaudiologia
  '11': ['251510', '251545'], // CRP: Psicologia Clínica + Neuropsicologia
};

// ─── Funções de Validação ────────────────────────────────────────────────────

/**
 * Valida se a combinação Conselho (Tabela 26) + CBO (Tabela 24) é aceita pela ANS.
 *
 * @param conselho - Código de 2 dígitos do conselho (ex: '11' para CRP)
 * @param cbo      - Código CBO de 6 dígitos (ex: '251510' para Psicólogo Clínico)
 * @returns true se a combinação for válida; false caso contrário
 * @throws Error se o conselho não estiver mapeado nas regras de validação
 *
 * @example
 * validarProfissionalTiss('11', '251510') // true  — CRP + Psicólogo Clínico ✓
 * validarProfissionalTiss('06', '251510') // false — CREFITO + Psicólogo ✗ (glosa!)
 */
export function validarProfissionalTiss(conselho: string, cbo: string): boolean {
  const cbosPermitidos = REGRAS_VALIDACAO_TISS[conselho];

  if (!cbosPermitidos) {
    // Conselhos sem regras mapeadas (ex: CRM genérico) são aceitos sem validação restrita
    return true;
  }

  return cbosPermitidos.includes(cbo);
}

/**
 * Retorna a descrição do conselho profissional pelo código ANS (Tabela 26).
 * @param codigo - Código de 2 dígitos (ex: '11')
 * @returns Sigla do conselho (ex: 'CRP') ou undefined se não encontrado
 */
export function getDescricaoConselho(codigo: string): string | undefined {
  return TABELA_26_CONSELHOS[codigo];
}

/**
 * Retorna a descrição do CBO pelo código (Tabela 24).
 * @param cbo - Código CBO de 6 dígitos (ex: '251510')
 * @returns Descrição da ocupação (ex: 'Psicólogo Clínico') ou undefined se não encontrado
 */
export function getDescricaoCBO(cbo: string): string | undefined {
  return TABELA_24_CBO[cbo];
}

/**
 * Retorna os CBOs permitidos para um conselho específico.
 * Útil para popular dropdowns no frontend com as opções válidas.
 * @param conselho - Código de 2 dígitos do conselho
 * @returns Array de objetos { codigo, descricao } com os CBOs permitidos
 */
export function getCBOsPermitidos(conselho: string): Array<{ codigo: string; descricao: string }> {
  const cbos = REGRAS_VALIDACAO_TISS[conselho] ?? [];
  return cbos.map(c => ({ codigo: c, descricao: TABELA_24_CBO[c] ?? c }));
}
