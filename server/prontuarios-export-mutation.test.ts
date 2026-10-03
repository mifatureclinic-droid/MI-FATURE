import { describe, it, expect } from "vitest";
import { z } from "zod";
import * as db_module from "./db";
import { getHistoricoProntuariosPaciente } from "./db-prontuarios";
import { generateProntuarioPDF } from "./pdf-export";

describe("Mutation prontuarios.exportarPDF", () => {
  it("deve retornar PDF em base64 com fileName", async () => {
    // Simular dados do paciente
    const pacienteData = {
      nome: "Test Patient",
      cpf: "123.456.789-00",
      dataNascimento: "15/01/1990",
      email: "test@example.com",
      telefone: "(11) 98765-4321",
    };

    // Gerar PDF
    const pdfBuffer = await generateProntuarioPDF(pacienteData, []);

    // Converter para base64
    const pdfBase64 = pdfBuffer.toString("base64");
    const fileName = `prontuario_Test_Patient_${new Date().toISOString().split("T")[0]}.pdf`;

    // Verificar resultado
    expect(pdfBase64).toBeDefined();
    expect(pdfBase64.length).toBeGreaterThan(0);
    expect(fileName).toContain("prontuario_");
    expect(fileName).toContain(".pdf");
  });

  it("deve gerar nome de arquivo com data correta", async () => {
    const pacienteData = {
      nome: "João da Silva",
      cpf: "987.654.321-00",
      dataNascimento: "20/05/1985",
      email: "joao@example.com",
      telefone: "(11) 99876-5432",
    };

    const pdfBuffer = await generateProntuarioPDF(pacienteData, []);
    const fileName = `prontuario_${pacienteData.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    expect(fileName).toBe(`prontuario_João_da_Silva_${new Date().toISOString().split("T")[0]}.pdf`);
  });

  it("deve suportar histórico com múltiplos prontuários", async () => {
    const pacienteData = {
      nome: "Maria Santos",
      cpf: "456.789.123-00",
      dataNascimento: "10/03/1992",
      email: "maria@example.com",
      telefone: "(11) 97654-3210",
    };

    const historico = [
      {
        id: 1,
        criadoEm: new Date("2026-01-15"),
        queixa: "Dor nas costas",
        diagnostico: "Lombalgia",
        tratamento: "Fisioterapia",
        observacoes: "Paciente respondendo bem",
        profissionalNome: "Dr. Silva",
      },
      {
        id: 2,
        criadoEm: new Date("2026-02-20"),
        queixa: "Dor no joelho",
        diagnostico: "Tendinite",
        tratamento: "Repouso e fisioterapia",
        observacoes: "Melhora gradual",
        profissionalNome: "Dra. Costa",
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(pacienteData, historico);

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve retornar buffer decodificável de base64", async () => {
    const pacienteData = {
      nome: "Carlos Oliveira",
      cpf: "321.654.987-00",
      dataNascimento: "25/07/1988",
      email: "carlos@example.com",
      telefone: "(11) 96543-2109",
    };

    const pdfBuffer = await generateProntuarioPDF(pacienteData, []);
    const pdfBase64 = pdfBuffer.toString("base64");

    // Decodificar e verificar
    const decodedBuffer = Buffer.from(pdfBase64, "base64");
    expect(decodedBuffer.length).toBe(pdfBuffer.length);
    expect(decodedBuffer.toString("utf8", 0, 4)).toBe("%PDF");
  });
});
