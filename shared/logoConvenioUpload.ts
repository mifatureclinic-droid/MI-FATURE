export function extrairBase64DeArquivo(dataUrl: string): string {
  const separador = dataUrl.indexOf(',');
  return separador >= 0 ? dataUrl.slice(separador + 1) : '';
}

export function mensagemErroLogoConvenio(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '');
  return mensagem.trim() || 'Não foi possível enviar a logo do convênio.';
}
