/**
 * Helper para integração com a Evolution API (WhatsApp)
 * Instância: mifatureclinic
 */

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || 'http://34.148.112.103:8080';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || 'mifature_evolution_key_2026';
const INSTANCE_NAME = 'mifatureclinic';

const headers = {
  'Content-Type': 'application/json',
  'apikey': EVOLUTION_KEY,
};

// ─── Instância ────────────────────────────────────────────────────────────────

export async function createInstance(): Promise<{ instance: string; status: string }> {
  const res = await fetch(`${EVOLUTION_URL}/instance/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      instanceName: INSTANCE_NAME,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao criar instância: ${err}`);
  }
  return res.json();
}

export async function getInstanceStatus(): Promise<{
  instance: { instanceName: string; state: string };
  qrcode?: { base64: string; code: string };
}> {
  // Usa fetchInstances (funciona externamente) em vez de connectionState (timeout externo)
  const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, { headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao obter estado: ${err}`);
  }
  const instances: any[] = await res.json();
  const inst = instances.find((i: any) => i.name === INSTANCE_NAME || i.instance?.instanceName === INSTANCE_NAME);
  if (!inst) {
    return { instance: { instanceName: INSTANCE_NAME, state: 'close' } };
  }
  // connectionStatus: 'open' | 'connecting' | 'close'
  const state = inst.connectionStatus || inst.instance?.state || 'close';
  return { instance: { instanceName: INSTANCE_NAME, state } };
}

export async function getQRCode(): Promise<{ base64?: string; code?: string; pairingCode?: string; qrcode?: { base64: string; code: string } }> {
  const res = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE_NAME}`, {
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Erro ao obter QR Code: ${err}`);
  }
  return res.json();
}

export async function disconnectInstance(): Promise<void> {
  await fetch(`${EVOLUTION_URL}/instance/logout/${INSTANCE_NAME}`, {
    method: 'DELETE',
    headers,
  });
}

export async function fetchInstances(): Promise<Array<{ instance: { instanceName: string; status: string } }>> {
  const res = await fetch(`${EVOLUTION_URL}/instance/fetchInstances`, { headers });
  if (!res.ok) return [];
  return res.json();
}

// ─── Envio de mensagens ───────────────────────────────────────────────────────

/**
 * Formata o número de telefone para o formato internacional (Evolution API)
 * Formatos suportados:
 *   "92-981120173"   → "5592981120173"
 *   "92 998187918"   → "5592998187918"
 *   "(11) 98888-7777" → "5511988887777"
 *   "92999045415"    → "5592999045415"
 *   "994444911"      → "5592994444911" (9 dígitos sem DDD → assume DDD 92)
 *   "91345787"       → "55929991345787" (8 dígitos sem DDD → assume DDD 92 + dígito 9)
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  // Remove todos os caracteres não numéricos (espaços, hífens, parênteses, etc.)
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Já está no formato internacional completo: 55 + DDD(2) + número(8-9) = 12-13 dígitos
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  // 11 dígitos: DDD(2) + 9 + número(8) — formato padrão celular brasileiro
  if (digits.length === 11) return `55${digits}`;
  // 10 dígitos: DDD(2) + número(8) — celular sem o dígito 9 ou fixo
  if (digits.length === 10) return `55${digits}`;
  // 9 dígitos: sem DDD, começa com 9 — assume DDD 92 (Amazonas)
  if (digits.length === 9) return `5592${digits}`;
  // 8 dígitos: número fixo ou celular sem DDD e sem dígito 9 — assume DDD 92 + dígito 9
  if (digits.length === 8) return `559299${digits}`;
  // Qualquer outro caso: adiciona 55 e tenta
  return `55${digits}`;
}

export async function sendTextMessage(phone: string, text: string): Promise<boolean> {
  try {
    const number = formatPhone(phone);
    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE_NAME}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        number,
        text,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendDocumentMessage(
  phone: string,
  documentUrl: string,
  fileName: string,
  caption?: string
): Promise<boolean> {
  try {
    const number = formatPhone(phone);
    const res = await fetch(`${EVOLUTION_URL}/message/sendMedia/${INSTANCE_NAME}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        number,
        mediatype: 'document',
        media: documentUrl,
        fileName,
        caption: caption || '',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Mensagens pré-formatadas ─────────────────────────────────────────────────

export function buildAgendamentoMsg(params: {
  pacienteNome: string;
  data: string;
  hora: string;
  profissionalNome: string;
  clinicaNome?: string;
}): string {
  const { pacienteNome, data, hora, profissionalNome, clinicaNome = 'MiFatureClinic' } = params;
  return `Olá, ${pacienteNome}! 👋\n\nSeu agendamento foi confirmado:\n\n📅 *Data:* ${data}\n⏰ *Hora:* ${hora}\n👨‍⚕️ *Profissional:* ${profissionalNome}\n🏥 *Clínica:* ${clinicaNome}\n\nEm caso de dúvidas, entre em contato conosco. Até logo! 😊`;
}

export function buildAssinaturaMsg(params: {
  pacienteNome: string;
  sessao: string;
  data: string;
  linkAssinatura: string;
}): string {
  const { pacienteNome, sessao, data, linkAssinatura } = params;
  return `Olá ${pacienteNome}! 👋\n\nSua guia SADT está pronta para assinatura. Clique no link abaixo para assinar digitalmente com validade jurídica:\n\n🔗 ${linkAssinatura}\n\n✅ ${sessao} - ${data}\n⏰ Link válido por 24 horas\n\nAtenciosamente,\nEquipe MiFatureClinic 🏥`;
}

export function buildConfirmacaoMsg(params: {
  pacienteNome: string;
  data: string;
  hora: string;
  linkConfirmacao: string;
}): string {
  const { pacienteNome, data, hora, linkConfirmacao } = params;
  return `Olá ${pacienteNome}, seu atendimento está agendado para o dia ${data} às ${hora}, podemos confirmar sua presença?\nPara confirmar ou desmarcar, clique no link: 🗓️ ${linkConfirmacao}\n\nDúvidas ou demais informações pode encaminhar por aqui que a gente responde!\nDica: Adicione este número aos Contatos para habilitar a confirmação no link acima. Aguardamos você!`;
}
