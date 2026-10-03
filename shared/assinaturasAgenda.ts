export interface AtendimentoParaAssinatura {
  id: number;
  data: unknown;
  guiaId?: number | null;
  pacienteId?: number | null;
  profissionalId?: number | null;
  convenioId?: number | null;
  serieId?: string | null;
  status?: string | null;
  assinaturaDigitalObrigatoria?: boolean;
}

export interface GuiaParaAssinatura {
  id: number;
  atendimentoId?: number | null;
  pacienteId?: number | null;
  profissionalId?: number | null;
  convenioId?: number | null;
  serieId?: string | null;
  assinadoPaciente?: number | boolean | null;
  dataAssinaturaPaciente?: unknown;
  assinaturaPacienteUrl?: string | null;
}

export interface AssinaturaSadtParaAgenda {
  atendimentoId?: number | null;
  guiaId?: number | null;
  profissionalId?: number | null;
  dataSessao?: unknown;
  status?: string | null;
  assinaturaDataUrl?: string | null;
}

export interface AssinaturaGuiaParaAgenda {
  guiaId: number;
  pacienteId?: number | null;
  sessaoNumero?: number | null;
  datasAtendimento?: string | null;
  assinaturaPacienteUrl?: string | null;
  token?: string | null;
}

export interface StatusAssinaturasAgenda {
  assinados: Set<number>;
  pendentes: Set<number>;
}

/** Normaliza uma data de banco/JSON para YYYY-MM-DD sem alterar o fuso local. */
export function normalizeAgendaDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const data = value.trim();
    const dataBrasileira = data.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/);
    if (dataBrasileira) return `${dataBrasileira[3]}-${dataBrasileira[2]}-${dataBrasileira[1]}`;
    return data.split('T')[0].slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const parsed = new Date(value as string | number);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
}

function hasLegacySignature(signature: AssinaturaGuiaParaAgenda): boolean {
  return Boolean(signature.assinaturaPacienteUrl && signature.assinaturaPacienteUrl.trim().length > 0);
}

function hasLegacyPendingLink(signature: AssinaturaGuiaParaAgenda): boolean {
  return Boolean(signature.token && signature.token.trim().length > 0 && !hasLegacySignature(signature));
}

function hasGuideLevelSignature(guia: GuiaParaAssinatura): boolean {
  const assinatura = guia.assinadoPaciente === 1 || guia.assinadoPaciente === true;
  const possuiImagem = Boolean(guia.assinaturaPacienteUrl && guia.assinaturaPacienteUrl.trim().length > 0);
  return assinatura && possuiImagem && Boolean(normalizeAgendaDate(guia.dataAssinaturaPaciente));
}

function pertenceAoMesmoContexto(atendimento: AtendimentoParaAssinatura, guia: GuiaParaAssinatura): boolean {
  return atendimento.pacienteId === guia.pacienteId
    && atendimento.profissionalId === guia.profissionalId
    && atendimento.convenioId === guia.convenioId;
}

/** Determina se a guia também pertence à sessão por compartilharem a mesma série. */
function atendimentoPertenceAGuia(atendimento: AtendimentoParaAssinatura, guia: GuiaParaAssinatura): boolean {
  if (!pertenceAoMesmoContexto(atendimento, guia)) return false;

  // Uma série explícita é parte da identidade clínica da guia. Mesmo que um
  // vínculo histórico aponte para atendimentoId ou guiaId, nunca é permitido
  // reconhecer assinatura se os dois registros informarem séries distintas.
  const possuiSeriesDivergentes = Boolean(
    atendimento.serieId
      && guia.serieId
      && atendimento.serieId !== guia.serieId,
  );
  if (possuiSeriesDivergentes) return false;

  if (atendimento.guiaId === guia.id || atendimento.id === guia.atendimentoId) {
    return true;
  }
  return Boolean(
    atendimento.serieId
      && guia.serieId
      && atendimento.serieId === guia.serieId,
  );
}

function parseSignatureDates(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeAgendaDate).filter(Boolean);
  } catch {
    return [];
  }
}

function getLegacySessionAtendimentoIds(
  signature: AssinaturaGuiaParaAgenda,
  grupo: AtendimentoParaAssinatura[],
): number[] {
  const datas = parseSignatureDates(signature.datasAtendimento);
  if (datas.length > 0) {
    return grupo
      .filter(atendimento => datas.includes(normalizeAgendaDate(atendimento.data)))
      .map(atendimento => atendimento.id);
  }

  const indice = Number(signature.sessaoNumero) - 1;
  if (Number.isInteger(indice) && indice >= 0 && indice < grupo.length) {
    return [grupo[indice].id];
  }
  return grupo.length === 1 ? [grupo[0].id] : [];
}

/**
 * Algumas assinaturas legadas foram gravadas em uma guia sem serieId e sem o
 * guiaId correspondente no atendimento. Só podem ser reconciliadas quando a
 * assinatura declarar a data clínica e houver exatamente um atendimento sem
 * guia, no mesmo paciente, profissional, convênio e data. A unicidade evita
 * que uma assinatura destrave duas sessões ou uma guia diferente já vinculada.
 */
function getLegacyOrphanSessionAtendimentoIds(
  signature: AssinaturaGuiaParaAgenda,
  guia: GuiaParaAssinatura | undefined,
  atendimentos: AtendimentoParaAssinatura[],
): number[] {
  if (!guia) return [];

  const datas = parseSignatureDates(signature.datasAtendimento);
  if (datas.length === 0) return [];

  return datas.flatMap(dataSessao => {
    const candidatos = atendimentos.filter(atendimento => (
      atendimento.guiaId == null
      && normalizeAgendaDate(atendimento.data) === dataSessao
      && pertenceAoMesmoContexto(atendimento, guia)
      && !(
        atendimento.serieId
        && guia.serieId
        && atendimento.serieId !== guia.serieId
      )
    ));

    return candidatos.length === 1 ? [candidatos[0].id] : [];
  });
}

/**
 * Devolve os IDs assinados e pendentes por atendimento.
 * A regra prioritária é sempre o vínculo direto atendimentoId/dataSessao.
 * Para registros legados de assinaturasGuias, usa datasAtendimento e, quando
 * necessário, o número sequencial da sessão dentro da mesma guia.
 */
export function getAtendimentosComStatusAssinatura(
  atendimentos: AtendimentoParaAssinatura[],
  guias: GuiaParaAssinatura[],
  assinaturasSadt: AssinaturaSadtParaAgenda[],
  assinaturasGuias: AssinaturaGuiaParaAgenda[],
): StatusAssinaturasAgenda {
  const assinados = new Set<number>();
  const pendentes = new Set<number>();

  for (const assinatura of assinaturasSadt) {
    if (assinatura.atendimentoId == null) continue;
    const atendimento = atendimentos.find(item => item.id === assinatura.atendimentoId);
    const guiaDaAssinatura = assinatura.guiaId == null
      ? undefined
      : guias.find(guia => guia.id === assinatura.guiaId);
    const profissionalDaGuia = assinatura.guiaId == null
      ? undefined
      : guiaDaAssinatura?.profissionalId;
    const profissionalDaAssinatura = assinatura.profissionalId ?? profissionalDaGuia;
    const dataSessao = normalizeAgendaDate(assinatura.dataSessao);
    const dataAtendimento = normalizeAgendaDate(atendimento?.data);

    // Mesmo que um registro histórico carregue atendimentoId, o estado só pode
    // ser aplicado quando ele representa a mesma data do agendamento. Caso o
    // vínculo direto esteja defasado, a reconciliação pela guia/data abaixo
    // encontra exclusivamente a sessão correta.
    if (!atendimento
      || (dataSessao && dataSessao !== dataAtendimento)
      || (guiaDaAssinatura != null && !atendimentoPertenceAGuia(atendimento, guiaDaAssinatura))
      || (profissionalDaAssinatura != null
        && atendimento.profissionalId != null
        && profissionalDaAssinatura !== atendimento.profissionalId)) continue;

    if (assinatura.status === 'assinado' || assinatura.assinaturaDataUrl) {
      assinados.add(assinatura.atendimentoId);
      pendentes.delete(assinatura.atendimentoId);
    } else if (assinatura.status === 'pendente' && !assinados.has(assinatura.atendimentoId)) {
      pendentes.add(assinatura.atendimentoId);
    }
  }

  const atendimentosPorGuia = new Map<number, AtendimentoParaAssinatura[]>();
  for (const guia of guias) {
    const grupo = atendimentos
      .filter(atendimento => atendimentoPertenceAGuia(atendimento, guia))
      .sort((a, b) => normalizeAgendaDate(a.data).localeCompare(normalizeAgendaDate(b.data)));
    if (grupo.length > 0) atendimentosPorGuia.set(guia.id, grupo);
  }

  // Guias antigas podem conservar a assinatura digital no próprio cadastro da
  // guia, sem uma linha correspondente em assinaturasGuias. Esse comprovante
  // somente libera a sessão da mesma guia cuja data clínica seja exatamente a
  // data registrada na assinatura; ele jamais se propaga para a série inteira.
  for (const guia of guias) {
    if (!hasGuideLevelSignature(guia)) continue;
    const dataAssinatura = normalizeAgendaDate(guia.dataAssinaturaPaciente);
    const grupo = atendimentosPorGuia.get(guia.id) ?? [];
    grupo
      .filter(atendimento => normalizeAgendaDate(atendimento.data) === dataAssinatura)
      .forEach(atendimento => {
        assinados.add(atendimento.id);
        pendentes.delete(atendimento.id);
      });
  }

  // Algumas assinaturas SADT antigas não têm atendimentoId, mas preservam a guia
  // e a data da sessão. Nesses casos, associar somente à sessão correspondente.
  // Assinaturas SADT históricas podem não ter atendimentoId e seus atendimentos
  // podem ainda não estar vinculados à guia. Nesses casos, a associação é feita
  // somente pela mesma guia ou pelo contexto exato (paciente, profissional,
  // convênio e data da sessão), sem propagar o status para a série inteira.
  for (const assinatura of assinaturasSadt) {
    const atendimentoDireto = assinatura.atendimentoId != null
      ? atendimentos.find(atendimento => atendimento.id === assinatura.atendimentoId)
      : undefined;
    const dataSessao = normalizeAgendaDate(assinatura.dataSessao);
    const dataDoVinculoDireto = normalizeAgendaDate(atendimentoDireto?.data);
    const possuiVinculoDiretoNaMesmaData = atendimentoDireto != null
      && (!dataSessao || dataSessao === dataDoVinculoDireto);
    if (possuiVinculoDiretoNaMesmaData || assinatura.guiaId == null) continue;
    const guiaDaAssinatura = guias.find(guia => guia.id === assinatura.guiaId);
    const grupo = atendimentosPorGuia.get(assinatura.guiaId) ?? [];
    const idsDaGuia = dataSessao
      ? grupo.filter(atendimento => normalizeAgendaDate(atendimento.data) === dataSessao).map(atendimento => atendimento.id)
      : [];
    const idsPorContexto = dataSessao && guiaDaAssinatura
      ? atendimentos
        .filter(atendimento => normalizeAgendaDate(atendimento.data) === dataSessao && atendimentoPertenceAGuia(atendimento, guiaDaAssinatura))
        .map(atendimento => atendimento.id)
      : [];
    const ids = idsDaGuia.length > 0 ? idsDaGuia : idsPorContexto;

    if (assinatura.status === "assinado" || assinatura.assinaturaDataUrl) {
      ids.forEach(id => {
        assinados.add(id);
        pendentes.delete(id);
      });
    } else if (assinatura.status === "pendente") {
      ids.forEach(id => {
        if (!assinados.has(id)) pendentes.add(id);
      });
    }
  }

  for (const assinatura of assinaturasGuias) {
    const grupo = atendimentosPorGuia.get(assinatura.guiaId) ?? [];
    const guiaDaAssinatura = guias.find(guia => guia.id === assinatura.guiaId);
    const idsDaGuia = grupo.length > 0
      ? getLegacySessionAtendimentoIds(assinatura, grupo)
      : [];
    const ids = idsDaGuia.length > 0
      ? idsDaGuia
      : getLegacyOrphanSessionAtendimentoIds(assinatura, guiaDaAssinatura, atendimentos);

    if (hasLegacySignature(assinatura)) {
      ids.forEach(id => {
        assinados.add(id);
        pendentes.delete(id);
      });
    } else if (hasLegacyPendingLink(assinatura)) {
      ids.forEach(id => {
        if (!assinados.has(id)) pendentes.add(id);
      });
    }
  }

  // Uma assinatura concluída sempre prevalece sobre qualquer link pendente
  // histórico da mesma sessão, independentemente da ordem de leitura do banco.
  assinados.forEach(id => pendentes.delete(id));

  // Guias de convênios que usam assinatura digital devem permanecer visíveis
  // como pendentes desde a criação da guia, mesmo antes do primeiro link ser
  // enviado. Isso cobre as guias Bradesco sem token inicial e não inclui os
  // convênios de assinatura física.
  for (const atendimento of atendimentos) {
    if (atendimento.assinaturaDigitalObrigatoria !== true) continue;
    if (atendimento.status === 'cancelado' || assinados.has(atendimento.id)) continue;
    const possuiGuia = atendimento.guiaId != null
      || guias.some(guia => atendimentoPertenceAGuia(atendimento, guia));
    if (possuiGuia) pendentes.add(atendimento.id);
  }

  // Convênios de guia física jamais devem apresentar pendência de assinatura
  // digital, inclusive quando existirem registros históricos de links pendentes.
  for (const atendimento of atendimentos) {
    if (atendimento.assinaturaDigitalObrigatoria !== false) continue;
    pendentes.delete(atendimento.id);
  }

  return { assinados, pendentes };
}

/** Compatibilidade para consumidores que precisam somente dos assinados. */
export function getAtendimentosComAssinatura(
  atendimentos: AtendimentoParaAssinatura[],
  guias: GuiaParaAssinatura[],
  assinaturasSadt: AssinaturaSadtParaAgenda[],
  assinaturasGuias: AssinaturaGuiaParaAgenda[],
): Set<number> {
  return getAtendimentosComStatusAssinatura(
    atendimentos,
    guias,
    assinaturasSadt,
    assinaturasGuias,
  ).assinados;
}
