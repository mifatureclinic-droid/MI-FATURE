/**
 * Reimporta os pacientes que falharam por CPF ausente.
 * Agora que a coluna cpf é nullable, insere com cpf = NULL.
 */
import XLSX from 'xlsx';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const ARQUIVO = '/home/ubuntu/upload/RelatóriodeAgendamentosClinicWeb5.38-v-20260702.4.xlsx';

// Pacientes que falharam na primeira importação (sem CPF na planilha)
// Excluindo as linhas de rodapé "TRIAGEM" e "TOTAL DE PACIENTES"
const NOMES_SEM_CPF = new Set([
  'LUZEMIRA DE OLIVEIRA AMAZONAS',
  'REGINA CELIA LIMA ROCHA',
  'PEDRO KAL EL MENEZES DE AZEVEDO',
  'JESSICA SAMARA BEZERRA GUIMARAES',
  'EDERSON DOS SANTOS SAUNIER',
  'IRACILDA BRAGA DANTAS',
  'RAVI BONFIM LOPES',
  'GIOVANNA VICTORIA GOMES DE LIMA',
  'LAURA CRISTINE MAIA LOPES',
  'ROSECLER DA SILVA',
  'KIRLEY MICHELLY MARQUES',
  'RAIMUNDO ALCIMAR LUCAS NETO',
  'ADRIANA DE SOUZA VIANA',
  'MARCELO OVIDIO SALLES',
  'R PHAEL LIMA SABBA GUIMARAES VIEIRA',
  'RAVI MIGUEL MORAES RODRIGUES',
  'ESDRAS AGUIAR DA SILVA',
  'IGOR MENEZES SALES VIEIRA',
  'CORA DALTO DE MEDEIROS CAMARGO',
  'ESTHEFANIE RODRIGUES BARROS',
  'MATEUS ODILIO MENEZES DA SILVA',
]);

function limparTelefone(tel) {
  if (!tel || tel === '-') return null;
  const t = tel.replace(/[^\d\-\s]/g, '').trim().substring(0, 20);
  return t || null;
}

function limparEmail(email) {
  if (!email || email === '-') return null;
  const e = email.trim().toLowerCase();
  return e.includes('@') ? e : null;
}

function limparEndereco(end) {
  if (!end) return null;
  const limpo = end.replace(/,+\s*$/, '').trim();
  return limpo.replace(/[,\s]/g, '') === '' ? null : limpo;
}

function limparCarteirinha(cart) {
  if (!cart) return null;
  return cart.replace(/[\u200b\u200c\u200d\uFEFF]/g, '').trim() || null;
}

function parsarData(dataStr) {
  if (!dataStr || dataStr === '-') return null;
  const partes = String(dataStr).trim().split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  const d = new Date(`${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
  return isNaN(d.getTime()) ? null : d;
}

// Leitura da planilha
const wb = XLSX.readFile(ARQUIVO);
const ws = wb.Sheets[wb.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Coletar linhas dos pacientes alvo (deduplica por nome)
const mapa = new Map();
for (const row of dados.slice(1)) {
  const nome = String(row[3]).trim().toUpperCase();
  if (NOMES_SEM_CPF.has(nome) && !mapa.has(nome)) {
    mapa.set(nome, row);
  }
}

console.log(`📋 Pacientes a reimportar: ${mapa.size}`);

const conn = await mysql.createConnection(process.env.DATABASE_URL);
let inseridos = 0;
let erros = 0;

for (const [nome, row] of mapa) {
  const telefone = limparTelefone(String(row[4]));
  const email = limparEmail(String(row[9]));
  const endereco = limparEndereco(String(row[10]));
  const carteirinha = limparCarteirinha(String(row[12]));
  const dataNascimento = parsarData(String(row[7]));

  try {
    // Verificar se já foi inserido em outra tentativa
    const [existe] = await conn.query('SELECT id FROM pacientes WHERE nome = ?', [nome]);
    if (existe.length > 0) {
      console.log(`⚠️  Já existe: ${nome}`);
      continue;
    }

    await conn.query(
      `INSERT INTO pacientes
         (nome, cpf, telefone, email, endereco, dataNascimento, cartaoSUS, createdAt, updatedAt)
       VALUES (?, NULL, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [nome, telefone, email, endereco, dataNascimento, carteirinha]
    );
    inseridos++;
    console.log(`✅ ${nome}`);
  } catch (e) {
    erros++;
    console.log(`❌ ${nome}: ${e.message}`);
  }
}

await conn.end();

console.log('\n═══════════════════════════════════════');
console.log(`✅ Inseridos: ${inseridos}`);
console.log(`❌ Erros:     ${erros}`);
console.log('═══════════════════════════════════════');
