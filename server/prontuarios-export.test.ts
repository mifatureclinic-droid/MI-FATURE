import { describe, it, expect } from "vitest";
import { generateProntuarioPDF } from "./pdf-export";

describe("Exportação de Prontuário em PDF", () => {
  it("deve gerar PDF com dados do paciente", async () => {
    const pdfBuffer = await generateProntuarioPDF(
      {
        nome: "João Silva",
        cpf: "123.456.789-00",
        dataNascimento: "15/01/1990",
        email: "joao@example.com",
        telefone: "(11) 98765-4321",
      },
      []
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
  });

  it("deve gerar PDF com histórico de prontuários", async () => {
    const historico = [
      {
        id: 1,
        criadoEm: new Date(),
        queixa: "Dor nas costas",
        diagnostico: "Lombalgia",
        tratamento: "Fisioterapia",
        observacoes: "Paciente respondendo bem ao tratamento",
        profissionalNome: "Dr. Silva",
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(
      {
        nome: "Maria Santos",
        cpf: "987.654.321-00",
        dataNascimento: "20/05/1985",
        email: "maria@example.com",
        telefone: "(11) 99876-5432",
      },
      historico
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve converter PDF para base64 para download", async () => {
    const pdfBuffer = await generateProntuarioPDF(
      {
        nome: "Carlos Oliveira",
        cpf: "456.789.123-00",
        dataNascimento: "10/03/1992",
        email: "carlos@example.com",
        telefone: "(11) 97654-3210",
      },
      []
    );

    const base64 = pdfBuffer.toString("base64");
    expect(base64.length).toBeGreaterThan(0);

    // Verificar se pode ser decodificado
    const decodedBuffer = Buffer.from(base64, "base64");
    expect(decodedBuffer.length).toBe(pdfBuffer.length);
  });

  it("deve gerar PDF com dados opcionais ausentes", async () => {
    const historico = [
      {
        id: 1,
        criadoEm: new Date(),
        queixa: null,
        diagnostico: null,
        tratamento: null,
        observacoes: null,
        profissionalNome: "Dra. Costa",
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(
      {
        nome: "Ana Paula",
        cpf: "321.654.987-00",
        dataNascimento: "25/07/1988",
        email: "ana@example.com",
        telefone: "",
      },
      historico
    );

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
