import mysql from 'mysql2/promise';

const profissionalId = 570007;
const dataAtendimento = '2026-08-13';
const aplicar = process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;

// Cada atendimento sem série recebe uma guia própria. Atendimentos que compartilham
// serieId são agrupados somente dentro da mesma série, paciente, convênio e profissional.
const alvos = new Map([
  [1830556, { convenioId: 600002, procedimentoId: 600005 }],
  [3450041, { convenioId: 630007, procedimentoId: 600035 }],
  [1830560, { convenioId: 630007, procedimentoId: 600035 }],
  [1830562, { convenioId: 600002, procedimentoId: 600008 }],
  [1830565, { convenioId: 600005, procedimentoId: 600046 }],
  [4680002, { convenioId: 600002, procedimentoId: 600005 }],
  [1830574, { convenioId: 600002, procedimentoId: 600005 }],
  [1830580, { convenioId: 600005, procedimentoId: 600049 }],
  [3450138, { convenioId: 600005, procedimentoId: 600049 }],
  [3450153, { convenioId: 600005, procedimentoId: 600049 }],
  [1830585, { convenioId: 600005, procedimentoId: 600049 }],
  [3450168, { convenioId: 600005, procedimentoId: 600049 }],
  [3450183, { convenioId: 600005, procedimentoId: 600049 }],
  [1830595, { convenioId: 600005, procedimentoId: 600049 }],
  [3450218, { convenioId: 600005, procedimentoId: 600048 }],
  [1830601, { convenioId: 600005, procedimentoId: 600048 }],
  [1830604, { convenioId: 600002, procedimentoId: 600005 }],
]);

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está disponível para executar o processamento.');
}

const connection = await mysql.createConnection(databaseUrl);
const ids = [...alvos.keys()];
const placeholders = ids.map(() => '?').join(', ');

function chaveSerie(atendimentoId, serieId) {
  return serieId || `nayara-avulso-${atendimentoId}`;
}

function numeroGuia(atendimentoId) {
  return `NAY${String(atendimentoId).padStart(10, '0')}`;
}

try {
  const [linhas] = await connection.execute(
    `
      SELECT
        a.id AS atendimentoId,
        a.pacienteId,
        a.profissionalId,
        a.convenioId,
        a.serieId,
        a.data,
        a.hora,
        a.status,
        p.nome AS paciente,
        p.numeroCarteira,
        c.nome AS convenio,
        a.procedimentoConvenioId
      FROM atendimentos a
      JOIN pacientes p ON p.id = a.pacienteId
      JOIN convenios c ON c.id = a.convenioId
      WHERE a.id IN (${placeholders})
        AND a.profissionalId = ?
        AND a.data = ?
        AND a.guiaId IS NULL
        AND a.status NOT IN ('cancelado', 'falta')
      ORDER BY a.hora, a.id
    `,
    [...ids, profissionalId, dataAtendimento],
  );

  const encontrados = new Set(linhas.map((linha) => Number(linha.atendimentoId)));
  const ausentes = ids.filter((id) => !encontrados.has(id));
  const incompataveis = linhas.filter((linha) => {
    const alvo = alvos.get(Number(linha.atendimentoId));
    return !alvo || Number(linha.convenioId) !== alvo.convenioId;
  });
  if (ausentes.length || incompataveis.length) {
    throw new Error(`Validação interrompida. Ausentes: ${ausentes.join(', ') || 'nenhum'}; convênio incompatível: ${incompataveis.map((x) => x.atendimentoId).join(', ') || 'nenhum'}.`);
  }

  const procedimentoIds = [...new Set([...alvos.values()].map((alvo) => alvo.procedimentoId))];
  const [procedimentos] = await connection.execute(
    `
      SELECT
        pc.id AS procedimentoConvenioId,
        pc.convenioId,
        pc.codigoConvenio,
        COALESCE(pc.descricaoConvenio, tp.descricao) AS procedimento,
        CAST(pc.valor AS DECIMAL(10, 2)) AS valorUnitario
      FROM procedimentosPorConvenio pc
      LEFT JOIN tabelaProcedimentos tp ON tp.id = pc.tabelaProcedimentoId
      WHERE pc.id IN (${procedimentoIds.map(() => '?').join(', ')})
        AND pc.ativo = 1
    `,
    procedimentoIds,
  );
  const procedimentosPorId = new Map(procedimentos.map((item) => [Number(item.procedimentoConvenioId), item]));

  for (const linha of linhas) {
    const alvo = alvos.get(Number(linha.atendimentoId));
    const procedimento = procedimentosPorId.get(alvo.procedimentoId);
    if (!procedimento || Number(procedimento.convenioId) !== alvo.convenioId) {
      throw new Error(`Procedimento planejado indisponível ou incompatível para o atendimento ${linha.atendimentoId}.`);
    }
    Object.assign(linha, procedimento);
  }

  const grupos = new Map();
  for (const linha of linhas) {
    const serieId = chaveSerie(linha.atendimentoId, linha.serieId);
    const chave = `${linha.pacienteId}:${linha.profissionalId}:${linha.convenioId}:${serieId}:${linha.procedimentoConvenioId}`;
    if (!grupos.has(chave)) grupos.set(chave, { ...linha, serieId, atendimentos: [] });
    grupos.get(chave).atendimentos.push(linha);
  }

  console.log(`Atendimentos elegíveis: ${linhas.length}; guias independentes: ${grupos.size}; modo: ${aplicar ? 'APLICAR' : 'SIMULAÇÃO'}.`);
  console.table([...grupos.values()].map((grupo) => ({
    paciente: grupo.paciente,
    convenio: grupo.convenio,
    serieId: grupo.serieId,
    atendimentos: grupo.atendimentos.map((item) => item.atendimentoId).join(', '),
    procedimento: `${grupo.codigoConvenio} — ${grupo.procedimento}`,
    valorUnitario: Number(grupo.valorUnitario),
  })));

  if (!aplicar) process.exit(0);

  await connection.beginTransaction();
  const resultado = [];

  for (const grupo of grupos.values()) {
    const [guiasExistentes] = await connection.execute(
      'SELECT id, numeroGuia FROM guias WHERE serieId = ? LIMIT 1 FOR UPDATE',
      [grupo.serieId],
    );
    if (guiasExistentes.length) {
      const guia = guiasExistentes[0];
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, procedimentoConvenioId = ?
          WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
            AND guiaId IS NULL AND status NOT IN ('cancelado', 'falta')
        `,
        [guia.id, grupo.procedimentoConvenioId, grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
      resultado.push({ paciente: grupo.paciente, guiaId: guia.id, numeroGuia: guia.numeroGuia, status: 'vinculada à guia de série existente' });
      continue;
    }

    let totalSessoes = grupo.atendimentos.length;
    if (!String(grupo.serieId).startsWith('nayara-avulso-')) {
      const [sessoes] = await connection.execute(
        `
          SELECT COUNT(*) AS total
          FROM atendimentos
          WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
            AND status NOT IN ('cancelado', 'falta')
        `,
        [grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
      totalSessoes = Math.max(Number(sessoes[0].total || 0), grupo.atendimentos.length);
    }

    const base = grupo.atendimentos.reduce((menor, atual) => Number(atual.atendimentoId) < Number(menor.atendimentoId) ? atual : menor);
    const numeroDaGuia = numeroGuia(base.atendimentoId);
    const senha = `NAY${String(base.atendimentoId).padStart(8, '0').slice(-8)}`;
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
        numeroDaGuia, grupo.pacienteId, profissionalId, grupo.convenioId, base.atendimentoId,
        grupo.data, grupo.procedimento, valorTotal.toFixed(2), totalSessoes, totalSessoes, senha,
        grupo.numeroCarteira || null, numeroDaGuia, `INTERNO-${numeroDaGuia}`, grupo.serieId,
        totalSessoes, valorTotal.toFixed(2), valorTotal.toFixed(2),
      ],
    );
    const guiaId = insercao.insertId;

    if (String(grupo.serieId).startsWith('nayara-avulso-')) {
      await connection.execute(
        'UPDATE atendimentos SET guiaId = ?, serieId = ?, procedimentoConvenioId = ? WHERE id = ? AND guiaId IS NULL',
        [guiaId, grupo.serieId, grupo.procedimentoConvenioId, base.atendimentoId],
      );
    } else {
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, procedimentoConvenioId = ?
          WHERE pacienteId = ? AND profissionalId = ? AND convenioId = ? AND serieId = ?
            AND guiaId IS NULL AND status NOT IN ('cancelado', 'falta')
        `,
        [guiaId, grupo.procedimentoConvenioId, grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
    }
    resultado.push({
      paciente: grupo.paciente,
      guiaId,
      numeroGuia: numeroDaGuia,
      sessoes: totalSessoes,
      valorTotal: valorTotal.toFixed(2),
      status: 'criada e vinculada',
    });
  }

  await connection.commit();
  console.table(resultado);
  console.log(`Guias criadas: ${resultado.filter((item) => item.status === 'criada e vinculada').length}; vínculos existentes: ${resultado.filter((item) => item.status !== 'criada e vinculada').length}.`);
} catch (error) {
  await connection.rollback().catch(() => undefined);
  throw error;
} finally {
  await connection.end();
}
