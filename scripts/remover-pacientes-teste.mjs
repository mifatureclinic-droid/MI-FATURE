/**
 * Remove os pacientes de teste criados durante o desenvolvimento.
 * IDs 540001–600004 são todos registros de teste.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Listar os registros de teste antes de remover
const [teste] = await conn.query(
  `SELECT id, nome FROM pacientes 
   WHERE id BETWEEN 540001 AND 600004
   ORDER BY id`
);

console.log(`\n📋 Registros de teste a remover (${teste.length}):`);
for (const r of teste) {
  console.log(`   ID ${r.id}: ${r.nome}`);
}

if (teste.length === 0) {
  console.log('Nenhum registro de teste encontrado.');
  await conn.end();
  process.exit(0);
}

// Remover dependências primeiro (agendamentos, atendimentos vinculados)
// Verificar se há atendimentos vinculados a esses pacientes
const ids = teste.map(r => r.id);
const placeholders = ids.map(() => '?').join(',');

const [atend] = await conn.query(
  `SELECT COUNT(*) as total FROM atendimentos WHERE pacienteId IN (${placeholders})`,
  ids
);
console.log(`\n⚠️  Atendimentos vinculados: ${atend[0]?.total || 0}`);

const [agend] = await conn.query(
  `SELECT COUNT(*) as total FROM agendamentos WHERE pacienteId IN (${placeholders})`,
  ids
).catch(() => [[{ total: 0 }]]);
console.log(`⚠️  Agendamentos vinculados: ${agend[0]?.total || 0}`);

// Remover atendimentos vinculados (se existirem)
if ((atend[0]?.total || 0) > 0) {
  await conn.query(`DELETE FROM atendimentos WHERE pacienteId IN (${placeholders})`, ids);
  console.log('🗑️  Atendimentos de teste removidos.');
}

// Remover agendamentos vinculados (se existirem)
await conn.query(`DELETE FROM agendamentos WHERE pacienteId IN (${placeholders})`, ids).catch(() => {});

// Remover os pacientes de teste
const [result] = await conn.query(
  `DELETE FROM pacientes WHERE id BETWEEN 540001 AND 600004`
);

console.log(`\n✅ ${result.affectedRows} pacientes de teste removidos.`);

// Confirmar total final
const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM pacientes');
console.log(`📊 Total de pacientes reais no banco: ${total}`);

await conn.end();
