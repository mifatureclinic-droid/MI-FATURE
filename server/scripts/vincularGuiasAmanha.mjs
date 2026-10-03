import mysql from 'mysql2/promise';
import { writeFile } from 'node:fs/promises';

const aplicar = process.argv.includes('--apply');
const escopoArg = process.argv.find((arg) => arg.startsWith('--profissionais='));
const dataArg = process.argv.find((arg) => arg.startsWith('--data='));
const dataAtendimento = String(dataArg?.split('=').slice(1).join('=') || '2026-08-14').trim();
const profissionalIds = String(escopoArg?.split('=').slice(1).join('=') || '')
  .split(',')
  .map((id) => Number(id.trim()))
  .filter((id) => Number.isInteger(id) && id > 0);
const databaseUrl = process.env.DATABASE_URL;
const sufixoData = dataAtendimento.replaceAll('-', '');
const prefixoAvulso = `programacao-${sufixoData}-avulso-`;
const reportPath = new URL(`../../relatorio_guias_${dataAtendimento}.json`, import.meta.url);

if (!databaseUrl) throw new Error('DATABASE_URL não está disponível.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(dataAtendimento)) throw new Error('Informe --data=AAAA-MM-DD.');
if (aplicar && profissionalIds.length === 0) {
  throw new Error('Vinculação bloqueada: informe --profissionais=<ids> para selecionar explicitamente os profissionais.');
}

const connection = await mysql.createConnection(databaseUrl);

const isParticular = (convenio) => /particular/i.test(String(convenio ?? ''));
const serieDaGuia = (atendimentoId, serieId) => serieId || `${prefixoAvulso}${atendimentoId}`;
const numeroGuia = (atendimentoId) => `AMN${String(atendimentoId).padStart(10, '0')}`;

async function buscarProcedimento(id) {
  const [rows] = await connection.execute(
    `
      SELECT pc.id AS procedimentoConvenioId, pc.convenioId, pc.codigoConvenio,
        COALESCE(pc.descricaoConvenio, tp.descricao) AS procedimento,
        CAST(pc.valor AS DECIMAL(10, 2)) AS valorUnitario
      FROM procedimentosPorConvenio pc
      LEFT JOIN tabelaProcedimentos tp ON tp.id = pc.tabelaProcedimentoId
      WHERE pc.id = ? AND pc.ativo = 1
      LIMIT 1
    `,
    [id],
  );
  return rows[0] || null;
}

async function resolverProcedimento(item) {
  if (item.procedimentoConvenioId) {
    const procedimento = await buscarProcedimento(item.procedimentoConvenioId);
    return procedimento && Number(procedimento.convenioId) === Number(item.convenioId)
      ? { procedimento, origem: 'atendimento' }
      : { bloqueio: 'Procedimento do atendimento está inativo ou não pertence ao convênio.' };
  }

  if (item.serieId) {
    const [referenciasSerie] = await connection.execute(
      `
        SELECT DISTINCT procedimentoConvenioId
        FROM atendimentos
        WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
          AND procedimentoConvenioId IS NOT NULL
      `,
      [item.pacienteId, item.profissionalId, item.convenioId, item.serieId],
    );
    if (referenciasSerie.length === 1) {
      const procedimento = await buscarProcedimento(referenciasSerie[0].procedimentoConvenioId);
      if (procedimento && Number(procedimento.convenioId) === Number(item.convenioId)) {
        return { procedimento, origem: 'série' };
      }
    }
    if (referenciasSerie.length > 1) {
      return { bloqueio: 'Série possui mais de um procedimento e exige revisão.' };
    }
  }

  const [historico] = await connection.execute(
    `
      SELECT DISTINCT procedimentoConvenioId
      FROM atendimentos
      WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ?
        AND data < ? AND procedimentoConvenioId IS NOT NULL
    `,
    [item.pacienteId, item.profissionalId, item.convenioId, dataAtendimento],
  );
  if (historico.length === 1) {
    const procedimento = await buscarProcedimento(historico[0].procedimentoConvenioId);
    if (procedimento && Number(procedimento.convenioId) === Number(item.convenioId)) {
      return { procedimento, origem: 'histórico único' };
    }
  }
  if (historico.length > 1) return { bloqueio: 'Histórico do paciente possui procedimentos distintos.' };
  return { bloqueio: 'Sem procedimento no atendimento, na série ou no histórico anterior.' };
}

try {
  const filtroProfissionais = profissionalIds.length > 0
    ? ` AND a.profissionalId IN (${profissionalIds.map(() => '?').join(', ')})`
    : '';
  const [candidatos] = await connection.execute(
    `
      SELECT
        a.id AS atendimentoId, a.pacienteId, a.profissionalId, a.convenioId, a.serieId,
        a.data, a.hora, a.procedimentoConvenioId,
        p.nome AS paciente, p.numeroCarteira,
        pr.nome AS profissional, c.nome AS convenio
      FROM atendimentos a
      JOIN pacientes p ON p.id = a.pacienteId
      JOIN profissionais pr ON pr.id = a.profissionalId
      JOIN convenios c ON c.id = a.convenioId
      WHERE a.data = ? AND a.status NOT IN ('cancelado', 'falta') AND a.guiaId IS NULL${filtroProfissionais}
      ORDER BY pr.nome, a.hora, a.id
    `,
    [dataAtendimento, ...profissionalIds],
  );

  const preparados = [];
  const bloqueados = [];
  for (const candidato of candidatos) {
    if (!isParticular(candidato.convenio) && (!candidato.numeroCarteira || String(candidato.numeroCarteira).trim() === '-')) {
      bloqueados.push({ atendimentoId: candidato.atendimentoId, paciente: candidato.paciente, profissional: candidato.profissional, convenio: candidato.convenio, motivo: 'Paciente sem número de carteirinha.' });
      continue;
    }
    const resolucao = await resolverProcedimento(candidato);
    if (resolucao.bloqueio) {
      bloqueados.push({ atendimentoId: candidato.atendimentoId, paciente: candidato.paciente, profissional: candidato.profissional, convenio: candidato.convenio, motivo: resolucao.bloqueio });
      continue;
    }
    if (!resolucao.procedimento.procedimento || Number(resolucao.procedimento.valorUnitario) <= 0) {
      bloqueados.push({ atendimentoId: candidato.atendimentoId, paciente: candidato.paciente, profissional: candidato.profissional, convenio: candidato.convenio, motivo: 'Procedimento sem descrição ou valor válido.' });
      continue;
    }
    preparados.push({ ...candidato, ...resolucao.procedimento, origemProcedimento: resolucao.origem });
  }

  const grupos = new Map();
  for (const item of preparados) {
    const serieId = serieDaGuia(item.atendimentoId, item.serieId);
    const chave = `${item.pacienteId}:${item.profissionalId}:${item.convenioId}:${serieId}`;
    if (!grupos.has(chave)) grupos.set(chave, { ...item, serieId, atendimentos: [] });
    grupos.get(chave).atendimentos.push(item);
  }

  const processaveis = [];
  for (const grupo of grupos.values()) {
    const procedimentos = [...new Set(grupo.atendimentos.map((item) => Number(item.procedimentoConvenioId)))];
    if (procedimentos.length !== 1) {
      bloqueados.push({ atendimentoIds: grupo.atendimentos.map((item) => item.atendimentoId), paciente: grupo.paciente, profissional: grupo.profissional, convenio: grupo.convenio, motivo: 'Atendimentos da mesma série possuem procedimentos diferentes.' });
      continue;
    }
    processaveis.push(grupo);
  }

  const relatorio = {
    data: dataAtendimento,
    modo: aplicar ? 'aplicar' : 'simulacao',
    profissionaisSelecionados: profissionalIds,
    atendimentosEncontrados: candidatos.length,
    atendimentosElegiveis: processaveis.reduce((total, grupo) => total + grupo.atendimentos.length, 0),
    gruposElegiveis: processaveis.length,
    bloqueados,
    grupos: processaveis.map((grupo) => ({
      paciente: grupo.paciente,
      profissional: grupo.profissional,
      convenio: grupo.convenio,
      serieId: grupo.serieId,
      atendimentoIds: grupo.atendimentos.map((item) => item.atendimentoId),
      procedimento: `${grupo.codigoConvenio} — ${grupo.procedimento}`,
      valorUnitario: Number(grupo.valorUnitario),
      origemProcedimento: [...new Set(grupo.atendimentos.map((item) => item.origemProcedimento))].join(', '),
    })),
  };

  console.log(JSON.stringify({ ...relatorio, grupos: relatorio.grupos.slice(0, 25), bloqueados: relatorio.bloqueados.slice(0, 25) }, null, 2));
  if (!aplicar) {
    await writeFile(reportPath, JSON.stringify(relatorio, null, 2));
    process.exit(0);
  }

  await connection.beginTransaction();
  const criadas = [];
  const vinculadas = [];
  for (const grupo of processaveis) {
    const [guiasExistentes] = await connection.execute(
      'SELECT id, numeroGuia FROM guias WHERE serieId = ? LIMIT 1 FOR UPDATE',
      [grupo.serieId],
    );
    let guiaId = guiasExistentes[0]?.id;
    let numeroDaGuia = guiasExistentes[0]?.numeroGuia;
    const procedimentoId = Number(grupo.procedimentoConvenioId);

    if (!guiaId) {
      let totalSessoes = grupo.atendimentos.length;
      if (!String(grupo.serieId).startsWith(prefixoAvulso)) {
        const [contagem] = await connection.execute(
          `
            SELECT COUNT(*) AS total FROM atendimentos
            WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
              AND status NOT IN ('cancelado', 'falta')
          `,
          [grupo.pacienteId, grupo.profissionalId, grupo.convenioId, grupo.serieId],
        );
        totalSessoes = Math.max(Number(contagem[0].total || 0), grupo.atendimentos.length);
      }
      const base = grupo.atendimentos.reduce((menor, atual) => Number(atual.atendimentoId) < Number(menor.atendimentoId) ? atual : menor);
      numeroDaGuia = numeroGuia(base.atendimentoId);
      const senha = `AMN${String(base.atendimentoId).padStart(8, '0').slice(-8)}`;
      const valorTotal = Number(grupo.valorUnitario) * totalSessoes;
      const [insercao] = await connection.execute(
        `
          INSERT INTO guias (
            numeroGuia, pacienteId, profissionalId, convenioId, atendimentoId, dataEmissao,
            procedimento, valor, status, totalSessoes, saldoSessoes, senhaAutorizacao,
            numeroCarteira, numeroGuiaPrincipal, numeroGuiaInterno, serieId, serieNumero,
            serieSessaoInicio, serieSessaoFim, valorProcedimentos, valorTotalGeral
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
        `,
        [
          numeroDaGuia, grupo.pacienteId, grupo.profissionalId, grupo.convenioId, base.atendimentoId,
          grupo.data, grupo.procedimento, valorTotal.toFixed(2), totalSessoes, totalSessoes, senha,
          grupo.numeroCarteira || null, numeroDaGuia, `INTERNO-${numeroDaGuia}`, grupo.serieId,
          totalSessoes, valorTotal.toFixed(2), valorTotal.toFixed(2),
        ],
      );
      guiaId = insercao.insertId;
      criadas.push({ guiaId, numeroGuia: numeroDaGuia, paciente: grupo.paciente, profissional: grupo.profissional, sessoes: totalSessoes, valorTotal: valorTotal.toFixed(2) });
    }

    if (String(grupo.serieId).startsWith(prefixoAvulso)) {
      const base = grupo.atendimentos[0];
      await connection.execute(
        'UPDATE atendimentos SET guiaId = ?, serieId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?) WHERE id = ? AND guiaId IS NULL',
        [guiaId, grupo.serieId, procedimentoId, base.atendimentoId],
      );
    } else {
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?)
          WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
            AND guiaId IS NULL AND status NOT IN ('cancelado', 'falta')
        `,
        [guiaId, procedimentoId, grupo.pacienteId, grupo.profissionalId, grupo.convenioId, grupo.serieId],
      );
    }
    vinculadas.push({ guiaId, numeroGuia: numeroDaGuia, paciente: grupo.paciente, profissional: grupo.profissional, atendimentoIds: grupo.atendimentos.map((item) => item.atendimentoId) });
  }

  await connection.commit();
  const resultado = { ...relatorio, criadas, vinculadas };
  await writeFile(reportPath, JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify({ guiasCriadas: criadas.length, gruposVinculados: vinculadas.length, atendimentosBloqueados: bloqueados.length, relatorio: reportPath.pathname }, null, 2));
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
