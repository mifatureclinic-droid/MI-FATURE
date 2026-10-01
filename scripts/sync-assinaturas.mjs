/**
 * Script de sincronização de assinaturas de assinaturasGuias → assinaturasSadt
 * Executa a migração directamente via SQL
 */
import mysql from 'mysql2/promise';
import crypto from 'crypto';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL não definida');
  process.exit(1);
}

async function sincronizar() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🔄 Iniciando sincronização de assinaturas...\n');
    
    // 1. Buscar todas as assinaturas já realizadas em assinaturasGuias
    const [assinadas] = await conn.execute(`
      SELECT ag.id, ag.guiaId, ag.pacienteId, ag.assinaturaPacienteUrl,
             ag.dataAssinatura, ag.hashAssinatura, ag.sessaoNumero, ag.createdAt
      FROM assinaturasGuias ag
      WHERE ag.hashAssinatura IS NOT NULL AND ag.hashAssinatura != ''
      ORDER BY ag.createdAt ASC
    `);
    
    console.log(`📋 Total de assinaturas realizadas em assinaturasGuias: ${assinadas.length}`);
    
    let migrados = 0;
    let ignorados = 0;
    let erros = 0;
    
    for (const ag of assinadas) {
      try {
        // Verificar se já existe em assinaturasSadt
        const [existente] = await conn.execute(`
          SELECT id FROM assinaturasSadt 
          WHERE guiaId = ? AND pacienteId = ? AND numeroSessao = ?
          LIMIT 1
        `, [ag.guiaId, ag.pacienteId, ag.sessaoNumero]);
        
        if (existente.length > 0) {
          ignorados++;
          continue;
        }
        
        // Buscar dados da guia
        const [guiaRows] = await conn.execute(`
          SELECT g.id, g.profissionalId, g.atendimentoId, g.dataEmissao, g.procedimento
          FROM guias g WHERE g.id = ?
          LIMIT 1
        `, [ag.guiaId]);
        
        if (guiaRows.length === 0) {
          console.warn(`⚠️  Guia ${ag.guiaId} não encontrada, ignorando assinatura ${ag.id}`);
          ignorados++;
          continue;
        }
        
        const guia = guiaRows[0];
        
        // Buscar dados do paciente
        const [pacienteRows] = await conn.execute(`
          SELECT p.nome, p.cpf, p.whatsapp FROM pacientes p WHERE p.id = ?
          LIMIT 1
        `, [ag.pacienteId]);
        
        const paciente = pacienteRows[0] || { nome: 'Paciente', cpf: null, whatsapp: null };
        
        // Gerar token único para migração
        const tokenMigracao = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const dataSessao = guia.dataEmissao ? new Date(guia.dataEmissao) : new Date(ag.createdAt);
        const procedimento = guia.procedimento || 'Procedimento';
        
        // Inserir em assinaturasSadt
        await conn.execute(`
          INSERT INTO assinaturasSadt 
          (guiaId, pacienteId, profissionalId, atendimentoId, numeroSessao, dataSessao,
           procedimento, pacienteNome, pacienteCpf, pacienteWhatsapp, token, tokenExpiresAt,
           status, assinaturaDataUrl, assinaturaHash, dataAssinatura, whatsappEnviado, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assinado', ?, ?, ?, 1, ?, NOW())
        `, [
          ag.guiaId,
          ag.pacienteId,
          guia.profissionalId || null,
          guia.atendimentoId || null,
          ag.sessaoNumero || 1,
          dataSessao,
          procedimento,
          paciente.nome,
          paciente.cpf || null,
          paciente.whatsapp || null,
          tokenMigracao,
          tokenExpiresAt,
          ag.assinaturaPacienteUrl,
          ag.hashAssinatura,
          ag.dataAssinatura ? new Date(ag.dataAssinatura) : new Date(ag.createdAt),
          new Date(ag.createdAt),
        ]);
        
        migrados++;
        if (migrados % 10 === 0) {
          console.log(`  ✅ ${migrados} assinaturas migradas...`);
        }
        
      } catch (err) {
        console.error(`  ❌ Erro ao migrar assinatura ${ag.id}:`, err.message);
        erros++;
      }
    }
    
    console.log('\n📊 Resultado da sincronização:');
    console.log(`  ✅ Migradas: ${migrados}`);
    console.log(`  ⏭️  Ignoradas (já existiam): ${ignorados}`);
    console.log(`  ❌ Erros: ${erros}`);
    
    // Verificar total final em assinaturasSadt
    const [[total]] = await conn.execute('SELECT COUNT(*) as total FROM assinaturasSadt');
    console.log(`\n📋 Total em assinaturasSadt agora: ${total.total}`);
    
  } finally {
    await conn.end();
  }
}

sincronizar().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
