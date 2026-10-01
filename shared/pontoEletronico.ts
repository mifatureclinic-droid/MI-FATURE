export type JornadaPonto = {
  horaEntrada: string;
  inicioIntervalo: string;
  fimIntervalo: string;
  horaSaida: string;
  toleranciaMarcacaoMinutos: number;
  toleranciaDiariaMinutos: number;
  adicionalHoraExtra: number;
  valorHora: number;
};

export type RegistroPonto = {
  data?: string | Date | null;
  entrada?: string | null;
  inicioIntervalo?: string | null;
  fimIntervalo?: string | null;
  saida?: string | null;
};

export const JORNADA_PADRAO_RECEPCAO: JornadaPonto = {
  horaEntrada: '08:00',
  inicioIntervalo: '12:00',
  fimIntervalo: '13:00',
  horaSaida: '17:00',
  toleranciaMarcacaoMinutos: 5,
  toleranciaDiariaMinutos: 10,
  adicionalHoraExtra: 50,
  valorHora: 0,
};

export function minutosDeHorario(horario?: string | null): number | null {
  if (!horario || !/^\d{2}:\d{2}$/.test(horario)) return null;
  const [hora, minuto] = horario.split(':').map(Number);
  if (hora > 23 || minuto > 59) return null;
  return hora * 60 + minuto;
}

export function formatarMinutos(total: number): string {
  const sinal = total < 0 ? '-' : '';
  const absoluto = Math.abs(Math.round(total));
  return `${sinal}${String(Math.floor(absoluto / 60)).padStart(2, '0')}:${String(absoluto % 60).padStart(2, '0')}`;
}

export function calcularResumoPonto(registro: RegistroPonto, jornada: JornadaPonto) {
  const entrada = minutosDeHorario(registro.entrada);
  const inicioIntervalo = minutosDeHorario(registro.inicioIntervalo);
  const fimIntervalo = minutosDeHorario(registro.fimIntervalo);
  const saida = minutosDeHorario(registro.saida);
  const previstoEntrada = minutosDeHorario(jornada.horaEntrada)!;
  const previstoInicioIntervalo = minutosDeHorario(jornada.inicioIntervalo)!;
  const previstoFimIntervalo = minutosDeHorario(jornada.fimIntervalo)!;
  const previstoSaida = minutosDeHorario(jornada.horaSaida)!;
  const minutosPrevistos = (previstoSaida - previstoEntrada) - (previstoFimIntervalo - previstoInicioIntervalo);

  if ([entrada, inicioIntervalo, fimIntervalo, saida].some((item) => item === null)) {
    return { completo: false, minutosPrevistos, minutosTrabalhados: 0, saldoMinutos: 0, horasExtrasMinutos: 0, atrasoMinutos: 0, toleranciaAplicada: false, valorHoraExtra: 0 };
  }

  const minutosTrabalhados = (saida! - entrada!) - (fimIntervalo! - inicioIntervalo!);
  const diferenca = minutosTrabalhados - minutosPrevistos;
  const desvios = [
    Math.abs(entrada! - previstoEntrada),
    Math.abs(inicioIntervalo! - previstoInicioIntervalo),
    Math.abs(fimIntervalo! - previstoFimIntervalo),
    Math.abs(saida! - previstoSaida),
  ];
  const toleranciaAplicada = desvios.every((desvio) => desvio <= jornada.toleranciaMarcacaoMinutos) && Math.abs(diferenca) <= jornada.toleranciaDiariaMinutos;
  const saldoMinutos = toleranciaAplicada ? 0 : diferenca;
  const horasExtrasMinutos = Math.max(saldoMinutos, 0);
  const atrasoMinutos = Math.max(-saldoMinutos, 0);
  const valorHoraExtra = (horasExtrasMinutos / 60) * jornada.valorHora * (1 + jornada.adicionalHoraExtra / 100);
  return { completo: true, minutosPrevistos, minutosTrabalhados, saldoMinutos, horasExtrasMinutos, atrasoMinutos, toleranciaAplicada, valorHoraExtra };
}

export type OcorrenciaPonto = {
  tipo: 'folga' | 'ferias' | 'atestado';
  dataInicio: string | Date;
  dataFim: string | Date;
};

function dataSomente(valor: string | Date) {
  return valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10);
}

function adicionarDias(data: string, quantidade: number) {
  const [ano, mes, dia] = data.split('-').map(Number);
  const valor = new Date(Date.UTC(ano, mes - 1, dia + quantidade));
  return valor.toISOString().slice(0, 10);
}

function ultimoDiaDaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number);
  return new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);
}

function diaDaSemana(data: string) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

export function calcularResumoMensalPonto({
  competencia,
  registros,
  ocorrencias,
  jornada,
  dataLimite,
}: {
  competencia: string;
  registros: RegistroPonto[];
  ocorrencias: OcorrenciaPonto[];
  jornada: JornadaPonto;
  dataLimite?: string;
}) {
  const inicio = `${competencia}-01`;
  const fim = dataLimite && dataLimite < ultimoDiaDaCompetencia(competencia) ? dataLimite : ultimoDiaDaCompetencia(competencia);
  const porData = new Map(registros.filter((registro) => registro.data).map((registro) => [dataSomente(registro.data!), registro]));
  const totais = {
    diasPrevistos: 0,
    diasCompletos: 0,
    faltas: 0,
    registrosIncompletos: 0,
    folgas: 0,
    ferias: 0,
    atestados: 0,
    minutosTrabalhados: 0,
    horasExtrasMinutos: 0,
    atrasoMinutos: 0,
    valorHorasExtras: 0,
  };
  for (let data = inicio; data <= fim; data = adicionarDias(data, 1)) {
    const semana = diaDaSemana(data);
    if (semana === 0 || semana === 6) continue;
    const ocorrencia = ocorrencias.find((item) => data >= dataSomente(item.dataInicio) && data <= dataSomente(item.dataFim));
    if (ocorrencia) {
      if (ocorrencia.tipo === 'folga') totais.folgas += 1;
      if (ocorrencia.tipo === 'ferias') totais.ferias += 1;
      if (ocorrencia.tipo === 'atestado') totais.atestados += 1;
      continue;
    }
    totais.diasPrevistos += 1;
    const registro = porData.get(data);
    if (!registro) {
      totais.faltas += 1;
      continue;
    }
    const resumo = calcularResumoPonto(registro, jornada);
    if (!resumo.completo) {
      totais.registrosIncompletos += 1;
      continue;
    }
    totais.diasCompletos += 1;
    totais.minutosTrabalhados += resumo.minutosTrabalhados;
    totais.horasExtrasMinutos += resumo.horasExtrasMinutos;
    totais.atrasoMinutos += resumo.atrasoMinutos;
    totais.valorHorasExtras += resumo.valorHoraExtra;
  }
  return totais;
}
