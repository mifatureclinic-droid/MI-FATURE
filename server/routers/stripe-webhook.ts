import Stripe from "stripe";
import express, { type Express } from "express";
import { getDb } from "../db";
import { subscricoes } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "../stripe-client";

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

      let event: Stripe.Event;

      try {
        event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} | ID: ${event.id}`);

      const database = await getDb();
      if (!database) {
        return res.status(500).json({ error: "Database unavailable" });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = parseInt(session.metadata?.user_id || "0");
            const plano = session.metadata?.plano as "starter" | "clinica" | "premium" | undefined;

            if (!userId || !plano) {
              console.warn("[Stripe Webhook] Missing userId or plano in metadata");
              break;
            }

            // Retrieve subscription details
            const subscriptionId = session.subscription as string;
            const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
            const customerId = session.customer as string;
            const priceId = subscription.items.data[0]?.price.id || "";

            // Upsert subscription record
            const existing = await database
              .select()
              .from(subscricoes)
              .where(eq(subscricoes.userId, userId))
              .limit(1);

            if (existing.length > 0) {
              await database
                .update(subscricoes)
                .set({
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subscriptionId,
                  stripePriceId: priceId,
                  plano,
                  status: "active",
                })
                .where(eq(subscricoes.userId, userId));
            } else {
              await database.insert(subscricoes).values({
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                plano,
                status: "active",
              });
            }

            console.log(`[Stripe Webhook] Subscription activated for user ${userId}, plan: ${plano}`);
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const status = subscription.status as "active" | "trialing" | "past_due" | "canceled" | "incomplete";

            await database
              .update(subscricoes)
              .set({ status, stripeSubscriptionId: subscription.id })
              .where(eq(subscricoes.stripeCustomerId, customerId));

            console.log(`[Stripe Webhook] Subscription updated for customer ${customerId}: ${status}`);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;

            await database
              .update(subscricoes)
              .set({ status: "canceled" })
              .where(eq(subscricoes.stripeCustomerId, customerId));

            console.log(`[Stripe Webhook] Subscription canceled for customer ${customerId}`);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            await database
              .update(subscricoes)
              .set({ status: "past_due" })
              .where(eq(subscricoes.stripeCustomerId, customerId));

            console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      res.json({ received: true });
    }
  );
}
