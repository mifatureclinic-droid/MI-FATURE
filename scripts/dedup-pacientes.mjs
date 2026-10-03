import { createConnection } from 'mysql2/promise';

const url = process.env.DATABASE_URL;

async function main() {
  const conn = await createConnection(url);

  // 1. Encontrar duplicados por nome (case-insensitive, ignorando espaços extras)
  const [duplicados] = await conn.execute(`
    SELECT 
      LOWER(TRIM(nome)) as nome_normalizado,
      COUNT(*) as total,
      GROUP_CONCAT(id ORDER BY id ASC SEPARATOR ',') as ids,
      GROUP_CONCAT(nome ORDER BY id ASC SEPARATOR '|||') as nomes
    FROM pacientes 
    GROUP BY LOWER(TRIM(nome)) 
    HAVING COUNT(*) > 1 
    ORDER BY total DESC, nome_normalizado ASC
  `);

  console.log(`\n=== PACIENTES DUPLICADOS ENCONTRADOS: ${duplicados.length} grupos ===\n`);

  if (duplicados.length === 0) {
    console.log('Nenhum duplicado encontrado!');
    await conn.end();
    return;
  }

  let totalRemovidos = 0;

  for (const grupo of duplicados) {
    const ids = grupo.ids.split(',').map(Number);
    const nomes = grupo.nomes.split('|||');
    const idManter = ids[0]; // manter o mais antigo (menor ID)
    const idsRemover = ids.slice(1);

    console.log(`Nome: "${nomes[0]}" | Total: ${grupo.total} | Manter ID: ${idManter} | Remover IDs: ${idsRemover.join(', ')}`);

    // 2. Redirecionar atendimentos dos duplicados para o ID a manter
    for (const idRemover of idsRemover) {
      await conn.execute(
        `UPDATE atendimentos SET pacienteId = ? WHERE pacienteId = ?`,
        [idManter, idRemover]
      );
      await conn.execute(
        `UPDATE prontuarios SET pacienteId = ? WHERE pacienteId = ?`,
        [idManter, idRemover]
      ).catch(() => {}); // tabela pode não ter pacienteId
      await conn.execute(
        `UPDATE guias SET pacienteId = ? WHERE pacienteId = ?`,
        [idManter, idRemover]
      ).catch(() => {});
    }

    // 3. Remover os duplicados (mantém apenas o mais antigo)
    const placeholders = idsRemover.map(() => '?').join(',');
    await conn.execute(
      `DELETE FROM pacientes WHERE id IN (${placeholders})`,
      idsRemover
    );

    totalRemovidos += idsRemover.length;
  }

  console.log(`\n=== CONCLUÍDO: ${totalRemovidos} registos duplicados removidos ===`);

  // 4. Verificar resultado final
  const [[{ total }]] = await conn.execute(`SELECT COUNT(*) as total FROM pacientes`);
  console.log(`Total de pacientes após deduplicação: ${total}`);

  await conn.end();
}

main().catch(err => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
