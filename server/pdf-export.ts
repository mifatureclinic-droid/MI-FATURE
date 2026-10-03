import { PDFDocument, PDFPage, rgb } from "pdf-lib";

interface PacienteInfo {
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone: string;
}

interface ProntuarioItem {
  id: number;
  createdAt?: Date;
  criadoEm?: Date;
  dataAtendimento?: string | Date;
  queixa?: string | null;
  diagnostico?: string | null;
  tratamento?: string | null;
  observacoes?: string | null;
  profissionalNome?: string;
  tipoAtendimento?: string;
  [key: string]: any;
}

interface ResumoConsolidado {
  totalAtendimentos: number;
  periodoInicio?: Date;
  periodoFim?: Date;
  profissionaisUnicos: Set<string>;
  tiposAtendimento: Map<string, number>;
  diagnosticosFrequentes: Map<string, number>;
}

function calcularResumoConsolidado(
  historico: ProntuarioItem[],
  dataInicio?: Date,
  dataFim?: Date
): ResumoConsolidado {
  const resumo: ResumoConsolidado = {
    totalAtendimentos: historico.length,
    periodoInicio: dataInicio,
    periodoFim: dataFim,
    profissionaisUnicos: new Set(),
    tiposAtendimento: new Map(),
    diagnosticosFrequentes: new Map(),
  };

  historico.forEach((item) => {
    // Contar profissionais únicos
    if (item.profissionalNome) {
      resumo.profissionaisUnicos.add(item.profissionalNome);
    }

    // Contar tipos de atendimento
    const tipo = item.tipoAtendimento || "Não especificado";
    resumo.tiposAtendimento.set(tipo, (resumo.tiposAtendimento.get(tipo) || 0) + 1);

    // Contar diagnósticos frequentes
    if (item.diagnostico) {
      resumo.diagnosticosFrequentes.set(
        item.diagnostico,
        (resumo.diagnosticosFrequentes.get(item.diagnostico) || 0) + 1
      );
    }
  });

  return resumo;
}

export async function generateProntuarioPDF(
  paciente: PacienteInfo,
  historico: ProntuarioItem[],
  dataInicio?: Date,
  dataFim?: Date
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4 size
  const { height } = page.getSize();
  let yPosition = height - 50;

  const drawText = (text: string, size: number = 12, bold: boolean = false, y?: number) => {
    if (y !== undefined) yPosition = y;
    page.drawText(text, {
      x: 50,
      y: yPosition,
      size,
      color: rgb(0, 0, 0),
    });
    yPosition -= size + 5;
  };

  const drawLine = () => {
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: 545, y: yPosition },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPosition -= 15;
  };

  const drawBox = (title: string, content: string[]) => {
    // Desenhar caixa de resumo
    page.drawRectangle({
      x: 50,
      y: yPosition - 80,
      width: 495,
      height: 80,
      borderColor: rgb(0.2, 0.4, 0.8),
      borderWidth: 1,
      color: rgb(0.95, 0.97, 1),
    });

    drawText(title, 11, true);
    content.forEach((line) => {
      drawText(line, 10);
    });
    yPosition -= 10;
  };

  // Cabeçalho
  drawText("HISTÓRICO DE PRONTUÁRIOS", 16, true);
  drawText(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 10);
  drawLine();

  // Dados do Paciente
  drawText("DADOS DO PACIENTE", 14, true);
  drawText(`Nome: ${paciente.nome}`, 11);
  drawText(`CPF: ${paciente.cpf}`, 11);
  drawText(`Data de Nascimento: ${paciente.dataNascimento}`, 11);
  drawText(`Email: ${paciente.email}`, 11);
  drawText(`Telefone: ${paciente.telefone}`, 11);
  drawLine();

  // Resumo Consolidado
  const resumo = calcularResumoConsolidado(historico, dataInicio, dataFim);

  drawText("RESUMO CONSOLIDADO DO PERÍODO", 14, true);

  const conteudoResumo: string[] = [];
  conteudoResumo.push(`Total de Atendimentos: ${resumo.totalAtendimentos}`);

  if (dataInicio && dataFim) {
    conteudoResumo.push(
      `Período: ${dataInicio.toLocaleDateString("pt-BR")} a ${dataFim.toLocaleDateString("pt-BR")}`
    );
  } else if (dataInicio) {
    conteudoResumo.push(`Período: A partir de ${dataInicio.toLocaleDateString("pt-BR")}`);
  } else if (dataFim) {
    conteudoResumo.push(`Período: Até ${dataFim.toLocaleDateString("pt-BR")}`);
  }

  conteudoResumo.push(`Profissionais: ${resumo.profissionaisUnicos.size}`);

  if (resumo.tiposAtendimento.size > 0) {
    const tipos = Array.from(resumo.tiposAtendimento.entries())
      .map(([tipo, count]) => `${tipo} (${count})`)
      .join(", ");
    conteudoResumo.push(`Tipos de Atendimento: ${tipos}`);
  }

  if (resumo.diagnosticosFrequentes.size > 0) {
    const diagnosticos = Array.from(resumo.diagnosticosFrequentes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([diag, count]) => `${diag} (${count})`)
      .join(", ");
    conteudoResumo.push(`Diagnósticos Principais: ${diagnosticos}`);
  }

  if (yPosition < 150) {
    page = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;
  }

  drawBox("RESUMO DO PERÍODO", conteudoResumo);
  drawLine();

  // Histórico de Prontuários
  drawText("HISTÓRICO DE ATENDIMENTOS", 14, true);

  if (historico.length === 0) {
    drawText("Nenhum prontuário registrado", 11);
  } else {
    historico.forEach((item, index) => {
      // Verificar se precisa de nova página
      if (yPosition < 100) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
      }

      drawText(`Atendimento ${index + 1}`, 12, true);
      const dataObj = item.dataAtendimento || item.createdAt || item.criadoEm || new Date();
      const dataAtendimento = new Date(dataObj).toLocaleDateString("pt-BR");
      const horaAtendimento = new Date(dataObj).toLocaleTimeString("pt-BR");
      drawText(`Data: ${dataAtendimento} às ${horaAtendimento}`, 10);

      if (item.profissionalNome) {
        drawText(`Profissional: ${item.profissionalNome}`, 10);
      }

      if (item.tipoAtendimento) {
        drawText(`Tipo: ${item.tipoAtendimento}`, 10);
      }

      if (item.queixa) {
        drawText(`Queixa Principal: ${item.queixa}`, 10);
      }

      if (item.diagnostico) {
        drawText(`Diagnóstico: ${item.diagnostico}`, 10);
      }

      if (item.tratamento) {
        drawText(`Tratamento: ${item.tratamento}`, 10);
      }

      if (item.observacoes) {
        drawText(`Observações: ${item.observacoes}`, 10);
      }

      yPosition -= 10;
    });
  }

  // Rodapé
  yPosition = 30;
  page.drawText("Documento gerado automaticamente pelo MIFATURE", {
    x: 50,
    y: yPosition,
    size: 9,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
