import { invokeLLM, listLLMModels } from './_core/llm';
import { storageGetSignedUrl } from './storage';
import {
  type ExtracaoSolicitantePedido,
  validarExtracaoSolicitante,
} from '../shared/solicitantePedidoMedico';

function obterArquivoPedido(url: string) {
  if (url.startsWith('/manus-storage/')) {
    return { key: url.replace(/^\/manus-storage\//, ''), externo: false };
  }
  if (/^https:\/\//i.test(url)) return { key: url, externo: true };
  return null;
}

export async function extrairSolicitanteDoPedidoMedico(pedidoMedicoUrl: string) {
  const arquivo = obterArquivoPedido(pedidoMedicoUrl);
  if (!arquivo) {
    return {
      encontrou: false,
      salvoAutomaticamente: false,
      motivo: 'O pedido médico antigo possui apenas o nome do arquivo. Reanexe-o na Pasta do Paciente para permitir a leitura segura.',
      dados: null,
    };
  }

  const urlSegura = arquivo.externo ? arquivo.key : await storageGetSignedUrl(arquivo.key);
  const mimeType = arquivo.key.toLowerCase().endsWith('.pdf') ? 'application/pdf' : undefined;
  const catalogo = await listLLMModels();
  const model = catalogo.data.find((item) => item.id === 'gemini-3-flash-preview')?.id
    ?? catalogo.data.find((item) => item.id === 'gpt-5-mini')?.id;

  const resposta = await invokeLLM({
    model,
    maxTokens: 900,
    messages: [
      {
        role: 'system',
        content: 'Você extrai somente dados literalmente visíveis na assinatura de um pedido médico brasileiro. Nunca invente nome, conselho, registro, UF ou CBO. Se o CBO não estiver escrito, retorne null. Use confiança baixa se a assinatura não estiver claramente legível.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Leia o documento anexado e identifique exclusivamente o profissional solicitante que assina o pedido.' },
          mimeType
            ? { type: 'file_url', file_url: { url: urlSegura, mime_type: 'application/pdf' } }
            : { type: 'image_url', image_url: { url: urlSegura, detail: 'high' } },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'solicitante_pedido_medico',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            encontrado: { type: 'boolean' },
            nome: { type: ['string', 'null'] },
            conselho: { type: ['string', 'null'] },
            numeroConselho: { type: ['string', 'null'] },
            uf: { type: ['string', 'null'] },
            cbo: { type: ['string', 'null'] },
            confianca: { type: 'number', minimum: 0, maximum: 1 },
          },
          required: ['encontrado', 'nome', 'conselho', 'numeroConselho', 'uf', 'cbo', 'confianca'],
          additionalProperties: false,
        },
      },
    },
  });

  const conteudo = resposta.choices[0]?.message.content;
  const texto = typeof conteudo === 'string' ? conteudo : '';
  const extracao = JSON.parse(texto) as ExtracaoSolicitantePedido;
  const dados = validarExtracaoSolicitante(extracao);

  return {
    encontrou: Boolean(dados),
    salvoAutomaticamente: Boolean(dados),
    motivo: dados ? null : 'Não foi possível confirmar uma assinatura completa no pedido médico. Revise ou preencha manualmente.',
    dados,
  };
}
