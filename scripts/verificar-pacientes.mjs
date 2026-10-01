import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Total
const [[{ total }]] = await conn.query('SELECT COUNT(*) as total FROM pacientes');
console.log(`\nTotal de pacientes no banco: ${total}`);

// Listar todos com nome e data de criação
const [rows] = await conn.query('SELECT id, nome, cpf, createdAt FROM pacientes ORDER BY id ASC');
console.log('\nID       | Nome                                          | CPF             | Criado em');
console.log('-'.repeat(100));
for (const r of rows) {
  const id = String(r.id).padEnd(8);
  const nome = (r.nome || '').substring(0, 45).padEnd(45);
  const cpf = (r.cpf || 'sem CPF').padEnd(15);
  const data = r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : '-';
  console.log(`${id} | ${nome} | ${cpf} | ${data}`);
}

await conn.end();
