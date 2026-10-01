export type CamposCabecalhoGuiaSadt = {
  numeroGuia?: string;
  numeroGuiaPrestador?: string;
  dataAutorizacao?: string;
  dataSolicitacao?: string;
};

/** Mantém os espelhos obrigatórios do cabeçalho da Guia SP/SADT alinhados. */
export function sincronizarCamposCabecalhoGuiaSadt<T extends CamposCabecalhoGuiaSadt>(campos: T): T {
  const numeroGuia = campos.numeroGuiaPrestador ?? campos.numeroGuia ?? '';
  const dataReferencia = campos.dataSolicitacao ?? campos.dataAutorizacao ?? '';

  return {
    ...campos,
    numeroGuia,
    numeroGuiaPrestador: numeroGuia,
    dataAutorizacao: dataReferencia,
    dataSolicitacao: dataReferencia,
  };
}
