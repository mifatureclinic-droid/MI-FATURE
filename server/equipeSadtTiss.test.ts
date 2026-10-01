import { describe, expect, it } from "vitest";
import { resolverEquipeSadtTiss } from "../shared/equipeSadtTiss";

describe("resolverEquipeSadtTiss", () => {
  const profissional = {
    id: 570002,
    nome: "JAIRO DE ASSIS MASCAREN",
    cpf: "123.456.789-09",
    conselhoProfissional: "CRP",
    codigoConselho: "11",
    crm: "20ª/07358",
    uf: "AM",
    especialidade: "Psicologia, Neuropsicologo",
  };

  it("completa todos os campos do executante a partir do profissional vinculado ao procedimento", () => {
    expect(resolverEquipeSadtTiss({
      dadosPrefaturamento: {},
      sequencial: 1,
      profissionalDoProcedimento: profissional,
    })).toEqual([{
      grauPart: "12",
      cpfContratado: "12345678909",
      nomeProf: "JAIRO DE ASSIS MASCAREN",
      conselho: "11",
      numeroConselhoProfissional: "07358",
      uf: "AM",
      cbos: "251545",
    }]);
  });

  it("prioriza o membro salvo para a sequência do procedimento", () => {
    const resultado = resolverEquipeSadtTiss({
      dadosPrefaturamento: JSON.stringify({ profissionais: [{
        seqRef: "2",
        grauPart: "10",
        codigoOperadoraCPF: "0000376402",
        nome: "PROFISSIONAL INFORMADO",
        conselhoProfissional: "11",
        numeroConselho: "20/12345",
        uf: "AM",
        codigoCBO: "251510",
      }] }),
      sequencial: 2,
      profissionalDaGuia: profissional,
    });
    expect(resultado).toEqual([expect.objectContaining({
      grauPart: "10",
      codigoProfissional: "0000376402",
      nomeProf: "PROFISSIONAL INFORMADO",
      numeroConselhoProfissional: "12345",
      cbos: "251510",
    })]);
  });

  it("usa os dados do psicólogo inserido como membro, sem herdar o solicitante ou contratado", () => {
    const psicologoExecutante = {
      id: 570004,
      nome: "SUZY PSICÓLOGA EXECUTANTE",
      cpf: "987.654.321-00",
      conselhoProfissional: "CRP",
      codigoConselho: "11",
      numeroConselho: "20ª/45678",
      uf: "AM",
      codigoCBO: "251510",
    };

    const resultado = resolverEquipeSadtTiss({
      dadosPrefaturamento: JSON.stringify({ profissionais: [{
        profissionalId: 570004,
        seqRef: "1",
        grauPart: "10",
      }] }),
      sequencial: 1,
      profissionalDoProcedimento: profissional,
      profissionalDaGuia: profissional,
      profissionaisExecutantes: [profissional, psicologoExecutante],
    });

    expect(resultado).toEqual([{
      grauPart: "10",
      cpfContratado: "98765432100",
      nomeProf: "SUZY PSICÓLOGA EXECUTANTE",
      conselho: "11",
      numeroConselhoProfissional: "45678",
      uf: "AM",
      cbos: "251510",
    }]);
  });
});
