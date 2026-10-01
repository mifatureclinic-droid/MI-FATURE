import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });
dotenv.config({ path: join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não encontrada');
  process.exit(1);
}

// Parsear a URL do banco
const url = new URL(DATABASE_URL);
const conn = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port || '3306'),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
});

console.log('Conectado ao banco. Buscando lançamentos não conciliados...');

const [lancamentos] = await conn.query(
  "SELECT * FROM extrato_bancario WHERE conciliado = 0 AND tipo IN ('credito', 'debito')"
);

console.log(`Encontrados ${lancamentos.length} lançamentos para conciliar.`);

const toDateStr = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  if (d instanceof Date) return d.toISOString().split('T')[0];
  const s = String(d);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return s.split('T')[0];
};

let inseridosReceber = 0;
let inseridosPagar = 0;
const BATCH = 50;

// Processar em lotes
for (let i = 0; i < lancamentos.length; i += BATCH) {
  const lote = lancamentos.slice(i, i + BATCH);
  
  for (const lanc of lote) {
    const dataStr = toDateStr(lanc.data);
    
    try {
      if (lanc.tipo === 'credito' && lanc.credito) {
        const valor = parseFloat(String(lanc.credito)).toFixed(2);
        await conn.execute(
          `INSERT INTO contas_receber (descricao, categoria, valor, dataVencimento, dataRecebimento, status, observacoes, extratoBancarioId, origemExtrato, criadoPor)
           VALUES (?, ?, ?, ?, ?, 'recebido', ?, ?, 1, 1)`,
          [
            lanc.descricao,
            lanc.categoria || 'Convênio',
            valor,
            dataStr,
            dataStr,
            `Extrato Bradesco. Doc: ${lanc.documento || '-'}`,
            lanc.id,
          ]
        );
        inseridosReceber++;
      } else if (lanc.tipo === 'debito' && lanc.debito) {
        const valor = parseFloat(String(lanc.debito)).toFixed(2);
        await conn.execute(
          `INSERT INTO contas_pagar (descricao, categoria, valor, dataVencimento, dataPagamento, status, observacoes, extratoBancarioId, origemExtrato, criadoPor)
           VALUES (?, ?, ?, ?, ?, 'pago', ?, ?, 1, 1)`,
          [
            lanc.descricao,
            lanc.categoria || 'Outros',
            valor,
            dataStr,
            dataStr,
            `Extrato Bradesco. Doc: ${lanc.documento || '-'}`,
            lanc.id,
          ]
        );
        inseridosPagar++;
      }
      
      // Marcar como conciliado
      await conn.execute(
        'UPDATE extrato_bancario SET conciliado = 1 WHERE id = ?',
        [lanc.id]
      );
    } catch (err) {
      console.error(`Erro no lançamento id=${lanc.id}: ${err.message}`);
    }
  }
  
  console.log(`Processados ${Math.min(i + BATCH, lancamentos.length)}/${lancamentos.length}...`);
}

await conn.end();
console.log(`\n✅ Conciliação concluída!`);
console.log(`   Contas a Receber inseridas: ${inseridosReceber}`);
console.log(`   Contas a Pagar inseridas:   ${inseridosPagar}`);
console.log(`   Total: ${inseridosReceber + inseridosPagar}`);
