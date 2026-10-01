import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL não configurada.');

const connection = await mysql.createConnection(databaseUrl);

function calcularHoraFinal30Minutos(horaInicial) {
  const match = String(horaInicial || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';

  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  if (hora > 23 || minuto > 59) return '';

  const total = (hora * 60 + minuto + 30) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function obterResumoFinanceiro() {
  const [rows] = await connection.query(`
    SELECT
      COUNT(DISTINCT pa.id) AS pagamentos,
      COALESCE(SUM(pa.valor), 0) AS valor_pagamentos,
      COUNT(DISTINCT cp.id) AS contas_pagar,
      COALESCE(SUM(cp.valor), 0) AS valor_contas_pagar
    FROM guias g
    LEFT JOIN pagamentos_atendimento pa ON pa.atendimentoId = g.atendimentoId
    LEFT JOIN contas_pagar cp ON cp.pagamentoAtendimentoId = pa.id
    WHERE g.dataEmissao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
  `);
  return rows[0];
}

try {
  await connection.beginTransaction();

  const financeiroAntes = await obterResumoFinanceiro();
  const [guias] = await connection.query(`
    SELECT g.id, g.dadosPrefaturamento, c.nome AS nomeConvenio
    FROM guias g
    LEFT JOIN convenios c ON c.id = g.convenioId
    WHERE g.dataEmissao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND g.dadosPrefaturamento IS NOT NULL
      AND g.dadosPrefaturamento <> ''
  `);

  let guiasAtualizadas = 0;
  let profissionaisBradescoAtualizados = 0;
  let execucoesPrefaturamentoAtualizadas = 0;

  for (const guia of guias) {
    let dados;
    try {
      dados = JSON.parse(guia.dadosPrefaturamento);
    } catch {
      continue;
    }

    let alterou = false;
    const ehBradesco = /bradesco/i.test(String(guia.nomeConvenio || dados.nomeConvenio || ''));

    if (ehBradesco && Array.isArray(dados.profissionais)) {
      dados.profissionais = dados.profissionais.map((profissional) => {
        if (profissional?.grauPart === '00') return profissional;
        profissionaisBradescoAtualizados += 1;
        alterou = true;
        return { ...profissional, grauPart: '00' };
      });
    }

    if (Array.isArray(dados.execucoes)) {
      dados.execucoes = dados.execucoes.map((execucao) => {
        const horaFinal = execucao?.horaFinal || calcularHoraFinal30Minutos(execucao?.horaInicial);
        const atualizada = {
          ...execucao,
          horaFinal,
          via: '1',
          tec: '1',
        };
        if (
          execucao?.horaFinal !== atualizada.horaFinal
          || execucao?.via !== atualizada.via
          || execucao?.tec !== atualizada.tec
        ) {
          execucoesPrefaturamentoAtualizadas += 1;
          alterou = true;
        }
        return atualizada;
      });
    }

    if (alterou) {
      await connection.query(
        'UPDATE guias SET dadosPrefaturamento = ? WHERE id = ?',
        [JSON.stringify(dados), guia.id],
      );
      guiasAtualizadas += 1;
    }
  }

  const [resultadoExecucoes] = await connection.query(`
    UPDATE guiaProcedimentos gp
    INNER JOIN guias g ON g.id = gp.guiaId
    SET gp.horaFinal = TIME_FORMAT(
      ADDTIME(STR_TO_DATE(gp.horaInicial, '%H:%i'), '00:30:00'),
      '%H:%i'
    )
    WHERE g.dataEmissao >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
      AND gp.horaInicial IS NOT NULL
      AND gp.horaInicial <> ''
      AND (gp.horaFinal IS NULL OR gp.horaFinal = '')
  `);

  const financeiroDepois = await obterResumoFinanceiro();
  if (JSON.stringify(financeiroAntes) !== JSON.stringify(financeiroDepois)) {
    throw new Error('A conferência financeira divergiu; a atualização foi cancelada.');
  }

  const resumo = {
    periodo: 'do primeiro dia do mês corrente até a data da execução',
    guiasAtualizadas,
    profissionaisBradescoAtualizados,
    execucoesPrefaturamentoAtualizadas,
    execucoesComHoraFinalPreenchida: resultadoExecucoes.affectedRows,
    financeiroPreservado: financeiroDepois,
  };

  await connection.query(
    `INSERT INTO auditoria (usuarioNome, usuarioPerfil, entidade, acao, descricao, dadosAnteriores, dadosNovos)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'Sistema',
      'sistema',
      'guia_sadt',
      'ATUALIZAR_PADROES_SADT_MES',
      'Atualização histórica dos campos 43, 44 e 49 e da hora final das Guias SADT do mês; pagamentos e contas a pagar preservados.',
      JSON.stringify({ financeiroAntes }),
      JSON.stringify(resumo),
    ],
  );

  await connection.commit();
  console.log(JSON.stringify(resumo));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
