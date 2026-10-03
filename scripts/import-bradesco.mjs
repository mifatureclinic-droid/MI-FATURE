import { readFileSync } from 'fs';
import { createConnection } from 'mysql2/promise';
import * as XLSX from 'xlsx';

function detectarCategoria(descricao) {
  const d = descricao.toUpperCase();
  if (d.includes('SALDO INVEST')) return 'Saldo Investimento';
  if (d.includes('PGTO.SINISTRO') || d.includes('SINISTRO')) return 'Convênio';
  if (d.includes('PIX RECEBIDO')) return 'PIX Recebido';
  if (d.includes('PIX ENVIADO') || d.includes('PIX ENVIO')) return 'PIX Enviado';
  if (d.includes('TED-TRANSF') || d.includes('TED ')) return 'TED';
  if (d.includes('TRIBUTO') || d.includes('SIMPLES') || d.includes('IMPOSTO')) return 'Tributo';
  if (d.includes('RENTAB') || d.includes('INVEST')) return 'Rendimento';
  if (d.includes('PAGTO ELETRON') || d.includes('PAGUE FACIL')) return 'Pagamento';
  if (d.includes('RECEB POR FORNECIMENTO')) return 'Recebimento';
  if (d.includes('STONE') || d.includes('MAQUINETA')) return 'Maquineta';
  if (d.includes('SALARIO') || d.includes('FOLHA')) return 'Folha de Pagamento';
  if (d.includes('ENERGIA') || d.includes('AGUA') || d.includes('TELEFONE') || d.includes('INTERNET')) return 'Utilidades';
  return 'Outros';
}

function parseBradescoXLS(filePath) {
  const buffer = readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let agencia = '';
  let conta = '';
  const lancamentos = [];

  for (const row of rows) {
    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();
    const col4 = String(row[4] || '').trim();

    if (col0.includes('Ag') && col0.includes('ncia:')) {
      const match = col0.match(/Ag[eê]ncia:\s*(\d+)\s+Conta:\s*([\d\-]+)/i);
      if (match) { agencia = match[1]; conta = match[2]; }
      continue;
    }

    const dataMatch = col0.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!dataMatch) continue;

    const dataISO = `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`;
    const descricao = col1;
    const documento = col2;

    let tipo = 'saldo';
    let credito = null;
    let debito = null;

    if (descricao.toUpperCase().includes('SALDO INVEST')) {
      tipo = 'saldo';
      const val = col2.replace(/\./g, '').replace(',', '.');
      credito = isNaN(parseFloat(val)) ? null : parseFloat(val);
    } else if (col3 && col3 !== '') {
      tipo = 'credito';
      const val = col3.replace(/\./g, '').replace(',', '.');
      credito = isNaN(parseFloat(val)) ? null : parseFloat(val);
    } else if (col4 && col4 !== '') {
      tipo = 'debito';
      const val = col4.replace(/\./g, '').replace(',', '.').replace('-', '');
      debito = isNaN(parseFloat(val)) ? null : parseFloat(val);
    } else {
      continue;
    }

    lancamentos.push({ data: dataISO, descricao, documento: tipo === 'saldo' ? '' : documento, credito, debito, tipo, categoria: detectarCategoria(descricao) });
  }

  return { agencia, conta, lancamentos };
}

const xlsPath = '/home/ubuntu/upload/Bradesco_21072026_113624.XLS';
const nomeArquivo = 'Bradesco_21072026_113624.XLS';

console.log(`Lendo arquivo: ${xlsPath}`);
const parsed = parseBradescoXLS(xlsPath);
console.log(`Agência: ${parsed.agencia}, Conta: ${parsed.conta}`);
console.log(`Total de lançamentos encontrados: ${parsed.lancamentos.length}`);

const conn = await createConnection(process.env.DATABASE_URL);
console.log('Conectado ao banco.');

// Buscar todos os lançamentos existentes de uma vez (para deduplicação em memória)
const [existentes] = await conn.execute(
  'SELECT data, descricao, documento FROM extrato_bancario WHERE arquivoOrigem = ?',
  [nomeArquivo]
);

const existentesSet = new Set(
  existentes.map(e => `${e.data?.toISOString?.()?.split('T')[0] ?? e.data}|${e.descricao}|${e.documento ?? ''}`)
);

console.log(`Lançamentos já existentes no banco: ${existentesSet.size}`);

// Filtrar apenas os novos
const novos = parsed.lancamentos.filter(lanc => {
  const key = `${lanc.data}|${lanc.descricao}|${lanc.documento || ''}`;
  return !existentesSet.has(key);
});

const duplicados = parsed.lancamentos.length - novos.length;
console.log(`Novos a inserir: ${novos.length}, Duplicados: ${duplicados}`);

if (novos.length === 0) {
  console.log('Nenhum lançamento novo para inserir.');
  await conn.end();
  process.exit(0);
}

// Inserir em batch
const values = novos.map(lanc => [
  'Bradesco',
  parsed.agencia || null,
  parsed.conta || null,
  lanc.data,
  lanc.descricao,
  lanc.documento || null,
  lanc.credito,
  lanc.debito,
  lanc.tipo,
  lanc.categoria,
  nomeArquivo,
  null,
]);

const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
const flatValues = values.flat();

await conn.execute(
  `INSERT INTO extrato_bancario (banco, agencia, conta, data, descricao, documento, credito, debito, tipo, categoria, arquivoOrigem, importadoPor)
   VALUES ${placeholders}`,
  flatValues
);

await conn.end();

console.log('\n=== RESULTADO ===');
console.log(`✅ Inseridos: ${novos.length}`);
console.log(`⚠️  Duplicados (ignorados): ${duplicados}`);
console.log(`📊 Total processado: ${parsed.lancamentos.length}`);
