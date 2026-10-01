export function determinarModoEnvioAssinatura({ aplicar, preparar }) {
  if (aplicar) return 'aplicado';
  if (preparar) return 'preparado';
  return 'simulação';
}

export function deveEnviarWhatsApp(modo) {
  return modo === 'aplicado';
}
