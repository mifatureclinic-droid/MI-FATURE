import mysql from 'mysql2/promise';

// Dra. Thiffane ID
const PROF_ID = 570009;

// Pacientes que precisam ser criados (com CPF placeholder)
const NOVOS_PACIENTES = [
  { nome: 'ROSANGELA MARIA',    cpf: '00000000001', convenioId: 600005 },
  { nome: 'ANNA CAROLINA',      cpf: '00000000002', convenioId: 600005 },
  { nome: 'ALINE ALCANTARA',    cpf: '00000000003', convenioId: 600005 },
  { nome: 'LORENA LOBAO',       cpf: '00000000004', convenioId: 600005 },
  { nome: 'CRISTIANE FARIAS',   cpf: '00000000005', convenioId: 600005 },
  { nome: 'ALBERCLAYCE',        cpf: '00000000006', convenioId: 600005 },
];

// Grade semanal: dia (1=Seg…5=Sex), hora, nome exato no banco, convenioId
// null = slot vago (não cria agendamento)
const GRADE = [
  // Segunda-feira
  { dia: 1, hora: '13:00', paciente: 'LETICIA MAGALHAES MENDES',              convenioId: 630005 },
  { dia: 1, hora: '14:00', paciente: 'ADRIANA BRITO DE SOUZA',                convenioId: 600005 },
  { dia: 1, hora: '15:00', paciente: 'ALINE FROTA DA SILVA CARDOSO BARBOSA',  convenioId: 600005 },
  { dia: 1, hora: '16:00', paciente: 'ROSANGELA MARIA',                       convenioId: 600005 },
  { dia: 1, hora: '17:00', paciente: null },
  { dia: 1, hora: '18:00', paciente: 'ANNA CAROLINA',                         convenioId: 600005 },
  { dia: 1, hora: '19:00', paciente: 'ROBSON CARVALHO DA SILVA',              convenioId: 600005 },

  // Terça-feira
  { dia: 2, hora: '13:00', paciente: 'GABRIEL PASSOS CORTEZÃO',               convenioId: 630006 },
  { dia: 2, hora: '14:00', paciente: 'RAYANE VITORIA RODRIGUES SANTOS',       convenioId: 600002 },
  { dia: 2, hora: '15:00', paciente: 'LUANA JOIA DE FIGUEIREDO COSTA BALBINO',convenioId: 600005 },
  { dia: 2, hora: '16:00', paciente: 'ASTERSON AMAZONAS DE ANDRADE',          convenioId: 600005 },
  { dia: 2, hora: '17:00', paciente: null },
  { dia: 2, hora: '18:00', paciente: 'ALINE ALCANTARA',                       convenioId: 600005 },

  // Quarta-feira
  { dia: 3, hora: '12:00', paciente: 'ADELAYNE MARIA RONDON TOME DA SILVA',   convenioId: 630002 },
  { dia: 3, hora: '13:00', paciente: 'LORENA LOBAO',                          convenioId: 600005 },
  { dia: 3, hora: '14:00', paciente: 'KARIME RITA DE SOUZA BENTES',           convenioId: 600005 },
  { dia: 3, hora: '15:00', paciente: 'ROBERTA VIEIRA BARROS MACEDO',          convenioId: 600002 },
  { dia: 3, hora: '16:00', paciente: 'IRACILDA BRAGA DANTAS',                 convenioId: 600005 },
  { dia: 3, hora: '17:00', paciente: 'CRISTIANE FARIAS',                      convenioId: 600005 },

  // Quinta-feira
  { dia: 4, hora: '13:00', paciente: 'JESSICA SAMARA BEZERRA GUIMARAES',      convenioId: 600002 },
  { dia: 4, hora: '14:00', paciente: 'SARA DE ALMEIDA BESSA AVELINO',         convenioId: 600002 },
  { dia: 4, hora: '15:00', paciente: 'JOANA BEATRIZ MAIA CASTRO',             convenioId: 600002 },
  { dia: 4, hora: '16:00', paciente: null },
  { dia: 4, hora: '17:00', paciente: null },
  { dia: 4, hora: '18:00', paciente: null },

  // Sexta-feira
  { dia: 5, hora: '13:00', paciente: 'ALBERCLAYCE',                           convenioId: 600005 },
  { dia: 5, hora: '14:00', paciente: null },
  { dia: 5, hora: '15:00', paciente: null },
  { dia: 5, hora: '16:00', paciente: null },
  { dia: 5, hora: '17:00', paciente: null },
  { dia: 5, hora: '18:00', paciente: 'SAULO RIBEIRO NUNES',                   convenioId: 600012 },
];

// Gerar datas das próximas 12 semanas a partir da próxima segunda-feira
function getProximasDatas(diaSemana, semanas = 12) {
  const datas = [];
  const hoje = new Date();
  const inicio = new Date(hoje);
  // Avançar até a próxima segunda-feira (inclusive hoje se for segunda)
  const diaHoje = inicio.getDay(); // 0=Dom
  const diasAteSegunda = diaHoje === 0 ? 1 : diaHoje === 1 ? 0 : 8 - diaHoje;
  inicio.setDate(inicio.getDate() + diasAteSegunda);
  inicio.setHours(0, 0, 0, 0);

  for (let s = 0; s < semanas; s++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + s * 7 + (diaSemana - 1));
    datas.push(d);
  }
  return datas;
}

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // 1. Cadastrar pacientes novos
  console.log('\n=== Cadastrando pacientes novos ===');
  const pacienteIds = {};

  for (const p of NOVOS_PACIENTES) {
    const [existe] = await conn.execute('SELECT id FROM pacientes WHERE nome = ?', [p.nome]);
    if (existe.length > 0) {
      pacienteIds[p.nome] = existe[0].id;
      console.log(`Já existe: ${p.nome} (id ${existe[0].id})`);
      continue;
    }
    const [result] = await conn.execute(
      'INSERT INTO pacientes (nome, cpf, dataNascimento, convenioId, numeroCarteira, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [p.nome, p.cpf, '1990-01-01', p.convenioId, 'N/A']
    );
    pacienteIds[p.nome] = result.insertId;
    console.log(`Criado: ${p.nome} (id ${result.insertId})`);
  }

  // 2. Buscar IDs dos pacientes existentes
  console.log('\n=== Buscando IDs dos pacientes existentes ===');
  const pacientesComNome = GRADE.filter(g => g.paciente && !NOVOS_PACIENTES.find(n => n.nome === g.paciente));
  const nomesUnicos = [...new Set(pacientesComNome.map(g => g.paciente))];

  for (const nome of nomesUnicos) {
    const [rows] = await conn.execute('SELECT id FROM pacientes WHERE nome = ? LIMIT 1', [nome]);
    if (rows.length > 0) {
      pacienteIds[nome] = rows[0].id;
    } else {
      // Busca parcial pelas duas primeiras palavras
      const partes = nome.split(' ').slice(0, 2).join(' ');
      const [rows2] = await conn.execute('SELECT id, nome FROM pacientes WHERE nome LIKE ? LIMIT 1', ['%' + partes + '%']);
      if (rows2.length > 0) {
        pacienteIds[nome] = rows2[0].id;
        console.log(`Match parcial: "${nome}" -> id ${rows2[0].id}: ${rows2[0].nome}`);
      } else {
        console.log(`ATENÇÃO: Paciente não encontrado: ${nome}`);
      }
    }
  }

  // 3. Criar agendamentos para as próximas 12 semanas
  console.log('\n=== Criando agendamentos ===');
  let criados = 0;
  let vagos = 0;
  let erros = 0;

  for (const slot of GRADE) {
    if (!slot.paciente) {
      vagos += 12;
      continue;
    }

    const pacienteId = pacienteIds[slot.paciente];
    if (!pacienteId) {
      console.log(`ERRO: sem ID para "${slot.paciente}"`);
      erros++;
      continue;
    }

    const datas = getProximasDatas(slot.dia, 12);

    for (const data of datas) {
      const dataStr = data.toISOString().split('T')[0];

      // Verificar se já existe agendamento ativo nesse slot
      const [existe] = await conn.execute(
        'SELECT id FROM atendimentos WHERE profissionalId = ? AND data = ? AND hora = ? AND status != "cancelado"',
        [PROF_ID, dataStr, slot.hora]
      );
      if (existe.length > 0) {
        continue;
      }

      try {
        await conn.execute(
          `INSERT INTO atendimentos (pacienteId, profissionalId, convenioId, data, hora, status, duracao, tipo, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'agendado', 60, 'Psicologia', NOW(), NOW())`,
          [pacienteId, PROF_ID, slot.convenioId, dataStr, slot.hora]
        );
        criados++;
      } catch (e) {
        console.log(`ERRO ao criar ${dataStr} ${slot.hora} paciente ${slot.paciente}: ${e.message}`);
        erros++;
      }
    }
  }

  console.log(`\n✅ Concluído:`);
  console.log(`   ${criados} agendamentos criados`);
  console.log(`   ${vagos} slots vagos ignorados`);
  console.log(`   ${erros} erros`);
  await conn.end();
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1); });
