function paraMinutos(horario: string) {
  const [hora, minuto] = horario.split(':').map(Number);
  return hora * 60 + minuto;
}

export function mesclarHorariosDaAgenda(horariosBase: string[], horariosDeAtendimento: string[]) {
  return Array.from(new Set([
    ...horariosBase,
    ...horariosDeAtendimento.filter(horario => /^\d{2}:\d{2}$/.test(horario)),
  ])).sort((a, b) => paraMinutos(a) - paraMinutos(b));
}
