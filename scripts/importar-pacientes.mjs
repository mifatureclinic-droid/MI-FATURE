/**
 * Script de importação de pacientes a partir da planilha
 * RelatóriodeAgendamentosClinicWeb5.38-v-20260702.4.xlsx
 *
 * Colunas da planilha:
 *   0: Profissional
 *   1: Data da Agenda
 *   2: Hora
 *   3: Paciente (nome)
 *   4: Telefones
 *   5: Grupo de Procedimento
 *   6: Convenio/Plano
 *   7: Nascimento (DD/MM/YYYY)
 *   8: Idade
 *   9: e-mail
 *  10: Endereco
 *  11: CPF do Paciente
 *  12: Carteirinha
 *  13: Registro profissional
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

// Usar xlsx via require dinâmico (já instalado como fast-xml-parser dep)
// Usamos openpyxl via python ou xlsx via node — aqui usamos o módulo xlsx
let XLSX;
try {
  XLSX = (await import('xlsx')).default;
} catch {
  console.error('❌ Módulo xlsx não encontrado. Instalando...');
  process.exit(1);
}

const ARQUIVO = '/home/ubuntu/upload/RelatóriodeAgendamentosClinicWeb5.38-v-20260702.4.xlsx';

// ─── Helpers de limpeza ───────────────────────────────────────────────────────

function limparCPF(cpf) {
  if (!cpf || cpf === '-' || cpf.trim() === '') return null;
  const limpo = cpf.replace(/\D/g, '');
  return limpo.length === 11 ? limpo : null;
}

function limparTelefone(tel) {
  if (!tel || tel === '-' || tel.trim() === '') return null;
  // Remove espaços e caracteres não numéricos, mantém o formato
  return tel.replace(/[^\d\-\s]/g, '').trim().substring(0, 20) || null;
}

function limparEmail(email) {
  if (!email || email === '-' || email.trim() === '') return null;
  const e = email.trim().toLowerCase();
  return e.includes('@') ? e : null;
}

function limparEndereco(end) {
  if (!end || end.trim() === '' || end.replace(/[,\s]/g, '') === '') return null;
  return end.replace(/,+\s*$/, '').trim() || null;
}

function limparCarteirinha(cart) {
  if (!cart || cart.trim() === '') return null;
  // Remove zero-width space e outros caracteres invisíveis
  return cart.replace(/[\u200b\u200c\u200d\uFEFF]/g, '').trim() || null;
}

function parsarData(dataStr) {
  if (!dataStr || dataStr === '-') return null;
  // Formato DD/MM/YYYY
  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  const d = new Date(`${ano}-${mes.padStart(2,'0')}-${dia.padStart(2,'0')}`);
  return isNaN(d.getTime()) ? null : d;
}

function parsarConvenio(convenioStr) {
  if (!convenioStr || convenioStr === '-') return { nome: null, plano: null };
  const partes = convenioStr.split('/');
  return {
    nome: partes[0]?.trim() || null,
    plano: partes[1]?.trim() || null,
  };
}

// ─── Leitura da planilha ──────────────────────────────────────────────────────

console.log('📂 Lendo planilha...');
const wb = XLSX.readFile(ARQUIVO);
const ws = wb.Sheets[wb.SheetNames[0]];
const dados = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

// Pular cabeçalho (linha 0)
const linhas = dados.slice(1).filter(row => row[3] && String(row[3]).trim() !== '');

// Deduplica por nome (pega o primeiro registro de cada paciente)
const pacientesMap = new Map();
for (const row of linhas) {
  const nome = String(row[3]).trim().toUpperCase();
  if (!pacientesMap.has(nome)) {
    pacientesMap.set(nome, row);
  }
}

const pacientes = Array.from(pacientesMap.values());
console.log(`✅ ${pacientes.length} pacientes únicos encontrados na planilha.`);

// ─── Conexão com banco ────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no .env');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

// Verificar estrutura da tabela pacientes
const [colunas] = await conn.query('DESCRIBE pacientes');
const nomeColunas = colunas.map(c => c.Field);
console.log('📋 Colunas da tabela pacientes:', nomeColunas.join(', '));

// ─── Importação ───────────────────────────────────────────────────────────────

let inseridos = 0;
let duplicados = 0;
let erros = 0;
const relatorio = [];

for (const row of pacientes) {
  const nome = String(row[3]).trim().toUpperCase();
  const cpf = limparCPF(String(row[11]));
  const telefone = limparTelefone(String(row[4]));
  const email = limparEmail(String(row[9]));
  const endereco = limparEndereco(String(row[10]));
  const carteirinha = limparCarteirinha(String(row[12]));
  const dataNasc = parsarData(String(row[7]));
  const { nome: convenioNome, plano: convenioPlano } = parsarConvenio(String(row[6]));

  try {
    // Verificar se já existe pelo nome ou CPF
    let existeQuery = 'SELECT id FROM pacientes WHERE nome = ?';
    let existeParams = [nome];
    if (cpf) {
      existeQuery = 'SELECT id FROM pacientes WHERE nome = ? OR cpf = ?';
      existeParams = [nome, cpf];
    }
    const [existe] = await conn.query(existeQuery, existeParams);

    if (existe.length > 0) {
      duplicados++;
      relatorio.push({ status: 'duplicado', nome, motivo: `ID existente: ${existe[0].id}` });
      continue;
    }

    // Montar objeto de inserção com apenas as colunas que existem
    const campos = {};
    campos.nome = nome;
    campos.createdAt = new Date();
    campos.updatedAt = new Date();

    if (nomeColunas.includes('cpf') && cpf) campos.cpf = cpf;
    if (nomeColunas.includes('telefone') && telefone) campos.telefone = telefone;
    if (nomeColunas.includes('email') && email) campos.email = email;
    if (nomeColunas.includes('endereco') && endereco) campos.endereco = endereco;
    if (nomeColunas.includes('dataNascimento') && dataNasc) campos.dataNascimento = dataNasc;
    if (nomeColunas.includes('carteirinha') && carteirinha) campos.carteirinha = carteirinha;
    if (nomeColunas.includes('convenio') && convenioNome) campos.convenio = convenioNome;
    if (nomeColunas.includes('plano') && convenioPlano) campos.plano = convenioPlano;
    if (nomeColunas.includes('convenioNome') && convenioNome) campos.convenioNome = convenioNome;
    if (nomeColunas.includes('planoNome') && convenioPlano) campos.planoNome = convenioPlano;
    if (nomeColunas.includes('numeroCarteira') && carteirinha) campos.numeroCarteira = carteirinha;
    if (nomeColunas.includes('status')) campos.status = 'ativo';

    const cols = Object.keys(campos);
    const vals = Object.values(campos);
    const placeholders = cols.map(() => '?').join(', ');
    const sql = `INSERT INTO pacientes (${cols.join(', ')}) VALUES (${placeholders})`;

    await conn.query(sql, vals);
    inseridos++;
    relatorio.push({ status: 'inserido', nome });

  } catch (err) {
    erros++;
    relatorio.push({ status: 'erro', nome, motivo: err.message });
  }
}

await conn.end();

// ─── Relatório final ──────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════');
console.log('📊 RELATÓRIO DE IMPORTAÇÃO');
console.log('═══════════════════════════════════════');
console.log(`✅ Inseridos:   ${inseridos}`);
console.log(`⚠️  Duplicados:  ${duplicados}`);
console.log(`❌ Erros:       ${erros}`);
console.log('═══════════════════════════════════════');

if (erros > 0) {
  console.log('\n❌ Pacientes com erro:');
  relatorio.filter(r => r.status === 'erro').forEach(r => {
    console.log(`   - ${r.nome}: ${r.motivo}`);
  });
}

if (duplicados > 0) {
  console.log('\n⚠️  Pacientes já existentes (ignorados):');
  relatorio.filter(r => r.status === 'duplicado').forEach(r => {
    console.log(`   - ${r.nome}`);
  });
}

console.log('\n✅ Importação concluída!');
