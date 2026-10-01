import { describe, expect, it } from "vitest";
import { resolverEquipeSadtTiss } from "./equipeSadtTiss";

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
});
