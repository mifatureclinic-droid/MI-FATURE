const FUNCOES_COR_NAO_SUPORTADAS_NO_HTML2CANVAS = /\b(?:oklch|oklab)\(/i;

export function estiloPossuiCorIncompativelComHtml2Canvas(valor: string | null | undefined): boolean {
  return FUNCOES_COR_NAO_SUPORTADAS_NO_HTML2CANVAS.test(valor ?? '');
}

export function deveIgnorarElementoNaCapturaPdf(elemento: Pick<Element, 'tagName' | 'getAttribute'>): boolean {
  const tag = elemento.tagName.toLowerCase();
  if (tag === 'svg') return true;

  const origemImagem = elemento.getAttribute('src')?.trim().toLowerCase() ?? '';
  return tag === 'img' && origemImagem !== '' && !origemImagem.startsWith('data:');
}

export const OPCOES_SEGURO_CAPTURA_PDF = {
  useCORS: true,
  allowTaint: false,
  backgroundColor: '#ffffff',
  logging: false,
  onclone: prepararCloneParaCapturaPdf,
  ignoreElements: deveIgnorarElementoNaCapturaPdf,
} as const;

export function prepararCloneParaCapturaPdf(documentoClonado: Document): void {
  const janela = documentoClonado.defaultView ?? window;
  const propriedades: ReadonlyArray<readonly [string, string]> = [
    ['color', '#111827'],
    ['background-color', '#ffffff'],
    ['border-top-color', '#111827'],
    ['border-right-color', '#111827'],
    ['border-bottom-color', '#111827'],
    ['border-left-color', '#111827'],
    ['outline-color', '#111827'],
    ['text-decoration-color', '#111827'],
    ['fill', '#111827'],
    ['stroke', '#111827'],
    ['stop-color', '#111827'],
    ['flood-color', '#111827'],
    ['lighting-color', '#111827'],
  ];

  for (const elemento of Array.from(documentoClonado.querySelectorAll<HTMLElement | SVGElement>('*'))) {
    const estiloComputado = janela.getComputedStyle(elemento);
    for (const [propriedade, substituto] of propriedades) {
      if (estiloPossuiCorIncompativelComHtml2Canvas(estiloComputado.getPropertyValue(propriedade))) {
        elemento.style.setProperty(propriedade, substituto, 'important');
      }
    }

    if (estiloPossuiCorIncompativelComHtml2Canvas(estiloComputado.getPropertyValue('box-shadow'))) {
      elemento.style.setProperty('box-shadow', 'none', 'important');
    }
    if (estiloPossuiCorIncompativelComHtml2Canvas(estiloComputado.getPropertyValue('text-shadow'))) {
      elemento.style.setProperty('text-shadow', 'none', 'important');
    }
    if (estiloPossuiCorIncompativelComHtml2Canvas(estiloComputado.getPropertyValue('background-image'))) {
      elemento.style.setProperty('background-image', 'none', 'important');
    }
  }
}
