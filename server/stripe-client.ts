import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("STRIPE_SECRET_KEY não configurada nas variáveis de ambiente.");
  }

  stripeClient = new Stripe(apiKey, {
    apiVersion: "2026-06-24.dahlia",
  });
  return stripeClient;
}
