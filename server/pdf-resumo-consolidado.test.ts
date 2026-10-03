import { describe, it, expect } from "vitest";
import { generateProntuarioPDF } from "./pdf-export";

describe("PDF com Resumo Consolidado", () => {
  const pacienteInfo = {
    nome: "João Silva",
    cpf: "123.456.789-00",
    dataNascimento: "01/01/1990",
    email: "joao@example.com",
    telefone: "(11) 98765-4321",
  };

  it("deve gerar PDF com histórico vazio", async () => {
    const pdfBuffer = await generateProntuarioPDF(pacienteInfo, []);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve gerar PDF com histórico e sem datas", async () => {
    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        tratamento: "Repouso",
        createdAt: new Date("2026-01-15"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(pacienteInfo, historico);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve gerar PDF com histórico e período de datas", async () => {
    const dataInicio = new Date("2026-01-01");
    const dataFim = new Date("2026-01-31");

    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        tratamento: "Repouso",
        createdAt: new Date("2026-01-15"),
      },
      {
        id: 2,
        profissionalNome: "Dra. Santos",
        tipoAtendimento: "Retorno",
        queixa: "Acompanhamento",
        diagnostico: "Cefaleia",
        tratamento: "Medicação",
        createdAt: new Date("2026-01-20"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(
      pacienteInfo,
      historico,
      dataInicio,
      dataFim
    );
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve gerar PDF com múltiplos atendimentos e tipos diferentes", async () => {
    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        tratamento: "Repouso",
        createdAt: new Date("2026-01-15"),
      },
      {
        id: 2,
        profissionalNome: "Dra. Santos",
        tipoAtendimento: "Fisioterapia",
        queixa: "Dor nas costas",
        diagnostico: "Lombalgia",
        tratamento: "Exercícios",
        createdAt: new Date("2026-01-20"),
      },
      {
        id: 3,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Retorno",
        queixa: "Acompanhamento",
        diagnostico: "Cefaleia",
        tratamento: "Medicação",
        createdAt: new Date("2026-01-25"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(pacienteInfo, historico);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve converter PDF para base64 corretamente", async () => {
    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        createdAt: new Date("2026-01-15"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(pacienteInfo, historico);
    const base64 = pdfBuffer.toString("base64");

    expect(typeof base64).toBe("string");
    expect(base64.length).toBeGreaterThan(0);
    // Verificar se é válido base64
    expect(() => Buffer.from(base64, "base64")).not.toThrow();
  });

  it("deve gerar PDF com apenas data de início", async () => {
    const dataInicio = new Date("2026-01-15");

    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        createdAt: new Date("2026-01-20"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(
      pacienteInfo,
      historico,
      dataInicio
    );
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("deve gerar PDF com apenas data de fim", async () => {
    const dataFim = new Date("2026-01-25");

    const historico = [
      {
        id: 1,
        profissionalNome: "Dr. Silva",
        tipoAtendimento: "Consulta",
        queixa: "Dor de cabeça",
        diagnostico: "Cefaleia",
        createdAt: new Date("2026-01-20"),
      },
    ];

    const pdfBuffer = await generateProntuarioPDF(
      pacienteInfo,
      historico,
      undefined,
      dataFim
    );
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });
});
