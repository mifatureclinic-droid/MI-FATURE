/**
 * Script: gerar-guias-agosto.mjs
 * Gera guias SADT para todos os atendimentos de agosto/2026 com convênio.
 * 
 * Regra de agrupamento:
 *   - Uma guia por (pacienteId + profissionalId + convenioId) em agosto
 *   - Vincula o primeiro atendimento do grupo à guia (atendimentoId)
 *   - Status: "rascunho" (aguardando assinatura do paciente)
 *   - Numeração: G-AGO-XXXXXX (sequencial)
 */

import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== Gerando guias SADT para agosto/2026 ===\n');

// 1. Buscar todos os atendimentos de agosto com convênio, agrupados por paciente+profissional+convênio
const [grupos] = await conn.execute(`
  SELECT 
    a.pacienteId,
    a.profissionalId,
    p.convenioId,
    p.nome as pacienteNome,
    pr.nome as profissionalNome,
    c.nome as convenioNome,
    p.numeroCarteira,
    p.validadeCarteira,
    COUNT(*) as totalSessoes,
    MIN(a.id) as primeiroAtendimentoId,
    MIN(a.data) as primeiraData
  FROM atendimentos a
  JOIN pacientes p ON a.pacienteId = p.id
  JOIN profissionais pr ON a.profissionalId = pr.id
  JOIN convenios c ON p.convenioId = c.id
  WHERE a.data >= '2026-08-01' AND a.data <= '2026-08-31'
    AND a.status = 'agendado'
    AND p.convenioId IS NOT NULL
  GROUP BY a.pacienteId, a.profissionalId, p.convenioId, p.nome, pr.nome, c.nome, p.numeroCarteira, p.validadeCarteira
  ORDER BY p.nome, pr.nome
`);

console.log(`Grupos encontrados: ${grupos.length}`);
console.log(`Total de sessões: ${grupos.reduce((s, g) => s + Number(g.totalSessoes), 0)}\n`);

// 2. Verificar guias já existentes para evitar duplicatas
const [guiasExistentes] = await conn.execute(`
  SELECT pacienteId, profissionalId, convenioId FROM guias
  WHERE DATE(dataEmissao) >= '2026-08-01' AND DATE(dataEmissao) <= '2026-08-31'
`);
const existentes = new Set(guiasExistentes.map(g => `${g.pacienteId}-${g.profissionalId}-${g.convenioId}`));
console.log(`Guias já existentes para agosto: ${existentes.size}`);

// 3. Gerar as guias
let criadas = 0;
let puladas = 0;
let seq = 1;

for (const grupo of grupos) {
  const chave = `${grupo.pacienteId}-${grupo.profissionalId}-${grupo.convenioId}`;
  
  if (existentes.has(chave)) {
    puladas++;
    continue;
  }

  const numeroGuia = `G-AGO-${String(seq).padStart(6, '0')}`;
  const dataEmissao = '2026-08-01';
  
  try {
    await conn.execute(`
      INSERT INTO guias (
        numeroGuia, pacienteId, profissionalId, convenioId,
        atendimentoId, dataEmissao, procedimento, valor, status,
        totalSessoes, numeroCarteira, validadeCarteira,
        tipoAtendimento, caraterAtendimento, indicacaoAcidente,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      numeroGuia,
      grupo.pacienteId,
      grupo.profissionalId,
      grupo.convenioId,
      grupo.primeiroAtendimentoId,
      dataEmissao,
      'SESSÃO DE TERAPIA', // procedimento padrão — será preenchido no pré-faturamento
      '0.00',
      'rascunho',
      grupo.totalSessoes,
      grupo.numeroCarteira || null,
      grupo.validadeCarteira ? new Date(grupo.validadeCarteira).toISOString().split('T')[0] : null,
      '05', // tipoAtendimento padrão
      '1',  // caraterAtendimento: Eletivo
      '9',  // indicacaoAcidente: Não acidente
    ]);
    
    criadas++;
    seq++;
    
    if (criadas % 50 === 0) {
      console.log(`  ${criadas} guias criadas...`);
    }
  } catch (err) {
    console.error(`Erro ao criar guia para ${grupo.pacienteNome} / ${grupo.profissionalNome}:`, err.message);
  }
}

console.log(`\n=== Resultado ===`);
console.log(`Guias criadas: ${criadas}`);
console.log(`Grupos pulados (já existiam): ${puladas}`);

// 4. Verificar resultado final
const [total] = await conn.execute('SELECT COUNT(*) as total FROM guias WHERE status = "rascunho"');
console.log(`\nTotal de guias em rascunho no banco: ${total[0].total}`);

await conn.end();
console.log('\nConcluído!');
