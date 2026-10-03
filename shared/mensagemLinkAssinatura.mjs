export function formatarDataAssinatura(dataIso) {
  const partes = String(dataIso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!partes) return String(dataIso ?? 'data não informada');
  return `${partes[3]}/${partes[2]}/${partes[1]}`;
}

export function criarMensagemLinkAssinatura({ paciente, profissional, dataSessao, horario, link, horarioExpiracao, sessaoNumero, totalSessoes, avisoAdicional, ocultarSessao = false, datasAtendimento }) {
  const primeiroNome = String(paciente ?? 'Paciente').trim().split(/\s+/)[0] || 'Paciente';
  const dataFormatada = formatarDataAssinatura(dataSessao);
  const datasValidas = [...new Set(
    (Array.isArray(datasAtendimento) ? datasAtendimento : [])
      .map((data) => String(data ?? '').trim())
      .filter((data) => /^\d{4}-\d{2}-\d{2}$/.test(data)),
  )];
  const datasFormatadas = datasValidas.map(formatarDataAssinatura);
  const temMultiplasDatas = datasFormatadas.length > 1;
  const listaDeDatas = datasFormatadas.length === 2
    ? `${datasFormatadas[0]} e ${datasFormatadas[1]}`
    : datasFormatadas.join(', ');
  const numero = Math.max(1, Number(sessaoNumero) || 1);
  const total = Number(totalSessoes);
  const referenciaSessao = Number.isInteger(total) && total >= numero
    ? `${numero}ª sessão de ${total}`
    : `${numero}ª sessão`;
  const aviso = String(avisoAdicional ?? '').trim();
  const blocoAviso = aviso ? `\n\n${aviso}` : '';
  const introducao = temMultiplasDatas
    ? `Para seus atendimentos dos dias ${listaDeDatas}, às ${horario}, com ${profissional || 'a profissional responsável'}, solicitamos a assinatura digital da guia.\n\nO link possui um campo de assinatura para cada data.`
    : ocultarSessao
    ? `Para seu atendimento em ${dataFormatada}, às ${horario}, com ${profissional || 'a profissional responsável'}, solicitamos a assinatura digital da guia.`
    : `Para sua ${referenciaSessao}, em ${dataFormatada}, às ${horario}, com ${profissional || 'a profissional responsável'}, solicitamos a assinatura digital da guia.`;
  return `Olá, ${primeiroNome}!\n\n${introducao}${blocoAviso}\n\nAcesse o link para assinar:\n${link}\n\nEste link é válido até ${dataFormatada}, às ${horarioExpiracao}, uma hora antes da consulta.`;
}

export function criarMensagemLinkAssinaturaAprovada({ paciente, dataSessao, link }) {
  const primeiroNome = String(paciente ?? 'Paciente').trim().split(/\s+/)[0] || 'Paciente';
  const dataFormatada = formatarDataAssinatura(dataSessao);
  return `Olá, ${primeiroNome}.\n\nA Clínica CLIPSI solicita a sua assinatura digital da guia referente ao atendimento de ${dataFormatada}.\n\nSolicitamos, por gentileza, que abra o link abaixo e assine:\n${link}\n\nCaso precise de ajuda, entre em contato com a clínica.`;
}
