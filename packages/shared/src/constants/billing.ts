/** Stripe price IDs per plan tier and billing interval.
 *  Actual Stripe price IDs should be set via environment variables.
 *  These placeholders are used for type safety and configuration structure. */

import type { PlanTier } from './plan-limits.js';

export interface PlanPricing {
  monthly: { brl: number; usd: number };
  annual: { brl: number; usd: number };
}

export const PLAN_PRICING: Record<PlanTier, PlanPricing> = {
  starter: {
    monthly: { brl: 0, usd: 0 },
    annual: { brl: 0, usd: 0 },
  },
  growth: {
    monthly: { brl: 9700, usd: 1900 },   // R$97 / $19 per month
    annual: { brl: 97000, usd: 19000 },   // R$970 / $190 per year (save ~17%)
  },
  pro: {
    monthly: { brl: 29700, usd: 4900 },   // R$297 / $49 per month
    annual: { brl: 297000, usd: 49000 },   // R$2970 / $490 per year
  },
  enterprise: {
    monthly: { brl: -1, usd: -1 },        // Custom pricing
    annual: { brl: -1, usd: -1 },
  },
} as const;

/** Map plan tier to feature highlights (for pricing page/upgrade modal) */
export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  starter: [
    '100K tokens/month',
    '1 project',
    '3 agents',
    '5 workflows',
    'Community support',
  ],
  growth: [
    '1M tokens/month',
    '5 projects',
    '10 agents',
    '25 workflows',
    'Priority support',
    'WhatsApp integration',
  ],
  pro: [
    '5M tokens/month',
    '20 projects',
    '50 agents',
    '100 workflows',
    'Dedicated support',
    'All integrations',
    'Advanced analytics',
  ],
  enterprise: [
    'Unlimited tokens',
    'Unlimited projects',
    'Unlimited agents',
    'Unlimited workflows',
    'Custom SLA',
    'On-premise option',
    'Dedicated account manager',
  ],
} as const;

/** Format a price amount (in cents) for display */
export function formatPrice(amountCents: number, currency: 'brl' | 'usd'): string {
  if (amountCents === -1) return 'Custom';
  if (amountCents === 0) return currency === 'brl' ? 'Grátis' : 'Free';

  const amount = amountCents / 100;
  if (currency === 'brl') {
    return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}
