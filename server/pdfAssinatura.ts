/**
 * Gerador de PDF comprovante de assinatura digital SADT
 * Usa pdfkit para criar um documento com os dados da guia, a assinatura desenhada e o hash SHA-256
 */
import PDFDocument from "pdfkit";
import { storagePut } from "./storage";

export interface DadosComprovante {
  pacienteNome: string;
  pacienteCpf?: string | null;
  numeroSessao: number;
  dataSessao: Date | string;
  procedimento: string;
  hash: string;
  assinaturaDataUrl?: string | null; // base64 do canvas (pode ser null se recusa)
  motivoRecusa?: string | null;
  dataAssinatura: Date;
  ipAssinatura?: string | null;
}

function formatarData(d: Date | string): string {
  const dt = typeof d === "string" ? new Date(d + "T12:00:00") : d;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarOrdinal(n: number): string {
  if (n === 1) return "1ª";
  if (n === 2) return "2ª";
  if (n === 3) return "3ª";
  return `${n}ª`;
}

/**
 * Gera o PDF comprovante e faz upload para o storage.
 * Retorna a URL pública do PDF.
 */
export async function gerarEArmazenarPdfComprovante(
  dados: DadosComprovante,
  assinaturaId: number
): Promise<string> {
  const pdfBuffer = await gerarPdfBuffer(dados);
  const fileKey = `assinaturas-sadt/${assinaturaId}-comprovante-${Date.now()}.pdf`;
  const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");
  return url;
}

/**
 * Gera o PDF em memória e retorna o Buffer.
 */
export function gerarPdfBuffer(dados: DadosComprovante): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const VERDE_ESCURO = "#1E4D3A";
    const VERDE_MEDIO = "#2D6B52";
    const CINZA = "#718096";
    const CINZA_CLARO = "#E2E8F0";
    const PRETO = "#1A202C";
    const AREIA = "#F2EDE4";

    const largura = doc.page.width - 100; // margem 50 de cada lado

    // ─── Cabeçalho ─────────────────────────────────────────────────────────
    doc.rect(50, 50, largura, 70).fill(VERDE_ESCURO);

    doc.fillColor("white")
      .fontSize(18)
      .font("Helvetica-Bold")
      .text("MiFatureClinic", 70, 65);

    doc.fillColor("rgba(255,255,255,0.7)")
      .fontSize(9)
      .font("Helvetica")
      .text("COMPROVANTE DE ASSINATURA DIGITAL", 70, 90);

    // Badge de validade jurídica no canto direito
    doc.fillColor("white")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("✓ VALIDADE JURÍDICA", 400, 75, { width: 145, align: "right" });

    doc.fillColor("rgba(255,255,255,0.6)")
      .fontSize(7)
      .font("Helvetica")
      .text("MP 2.200-2/2001 · ICP-Brasil", 400, 90, { width: 145, align: "right" });

    // ─── Título da guia ────────────────────────────────────────────────────
    doc.moveDown(0.5);
    const yTitulo = 140;
    doc.fillColor(VERDE_ESCURO)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Guia SADT — ${formatarOrdinal(dados.numeroSessao)} Sessão`, 50, yTitulo);

    doc.fillColor(CINZA)
      .fontSize(10)
      .font("Helvetica")
      .text(`Data da sessão: ${formatarData(dados.dataSessao)}`, 50, yTitulo + 20);

    // Linha separadora
    doc.moveTo(50, yTitulo + 40).lineTo(50 + largura, yTitulo + 40).strokeColor(CINZA_CLARO).lineWidth(1).stroke();

    // ─── Dados do paciente e procedimento ─────────────────────────────────
    const yDados = yTitulo + 55;
    const colEsq = 50;
    const colDir = 310;

    doc.fillColor(CINZA).fontSize(8).font("Helvetica-Bold")
      .text("PACIENTE", colEsq, yDados)
      .text("PROCEDIMENTO", colDir, yDados);

    doc.fillColor(PRETO).fontSize(11).font("Helvetica-Bold")
      .text(dados.pacienteNome, colEsq, yDados + 14, { width: 240 })
      .text(dados.procedimento, colDir, yDados + 14, { width: 240 });

    if (dados.pacienteCpf) {
      doc.fillColor(CINZA).fontSize(9).font("Helvetica")
        .text(`CPF: ${dados.pacienteCpf}`, colEsq, yDados + 32);
    }

    // ─── Linha separadora ─────────────────────────────────────────────────
    const ySep2 = yDados + 55;
    doc.moveTo(50, ySep2).lineTo(50 + largura, ySep2).strokeColor(CINZA_CLARO).lineWidth(1).stroke();

    // ─── Assinatura ou Motivo de Recusa ────────────────────────────────────
    const yAssinatura = ySep2 + 20;

    if (dados.motivoRecusa) {
      // Caso de recusa — mostrar motivo
      doc.rect(50, yAssinatura, largura, 90).fill("#FFF5F5").stroke("#FEB2B2");

      doc.fillColor("#C53030").fontSize(9).font("Helvetica-Bold")
        .text("⚠ PACIENTE NÃO ASSINOU — MOTIVO DECLARADO:", 65, yAssinatura + 12);

      doc.fillColor(PRETO).fontSize(10).font("Helvetica")
        .text(dados.motivoRecusa, 65, yAssinatura + 30, { width: largura - 30, height: 50 });

    } else if (dados.assinaturaDataUrl && dados.assinaturaDataUrl.startsWith("data:image")) {
      // Caso de assinatura — inserir imagem do canvas
      doc.fillColor(CINZA).fontSize(8).font("Helvetica-Bold")
        .text("ASSINATURA DO PACIENTE", 50, yAssinatura);

      doc.rect(50, yAssinatura + 14, largura, 100).fill("#FAFFFE").stroke(CINZA_CLARO);

      try {
        const base64Data = dados.assinaturaDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const imgBuffer = Buffer.from(base64Data, "base64");
        doc.image(imgBuffer, 60, yAssinatura + 18, { width: largura - 20, height: 90, fit: [largura - 20, 90] });
      } catch {
        doc.fillColor(CINZA).fontSize(9).font("Helvetica")
          .text("(imagem da assinatura não disponível)", 65, yAssinatura + 55);
      }

      // Linha de assinatura
      doc.moveTo(60, yAssinatura + 110).lineTo(50 + largura - 10, yAssinatura + 110)
        .strokeColor(CINZA_CLARO).lineWidth(0.5).stroke();

    } else {
      // Sem assinatura e sem motivo (não deveria acontecer)
      doc.rect(50, yAssinatura, largura, 60).fill(AREIA);
      doc.fillColor(CINZA).fontSize(9).font("Helvetica")
        .text("Assinatura não disponível.", 65, yAssinatura + 22);
    }

    // ─── Hash SHA-256 ──────────────────────────────────────────────────────
    const yHash = yAssinatura + (dados.motivoRecusa ? 110 : 130);

    doc.rect(50, yHash, largura, 60).fill("#EBF4F0").stroke("#C6E0D4");

    doc.fillColor(VERDE_MEDIO).fontSize(8).font("Helvetica-Bold")
      .text("🔒 HASH DE VERIFICAÇÃO SHA-256", 65, yHash + 10);

    doc.fillColor(VERDE_ESCURO).fontSize(8).font("Courier")
      .text(dados.hash, 65, yHash + 26, { width: largura - 30, lineBreak: true });

    // ─── Metadados ─────────────────────────────────────────────────────────
    const yMeta = yHash + 80;
    doc.moveTo(50, yMeta).lineTo(50 + largura, yMeta).strokeColor(CINZA_CLARO).lineWidth(1).stroke();

    const dataHora = dados.dataAssinatura.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

    doc.fillColor(CINZA).fontSize(8).font("Helvetica")
      .text(`Data/Hora: ${dataHora}`, 50, yMeta + 12)
      .text(`IP: ${dados.ipAssinatura || "não disponível"}`, 50, yMeta + 26);

    doc.fillColor(CINZA).fontSize(8).font("Helvetica")
      .text(`Tipo: ${dados.motivoRecusa ? "Recusa declarada" : "Assinatura digital"}`, 310, yMeta + 12)
      .text("Padrão: SHA-256 · MP 2.200-2/2001", 310, yMeta + 26);

    // ─── Rodapé ────────────────────────────────────────────────────────────
    const yRodape = doc.page.height - 70;
    doc.rect(50, yRodape, largura, 1).fill(CINZA_CLARO);

    doc.fillColor(CINZA).fontSize(7).font("Helvetica")
      .text(
        "Este documento é um comprovante de assinatura digital gerado pelo sistema MiFatureClinic. " +
        "A autenticidade pode ser verificada pelo hash SHA-256 acima. " +
        "Conforme MP 2.200-2/2001 e padrão ICP-Brasil.",
        50, yRodape + 10, { width: largura, align: "center" }
      );

    doc.end();
  });
}
