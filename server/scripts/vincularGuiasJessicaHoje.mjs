import mysql from 'mysql2/promise';

const profissionalId = 570008;
const dataAtendimento = '2026-08-13';
const aplicar = process.argv.includes('--apply');
const databaseUrl = process.env.DATABASE_URL;

const alvos = new Map([
  [1830563, { convenioId: 600002, procedimentoId: 600005 }],
  [1830571, { convenioId: 600002, procedimentoId: 600005 }],
  [1830573, { convenioId: 600002, procedimentoId: 600005 }],
  [1830589, { convenioId: 600002, procedimentoId: 600005 }],
  [1830593, { convenioId: 600002, procedimentoId: 600005 }],
  [1830600, { convenioId: 600002, procedimentoId: 600005 }],
  [1830603, { convenioId: 630005, procedimentoId: 1020002 }],
  [1830606, { convenioId: 600005, procedimentoId: 600049 }],
  [1830612, { convenioId: 600005, procedimentoId: 600049 }],
  [1830614, { convenioId: 600002, procedimentoId: 600005 }],
  [1830618, { convenioId: 600005, procedimentoId: 600049 }],
]);

if (!databaseUrl) {
  throw new Error('DATABASE_URL não está disponível para executar o processamento.');
}

const connection = await mysql.createConnection(databaseUrl);

function serieIsolada(atendimentoId, serieId) {
  return serieId || `jessica-avulso-${atendimentoId}`;
}

function numeroGuia(atendimentoId) {
  return `JES${String(atendimentoId).padStart(10, '0')}`;
}

try {
  const ids = [...alvos.keys()];
  const placeholders = ids.map(() => '?').join(', ');
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
  const invalidos = linhas.filter((linha) => {
    const esperado = alvos.get(Number(linha.atendimentoId));
    return !esperado || Number(linha.convenioId) !== esperado.convenioId;
  });

  if (ausentes.length > 0 || invalidos.length > 0) {
    throw new Error(`Validação interrompida. Ausentes: ${ausentes.join(', ') || 'nenhum'}; incompatíveis: ${invalidos.map((linha) => linha.atendimentoId).join(', ') || 'nenhum'}.`);
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
  const procedimentosPorId = new Map(procedimentos.map((procedimento) => [Number(procedimento.procedimentoConvenioId), procedimento]));

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
    const serieId = serieIsolada(linha.atendimentoId, linha.serieId);
    const chave = `${linha.pacienteId}:${linha.profissionalId}:${linha.convenioId}:${serieId}:${linha.procedimentoConvenioId}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, { ...linha, serieId, atendimentos: [linha] });
    } else {
      grupos.get(chave).atendimentos.push(linha);
    }
  }

  console.log(`Atendimentos elegíveis: ${linhas.length}; grupos independentes: ${grupos.size}; modo: ${aplicar ? 'APLICAR' : 'SIMULAÇÃO'}.`);
  console.table([...grupos.values()].map((grupo) => ({
    paciente: grupo.paciente,
    convenio: grupo.convenio,
    serieId: grupo.serieId,
    atendimentos: grupo.atendimentos.map((atendimento) => atendimento.atendimentoId).join(', '),
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

    let guiaId;
    let numeroDaGuia;
    let sessoesDaSerie = grupo.atendimentos.length;

    if (guiasExistentes.length > 0) {
      guiaId = guiasExistentes[0].id;
      numeroDaGuia = guiasExistentes[0].numeroGuia;
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, procedimentoConvenioId = ?
          WHERE pacienteId = ?
            AND profissionalId = ?
            AND convenioId = ?
            AND serieId = ?
            AND guiaId IS NULL
            AND status NOT IN ('cancelado', 'falta')
        `,
        [guiaId, grupo.procedimentoConvenioId, grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
      resultado.push({
        paciente: grupo.paciente,
        guiaId,
        numeroGuia: numeroDaGuia,
        status: 'vinculada à guia de série existente',
      });
      continue;
    }

    if (!String(grupo.serieId).startsWith('jessica-avulso-')) {
      const [sessoes] = await connection.execute(
        `
          SELECT COUNT(*) AS total
          FROM atendimentos
          WHERE pacienteId = ?
            AND profissionalId = ?
            AND convenioId = ?
            AND serieId = ?
            AND status NOT IN ('cancelado', 'falta')
        `,
        [grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
      sessoesDaSerie = Math.max(Number(sessoes[0].total || 0), grupo.atendimentos.length);
    }

    const atendimentoBase = grupo.atendimentos.reduce((menor, atual) => (
      Number(atual.atendimentoId) < Number(menor.atendimentoId) ? atual : menor
    ));
    numeroDaGuia = numeroGuia(atendimentoBase.atendimentoId);
    const senha = `JES${String(atendimentoBase.atendimentoId).padStart(8, '0').slice(-8)}`;
    const valorTotal = Number(grupo.valorUnitario) * sessoesDaSerie;

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
        numeroDaGuia,
        grupo.pacienteId,
        profissionalId,
        grupo.convenioId,
        atendimentoBase.atendimentoId,
        grupo.data,
        grupo.procedimento,
        valorTotal.toFixed(2),
        sessoesDaSerie,
        sessoesDaSerie,
        senha,
        grupo.numeroCarteira || null,
        numeroDaGuia,
        `INTERNO-${numeroDaGuia}`,
        grupo.serieId,
        sessoesDaSerie,
        valorTotal.toFixed(2),
        valorTotal.toFixed(2),
      ],
    );

    guiaId = insercao.insertId;
    if (String(grupo.serieId).startsWith('jessica-avulso-')) {
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, serieId = ?, procedimentoConvenioId = ?
          WHERE id = ? AND guiaId IS NULL
        `,
        [guiaId, grupo.serieId, grupo.procedimentoConvenioId, atendimentoBase.atendimentoId],
      );
    } else {
      await connection.execute(
        `
          UPDATE atendimentos
          SET guiaId = ?, procedimentoConvenioId = ?
          WHERE pacienteId = ?
            AND profissionalId = ?
            AND convenioId = ?
            AND serieId = ?
            AND guiaId IS NULL
            AND status NOT IN ('cancelado', 'falta')
        `,
        [guiaId, grupo.procedimentoConvenioId, grupo.pacienteId, profissionalId, grupo.convenioId, grupo.serieId],
      );
    }

    resultado.push({
      paciente: grupo.paciente,
      guiaId,
      numeroGuia: numeroDaGuia,
      sessoes: sessoesDaSerie,
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
