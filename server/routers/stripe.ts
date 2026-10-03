import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { subscricoes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { STRIPE_PLANS, type PlanKey } from "../stripe-products";
import { getStripe } from "../stripe-client";

export const stripeRouter = router({
  /**
   * Cria uma sessão de checkout Stripe para o plano escolhido
   */
  createCheckout: protectedProcedure
    .input(z.object({
      plano: z.enum(["starter", "clinica", "premium"]),
      origin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = STRIPE_PLANS[input.plano as PlanKey];

      if (!plan.priceId) {
        throw new Error(`Price ID para o plano "${input.plano}" não configurado. Configure STRIPE_PRICE_${input.plano.toUpperCase()} nas variáveis de ambiente.`);
      }

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer_email: ctx.user.email || undefined,
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        allow_promotion_codes: true,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          plano: input.plano,
        },
        success_url: `${input.origin}/portal/subscricao?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/#planos`,
      });

      return { url: session.url };
    }),

  /**
   * Retorna a subscrição activa do utilizador autenticado
   */
  getSubscricao: protectedProcedure.query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) return null;
      const [sub] = await database
        .select()
        .from(subscricoes)
        .where(eq(subscricoes.userId, ctx.user.id))
        .limit(1);

      return sub || null;
  }),

  /**
   * Abre o portal de billing Stripe para gerir a subscrição
   */
  createPortalSession: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) throw new Error("Database não disponível.");
      const [sub] = await database
        .select()
        .from(subscricoes)
        .where(eq(subscricoes.userId, ctx.user.id))
        .limit(1);

      if (!sub?.stripeCustomerId) {
        throw new Error("Nenhuma subscrição activa encontrada.");
      }

      const session = await getStripe().billingPortal.sessions.create({
        customer: sub.stripeCustomerId,
        return_url: `${input.origin}/portal/subscricao`,
      });

      return { url: session.url };
    }),
});
