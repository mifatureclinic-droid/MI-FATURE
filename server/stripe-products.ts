/**
 * Produtos e preços Stripe para os planos MiFatureClinic
 * Os Price IDs são criados dinamicamente no Stripe e guardados aqui como referência.
 * Em produção, substitua os lookup_keys pelos Price IDs reais do Stripe Dashboard.
 */

export const STRIPE_PLANS = {
  starter: {
    name: "MiFatureClinic Starter",
    description: "Ideal para clínicas com 1 profissional. Agenda, prontuário básico e lembretes WhatsApp.",
    priceId: process.env.STRIPE_PRICE_STARTER || "",
    plano: "starter" as const,
    features: [
      "1 profissional",
      "Agenda inteligente",
      "Prontuário básico",
      "Guias TISS/ANS",
      "Lembretes WhatsApp (50/mês)",
      "Relatórios básicos",
      "Suporte por e-mail",
    ],
  },
  clinica: {
    name: "MiFatureClinic Clínica",
    description: "Para clínicas em crescimento com até 5 profissionais. Faturamento TISS completo.",
    priceId: process.env.STRIPE_PRICE_CLINICA || "",
    plano: "clinica" as const,
    features: [
      "Até 5 profissionais",
      "Agenda multi-profissional",
      "Prontuário completo",
      "Guias TISS/ANS completas",
      "Faturamento TISS automático",
      "Lembretes WhatsApp ilimitados",
      "Relatórios e repasse financeiro",
      "Suporte prioritário",
    ],
  },
  premium: {
    name: "MiFatureClinic Premium",
    description: "Para grandes clínicas. Profissionais ilimitados e integração com faturamento terceirizado MiFature.",
    priceId: process.env.STRIPE_PRICE_PREMIUM || "",
    plano: "premium" as const,
    features: [
      "Profissionais ilimitados",
      "Agenda multi-profissional",
      "Prontuário completo + assinatura digital",
      "Guias TISS/ANS completas",
      "Faturamento TISS automático",
      "Lembretes WhatsApp ilimitados",
      "Relatórios avançados + dashboard",
      "Repasse financeiro automático",
      "Contrato terapêutico digital",
      "Gestor de conta dedicado",
      "Integração com faturamento terceirizado MiFature",
    ],
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
