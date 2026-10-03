export type LinhaPacienteEnvioAnamnese = {
  pacienteId: number;
  nome: string;
  whatsapp: string | null;
  telefone: string | null;
};

export type PacienteElegivelEnvioAnamnese = {
  pacienteId: number;
  nome: string;
  telefone: string;
};

export function consolidarPacientesElegiveisAnamnese(linhas: LinhaPacienteEnvioAnamnese[]): PacienteElegivelEnvioAnamnese[] {
  const elegiveis = new Map<number, PacienteElegivelEnvioAnamnese>();
  for (const linha of linhas) {
    const telefone = linha.whatsapp || linha.telefone;
    if (telefone && !elegiveis.has(linha.pacienteId)) {
      elegiveis.set(linha.pacienteId, { pacienteId: linha.pacienteId, nome: linha.nome, telefone });
    }
  }
  return [...elegiveis.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
