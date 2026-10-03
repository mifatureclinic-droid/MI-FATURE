import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { coresAtendimento } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const coresAtendimentoRouter = router({
  // Listar todas as cores configuradas
  listar: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const cores = await db.select().from(coresAtendimento).orderBy(coresAtendimento.tipo);
    return cores;
  }),

  // Salvar (upsert) uma cor para um tipo de atendimento
  salvar: protectedProcedure
    .input(z.object({
      tipo: z.string().min(1),
      cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      corTexto: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      const existing = await db.select().from(coresAtendimento).where(eq(coresAtendimento.tipo, input.tipo)).limit(1);
      if (existing.length > 0) {
        await db.update(coresAtendimento)
          .set({ cor: input.cor, corTexto: input.corTexto })
          .where(eq(coresAtendimento.tipo, input.tipo));
      } else {
        await db.insert(coresAtendimento).values({
          tipo: input.tipo,
          cor: input.cor,
          corTexto: input.corTexto,
        });
      }
      return { success: true };
    }),

  // Salvar todas as cores de uma vez (bulk upsert)
  salvarTodas: protectedProcedure
    .input(z.array(z.object({
      tipo: z.string().min(1),
      cor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      corTexto: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#ffffff'),
    })))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('DB unavailable');
      for (const item of input) {
        const existing = await db.select().from(coresAtendimento).where(eq(coresAtendimento.tipo, item.tipo)).limit(1);
        if (existing.length > 0) {
          await db.update(coresAtendimento)
            .set({ cor: item.cor, corTexto: item.corTexto })
            .where(eq(coresAtendimento.tipo, item.tipo));
        } else {
          await db.insert(coresAtendimento).values({
            tipo: item.tipo,
            cor: item.cor,
            corTexto: item.corTexto,
          });
        }
      }
      return { success: true };
    }),
});
