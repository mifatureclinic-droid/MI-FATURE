/**
 * Script para normalizar os números de WhatsApp dos pacientes
 * para o formato internacional 55DDXXXXXXXXX (Evolution API)
 * 
 * Execução: node scripts/normalizar-whatsapp.mjs
 */
import { createConnection } from 'mysql2/promise';

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // Já está no formato internacional completo
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // 11 dígitos: DDD(2) + 9 + número(8)
  if (digits.length === 11) return `55${digits}`;
  // 10 dígitos: DDD(2) + número(8)
  if (digits.length === 10) return `55${digits}`;
  // 9 dígitos: sem DDD, começa com 9 — assume DDD 92 (Amazonas)
  if (digits.length === 9) return `5592${digits}`;
  // 8 dígitos: sem DDD e sem dígito 9 — assume DDD 92 + dígito 9
  if (digits.length === 8) return `559299${digits}`;
  // Outros: adiciona 55
  return `55${digits}`;
}

const conn = await createConnection(process.env.DATABASE_URL);

// Buscar todos os pacientes com whatsapp preenchido
const [pacientes] = await conn.execute(
  "SELECT id, nome, whatsapp, telefone FROM pacientes WHERE (whatsapp IS NOT NULL AND whatsapp != '') OR (telefone IS NOT NULL AND telefone != '')"
);

console.log(`\n📱 Total de pacientes com telefone/whatsapp: ${pacientes.length}`);

let atualizados = 0;
let erros = 0;
let semNumero = 0;
let jaCorretos = 0;

for (const p of pacientes) {
  // Usar whatsapp se disponível, senão telefone
  const numeroOriginal = p.whatsapp || p.telefone;
  if (!numeroOriginal) {
    semNumero++;
    continue;
  }

  const numeroNormalizado = formatPhone(numeroOriginal);
  
  if (!numeroNormalizado) {
    console.log(`⚠️  [${p.id}] ${p.nome}: número inválido "${numeroOriginal}"`);
    erros++;
    continue;
  }

  // Verificar se já está correto
  if (p.whatsapp === numeroNormalizado) {
    jaCorretos++;
    continue;
  }

  try {
    await conn.execute(
      "UPDATE pacientes SET whatsapp = ? WHERE id = ?",
      [numeroNormalizado, p.id]
    );
    console.log(`✅ [${p.id}] ${p.nome}: "${numeroOriginal}" → "${numeroNormalizado}"`);
    atualizados++;
  } catch (err) {
    console.error(`❌ [${p.id}] ${p.nome}: erro ao atualizar - ${err.message}`);
    erros++;
  }
}

console.log(`\n📊 Resumo:`);
console.log(`   ✅ Atualizados: ${atualizados}`);
console.log(`   ✓  Já corretos: ${jaCorretos}`);
console.log(`   ⚠️  Sem número:  ${semNumero}`);
console.log(`   ❌ Erros:       ${erros}`);

await conn.end();
console.log('\n✅ Normalização concluída!');
