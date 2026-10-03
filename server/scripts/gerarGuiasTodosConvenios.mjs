import mysql from 'mysql2/promise';
import { writeFile } from 'node:fs/promises';
import { avaliarElegibilidadeGuia } from '../../shared/guiaConvenioElegibilidade.mjs';

const aplicar = process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;
const reportPath = new URL('../../relatorio_guias_todos_convenios.json', import.meta.url);

if (!databaseUrl) throw new Error('DATABASE_URL não está disponível.');

const normalizarDinheiro = (valor) => Number.parseFloat(String(valor ?? 0)) || 0;
const dataDaLinha = (valor) => {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    return valor.toISOString().slice(0, 10);
  }
  const texto = String(valor ?? '');
  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? texto.slice(0, 10) : data.toISOString().slice(0, 10);
};
const isParticular = (nome) => String(nome ?? '').toLocaleLowerCase('pt-BR').includes('particular');
const isAvulso = (serieId) => !serieId;

const connection = await mysql.createConnection(databaseUrl);
let transacaoAberta = false;

try {
  const [candidatos] = await connection.execute(`
    SELECT
      a.id AS atendimentoId,
      a.pacienteId,
      a.profissionalId,
      a.convenioId,
      a.serieId,
      a.data,
      a.procedimentoConvenioId,
      p.numeroCarteira,
      c.nome AS convenio,
      pc.codigoConvenio,
      COALESCE(pc.descricaoConvenio, tp.descricao) AS procedimento,
      pc.valor AS valorUnitario
    FROM atendimentos a
    JOIN pacientes p ON p.id = a.pacienteId
    JOIN convenios c ON c.id = a.convenioId
    LEFT JOIN procedimentosPorConvenio pc ON pc.id = a.procedimentoConvenioId
    LEFT JOIN tabelaProcedimentos tp ON tp.id = pc.tabelaProcedimentoId
    WHERE a.status = 'realizado'
      AND a.prontuarioFeito = 1
      AND a.guiaId IS NULL
    ORDER BY a.convenioId, a.pacienteId, a.profissionalId, a.serieId, a.id
  `);

  const grupos = new Map();
  for (const item of candidatos) {
    if (isParticular(item.convenio)) continue;
    const chave = isAvulso(item.serieId)
      ? `avulso:${item.atendimentoId}`
      : `serie:${item.convenioId}:${item.pacienteId}:${item.profissionalId}:${item.serieId}`;
    if (!grupos.has(chave)) grupos.set(chave, { chave, base: item, candidatos: [] });
    grupos.get(chave).candidatos.push(item);
  }

  const processaveis = [];
  const bloqueados = [];

  for (const grupo of grupos.values()) {
    const base = grupo.base;
    let sessoes = grupo.candidatos;
    let guiaExistente = null;
    if (!isAvulso(base.serieId)) {
      const [daSerie] = await connection.execute(`
        SELECT a.id, a.guiaId, a.procedimentoConvenioId, a.status,
          pc.valor AS valorUnitario,
          COALESCE(pc.descricaoConvenio, tp.descricao) AS procedimento
        FROM atendimentos a
        LEFT JOIN procedimentosPorConvenio pc ON pc.id = a.procedimentoConvenioId
        LEFT JOIN tabelaProcedimentos tp ON tp.id = pc.tabelaProcedimentoId
        WHERE a.convenioId = ? AND a.pacienteId = ? AND a.profissionalId = ?
          AND a.serieId = ? AND a.status NOT IN ('cancelado', 'falta')
      `, [base.convenioId, base.pacienteId, base.profissionalId, base.serieId]);
      sessoes = daSerie;
      const guiaIds = [...new Set(daSerie.map((x) => x.guiaId).filter(Boolean))];
      if (guiaIds.length > 1) {
        bloqueados.push({ convenio: base.convenio, atendimentoIds: grupo.candidatos.map((x) => x.atendimentoId), serieId: base.serieId, motivo: 'Série possui mais de uma guia vinculada.' });
        continue;
      }
      if (guiaIds.length === 1) guiaExistente = guiaIds[0];
    }

    const elegibilidade = avaliarElegibilidadeGuia({ numeroCarteira: base.numeroCarteira, sessoes });
    if (!elegibilidade.processavel) {
      bloqueados.push({ convenio: base.convenio, atendimentoIds: grupo.candidatos.map((x) => x.atendimentoId), serieId: base.serieId || null, motivo: elegibilidade.motivo });
      continue;
    }

    processaveis.push({
      ...grupo,
      sessoes,
      guiaExistente,
      procedimentoId: elegibilidade.procedimentoId,
      procedimento: elegibilidade.procedimento,
      valorUnitario: elegibilidade.valorUnitario,
      totalSessoes: sessoes.length,
    });
  }

  const relatorio = {
    modo: aplicar ? 'aplicar' : 'simulacao',
    geradoEm: new Date().toISOString(),
    atendimentosCandidatos: candidatos.length,
    gruposProcessaveis: processaveis.length,
    gruposBloqueados: bloqueados.length,
    bloqueados,
    processaveis: processaveis.map((g) => ({
      convenio: g.base.convenio,
      convenioId: g.base.convenioId,
      atendimentoIds: g.candidatos.map((x) => x.atendimentoId),
      serieId: g.base.serieId || null,
      guiaExistente: g.guiaExistente,
      procedimento: g.procedimento,
      valorUnitario: g.valorUnitario,
      totalSessoes: g.totalSessoes,
    })),
  };

  if (!aplicar) {
    await writeFile(reportPath, JSON.stringify(relatorio, null, 2));
    console.log(JSON.stringify({ ...relatorio, processaveis: relatorio.processaveis.slice(0, 20) }, null, 2));
    process.exit(0);
  }

  await connection.beginTransaction();
  transacaoAberta = true;
  const criadas = [];
  const vinculadas = [];

  for (const grupo of processaveis) {
    const base = grupo.base;
    const atendimentoBaseId = Math.min(...grupo.candidatos.map((x) => Number(x.atendimentoId)));
    const serieId = base.serieId || `convenio-${base.convenioId}-avulso-${atendimentoBaseId}`;
    let guiaId = grupo.guiaExistente;

    if (!guiaId) {
      const numeroGuia = `G${base.convenioId}-${String(atendimentoBaseId).padStart(10, '0')}`;
      const senha = `S${base.convenioId}-${String(atendimentoBaseId).padStart(8, '0')}`;
      const valorTotal = grupo.valorUnitario * grupo.totalSessoes;
      const [insert] = await connection.execute(`
        INSERT INTO guias (
          numeroGuia, pacienteId, profissionalId, convenioId, atendimentoId, dataEmissao,
          procedimento, valor, status, totalSessoes, saldoSessoes, senhaAutorizacao,
          numeroCarteira, numeroGuiaPrincipal, numeroGuiaInterno, serieId, serieNumero,
          serieSessaoInicio, serieSessaoFim, valorProcedimentos, valorTotalGeral
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
      `, [
        numeroGuia, base.pacienteId, base.profissionalId, base.convenioId, atendimentoBaseId,
        dataDaLinha(base.data), grupo.procedimento, valorTotal.toFixed(2), grupo.totalSessoes,
        grupo.totalSessoes, senha, base.numeroCarteira, numeroGuia, `INTERNO-${numeroGuia}`,
        serieId, grupo.totalSessoes, valorTotal.toFixed(2), valorTotal.toFixed(2),
      ]);
      guiaId = insert.insertId;
      criadas.push({ convenio: base.convenio, guiaId, numeroGuia, serieId, sessoes: grupo.totalSessoes, valorTotal: valorTotal.toFixed(2) });
    }

    if (isAvulso(base.serieId)) {
      await connection.execute(`
        UPDATE atendimentos
        SET guiaId = ?, serieId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?)
        WHERE id = ? AND guiaId IS NULL
      `, [guiaId, serieId, grupo.procedimentoId, atendimentoBaseId]);
    } else {
      await connection.execute(`
        UPDATE atendimentos
        SET guiaId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?)
        WHERE convenioId = ? AND pacienteId = ? AND profissionalId = ?
          AND serieId = ? AND guiaId IS NULL AND status NOT IN ('cancelado', 'falta')
      `, [guiaId, grupo.procedimentoId, base.convenioId, base.pacienteId, base.profissionalId, base.serieId]);
    }
    vinculadas.push({ convenio: base.convenio, guiaId, atendimentoIds: grupo.candidatos.map((x) => x.atendimentoId) });
  }

  await connection.commit();
  transacaoAberta = false;
  const relatorioFinal = { ...relatorio, criadas, vinculadas };
  await writeFile(reportPath, JSON.stringify(relatorioFinal, null, 2));
  console.log(JSON.stringify({ criadas: criadas.length, vinculadas: vinculadas.length, bloqueados }, null, 2));
  process.exit(0);
} catch (error) {
  if (transacaoAberta) await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end().catch(() => undefined);
}
