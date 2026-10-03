export function calcularExpiracaoLinkManaus(data, hora, minutosAntes = 60) {
  const [horas, minutos] = String(hora ?? '').split(':').map(Number);
  if (!Number.isInteger(horas) || !Number.isInteger(minutos)) return null;
  if (!Number.isInteger(minutosAntes) || minutosAntes < 0) return null;
  const totalMinutos = horas * 60 + minutos - minutosAntes;
  if (totalMinutos < 0) return null;
  const horaManaus = `${String(Math.floor(totalMinutos / 60)).padStart(2, '0')}:${String(totalMinutos % 60).padStart(2, '0')}`;
  return {
    horaManaus,
    timestampUtc: new Date(`${data}T${horaManaus}:00-04:00`),
  };
}

export function janelaEnvioAssinaturaEstaAberta({ dataSessao, dataAtual, horaAtual, horaExpiracao }) {
  if (!dataSessao || !dataAtual || !horaAtual || !horaExpiracao) return false;
  if (dataSessao > dataAtual) return true;
  if (dataSessao < dataAtual) return false;
  return horaExpiracao > horaAtual;
}
