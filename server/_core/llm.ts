// LLM adapter — talks directly to the Google Gemini API, replacing the
// Manus Forge LLM gateway. Public types/functions (Message, InvokeParams,
// InvokeResult, invokeLLM, listLLMModels...) are kept byte-for-byte
// compatible with the original so callers (e.g.
// server/solicitantePedidoMedico.ts) did not need any changes.
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: { name: string };
};
export type ToolChoice = ToolChoicePrimitive | ToolChoiceByName | ToolChoiceExplicit;

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

const DEFAULT_MODEL = "gemini-3-flash-preview";

// Free-tier-friendly models actually available on the real Gemini API today.
// listLLMModels() is only used by callers to pick an id from this list, so
// keeping "gemini-3-flash-preview" first preserves existing selection logic
// (e.g. solicitantePedidoMedico.ts looks for this exact id).
const AVAILABLE_MODELS: ModelInfo[] = [
  { id: "gemini-3-flash-preview", object: "model", created: 0, owned_by: "google" },
  { id: "gemini-2.5-flash", object: "model", created: 0, owned_by: "google" },
  { id: "gemini-2.5-pro", object: "model", created: 0, owned_by: "google" },
];

export async function listLLMModels(): Promise<ModelsResponse> {
  return { object: "list", data: AVAILABLE_MODELS };
}

const assertApiKey = () => {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
};

const RETRY_MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 500;
const RETRY_MAX_DELAY_MS = 30_000;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const parseRetryAfter = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const at = Date.parse(value);
  return Number.isNaN(at) ? undefined : Math.max(0, at - Date.now());
};

const computeBackoffDelay = (attempt: number, retryAfterMs?: number): number => {
  const cap = Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, RETRY_MAX_DELAY_MS);
  const jittered = cap / 2 + Math.random() * (cap / 2);
  return Math.min(Math.max(jittered, retryAfterMs ?? 0), RETRY_MAX_DELAY_MS);
};

const fetchWithBackoff = async (url: string, init: NonNullable<Parameters<typeof fetch>[1]>): Promise<Response> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === RETRY_MAX_RETRIES) return response;
      const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
      try { await response.body?.cancel(); } catch { /* noop */ }
      console.warn(`LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after status ${response.status}`);
      await sleep(computeBackoffDelay(attempt, retryAfterMs));
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_MAX_RETRIES) throw error;
      console.warn(`LLM request retry ${attempt + 1}/${RETRY_MAX_RETRIES} after network error`);
      await sleep(computeBackoffDelay(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error("LLM request failed after exhausting retries");
};

async function fetchAsBase64(url: string): Promise<string> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch attachment for LLM (${resp.status})`);
  const buf = Buffer.from(await resp.arrayBuffer());
  return buf.toString("base64");
}

// --- JSON Schema (draft-ish, as used by our own callers) -> Gemini's
// OpenAPI-3.0-subset Schema object. Handles the subset actually in use:
// object/properties/required, string/number/boolean/array, and the
// `type: [X, "null"]` union pattern -> `{ type: X, nullable: true }`.
function convertJsonSchemaToGemini(schema: any): any {
  if (schema == null || typeof schema !== "object") return schema;

  let nullable = false;
  let type = schema.type;
  if (Array.isArray(type)) {
    nullable = type.includes("null");
    type = type.find((t: string) => t !== "null");
  }

  const typeMap: Record<string, string> = {
    string: "STRING",
    number: "NUMBER",
    integer: "INTEGER",
    boolean: "BOOLEAN",
    object: "OBJECT",
    array: "ARRAY",
  };

  const out: Record<string, unknown> = {};
  if (type && typeMap[type]) out.type = typeMap[type];
  if (nullable) out.nullable = true;
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;

  if (type === "object" && schema.properties) {
    out.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([k, v]) => [k, convertJsonSchemaToGemini(v)])
    );
    if (Array.isArray(schema.required)) out.required = schema.required;
  }

  if (type === "array" && schema.items) {
    out.items = convertJsonSchemaToGemini(schema.items);
  }

  return out;
}

async function buildGeminiParts(
  content: MessageContent | MessageContent[]
): Promise<Array<{ text: string } | { inline_data: { mime_type: string; data: string } }>> {
  const items = Array.isArray(content) ? content : [content];
  const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [];

  for (const item of items) {
    if (typeof item === "string") {
      parts.push({ text: item });
      continue;
    }
    if (item.type === "text") {
      parts.push({ text: item.text });
      continue;
    }
    if (item.type === "file_url") {
      const data = await fetchAsBase64(item.file_url.url);
      parts.push({ inline_data: { mime_type: item.file_url.mime_type || "application/pdf", data } });
      continue;
    }
    if (item.type === "image_url") {
      const data = await fetchAsBase64(item.image_url.url);
      // Best-effort mime type guess; Gemini infers from bytes if this is
      // slightly wrong for jpeg-vs-png, but this covers our real usage.
      parts.push({ inline_data: { mime_type: "image/png", data } });
      continue;
    }
  }
  return parts;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  if (params.tools?.length || params.toolChoice || params.tool_choice) {
    throw new Error(
      "invokeLLM: function/tool calling is not implemented in the Gemini adapter (no current caller needs it)."
    );
  }

  const model = params.model || DEFAULT_MODEL;
  const maxOutputTokens = params.max_tokens ?? params.maxTokens;

  const systemMessages = params.messages.filter(m => m.role === "system");
  const conversation = params.messages.filter(m => m.role !== "system");

  const systemText = systemMessages
    .map(m => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join("\n");

  const contents = [];
  for (const message of conversation) {
    const role = message.role === "assistant" ? "model" : "user";
    const parts = await buildGeminiParts(message.content);
    contents.push({ role, parts });
  }

  const generationConfig: Record<string, unknown> = {};
  if (typeof maxOutputTokens === "number") generationConfig.maxOutputTokens = maxOutputTokens;

  const responseFormat = params.response_format || params.responseFormat;
  const outputSchema = params.output_schema || params.outputSchema;
  const jsonSchema = responseFormat?.type === "json_schema" ? responseFormat.json_schema : outputSchema;

  if (responseFormat?.type === "json_object") {
    generationConfig.responseMimeType = "application/json";
  } else if (jsonSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = convertJsonSchemaToGemini(jsonSchema.schema);
  }

  const body: Record<string, unknown> = { contents };
  if (systemText) body.systemInstruction = { parts: [{ text: systemText }] };
  if (Object.keys(generationConfig).length > 0) body.generationConfig = generationConfig;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${ENV.geminiApiKey}`;

  const response = await fetchWithBackoff(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  const data = (await response.json()) as any;
  const candidate = data.candidates?.[0];
  const text: string = (candidate?.content?.parts || [])
    .map((p: any) => p.text || "")
    .join("");

  return {
    id: data.responseId || `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: candidate?.finishReason?.toLowerCase() ?? null,
      },
    ],
    usage: data.usageMetadata
      ? {
          prompt_tokens: data.usageMetadata.promptTokenCount ?? 0,
          completion_tokens: data.usageMetadata.candidatesTokenCount ?? 0,
          total_tokens: data.usageMetadata.totalTokenCount ?? 0,
        }
      : undefined,
  };
}
