export type BradescoReturnStatus = "autorizado" | "negado" | "enviado_portal" | "liberada";

export type BradescoReturnForm = {
  status: BradescoReturnStatus;
  protocoloBradesco: string;
  numeroAutorizacaoBradesco: string;
  senhaAutorizacaoBradesco: string;
  dataAutorizacao: string;
  validadeAutorizacao: string;
  sessoesAutorizadas: string;
  motivoNegacao: string;
};

const optional = (value: string) => value.trim() || undefined;

export function isBradescoReturnReady(form: BradescoReturnForm) {
  if (form.status === "enviado_portal") return Boolean(optional(form.protocoloBradesco));
  if (form.status === "liberada") {
    return Boolean(optional(form.protocoloBradesco) && optional(form.senhaAutorizacaoBradesco) && optional(form.dataAutorizacao));
  }
  return true;
}

export function buildBradescoReturnPayload(autorizacaoId: number, form: BradescoReturnForm) {
  return {
    autorizacaoId,
    status: form.status,
    protocoloBradesco: optional(form.protocoloBradesco),
    numeroAutorizacaoBradesco: optional(form.numeroAutorizacaoBradesco),
    senhaAutorizacaoBradesco: optional(form.senhaAutorizacaoBradesco),
    dataAutorizacao: optional(form.dataAutorizacao),
    validadeAutorizacao: optional(form.validadeAutorizacao),
    sessoesAutorizadas: form.sessoesAutorizadas ? Number(form.sessoesAutorizadas) : undefined,
    motivoNegacao: optional(form.motivoNegacao),
  };
}
