export type DadosPerfilAcoes = {
  perfil?: string | null;
  role?: string | null;
  profissionalVinculadoId?: number | string | null;
};

function normalizarPerfil(perfil: string | null | undefined): string {
  return (perfil || '').trim().toLocaleLowerCase('pt-BR');
}

const PERFIS_ADMINISTRATIVOS = new Set([
  'master',
  'administrador',
  'admin',
  'recepcao',
  'recepção',
  'recepcionista',
]);

/**
 * O perfil administrativo sempre prevalece. Quando o perfil não vier na sessão,
 * uma conta comum vinculada a profissional é tratada como profissional.
 */
export function ehProfissionalNoMenu(dados: DadosPerfilAcoes): boolean {
  const perfil = normalizarPerfil(dados.perfil);
  if (dados.role === 'admin' || PERFIS_ADMINISTRATIVOS.has(perfil)) return false;
  if (dados.profissionalVinculadoId !== null && dados.profissionalVinculadoId !== undefined) return true;
  return perfil === 'profissional';
}

export function podeExibirAcoesAdministrativas(dados: DadosPerfilAcoes): boolean {
  return !ehProfissionalNoMenu(dados);
}

/** Exclusão de paciente é uma operação destrutiva e fica restrita ao master. */
export function podeExcluirPaciente(dados: DadosPerfilAcoes): boolean {
  return normalizarPerfil(dados.perfil) === 'master';
}
