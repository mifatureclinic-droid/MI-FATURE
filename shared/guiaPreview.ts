export type GuiaParaPreview = {
  id?: number | null;
  numeroGuia?: string | null;
};

export function prepararGuiaParaPreview<T extends GuiaParaPreview>(guia: T | null | undefined): T | null {
  if (!guia || guia.id == null) return null;
  return guia;
}
