export function distanciaEmMetros(lat1: number, lon1: number, lat2: number, lon2: number) {
  const raioTerra = 6_371_000;
  const paraRadiano = (valor: number) => valor * Math.PI / 180;
  const dLat = paraRadiano(lat2 - lat1);
  const dLon = paraRadiano(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(paraRadiano(lat1)) * Math.cos(paraRadiano(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * raioTerra * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function distanciaDescritor(base: number[], tentativa: number[]) {
  if (base.length !== tentativa.length || base.length !== 128) return Infinity;
  return Math.sqrt(base.reduce((soma, valor, indice) => soma + (valor - tentativa[indice]) ** 2, 0));
}
