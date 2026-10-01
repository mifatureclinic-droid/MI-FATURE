/**
 * Script para zerar o cadastro de profissionais.
 * Trata as dependências (FK) antes de deletar:
 *   - alertasProntuarioPendente.profissionalId → NULL
 *   - atendimentos.profissionalId → NULL
 *   - guias_sp_sadt.profissionalId → NULL
 *   - confirmacoes_profissional.profissionalId → NULL (se existir)
 * Depois deleta todos os profissionais.
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  console.log('🔍 Verificando profissionais cadastrados...');
  const [rows] = await conn.query('SELECT id, nome FROM profissionais');
  console.log(`   Total: ${rows.length} profissional(is)`);
  if (rows.length > 0) {
    rows.forEach(r => console.log(`   - [${r.id}] ${r.nome}`));
  }

  if (rows.length === 0) {
    console.log('✅ Nenhum profissional cadastrado. Nada a fazer.');
    await conn.end();
    process.exit(0);
  }

  console.log('\n🔧 Removendo referências de chave estrangeira...');

  // Tabelas que referenciam profissionalId
  const tabelas = [
    'alertasProntuarioPendente',
    'atendimentos',
    'guias_sp_sadt',
    'confirmacoes_profissional',
    'agendamentos',
  ];

  for (const tabela of tabelas) {
    try {
      const [result] = await conn.query(
        `UPDATE ${tabela} SET profissionalId = NULL WHERE profissionalId IS NOT NULL`
      );
      if (result.affectedRows > 0) {
        console.log(`   ✓ ${tabela}: ${result.affectedRows} linha(s) atualizada(s)`);
      }
    } catch (e) {
      if (e.code === 'ER_NO_SUCH_TABLE') {
        // tabela não existe neste projeto, ignorar
      } else if (e.code === 'ER_BAD_FIELD_ERROR') {
        // coluna não existe nesta tabela, ignorar
      } else {
        console.warn(`   ⚠ ${tabela}: ${e.message}`);
      }
    }
  }

  console.log('\n🗑  Deletando todos os profissionais...');
  const [del] = await conn.query('DELETE FROM profissionais');
  console.log(`   ✅ ${del.affectedRows} profissional(is) removido(s).`);

  // Confirmar
  const [check] = await conn.query('SELECT COUNT(*) as total FROM profissionais');
  console.log(`\n✅ Cadastro de profissionais zerado. Total atual: ${check[0].total}`);

} catch (err) {
  console.error('❌ Erro:', err.message);
  process.exit(1);
} finally {
  await conn.end();
}
