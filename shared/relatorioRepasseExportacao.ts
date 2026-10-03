export type LinhaRepasseParaExportacao = {
  pacienteNome: string;
  profissionalNome: string;
  convenioNome: string;
  data: string | Date;
  valorBruto: number;
  valorRepasse: number;
  valorGlosa: number;
  statusRecebimento: 'recebido' | 'glosa' | 'pendente';
};

export function formatarDataRepasseParaExportacao(data: string | Date): string {
  const texto = typeof data === 'string' ? data : data.toISOString();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  return iso ? `${iso[3]}/${iso[2]}/${iso[1]}` : texto;
}

export function prepararDadosExportacaoRepasse(linhas: LinhaRepasseParaExportacao[]) {
  const registros = linhas.map(linha => ({
    Paciente: linha.pacienteNome,
    Profissional: linha.profissionalNome,
    Convênio: linha.convenioNome,
    Data: formatarDataRepasseParaExportacao(linha.data),
    'Valor Bruto (R$)': Number(linha.valorBruto || 0).toFixed(2),
    'Repasse (R$)': Number(linha.valorRepasse || 0).toFixed(2),
    'Glosa (R$)': Number(linha.valorGlosa || 0).toFixed(2),
    Status: linha.statusRecebimento,
  }));

  const totaisBrutos = linhas.reduce((acumulado, linha) => ({
    valorBruto: acumulado.valorBruto + Number(linha.valorBruto || 0),
    valorRepasse: acumulado.valorRepasse + Number(linha.valorRepasse || 0),
    valorGlosa: acumulado.valorGlosa + Number(linha.valorGlosa || 0),
  }), { valorBruto: 0, valorRepasse: 0, valorGlosa: 0 });

  const totais = {
    valorBruto: Number(totaisBrutos.valorBruto.toFixed(2)),
    valorRepasse: Number(totaisBrutos.valorRepasse.toFixed(2)),
    valorGlosa: Number(totaisBrutos.valorGlosa.toFixed(2)),
  };

  return { registros, totais };
}
