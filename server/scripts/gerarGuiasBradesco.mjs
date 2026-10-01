import mysql from 'mysql2/promise';

const convenioId = 600002;
const aplicar = process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está disponível para executar o processamento.');
}

const connection = await mysql.createConnection(databaseUrl);

try {
  const [rows] = await connection.execute(`
    SELECT
      a.id AS atendimentoId,
      a.pacienteId,
      a.profissionalId,
      a.serieId,
      a.data,
      a.hora,
      a.procedimentoConvenioId,
      p.numeroCarteira,
      pc.codigoConvenio,
      COALESCE(pc.descricaoConvenio, tp.descricao) AS procedimento,
      CAST(pc.valor AS DECIMAL(10,2)) AS valorUnitario
    FROM atendimentos a
    JOIN pacientes p ON p.id = a.pacienteId
    JOIN procedimentosPorConvenio pc ON pc.id = a.procedimentoConvenioId
    LEFT JOIN tabelaProcedimentos tp ON tp.id = pc.tabelaProcedimentoId
    WHERE a.convenioId = ?
      AND a.status = 'realizado'
      AND a.prontuarioFeito = 1
      AND a.guiaId IS NULL
      AND a.procedimentoConvenioId IS NOT NULL
    ORDER BY a.pacienteId, a.profissionalId, a.serieId, a.id
  `, [convenioId]);

  const grupos = new Map();
  for (const row of rows) {
    const serieId = row.serieId || `bradesco-avulso-${row.atendimentoId}`;
    const chave = `${row.pacienteId}:${row.profissionalId}:${serieId}:${row.procedimentoConvenioId}`;
    if (!grupos.has(chave)) grupos.set(chave, { ...row, serieId, atendimentos: [] });
    grupos.get(chave).atendimentos.push(row.atendimentoId);
  }

  console.log(`Atendimentos elegíveis: ${rows.length}; grupos de guia: ${grupos.size}; modo: ${aplicar ? 'APLICAR' : 'SIMULAÇÃO'}.`);
  console.table([...grupos.values()].map((g) => ({
    pacienteId: g.pacienteId,
    profissionalId: g.profissionalId,
    serieId: g.serieId,
    procedimento: g.procedimento,
    valorUnitario: Number(g.valorUnitario),
    atendimentosConcluidos: g.atendimentos.length,
  })));

  if (!aplicar) process.exit(0);

  await connection.beginTransaction();
  const resultado = [];

  for (const grupo of grupos.values()) {
    const [jaExiste] = await connection.execute(
      'SELECT id FROM guias WHERE serieId = ? LIMIT 1 FOR UPDATE',
      [grupo.serieId],
    );
    if (jaExiste.length > 0) {
      resultado.push({ serieId: grupo.serieId, status: 'ignorada: guia já existente' });
      continue;
    }

    let sessoesDaSerie = grupo.atendimentos.length;
    if (!String(grupo.serieId).startsWith('bradesco-avulso-')) {
      const [contagem] = await connection.execute(`
        SELECT COUNT(*) AS total
        FROM atendimentos
        WHERE convenioId = ? AND pacienteId = ? AND profissionalId = ?
          AND serieId = ? AND status NOT IN ('cancelado', 'falta')
      `, [convenioId, grupo.pacienteId, grupo.profissionalId, grupo.serieId]);
      sessoesDaSerie = Math.max(Number(contagem[0].total || 0), grupo.atendimentos.length);
    }

    const atendimentoBaseId = Math.min(...grupo.atendimentos.map(Number));
    const numeroGuia = `BRD${String(atendimentoBaseId).padStart(10, '0')}`;
    const senha = `BRD${String(atendimentoBaseId).padStart(8, '0').slice(-8)}`;
    const valorTotal = Number(grupo.valorUnitario) * sessoesDaSerie;

    const [insert] = await connection.execute(`
      INSERT INTO guias (
        numeroGuia, pacienteId, profissionalId, convenioId, atendimentoId, dataEmissao,
        procedimento, valor, status, totalSessoes, saldoSessoes, senhaAutorizacao,
        numeroCarteira, numeroGuiaPrincipal, numeroGuiaInterno, serieId, serieNumero,
        serieSessaoInicio, serieSessaoFim, valorProcedimentos, valorTotalGeral
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
    `, [
      numeroGuia,
      grupo.pacienteId,
      grupo.profissionalId,
      convenioId,
      atendimentoBaseId,
      grupo.data,
      grupo.procedimento,
      valorTotal.toFixed(2),
      sessoesDaSerie,
      sessoesDaSerie,
      senha,
      grupo.numeroCarteira || null,
      numeroGuia,
      `INTERNO-${numeroGuia}`,
      grupo.serieId,
      sessoesDaSerie,
      valorTotal.toFixed(2),
      valorTotal.toFixed(2),
    ]);

    const guiaId = insert.insertId;
    if (String(grupo.serieId).startsWith('bradesco-avulso-')) {
      await connection.execute(`
        UPDATE atendimentos
        SET guiaId = ?, serieId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?)
        WHERE id = ? AND guiaId IS NULL
      `, [guiaId, grupo.serieId, grupo.procedimentoConvenioId, atendimentoBaseId]);
    } else {
      await connection.execute(`
        UPDATE atendimentos
        SET guiaId = ?, procedimentoConvenioId = COALESCE(procedimentoConvenioId, ?)
        WHERE convenioId = ? AND pacienteId = ? AND profissionalId = ?
          AND serieId = ? AND guiaId IS NULL AND status NOT IN ('cancelado', 'falta')
      `, [
        guiaId,
        grupo.procedimentoConvenioId,
        convenioId,
        grupo.pacienteId,
        grupo.profissionalId,
        grupo.serieId,
      ]);
    }

    resultado.push({
      serieId: grupo.serieId,
      guiaId,
      numeroGuia,
      procedimento: grupo.procedimento,
      sessoes: sessoesDaSerie,
      valorTotal: valorTotal.toFixed(2),
    });
  }

  await connection.commit();
  console.table(resultado);
  console.log(`Guias criadas: ${resultado.filter((item) => item.guiaId).length}; ignoradas: ${resultado.filter((item) => !item.guiaId).length}.`);
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
