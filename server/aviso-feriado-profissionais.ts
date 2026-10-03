import { and, eq } from 'drizzle-orm';
import { cienciasAvisosProfissionais } from '../drizzle/schema';
import { getDb } from './db';
import { notifyOwner } from './_core/notification';
import {
  AVISO_FERIADO_SETEMBRO_2026,
  dataManaus,
  deveExibirAvisoFeriado,
  montarAvisoCienciaEmail,
} from '../shared/avisoFeriadoProfissionais';

const EMAIL_DESTINATARIO = 'mifatureclinic@gmail.com';
const EMAIL_COPIA_AVISO = 'gerenciaclipsi@gmail.com';

type UsuarioAviso = {
  id: number;
  perfil?: string | null;
  name?: string | null;
  profissionalVinculadoId?: number | null;
};

export async function obterAvisoFeriadoProfissional(usuario: UsuarioAviso, agora = new Date()) {
  const dataReferencia = dataManaus(agora);
  const dataReferenciaDb = new Date(`${dataReferencia}T00:00:00.000Z`);
  const db = await getDb();
  if (!db) throw new Error('Banco de dados indisponível');

  const ciencias = await db
    .select()
    .from(cienciasAvisosProfissionais)
    .where(and(
      eq(cienciasAvisosProfissionais.codigoAviso, AVISO_FERIADO_SETEMBRO_2026.codigo),
      eq(cienciasAvisosProfissionais.userId, usuario.id),
      eq(cienciasAvisosProfissionais.dataReferencia, dataReferenciaDb),
    ))
    .limit(1);

  const cienteHoje = ciencias.length > 0;
  return {
    ...AVISO_FERIADO_SETEMBRO_2026,
    dataReferencia,
    cienteHoje,
    exibir: deveExibirAvisoFeriado({
      perfil: usuario.perfil,
      dataReferencia,
      cienteHoje,
    }),
  };
}

async function enviarEmailCiencia(params: { profissional: string; dataCiencia: Date }) {
  const { assunto, texto } = montarAvisoCienciaEmail(params);
  const apiKey = process.env.RESEND_API_KEY;
  const remetente = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !remetente) {
    await notifyOwner({
      title: assunto,
      content: `${texto} E-mail pendente de configuração do serviço de envio.`,
    });
    return { emailEnviado: false, motivo: 'configuracao_de_email_pendente' as const };
  }

  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: remetente,
        to: [EMAIL_DESTINATARIO],
        cc: [EMAIL_COPIA_AVISO],
        subject: assunto,
        text: texto,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text().catch(() => '');
      console.warn('[AvisoFeriado] Falha no e-mail de ciência:', resposta.status, detalhe);
      await notifyOwner({ title: assunto, content: `${texto} Falha no envio por e-mail.` });
      return { emailEnviado: false, motivo: 'falha_no_envio' as const };
    }

    return { emailEnviado: true, motivo: null };
  } catch (erro) {
    console.warn('[AvisoFeriado] Erro no envio por e-mail:', erro);
    await notifyOwner({ title: assunto, content: `${texto} Falha no envio por e-mail.` });
    return { emailEnviado: false, motivo: 'falha_no_envio' as const };
  }
}

export async function registrarCienciaAvisoFeriado(usuario: UsuarioAviso) {
  const status = await obterAvisoFeriadoProfissional(usuario);
  if (usuario.perfil !== 'profissional') {
    throw new Error('Este aviso é restrito a profissionais.');
  }
  if (status.dataReferencia < AVISO_FERIADO_SETEMBRO_2026.inicio || status.dataReferencia > AVISO_FERIADO_SETEMBRO_2026.fim) {
    throw new Error('O período deste aviso já não está ativo.');
  }

  const db = await getDb();
  if (!db) throw new Error('Banco de dados indisponível');

  if (status.cienteHoje) {
    return { registradoAgora: false, dataCiencia: null, emailEnviado: false };
  }

  const agora = new Date();
  try {
    await db.insert(cienciasAvisosProfissionais).values({
      codigoAviso: AVISO_FERIADO_SETEMBRO_2026.codigo,
      userId: usuario.id,
      profissionalId: usuario.profissionalVinculadoId ?? null,
      dataReferencia: new Date(`${status.dataReferencia}T00:00:00.000Z`),
      dataCiencia: agora,
    });
  } catch (erro) {
    // A tabela impede duas ciências para o mesmo aviso, utilizador e dia.
    // Se outro clique/aba já inseriu o registro, tratamos como sucesso idempotente.
    const statusRevalidado = await obterAvisoFeriadoProfissional(usuario);
    if (statusRevalidado.cienteHoje) {
      return { registradoAgora: false, dataCiencia: null, emailEnviado: false };
    }
    throw erro;
  }

  const envio = await enviarEmailCiencia({
    profissional: usuario.name?.trim() || 'Profissional',
    dataCiencia: agora,
  });

  return { registradoAgora: true, dataCiencia: agora, ...envio };
}
