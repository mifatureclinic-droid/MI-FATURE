import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 1. Identificar todos os slots duplicados
  const [duplicatas] = await conn.query(`
    SELECT pacienteId, profissionalId, data, hora,
           COUNT(*) as total,
           MIN(id) as manter_id,
           GROUP_CONCAT(id ORDER BY id) as todos_ids
    FROM atendimentos
    WHERE status != 'cancelado'
    GROUP BY pacienteId, profissionalId, data, hora
    HAVING COUNT(*) > 1
    ORDER BY total DESC
  `);

  console.log(`\n=== Duplicatas encontradas: ${duplicatas.length} slots ===`);

  let totalRemovidos = 0;
  let totalErros = 0;

  for (const dup of duplicatas) {
    const ids = dup.todos_ids.split(',').map(Number);
    const manterIds = [dup.manter_id]; // manter apenas o mais antigo
    const removerIds = ids.filter(id => !manterIds.includes(id));

    console.log(`\nSlot: paciente=${dup.pacienteId} prof=${dup.profissionalId} data=${dup.data} hora=${dup.hora}`);
    console.log(`  Total: ${dup.total} | Manter: ${dup.manter_id} | Remover: ${removerIds.join(', ')}`);

    for (const idRemover of removerIds) {
      try {
        // Verificar se o registro a remover tem dados importantes (prontuário, guia)
        const [check] = await conn.query(
          'SELECT id, guiaId, prontuarioFeito FROM atendimentos WHERE id = ?',
          [idRemover]
        );
        if (check.length > 0 && (check[0].guiaId || check[0].prontuarioFeito)) {
          console.log(`  ⚠️  ID ${idRemover} tem guia/prontuário - cancelando em vez de excluir`);
          await conn.execute(
            'UPDATE atendimentos SET status = "cancelado" WHERE id = ?',
            [idRemover]
          );
        } else {
          await conn.execute('DELETE FROM atendimentos WHERE id = ?', [idRemover]);
        }
        totalRemovidos++;
      } catch (e) {
        console.log(`  ❌ Erro ao remover ID ${idRemover}: ${e.message}`);
        totalErros++;
      }
    }
  }

  console.log(`\n✅ Concluído:`);
  console.log(`   ${totalRemovidos} duplicatas removidas/canceladas`);
  console.log(`   ${totalErros} erros`);

  // 2. Verificar resultado final
  const [verificacao] = await conn.query(`
    SELECT COUNT(*) as slots_duplicados
    FROM (
      SELECT COUNT(*) as total
      FROM atendimentos
      WHERE status != 'cancelado'
      GROUP BY pacienteId, profissionalId, data, hora
      HAVING COUNT(*) > 1
    ) sub
  `);
  console.log(`\n📊 Slots duplicados restantes: ${verificacao[0].slots_duplicados}`);

  await conn.end();
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
