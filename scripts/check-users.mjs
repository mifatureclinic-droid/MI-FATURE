import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const conn = await createConnection(process.env.DATABASE_URL);

const [rows] = await conn.execute(
  "SELECT id, name, email, role, perfil, profissionalVinculadoId, createdAt FROM `users` WHERE LOWER(name) LIKE '%gabriel%' OR LOWER(name) LIKE '%ester%' ORDER BY name"
);

console.log('Usuários encontrados:', JSON.stringify(rows, null, 2));

// Verificar também na tabela de profissionais
const [profs] = await conn.execute(
  "SELECT id, nome, email, ativo FROM profissionais WHERE LOWER(nome) LIKE '%gabriel%' OR LOWER(nome) LIKE '%ester%' ORDER BY nome"
);
console.log('Profissionais encontrados:', JSON.stringify(profs, null, 2));

await conn.end();
process.exit(0);
