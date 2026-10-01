import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { calcularExpiracaoLinkManaus, janelaEnvioAssinaturaEstaAberta } from '../../shared/expiracaoLinkAssinatura.mjs';
import { criarMensagemLinkAssinatura, criarMensagemLinkAssinaturaAprovada } from '../../shared/mensagemLinkAssinatura.mjs';
import { determinarModoEnvioAssinatura, deveEnviarWhatsApp } from '../../shared/modoEnvioAssinatura.mjs';
import { calcularNumeroSessaoSerie, formatarReferenciaSessao } from '../../shared/sessaoSerie.mjs';

const aplicar = process.argv.includes('--apply');
const preparar = process.argv.includes('--prepare');
const modo = determinarModoEnvioAssinatura({ aplicar, preparar });
const persistirTokens = modo === 'aplicado' || modo === 'preparado';
const escopoArg = process.argv.find((arg) => arg.startsWith('--profissionais='));
const dataArg = process.argv.find((arg) => arg.startsWith('--data='));
const atendimentosArg = process.argv.find((arg) => arg.startsWith('--atendimentos='));
const avisoArg = process.argv.find((arg) => arg.startsWith('--aviso='));
const mensagemAprovada = process.argv.includes('--mensagem-aprovada');
const ocultarSessao = process.argv.includes('--sem-sessao');
const avisoAdicional = String(avisoArg?.split('=').slice(1).join('=') || '').trim();
const profissionalIds = new Set(
  String(escopoArg?.split('=').slice(1).join('=') || '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0),
);
const atendimentoIds = new Set(
  String(atendimentosArg?.split('=').slice(1).join('=') || '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id > 0),
);
const databaseUrl = process.env.DATABASE_URL;
const evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
const evolutionKey = process.env.EVOLUTION_API_KEY;
const instance = process.env.EVOLUTION_INSTANCE_NAME || 'mifatureclinic';
const agoraManaus = new Date();
const dataAtualManaus = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' }).format(agoraManaus);
const hoje = String(dataArg?.split('=').slice(1).join('=') || dataAtualManaus).trim();
const horaAtual = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Manaus', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(agoraManaus);
const reportPath = new URL('../../relatorio_links_assinatura_hoje.json', import.meta.url);

if (!databaseUrl) throw new Error('DATABASE_URL não está disponível.');
if (!/^\d{4}-\d{2}-\d{2}$/.test(hoje)) {
  throw new Error('Data inválida: informe --data=AAAA-MM-DD.');
}
if (persistirTokens && profissionalIds.size === 0) {
  throw new Error('Preparação bloqueada: informe --profissionais=<ids> para selecionar explicitamente os profissionais.');
}
if (deveEnviarWhatsApp(modo) && (!evolutionUrl || !evolutionKey)) throw new Error('Evolution API não está configurada.');

const normalizarTelefone = (telefone) => String(telefone ?? '').replace(/\D/g, '');
const ehIsentoDeAssinatura = (convenio) => /medi?service|proasa|affeam|fusex/i.test(String(convenio ?? ''));
const normalizarDatasAtendimento = (valor, dataPadrao) => {
  try {
    const datas = Array.isArray(valor) ? valor : JSON.parse(String(valor ?? '[]'));
    const normalizadas = [...new Set(
      (Array.isArray(datas) ? datas : [])
        .map((data) => String(data ?? '').trim())
        .filter((data) => /^\d{4}-\d{2}-\d{2}$/.test(data)),
    )];
    return normalizadas.length > 0 ? normalizadas : [dataPadrao];
  } catch {
    return [dataPadrao];
  }
};

const connection = await mysql.createConnection(databaseUrl);
const enviados = [];
const pendentes = [];
const foraDoEscopo = [];

try {
  const [atendimentos] = await connection.execute(
    `SELECT
      a.id AS atendimentoId, a.data, a.hora, a.guiaId, a.serieId,
      p.nome AS paciente, p.telefone,
      pr.id AS profissionalId, pr.nome AS profissional,
      c.nome AS convenio,
      g.id AS guiaEncontradaId, g.numeroGuia, g.serieSessaoInicio, g.serieSessaoFim, g.totalSessoes AS totalSessoesGuia,
      g.pacienteId AS guiaPacienteId, g.profissionalId AS guiaProfissionalId, g.procedimento AS procedimentoGuia,
      MAX(CASE WHEN s.status = 'assinado' THEN 1 ELSE 0 END) AS assinaturaConcluida,
      MAX(CASE WHEN s.status = 'pendente' THEN 1 ELSE 0 END) AS linkPendente,
      MAX(s.token) AS tokenPendente
    FROM atendimentos a
    JOIN pacientes p ON p.id = a.pacienteId
    LEFT JOIN profissionais pr ON pr.id = a.profissionalId
    LEFT JOIN convenios c ON c.id = a.convenioId
    LEFT JOIN guias g ON g.id = a.guiaId OR g.atendimentoId = a.id
    LEFT JOIN assinaturasSadt s ON s.atendimentoId = a.id OR (s.guiaId = g.id AND s.dataSessao = a.data)
    WHERE a.data = ? AND a.status NOT IN ('cancelado', 'falta')
    GROUP BY a.id, a.data, a.hora, a.guiaId, a.serieId, p.nome, p.telefone, pr.id, pr.nome, c.nome, g.id, g.numeroGuia, g.serieSessaoInicio, g.serieSessaoFim, g.totalSessoes
    ORDER BY a.hora`,
    [hoje],
  );

  for (const item of atendimentos) {
    const base = {
      atendimentoId: item.atendimentoId,
      paciente: item.paciente,
      profissionalId: item.profissionalId,
      profissional: item.profissional,
      convenio: item.convenio,
      horario: item.hora,
    };
    if (!profissionalIds.has(Number(item.profissionalId))) {
      foraDoEscopo.push(base);
      continue;
    }
    if (atendimentoIds.size > 0 && !atendimentoIds.has(Number(item.atendimentoId))) {
      pendentes.push({ ...base, motivo: 'atendimento_não_selecionado' });
      continue;
    }
    if (Number(item.atendimentoId) === 1830525) {
      pendentes.push({ ...base, motivo: 'já_enviado_no_teste' });
      continue;
    }
    const expiracao = calcularExpiracaoLinkManaus(hoje, item.hora);
    const expiraHora = expiracao?.horaManaus;
    if (Number(item.assinaturaConcluida) === 1) {
      pendentes.push({ ...base, motivo: 'já_assinado' });
      continue;
    }
    if (ehIsentoDeAssinatura(item.convenio)) {
      pendentes.push({ ...base, motivo: 'assinatura_em_guia_fisica' });
      continue;
    }
    if (!janelaEnvioAssinaturaEstaAberta({
      dataSessao: hoje,
      dataAtual: dataAtualManaus,
      horaAtual,
      horaExpiracao: expiraHora,
    })) {
      pendentes.push({ ...base, motivo: 'janela_de_envio_expirada' });
      continue;
    }
    if (!item.guiaEncontradaId) {
      pendentes.push({ ...base, motivo: 'sem_guia_vinculada' });
      continue;
    }
    const telefone = normalizarTelefone(item.telefone);
    if (!/^\d{10,11}$/.test(telefone)) {
      pendentes.push({ ...base, motivo: 'telefone_inválido_ou_ausente' });
      continue;
    }

    let atendimentosAnteriores = 0;
    if (item.serieId) {
      const [anteriores] = await connection.execute(
        `SELECT COUNT(*) AS total
         FROM atendimentos
         WHERE serieId = ? AND status <> 'cancelado'
           AND (data < ? OR (data = ? AND hora < ?))`,
        [item.serieId, item.data, item.data, item.hora],
      );
      atendimentosAnteriores = Number(anteriores[0]?.total ?? 0);
    }
    const sessaoNumero = item.serieId
      ? calcularNumeroSessaoSerie({ sessaoInicial: item.serieSessaoInicio, atendimentosAnteriores })
      : 1;
    const totalSessoes = item.serieId && Number(item.serieSessaoFim) >= Number(item.serieSessaoInicio)
      ? Number(item.serieSessaoFim) - Number(item.serieSessaoInicio) + 1
      : Number(item.totalSessoesGuia) || undefined;
    const token = item.tokenPendente || randomUUID().replace(/-/g, '');
    // O banco armazena TIMESTAMP em UTC. A expiração informada ao paciente é em Manaus (UTC-4).
    const expiraEm = expiracao.timestampUtc;
    const expiraEmManaus = `${hoje} ${expiraHora}:00`;
    const link = `https://mifature.click/assinar-sessao/${token}`;
    const [metadadosLink] = await connection.execute(
      `SELECT datasAtendimento FROM assinaturasGuias WHERE token = ? LIMIT 1`,
      [token],
    );
    const datasAtendimento = normalizarDatasAtendimento(metadadosLink[0]?.datasAtendimento, hoje);
    const mensagem = mensagemAprovada
      ? criarMensagemLinkAssinaturaAprovada({ paciente: item.paciente, dataSessao: hoje, link })
      : criarMensagemLinkAssinatura({
          paciente: item.paciente,
          profissional: item.profissional,
          dataSessao: hoje,
          horario: item.hora,
          link,
          horarioExpiracao: expiraHora,
          sessaoNumero,
          totalSessoes,
          avisoAdicional,
          ocultarSessao,
          datasAtendimento,
        });

    if (persistirTokens) {
      await connection.beginTransaction();
      try {
        if (item.linkPendente && item.tokenPendente) {
          if (deveEnviarWhatsApp(modo)) {
            await connection.execute(
              `UPDATE assinaturasSadt
               SET tokenExpiresAt = ?, dataSessao = ?, whatsappEnviado = 1, dataEnvioWhatsapp = NOW()
               WHERE atendimentoId = ? AND status = 'pendente'`,
              [expiraEm, hoje, item.atendimentoId],
            );
          } else {
            await connection.execute(
              `UPDATE assinaturasSadt
               SET tokenExpiresAt = ?, dataSessao = ?
               WHERE atendimentoId = ? AND status = 'pendente'`,
              [expiraEm, hoje, item.atendimentoId],
            );
          }
        } else {
          if (deveEnviarWhatsApp(modo)) {
            await connection.execute(
              `INSERT INTO assinaturasSadt
               (guiaId, pacienteId, profissionalId, atendimentoId, dataSessao, procedimento, pacienteNome, pacienteWhatsapp, token, tokenExpiresAt, status, whatsappEnviado, dataEnvioWhatsapp, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 1, NOW(), NOW())`,
              [item.guiaEncontradaId, item.guiaPacienteId, item.guiaProfissionalId, item.atendimentoId, hoje, item.procedimentoGuia, item.paciente, telefone, token, expiraEm],
            );
          } else {
            await connection.execute(
              `INSERT INTO assinaturasSadt
               (guiaId, pacienteId, profissionalId, atendimentoId, dataSessao, procedimento, pacienteNome, pacienteWhatsapp, token, tokenExpiresAt, status, whatsappEnviado, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0, NOW())`,
              [item.guiaEncontradaId, item.guiaPacienteId, item.guiaProfissionalId, item.atendimentoId, hoje, item.procedimentoGuia, item.paciente, telefone, token, expiraEm],
            );
          }
        }
        const [linksSessao] = await connection.execute(
          `SELECT id FROM assinaturasGuias WHERE token = ? LIMIT 1`,
          [token],
        );
        if (linksSessao.length > 0) {
          await connection.execute(
            `UPDATE assinaturasGuias
             SET guiaId = ?, pacienteId = ?, sessaoNumero = ?, tokenExpiresAt = ?, datasAtendimento = ?
             WHERE id = ?`,
            [item.guiaEncontradaId, item.guiaPacienteId, sessaoNumero, expiraEm, JSON.stringify(datasAtendimento), linksSessao[0].id],
          );
        } else {
          await connection.execute(
            `INSERT INTO assinaturasGuias
             (guiaId, pacienteId, sessaoNumero, token, tokenExpiresAt, datasAtendimento, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [item.guiaEncontradaId, item.guiaPacienteId, sessaoNumero, token, expiraEm, JSON.stringify(datasAtendimento)],
          );
        }
        if (deveEnviarWhatsApp(modo)) {
          const resposta = await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: { apikey: evolutionKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: `55${telefone}`, text: mensagem }),
          });
          if (!resposta.ok) throw new Error(`WhatsApp respondeu ${resposta.status}: ${await resposta.text()}`);
        }
        await connection.commit();
        enviados.push({
          ...base,
          telefoneFinal: telefone.slice(-4),
          expiraEm: expiraEmManaus,
          link,
          mensagem,
          referenciaSessao: formatarReferenciaSessao({ sessaoNumero, totalSessoes }),
          status: deveEnviarWhatsApp(modo) ? 'enviado' : 'preparado',
        });
      } catch (erro) {
        await connection.rollback();
        pendentes.push({ ...base, motivo: 'falha_no_envio', detalhe: String(erro) });
      }
    } else {
      enviados.push({ ...base, telefoneFinal: telefone.slice(-4), expiraEm: expiraEmManaus, status: 'simulação' });
    }
  }
} finally {
  await connection.end();
}

const resultado = {
  data: hoje,
  horaAtualManaus: horaAtual,
  modo,
  profissionaisSelecionados: [...profissionalIds],
  atendimentosSelecionados: [...atendimentoIds],
  enviados,
  pendentes,
  foraDoEscopo,
};
await writeFile(reportPath, JSON.stringify(resultado, null, 2));
console.log(JSON.stringify({ data: hoje, horaAtualManaus: horaAtual, enviados: enviados.length, pendentes: pendentes.length, reportPath: reportPath.pathname }, null, 2));
