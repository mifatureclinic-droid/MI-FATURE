export type UsuarioPastaPaciente = {
  perfil?: string | null;
  role?: string | null;
};

/** Perfis autorizados a gerir anamnese e contrato terapêutico na Pasta do Paciente. */
export function podeGerirPastaPaciente(usuario?: UsuarioPastaPaciente | null): boolean {
  if (usuario?.role === 'admin') return true;
  const perfil = (usuario?.perfil ?? '').toLocaleLowerCase('pt-BR');
  return [
    'administrador',
    'master',
    'profissional',
    'recepcao',
    'recepção',
    'recepcionista',
  ].includes(perfil);
}
