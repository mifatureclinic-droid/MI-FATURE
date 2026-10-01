/**
 * Script: gerar-guias-faltantes.mjs
 * 
 * Gera guias SADT para todos os atendimentos agendados que ainda não têm guia.
 * Agrupa por: pacienteId + profissionalId + convenioId + mês
 * 
 * Uso: node scripts/gerar-guias-faltantes.mjs
 */

import { config } from 'dotenv';
config();
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔍 Buscando atendimentos sem guia...\n');

// 1. Buscar todos os grupos (paciente+profissional+convenio+mês) sem guia
const [grupos] = await conn.execute(`
  SELECT 
    a.pacienteId,
    a.profissionalId,
    a.convenioId,
    DATE_FORMAT(a.data, '%Y-%m') as mes,
    DATE_FORMAT(a.data, '%Y-%m-01') as dataEmissao,
    COUNT(*) as qtdAtendimentos,
    MIN(a.data) as primeiraData,
    p.nome as pacienteNome,
    pr.nome as profissionalNome,
    c.nome as convenioNome,
    p.numeroCarteira,
    p.validadeCarteira,
    pc.valor as valorProcedimento,
    pc.codigoConvenio as codigoTUSS,
    a.tipo as nomeProcedimento
  FROM atendimentos a
  JOIN pacientes p ON p.id = a.pacienteId
  LEFT JOIN profissionais pr ON pr.id = a.profissionalId
  LEFT JOIN convenios c ON c.id = a.convenioId
  LEFT JOIN procedimentosPorConvenio pc ON pc.id = a.procedimentoConvenioId
  WHERE a.data >= '2026-08-01'
    AND a.convenioId IS NOT NULL
    AND a.status NOT IN ('cancelado')
    AND a.profissionalId IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM guias g 
      WHERE g.pacienteId = a.pacienteId 
        AND g.profissionalId = a.profissionalId
        AND g.convenioId = a.convenioId
        AND DATE_FORMAT(g.dataEmissao, '%Y-%m') = DATE_FORMAT(a.data, '%Y-%m')
    )
  GROUP BY a.pacienteId, a.profissionalId, a.convenioId, DATE_FORMAT(a.data, '%Y-%m'),
    DATE_FORMAT(a.data, '%Y-%m-01'), p.nome, pr.nome, c.nome, p.numeroCarteira, p.validadeCarteira,
    pc.valor, pc.codigoConvenio, a.tipo
  ORDER BY mes, pacienteNome
`);

console.log(`📋 Encontrados ${grupos.length} grupos sem guia:\n`);

if (grupos.length === 0) {
  console.log('✅ Todos os atendimentos já têm guia! Nada a fazer.');
  await conn.end();
  process.exit(0);
}

// Mostrar resumo por mês
const resumoMes = {};
for (const g of grupos) {
  if (!resumoMes[g.mes]) resumoMes[g.mes] = 0;
  resumoMes[g.mes]++;
}
console.log('Resumo por mês:');
for (const [mes, qtd] of Object.entries(resumoMes)) {
  console.log(`  ${mes}: ${qtd} guias a criar`);
}
console.log('');

// 2. Criar as guias
let criadas = 0;
let erros = 0;
const errosDetalhes = [];

for (const grupo of grupos) {
  try {
    // Número único: G + mês (AAMM) + pacienteId (max 6 dig) + convenioId (max 4 dig) = max 17 chars
    const mesCompacto = grupo.mes.replace('-', '').substring(2); // ex: 2608
    const numeroGuia = `G${mesCompacto}${String(grupo.pacienteId).padStart(4,'0')}C${String(grupo.convenioId).padStart(3,'0')}`.substring(0, 20);
    
    // Valor: usar o valor do procedimento vinculado, ou 0 se não houver
    const valor = grupo.valorProcedimento ? parseFloat(grupo.valorProcedimento) : 0;
    
    // Procedimento: usar nome do procedimento vinculado, ou tipo do atendimento
    const procedimento = grupo.nomeProcedimento || 'Sessão';
    
    // Data de emissão: primeiro dia do mês
    const dataEmissao = new Date(grupo.dataEmissao + 'T12:00:00');
    
    // Número da carteirinha (truncar para 50 chars para evitar erro de tamanho)
    const numeroCarteira = grupo.numeroCarteira ? String(grupo.numeroCarteira).substring(0, 50) : null;
    const validadeCarteira = grupo.validadeCarteira ? new Date(grupo.validadeCarteira) : null;

    await conn.execute(`
      INSERT INTO guias (
        numeroGuia, pacienteId, profissionalId, convenioId,
        dataEmissao, procedimento, valor, status,
        numeroCarteira, validadeCarteira
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?)
    `, [
      numeroGuia,
      grupo.pacienteId,
      grupo.profissionalId,
      grupo.convenioId,
      dataEmissao,
      procedimento,
      valor,
      numeroCarteira,
      validadeCarteira,
    ]);

    criadas++;
    if (criadas <= 10 || criadas % 50 === 0) {
      console.log(`  ✅ [${criadas}] ${grupo.pacienteNome} | ${grupo.profissionalNome || 'S/Prof'} | ${grupo.convenioNome} | ${grupo.mes} (${grupo.qtdAtendimentos} sess.)`);
    }
  } catch (err) {
    erros++;
    errosDetalhes.push({ grupo: `${grupo.pacienteNome}/${grupo.mes}`, erro: err.message });
    if (erros <= 5) {
      console.error(`  ❌ Erro: ${grupo.pacienteNome} | ${grupo.mes} → ${err.message}`);
    }
  }
}

console.log(`\n========================================`);
console.log(`✅ Guias criadas: ${criadas}`);
console.log(`❌ Erros: ${erros}`);
if (errosDetalhes.length > 0) {
  console.log('\nDetalhes dos erros:');
  errosDetalhes.forEach(e => console.log(`  - ${e.grupo}: ${e.erro}`));
}

// 3. Verificar total de guias por mês após criação
const [totais] = await conn.execute(`
  SELECT DATE_FORMAT(dataEmissao, '%Y-%m') as mes, status, COUNT(*) as total
  FROM guias
  WHERE dataEmissao >= '2026-08-01'
  GROUP BY mes, status
  ORDER BY mes, status
`);
console.log('\n=== Guias no banco após criação ===');
console.table(totais);

await conn.end();
console.log('\n🎉 Script concluído!');
