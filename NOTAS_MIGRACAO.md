# Notas da migração para fora do Manus

Este projeto foi adaptado a partir do `mifature-portal` original para poder
rodar sem depender da plataforma Manus. Este documento lista **exatamente**
o que mudou, o que ficou igual, e o que ainda precisa de trabalho.

## ✅ O que foi migrado e já deve funcionar

| Área | Antes (Manus) | Agora |
|---|---|---|
| Login | Manus OAuth (`server/_core/oauth.ts`, `sdk.ts`) | Google OAuth 2.0, direto. O app **já tinha** também um login manual por e-mail/senha (`loginManual` em `routers.ts`) que nunca dependeu do Manus — continua funcionando sem nenhuma mudança. |
| Sessão | JWT assinado localmente (já não dependia do Manus para isso) | Igual, só o payload mudou (agora carrega `email` também) |
| Armazenamento de arquivos | Manus Forge → presign S3 | Cloudflare R2 (compatível com S3) via `@aws-sdk/client-s3`, que **já estava** no `package.json` |
| URLs de arquivo salvas no banco (`/manus-storage/...`) | — | Mantidas exatamente iguais de propósito, para não quebrar registros já existentes no banco |
| Notificação ao dono do sistema | Manus Notification Service | Webhook Slack/Discord (grátis) opcional; se não configurado, só loga no console em vez de falhar |
| Lembrete diário de atendimento (cron) | Autenticado via sessão especial `cron_*` do Heartbeat do Manus | Autenticado por um segredo simples (`CRON_SECRET`) que você aponta em qualquer agendador externo grátis |
| Extração por IA do médico solicitante em PDFs (`server/_core/llm.ts`, usado por `solicitantePedidoMedico.ts`) | Manus Forge LLM gateway | Google Gemini API direto (`gemini-3-flash-preview`, tier grátis). Mesmas funções/tipos exportados — `solicitantePedidoMedico.ts` não precisou de nenhuma mudança |

### Sobre a migração do `llm.ts` (leia antes de confiar 100%)

- Convertido manualmente o formato de chamada (mensagens + PDF anexado +
  `response_format: json_schema`) para o formato nativo do Gemini
  (`contents` + `inline_data` em base64 + `responseSchema`). É uma tradução
  de formato entre duas APIs bem diferentes — recomendo testar com alguns
  PDFs reais de pedido médico antes de confiar em produção.
- Chamadas com `tools`/`tool_choice` (function calling) **não foram
  implementadas** neste adaptador — não há nenhum uso disso hoje no
  código, mas se algo futuro precisar, vai lançar um erro claro em vez de
  falhar silenciosamente.
- A validação existente em `shared/solicitantePedidoMedico.ts`
  (`validarExtracaoSolicitante`, confiança mínima 0.85, formato de CRM/UF)
  continua intacta — se a IA errar ou tiver baixa confiança, o sistema já
  cai para preenchimento manual, como antes.

## ⚠️ O que AINDA depende do Manus (não migrado)

Estes arquivos chamam o gateway "Forge" do Manus e vão falhar fora dele até
serem adaptados para um provedor próprio:

- `server/_core/imageGeneration.ts`, `voiceTranscription.ts`, `map.ts`,
  `dataApi.ts`, `server/_core/heartbeat.ts` (a API de agendar/editar cron
  do Manus, diferente do handler do lembrete que já foi migrado acima) —
  verificados e **não são chamados por nenhuma rota ativa do app hoje**,
  então não afetam o funcionamento atual. Ficaram no código apenas para não
  quebrar a compilação.

## 🔒 Achado de segurança (não relacionado à migração)

`server/_core/env.ts` continha, no código-fonte original, uma URL e uma API
key reais do servidor Evolution API (WhatsApp) como valor padrão hardcoded.
Removi esse fallback: agora `EVOLUTION_API_URL` e `EVOLUTION_API_KEY`
precisam ser definidos via variável de ambiente. **Recomendo rotacionar
essa chave**, já que ela esteve exposta dentro do repositório.

## Como fazer o deploy (resumo)

1. Banco: crie um cluster grátis no **TiDB Cloud** (tier Starter) e use a
   connection string como `DATABASE_URL`.
2. Login: crie credenciais OAuth no **Google Cloud Console** e preencha
   `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
3. Arquivos: crie um bucket no **Cloudflare R2** e preencha as variáveis
   `R2_*`.
4. Hospedagem: suba o repositório num **Web Service grátis no Render**
   (ou Fly.io) e configure todas as variáveis de `.env.example` no painel.
5. (Opcional) Lembrete diário: configure um agendador grátis
   (cron-job.org, GitHub Actions) para chamar
   `POST /api/scheduled/lembrete-atendimento` com
   `Authorization: Bearer <CRON_SECRET>`.
6. Rode `pnpm install`, `pnpm db:push` e `pnpm test` localmente com as
   novas variáveis antes de subir para produção.
