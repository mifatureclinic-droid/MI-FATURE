export const ENV = {
  // --- Core (unchanged) ---
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // --- Google OAuth (replaces Manus OAuth) ---
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // --- Cloudflare R2 storage (replaces Manus Forge storage) ---
  // R2 is S3-compatible: https://developers.cloudflare.com/r2/api/s3/
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "",

  // --- Owner notifications (replaces Manus Notification Service) ---
  // Optional: paste a Slack or Discord "Incoming Webhook" URL (both free).
  // If unset, notifications are just logged to the server console instead of failing.
  ownerNotifyWebhookUrl: process.env.OWNER_NOTIFY_WEBHOOK_URL ?? "",

  // --- Cron secret (replaces Manus Heartbeat cron auth) ---
  // Used to authorize calls to /api/scheduled/lembrete-atendimento from an
  // external free scheduler (e.g. cron-job.org, GitHub Actions schedule).
  cronSecret: process.env.CRON_SECRET ?? "",

  // --- Gemini API (replaces the Manus Forge LLM gateway) ---
  // Used by server/_core/llm.ts, in turn used by the medical-requisition
  // PDF extraction feature (server/solicitantePedidoMedico.ts).
  // Free tier: https://aistudio.google.com/apikey
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",

  // --- Manus-only "Forge" gateway (image gen, voice, maps, cron) ---
  // NOT replaced in this pass. imageGeneration.ts, voiceTranscription.ts,
  // map.ts, dataApi.ts and heartbeat.ts still call this gateway and will
  // fail outside Manus. Verified: none of these are called by any active
  // route in the app today. Kept here only so those files keep compiling.
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // --- WhatsApp (Evolution API) — already external to Manus, unchanged ---
  // NOTE: previously had hardcoded fallback values baked into the source
  // (a real API key + IP address). Removed for security: both must now be
  // set explicitly via environment variables, and you should rotate that
  // key since it was committed to the repo.
  evolutionApiUrl: process.env.EVOLUTION_API_URL ?? "",
  evolutionApiKey: process.env.EVOLUTION_API_KEY ?? "",
};
