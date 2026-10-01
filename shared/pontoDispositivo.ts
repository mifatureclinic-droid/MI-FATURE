export function cameraEstaPronta(readyState: number) {
  return readyState >= 2;
}

export function mensagemErroGeolocalizacao(codigo?: number) {
  switch (codigo) {
    case 1:
      return 'A localização foi bloqueada. Autorize a localização precisa para este site nas definições do navegador.';
    case 2:
      return 'Não foi possível determinar a sua localização. Ative o GPS e tente novamente próximo de uma janela ou área aberta.';
    case 3:
      return 'A localização demorou demasiado. Verifique o GPS e tente novamente.';
    default:
      return 'Não foi possível obter a localização. Autorize o GPS e tente novamente.';
  }
}
