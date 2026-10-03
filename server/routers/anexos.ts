import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { anexosPaciente } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { storagePut } from "../storage";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  zip: "application/zip",
};

function normalizarMimeType(mimeType: string | undefined, nome: string) {
  if (mimeType?.trim()) return mimeType.trim();
  const extension = nome.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES_BY_EXTENSION[extension] || "application/octet-stream";
}

function decodificarUploadBase64(base64: string) {
  const conteudo = base64.replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!conteudo || !/^[A-Za-z0-9+/]+={0,2}$/.test(conteudo) || conteudo.length % 4 !== 0) {
    throw new Error("O arquivo enviado está inválido. Selecione o documento novamente e tente outra vez.");
  }
  const buffer = Buffer.from(conteudo, "base64");
  if (!buffer.length) throw new Error("O arquivo enviado está vazio.");
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("Arquivo muito grande. O limite para anexos é 25 MB.");
  }
  return buffer;
}

export const anexosRouter = router({
  // Listar anexos de um paciente
  list: protectedProcedure
    .input(z.object({ pacienteId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(anexosPaciente)
        .where(eq(anexosPaciente.pacienteId, input.pacienteId))
        .orderBy(desc(anexosPaciente.createdAt));
      return rows;
    }),

  // Upload de anexo (recebe base64)
  upload: protectedProcedure
    .input(
      z.object({
        pacienteId: z.number(),
        nome: z.string().min(1),
        descricao: z.string().optional(),
        categoria: z.string().default("outros"),
        mimeType: z.string(),
        tamanho: z.number().optional(),
        base64: z.string().min(1), // conteúdo do arquivo em base64
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');

      const buffer = decodificarUploadBase64(input.base64);
      const mimeType = normalizarMimeType(input.mimeType, input.nome);

      // Gerar chave única no S3
      const ext = input.nome.split(".").pop() || "bin";
      const fileKey = `pacientes/${input.pacienteId}/anexos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Upload para S3
      const { url } = await storagePut(fileKey, buffer, mimeType);

      // Salvar no banco
      const [result] = await db.insert(anexosPaciente).values({
        pacienteId: input.pacienteId,
        nome: input.nome,
        descricao: input.descricao || null,
        categoria: input.categoria,
        fileKey,
        fileUrl: url,
        mimeType,
        tamanho: input.tamanho || buffer.length,
        uploadedBy: ctx.user.id,
        createdAt: new Date(),
      });

      return { success: true, id: (result as any).insertId };
    }),

  // Deletar anexo
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      await db.delete(anexosPaciente).where(eq(anexosPaciente.id, input.id));
      return { success: true };
    }),
});

export const __anexosInternals = { MAX_UPLOAD_BYTES, decodificarUploadBase64, normalizarMimeType };
