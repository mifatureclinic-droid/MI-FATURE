const camposOpcionais = new Set([
  'cnpj',
  'codigoOperadora',
  'registroANS',
  'codigoNaOperadora',
  'logoUrl',
  'email',
  'telefone',
  'endereco',
  'cidade',
  'estado',
  'cep',
  'aniversarioConvenio',
  'anexoUrl',
]);

export function normalizarDadosConvenio<T extends Record<string, unknown>>(dados: T): T {
  return Object.fromEntries(
    Object.entries(dados)
      .map(([campo, valor]): [string, unknown] => [campo, typeof valor === 'string' ? valor.trim() : valor])
      .filter(([campo, valor]) => !(camposOpcionais.has(campo) && valor === '')),
  ) as T;
}
