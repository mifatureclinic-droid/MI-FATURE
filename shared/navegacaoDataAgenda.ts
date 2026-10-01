export function deslocarDataAgenda(data: Date, dias: number): Date {
  if (!(data instanceof Date) || Number.isNaN(data.getTime()) || !Number.isFinite(dias)) {
    throw new Error('Data ou deslocamento inválido para a Agenda.');
  }

  const proximaData = new Date(data);
  proximaData.setDate(proximaData.getDate() + Math.trunc(dias));
  return proximaData;
}
